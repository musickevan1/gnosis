from datetime import datetime
from models.database import db

class SearchHistory(db.Model):
    __tablename__ = 'search_history'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    topic = db.Column(db.String(255), nullable=False)
    difficulty = db.Column(db.String(50))
    subject_type = db.Column(db.String(50))
    lesson_content = db.Column(db.Text)
    quiz_content = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'topic': self.topic,
            'difficulty': self.difficulty,
            'subject_type': self.subject_type,
            'lesson_content': self.lesson_content,
            'quiz_content': self.quiz_content,
            'created_at': self.created_at.isoformat()
        }
