"""Search history model."""
from datetime import datetime
from src.core.models.database import db

class SearchHistory(db.Model):
    """Search history model."""
    
    __tablename__ = 'search_history'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    topic = db.Column(db.String(200), nullable=False)
    difficulty = db.Column(db.String(50))
    content = db.Column(db.Text)
    content_type = db.Column(db.String(50))  # 'lesson' or 'quiz'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        """Convert to dictionary."""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'topic': self.topic,
            'difficulty': self.difficulty,
            'content': self.content,
            'content_type': self.content_type,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
