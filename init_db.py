from flask import Flask
from models.database import db
from models.user import User
from models.search_history import SearchHistory
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Create Flask app
app = Flask(__name__)

# Configure SQLite database
db_path = os.path.join(app.instance_path, 'app.db')
os.makedirs(app.instance_path, exist_ok=True)
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize database
db.init_app(app)

with app.app_context():
    # Create all database tables
    db.create_all()
    print("Database tables created successfully!")
