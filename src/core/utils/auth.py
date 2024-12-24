"""Authentication utilities."""
from functools import wraps
from flask import request, jsonify, current_app
import jwt
from datetime import datetime, timedelta
import os

def create_token(user_id: int) -> str:
    """Create a JWT token for a user."""
    expiration = datetime.utcnow() + timedelta(hours=24)
    return jwt.encode(
        {'user_id': user_id, 'exp': expiration},
        os.getenv('SECRET_KEY', 'test-secret-key'),
        algorithm='HS256'
    )

def token_required(f):
    """Decorator to require JWT token for routes."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization')
        
        if auth_header:
            try:
                token = auth_header.split(" ")[1]
            except IndexError:
                return jsonify({'error': 'Invalid token format'}), 401
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        try:
            data = jwt.decode(
                token,
                os.getenv('SECRET_KEY', 'test-secret-key'),
                algorithms=['HS256']
            )
            current_user_id = data['user_id']
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
        
        return f(current_user_id, *args, **kwargs)
    
    return decorated
