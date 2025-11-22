from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, User, Meeting, Topic, DiscussionPoint, ActionItem
import os
from datetime import datetime

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here' # Change this in production
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///quickmom.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Configure CORS to allow requests from Next.js frontend
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:3000", "http://127.0.0.1:3000"]}}, supports_credentials=True)

db.init_app(app)
login_manager = LoginManager()
login_manager.init_app(app)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

with app.app_context():
    db.create_all()

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not username or not email or not password:
        return jsonify({'error': 'Missing required fields'}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered'}), 400
    
    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username already taken'}), 400

    user = User(
        username=username,
        email=email,
        password_hash=generate_password_hash(password)
    )
    db.session.add(user)
    db.session.commit()

    login_user(user)
    return jsonify({'message': 'Registered successfully', 'user': user.to_dict()}), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    user = User.query.filter_by(email=email).first()
    if user and check_password_hash(user.password_hash, password):
        login_user(user)
        return jsonify({'message': 'Logged in successfully', 'user': user.to_dict()})
    
    return jsonify({'error': 'Invalid email or password'}), 401

@app.route('/api/auth/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({'message': 'Logged out successfully'})

@app.route('/api/auth/me', methods=['GET'])
def get_current_user():
    if current_user.is_authenticated:
        return jsonify({'user': current_user.to_dict()})
    return jsonify({'user': None}), 200

# Meeting Routes
@app.route('/api/meetings', methods=['GET'])
@login_required
def get_meetings():
    meetings = Meeting.query.filter(
        (Meeting.owner_id == current_user.id) | 
        (Meeting.attendees.any(id=current_user.id))
    ).all()
    return jsonify([meeting.to_dict() for meeting in meetings])



@app.route('/api/users/search', methods=['GET'])
@login_required
def search_users():
    query = request.args.get('q', '')
    if not query:
        # Return all users (limit 20) if no query
        users = User.query.limit(20).all()
        return jsonify([user.to_dict() for user in users])
    
    users = User.query.filter(User.username.ilike(f'%{query}%')).limit(10).all()
    return jsonify([user.to_dict() for user in users])

@app.route('/api/seed', methods=['POST'])
def seed_db():
    # Create some dummy users
    if User.query.count() > 1:
        return jsonify({'message': 'Database already seeded'})
        
    users = [
        User(username='alice', email='alice@example.com', password_hash=generate_password_hash('password')),
        User(username='bob', email='bob@example.com', password_hash=generate_password_hash('password')),
        User(username='charlie', email='charlie@example.com', password_hash=generate_password_hash('password')),
        User(username='david', email='david@example.com', password_hash=generate_password_hash('password')),
    ]
    
    for user in users:
        if not User.query.filter_by(email=user.email).first():
            db.session.add(user)
    
    db.session.commit()
    return jsonify({'message': 'Database seeded successfully'})

@app.route('/api/meetings', methods=['POST'])
@login_required
def create_meeting():
    data = request.get_json()
    meeting = Meeting(
        title=data.get('title'),
        description=data.get('description'),
        date=datetime.fromisoformat(data.get('date')) if data.get('date') else datetime.utcnow(),
        owner_id=current_user.id
    )
    
    attendee_ids = data.get('attendeeIds', [])
    if attendee_ids:
        attendees = User.query.filter(User.id.in_(attendee_ids)).all()
        meeting.attendees.extend(attendees)
        
    db.session.add(meeting)
    db.session.commit()
    return jsonify(meeting.to_dict()), 201

@app.route('/api/meetings/<int:meeting_id>', methods=['GET'])
@login_required
def get_meeting(meeting_id):
    meeting = Meeting.query.get_or_404(meeting_id)
    # Allow owner OR attendees to view
    if meeting.owner_id != current_user.id and current_user not in meeting.attendees:
        return jsonify({'error': 'Unauthorized'}), 403
    return jsonify(meeting.to_dict())

@app.route('/api/meetings/<int:meeting_id>/topics', methods=['POST'])
@login_required
def create_topic(meeting_id):
    meeting = Meeting.query.get_or_404(meeting_id)
    if meeting.owner_id != current_user.id and current_user not in meeting.attendees:
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.get_json()
    topic = Topic(title=data.get('title'), meeting_id=meeting.id)
    db.session.add(topic)
    db.session.commit()
    return jsonify(topic.to_dict()), 201

@app.route('/api/meetings/<int:meeting_id>/topics/<int:topic_id>/points', methods=['POST'])
@login_required
def create_discussion_point(meeting_id, topic_id):
    meeting = Meeting.query.get_or_404(meeting_id)
    if meeting.owner_id != current_user.id and current_user not in meeting.attendees:
        return jsonify({'error': 'Unauthorized'}), 403
        
    data = request.get_json()
    point = DiscussionPoint(text=data.get('text'), topic_id=topic_id)
    db.session.add(point)
    db.session.commit()
    return jsonify(point.to_dict()), 201

@app.route('/api/meetings/<int:meeting_id>/action-items', methods=['POST'])
@login_required
def create_action_item(meeting_id):
    meeting = Meeting.query.get_or_404(meeting_id)
    if meeting.owner_id != current_user.id and current_user not in meeting.attendees:
        return jsonify({'error': 'Unauthorized'}), 403
        
    data = request.get_json()
    # Handle date parsing safely
    try:
        due_date = datetime.fromisoformat(data.get('dueDate').replace('Z', '+00:00'))
    except (ValueError, TypeError):
        due_date = datetime.utcnow()

    action_item = ActionItem(
        task=data.get('task'),
        assignee_id=int(data.get('assigneeId')),
        due_date=due_date,
        meeting_id=meeting.id,
        topic_id=int(data.get('topicId')) if data.get('topicId') != 'general' else None
    )
    db.session.add(action_item)
    db.session.commit()
    return jsonify(action_item.to_dict()), 201

@app.route('/api/action-items/<int:item_id>', methods=['PUT'])
@login_required
def update_action_item(item_id):
    item = ActionItem.query.get_or_404(item_id)
    meeting = Meeting.query.get(item.meeting_id)
    
    if meeting.owner_id != current_user.id and current_user not in meeting.attendees:
        return jsonify({'error': 'Unauthorized'}), 403
        
    data = request.get_json()
    if 'completed' in data:
        item.completed = data['completed']
        
    db.session.commit()
    return jsonify(item.to_dict())

@app.route('/api/meetings/<int:meeting_id>/transcribe', methods=['POST'])
@login_required
def transcribe_meeting(meeting_id):
    meeting = Meeting.query.get_or_404(meeting_id)
    if meeting.owner_id != current_user.id and current_user not in meeting.attendees:
        return jsonify({'error': 'Unauthorized'}), 403
        
    data = request.get_json()
    # In a real app, we would process the audio data here using an AI service (e.g. OpenAI Whisper)
    # For now, we'll simulate a transcription.
    
    # audio_data = data.get('audioData') # Base64 string
    
    simulated_transcription = (
        "Speaker 1: Let's start the meeting.\n"
        "Speaker 2: We need to discuss the project timeline.\n"
        "Speaker 1: Agreed. The deadline is approaching.\n"
        "Speaker 3: I'll update the Gantt chart by tomorrow.\n"
        f"[Transcribed at {datetime.utcnow().isoformat()}]"
    )
    
    meeting.transcription = simulated_transcription
    db.session.commit()
    
    return jsonify({'transcription': simulated_transcription})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
