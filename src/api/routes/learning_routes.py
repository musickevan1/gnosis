"""Learning routes."""
from flask import Blueprint, request, jsonify
from src.core.models.user import User, Progress
from src.core.models.search_history import SearchHistory
from src.core.models.database import db
from src.core.utils.auth import token_required

bp = Blueprint('learning', __name__, url_prefix='/api/learning')

@bp.route('/history', methods=['GET'])
@token_required
def get_history(current_user_id):
    """Get user's search history."""
    history = SearchHistory.query.filter_by(user_id=current_user_id).all()
    return jsonify([h.to_dict() for h in history]), 200

@bp.route('/progress', methods=['GET'])
@token_required
def get_progress(current_user_id):
    """Get user's learning progress."""
    progress = Progress.query.filter_by(user_id=current_user_id).all()
    return jsonify([p.to_dict() for p in progress]), 200

@bp.route('/progress', methods=['POST'])
@token_required
def update_progress(current_user_id):
    """Update user's learning progress."""
    data = request.get_json()
    if not data or not data.get('topic') or not data.get('score'):
        return jsonify({'error': 'Missing required fields'}), 400
    
    progress = Progress(
        user_id=current_user_id,
        topic=data['topic'],
        score=data['score']
    )
    db.session.add(progress)
    db.session.commit()
    
    return jsonify(progress.to_dict()), 201
