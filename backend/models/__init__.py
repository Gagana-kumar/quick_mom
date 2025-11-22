from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

from .user import User
from .meeting import Meeting
from .topic import Topic
from .point import DiscussionPoint
from .action_item import ActionItem
