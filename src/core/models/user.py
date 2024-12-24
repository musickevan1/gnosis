from .database import db
from datetime import datetime
import bcrypt
import logging

logger = logging.getLogger(__name__)

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.LargeBinary, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    learning_preferences = db.Column(db.JSON)
    progress = db.relationship('Progress', backref='user', lazy=True)

    def set_password(self, password):
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

class Progress(db.Model):
    __tablename__ = 'progress'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    topic = db.Column(db.String(100), nullable=False)
    score = db.Column(db.Float)
    completed_at = db.Column(db.DateTime, default=datetime.utcnow)
    time_spent = db.Column(db.Integer)  # in minutes
    difficulty_level = db.Column(db.String(20))
    feedback = db.Column(db.Text)
