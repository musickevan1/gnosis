from flask import Blueprint, request, jsonify
from models.user import User, Progress, db
from datetime import datetime
from functools import wraps
from jose import jwt
import os

bp = Blueprint('learning', __name__)

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({"error": "Token is missing"}), 401
        
        try:
            token = token.split()[1]  # Remove 'Bearer ' prefix
            data = jwt.decode(token, os.getenv('SECRET_KEY'), algorithms=['HS256'])
            current_user = User.query.get(data['user_id'])
        except:
            return jsonify({"error": "Invalid token"}), 401
            
        return f(current_user, *args, **kwargs)
    return decorated

@bp.route('/api/learning/progress', methods=['POST'])
@token_required
def save_progress(current_user):
    data = request.get_json()
    
    progress = Progress(
        user_id=current_user.id,
        topic=data['topic'],
        score=data.get('score'),
        time_spent=data.get('time_spent'),
        difficulty_level=data.get('difficulty_level'),
        feedback=data.get('feedback')
    )
    
    db.session.add(progress)
    db.session.commit()
    
    return jsonify({"message": "Progress saved successfully"}), 201

@bp.route('/api/learning/progress', methods=['GET'])
@token_required
def get_progress(current_user):
    progress = Progress.query.filter_by(user_id=current_user.id).all()
    
    return jsonify({
        "progress": [{
            "topic": p.topic,
            "score": p.score,
            "completed_at": p.completed_at.isoformat(),
            "time_spent": p.time_spent,
            "difficulty_level": p.difficulty_level,
            "feedback": p.feedback
        } for p in progress]
    })
