"""Test configuration and fixtures."""
import os
import pytest
from src.app import create_app
from src.core.models.database import db as _db
from src.core.models.user import User

@pytest.fixture(scope='session')
def app():
    """Create a Flask app context for the tests."""
    os.environ['FLASK_ENV'] = 'testing'
    app = create_app()
    
    # Configure the app for testing
    app.config.update({
        'TESTING': True,
        'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
        'SECRET_KEY': 'test-secret-key',
    })
    
    # Create application context
    with app.app_context():
        yield app

@pytest.fixture(scope='session')
def db(app):
    """Create a database object."""
    _db.create_all()
    yield _db
    _db.drop_all()

@pytest.fixture(scope='function')
def session(db):
    """Create a new database session for a test."""
    connection = db.engine.connect()
    transaction = connection.begin()
    
    session = db.create_scoped_session()
    db.session = session
    
    yield session
    
    transaction.rollback()
    connection.close()
    session.remove()

@pytest.fixture
def test_client(app):
    """Create a test client."""
    return app.test_client()

@pytest.fixture
def test_user(session):
    """Create a test user."""
    user = User(username='testuser')
    user.set_password('testpass123')
    session.add(user)
    session.commit()
    return user
