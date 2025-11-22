from . import db
from datetime import datetime

class ActionItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    task = db.Column(db.String(200), nullable=False)
    assignee_id = db.Column(db.Integer, nullable=True) # For now, just store ID if we had attendees
    due_date = db.Column(db.DateTime, nullable=True)
    completed = db.Column(db.Boolean, default=False)
    topic_id = db.Column(db.Integer, db.ForeignKey('topic.id'), nullable=True)
    meeting_id = db.Column(db.Integer, db.ForeignKey('meeting.id'), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'task': self.task,
            'assigneeId': str(self.assignee_id) if self.assignee_id else None,
            'dueDate': self.due_date.isoformat() if self.due_date else None,
            'completed': self.completed,
            'topic_id': self.topic_id
        }
