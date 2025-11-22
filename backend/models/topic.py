from . import db

class Topic(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    meeting_id = db.Column(db.Integer, db.ForeignKey('meeting.id'), nullable=False)
    discussion_points = db.relationship('DiscussionPoint', backref='topic', lazy=True, cascade="all, delete-orphan")
    action_items = db.relationship('ActionItem', backref='topic', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'meeting_id': self.meeting_id,
            'discussionPoints': [dp.to_dict() for dp in self.discussion_points],
            'actionItems': [ai.to_dict() for ai in self.action_items]
        }
