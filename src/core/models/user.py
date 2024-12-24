"""User model and related models."""
from src.core.models.database import db
import bcrypt
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class User(db.Model):
    """User model for authentication and profile."""
    __tablename__ = 'user'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=True)
    password_hash = db.Column(db.LargeBinary, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    learning_preferences = db.Column(db.JSON)
    progress = db.relationship('Progress', backref='user', lazy=True)

    def set_password(self, password):
        """Hash and set the user's password."""
        try:
            logger.debug(f"Setting password for user {self.username}")
            if isinstance(password, str):
                password = password.encode('utf-8')
            salt = bcrypt.gensalt()
            self.password_hash = bcrypt.hashpw(password, salt)
            logger.debug("Password set successfully")
        except Exception as e:
            logger.error(f"Error setting password: {str(e)}")
            raise
    
    def check_password(self, password):
        """Check if the provided password matches the hash."""
        try:
            logger.debug(f"Checking password for user {self.username}")
            if isinstance(password, str):
                password = password.encode('utf-8')
            result = bcrypt.checkpw(password, self.password_hash)
            logger.debug(f"Password check result: {result}")
            return result
        except Exception as e:
            logger.error(f"Error checking password: {str(e)}")
            return False
    
    def to_dict(self):
        """Convert the model to a dictionary."""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'created_at': self.created_at.isoformat()
        }

class Progress(db.Model):
    """Model for tracking user learning progress."""
    __tablename__ = 'progress'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    topic = db.Column(db.String(200), nullable=False)
    score = db.Column(db.Float)
    completed_at = db.Column(db.DateTime, default=datetime.utcnow)
    time_spent = db.Column(db.Integer)  # in minutes
    difficulty_level = db.Column(db.String(20))
    feedback = db.Column(db.Text)

    def to_dict(self):
        """Convert the model to a dictionary."""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'topic': self.topic,
            'score': self.score,
            'completed_at': self.completed_at.isoformat()
        }
