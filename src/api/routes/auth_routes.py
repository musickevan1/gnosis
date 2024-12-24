from flask import Blueprint, request, jsonify
from src.core.models.user import User, db
from src.core.utils.auth import token_required, create_token
from datetime import datetime, timedelta
import os
import logging
from functools import wraps
import jwt
from flask import current_app

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

bp = Blueprint('auth', __name__)

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        # Skip token check for OPTIONS requests
        if request.method == 'OPTIONS':
            return jsonify({"message": "OK"}), 200
            
        token = request.headers.get('Authorization')
        if not token:
            logger.warning("Token missing in request")
            return jsonify({"error": "Token is missing"}), 401
        
        try:
            if not token.startswith('Bearer '):
                raise jwt.InvalidTokenError("Invalid token format")
                
            token = token.split()[1]
            data = jwt.decode(
                token, 
                current_app.config['SECRET_KEY'],
                algorithms=['HS256']
            )
            
            current_user = User.query.get(data['user_id'])
            if not current_user:
                raise ValueError("User not found")
                
            return f(current_user, *args, **kwargs)
                
        except jwt.ExpiredSignatureError:
            logger.warning("Expired token used")
            return jsonify({"error": "Token has expired"}), 401
        except jwt.InvalidTokenError as e:
            logger.warning(f"JWT validation failed: {str(e)}")
            return jsonify({"error": "Invalid token"}), 401
        except Exception as e:
            logger.error(f"Token validation error: {str(e)}")
            return jsonify({"error": "Authentication failed"}), 401
            
    return decorated

@bp.route('/register', methods=['POST', 'OPTIONS'])
def register():
    if request.method == 'OPTIONS':
        return jsonify({"message": "OK"}), 200
        
    try:
        data = request.get_json()
        logger.info("Processing registration request")
        
        # Validate required fields
        required_fields = ['username', 'email', 'password']
        for field in required_fields:
            if not data.get(field):
                return jsonify({"error": f"Missing required field: {field}"}), 400

        # Validate email format
        if '@' not in data['email']:
            return jsonify({"error": "Invalid email format"}), 400
            
        # Check if email already exists
        if User.query.filter_by(email=data['email']).first():
            return jsonify({"error": "Email already registered"}), 400
            
        # Check if username already exists
        if User.query.filter_by(username=data['username']).first():
            return jsonify({"error": "Username already taken"}), 400
            
        # Create new user
        new_user = User(
            username=data['username'],
            email=data['email']
        )
        new_user.set_password(data['password'])
        
        db.session.add(new_user)
        db.session.commit()
        
        # Generate token
        token = jwt.encode(
            {
                'user_id': new_user.id,
                'exp': datetime.utcnow() + timedelta(hours=24)
            },
            current_app.config['SECRET_KEY'],
            algorithm='HS256'
        )
        
        logger.info(f"User {new_user.username} registered successfully")
        return jsonify({
            "message": "Registration successful",
            "token": token,
            "user": {
                "id": new_user.id,
                "username": new_user.username,
                "email": new_user.email
            }
        }), 201
        
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        db.session.rollback()
        return jsonify({"error": "Registration failed"}), 500

@bp.route('/login', methods=['POST', 'OPTIONS'])
def login():
    if request.method == 'OPTIONS':
        return jsonify({"message": "OK"}), 200
        
    try:
        data = request.get_json()
        logger.info("Processing login request")
        
        # Validate required fields
        if not data or not data.get('username') or not data.get('password'):
            return jsonify({'error': 'Missing username or password'}), 400
            
        user = User.query.filter_by(username=data['username']).first()
        if not user:
            return jsonify({'error': 'Invalid username or password'}), 401
            
        if not user.check_password(data['password']):
            return jsonify({'error': 'Invalid username or password'}), 401
            
        # Update last login
        user.last_login = datetime.utcnow()
        db.session.commit()
        
        # Generate token
        token = jwt.encode(
            {
                'user_id': user.id,
                'exp': datetime.utcnow() + timedelta(hours=24)
            },
            current_app.config['SECRET_KEY'],
            algorithm='HS256'
        )
        
        logger.info(f"User {user.username} logged in successfully")
        return jsonify({
            "token": token,
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email
            }
        })
        
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return jsonify({"error": "Login failed"}), 500

@bp.route('/check-availability', methods=['POST', 'OPTIONS'])
def check_availability():
    if request.method == 'OPTIONS':
        return jsonify({"message": "OK"}), 200
        
    try:
        data = request.get_json()
        field_type = data.get('type')  # 'username' or 'email'
        value = data.get('value')

        if not field_type or not value:
            return jsonify({
                "error": "Missing required fields"
            }), 400

        if field_type == 'username':
            existing = User.query.filter_by(username=value).first()
            return jsonify({
                "available": not existing,
                "message": "Username is available" if not existing else "Username is already taken"
            })
        elif field_type == 'email':
            existing = User.query.filter_by(email=value).first()
            return jsonify({
                "available": not existing,
                "message": "Email is available" if not existing else "Email is already registered"
            })
        else:
            return jsonify({
                "error": "Invalid field type"
            }), 400

    except Exception as e:
        logger.error(f"Error checking availability: {str(e)}")
        return jsonify({
            "error": "An error occurred while checking availability"
        }), 500

@bp.route('/me', methods=['GET', 'OPTIONS'])
@token_required
def get_current_user(current_user):
    """Get current user information."""
    if request.method == 'OPTIONS':
        return jsonify({"message": "OK"}), 200
        
    try:
        if not current_user:
            return jsonify({"error": "User not found"}), 404
            
        return jsonify({
            "id": current_user.id,
            "username": current_user.username,
            "email": current_user.email,
            "last_login": current_user.last_login.isoformat() if current_user.last_login else None
        }), 200
    except Exception as e:
        logger.error(f"Error fetching user data: {str(e)}")
        return jsonify({"error": "Failed to fetch user data"}), 500
