from . import db
from datetime import datetime

meeting_attendees = db.Table('meeting_attendees',
    db.Column('user_id', db.Integer, db.ForeignKey('user.id'), primary_key=True),
    db.Column('meeting_id', db.Integer, db.ForeignKey('meeting.id'), primary_key=True)
)

class Meeting(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    date = db.Column(db.DateTime, default=datetime.utcnow)
    owner_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    topics = db.relationship('Topic', backref='meeting', lazy=True, cascade="all, delete-orphan")
    action_items = db.relationship('ActionItem', backref='meeting', lazy=True, cascade="all, delete-orphan")
    attendees = db.relationship('User', secondary=meeting_attendees, lazy='subquery',
        backref=db.backref('meetings_attended', lazy=True))
    transcription = db.Column(db.Text)

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'date': self.date.isoformat(),
            'owner_id': self.owner_id,
            'topics': [topic.to_dict() for topic in self.topics],
            'attendees': [user.to_dict() for user in self.attendees],
            'actionItems': [item.to_dict() for item in self.action_items],
            'transcription': self.transcription
        }
