from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import os
import logging
from routes.auth_routes import bp as auth_bp
from routes.ai_routes import bp as ai_bp
from routes.learning_routes import bp as learning_bp
from models.database import db

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def create_app():
    # Load environment variables
    load_dotenv()  # This will load from the .env file in the current directory
    logger.info("Loading environment variables...")

    app = Flask(__name__)
    
    # Configure CORS with proper preflight handling
    CORS(app, 
         resources={r"/api/*": {
             "origins": ["http://localhost:5177", "http://127.0.0.1:5177"],
             "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
             "allow_headers": ["Content-Type", "Authorization", "Access-Control-Allow-Credentials"],
             "supports_credentials": True,
             "expose_headers": ["Content-Type", "Authorization"],
             "max_age": 600  # Cache preflight requests for 10 minutes
         }},
         supports_credentials=True
    )

    # Get the absolute path to the database file
    db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'instance', 'app.db')
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    
    # Required configuration
    required_env_vars = [
        'SECRET_KEY',
        'OPENAI_API_KEY'
    ]
    
    missing_vars = [var for var in required_env_vars if not os.getenv(var)]
    if missing_vars:
        logger.error(f"Missing required environment variables: {', '.join(missing_vars)}")
        raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}")

    # Set up app configuration
    app.config.update(
        SQLALCHEMY_DATABASE_URI=f'sqlite:///{db_path}',
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
        SECRET_KEY=os.getenv('SECRET_KEY').strip(),
        OPENAI_API_KEY=os.getenv('OPENAI_API_KEY').strip()
    )
    
    # Initialize extensions
    db.init_app(app)
    
    # Create database tables
    with app.app_context():
        db.create_all()
        logger.info("Database tables created successfully")
    
    # Register blueprints with url_prefix
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(ai_bp, url_prefix='/api/ai')
    app.register_blueprint(learning_bp, url_prefix='/api/learning')
    
    # Log configuration (safely)
    logger.info("App configuration loaded")
    logger.info(f"Database path: {db_path}")
    logger.info(f"OpenAI API Key present: {'Yes' if app.config['OPENAI_API_KEY'] else 'No'}")
    
    return app

app = create_app()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
