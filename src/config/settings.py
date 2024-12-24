"""Application configuration management."""
import os
from pathlib import Path
from typing import Dict, Any
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Base directory of the project
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Environment
ENV = os.getenv("FLASK_ENV", "development")

# Basic Flask configuration
FLASK_CONFIG = {
    "SECRET_KEY": os.getenv("SECRET_KEY", "default-secret-key"),
    "DEBUG": ENV == "development",
}

# Database configuration
DATABASE_CONFIG = {
    "SQLALCHEMY_DATABASE_URI": os.getenv(
        "DATABASE_URL", f"sqlite:///{BASE_DIR}/instance/app.db"
    ),
    "SQLALCHEMY_TRACK_MODIFICATIONS": False,
}

# OpenAI configuration
OPENAI_CONFIG = {
    "API_KEY": os.getenv("OPENAI_API_KEY"),
    "MODEL": "gpt-3.5-turbo",
    "MAX_TOKENS": 2000,
    "TEMPERATURE": 0.7,
}

# Security configuration
SECURITY_CONFIG = {
    "JWT_EXPIRATION_HOURS": 24,
    "PASSWORD_MIN_LENGTH": 8,
    "RATE_LIMIT_DEFAULT": "200 per day",
}

# CORS configuration
CORS_CONFIG = {
    "ORIGINS": [
        "http://localhost:5177",
        "http://127.0.0.1:5177",
    ],
    "METHODS": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "ALLOWED_HEADERS": ["Content-Type", "Authorization"],
    "EXPOSE_HEADERS": ["Content-Type", "Authorization"],
    "SUPPORTS_CREDENTIALS": True,
    "MAX_AGE": 600,  # 10 minutes
}

def get_config() -> Dict[str, Any]:
    """Get the complete configuration dictionary."""
    return {
        "ENV": ENV,
        "FLASK": FLASK_CONFIG,
        "DATABASE": DATABASE_CONFIG,
        "OPENAI": OPENAI_CONFIG,
        "SECURITY": SECURITY_CONFIG,
        "CORS": CORS_CONFIG,
    }
