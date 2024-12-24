"""Test authentication functionality."""
import pytest
from src.core.models.user import User

def test_user_creation(session):
    """Test user creation and password hashing."""
    user = User(username='newuser')
    user.set_password('password123')
    
    session.add(user)
    session.commit()
    
    assert user.id is not None
    assert user.username == 'newuser'
    assert user.check_password('password123')
    assert not user.check_password('wrongpass')

def test_user_authentication(test_client, test_user):
    """Test user login endpoint."""
    # Test successful login
    response = test_client.post('/api/auth/login', json={
        'username': 'testuser',
        'password': 'testpass123'
    })
    assert response.status_code == 200
    assert 'token' in response.json
    
    # Test failed login
    response = test_client.post('/api/auth/login', json={
        'username': 'testuser',
        'password': 'wrongpass'
    })
    assert response.status_code == 401

def test_protected_route(test_client, test_user):
    """Test protected route access."""
    # First login to get token
    response = test_client.post('/api/auth/login', json={
        'username': 'testuser',
        'password': 'testpass123'
    })
    token = response.json['token']
    
    # Test accessing protected route with token
    response = test_client.get('/api/auth/me', headers={
        'Authorization': f'Bearer {token}'
    })
    assert response.status_code == 200
    assert response.json['username'] == 'testuser'
    
    # Test accessing protected route without token
    response = test_client.get('/api/auth/me')
    assert response.status_code == 401
