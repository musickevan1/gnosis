"""Test AI service functionality."""
import pytest
from unittest.mock import patch, MagicMock
from src.services.ai.lesson_service import generate_lesson_content
from src.core.models.search_history import SearchHistory

@pytest.fixture
def mock_openai_response():
    """Mock OpenAI API response."""
    return {
        "choices": [{
            "message": {
                "content": "Test lesson content"
            }
        }]
    }

def test_generate_lesson(test_client, test_user, mock_openai_response):
    """Test lesson generation endpoint."""
    # Login to get token
    response = test_client.post('/api/auth/login', json={
        'username': 'testuser',
        'password': 'testpass123'
    })
    token = response.json['token']
    
    # Test lesson generation
    with patch('openai.OpenAI') as mock_openai:
        mock_instance = MagicMock()
        mock_instance.chat.completions.create.return_value = mock_openai_response
        mock_openai.return_value = mock_instance
        
        response = test_client.post(
            '/api/ai/generate-lesson',
            json={
                'topic': 'Python programming',
                'difficulty': 'beginner'
            },
            headers={'Authorization': f'Bearer {token}'}
        )
        
        assert response.status_code == 200
        assert 'content' in response.json

def test_search_history(test_client, test_user, session):
    """Test search history functionality."""
    # Create some search history
    history = SearchHistory(
        user_id=test_user.id,
        topic='Python',
        difficulty='beginner'
    )
    session.add(history)
    session.commit()
    
    # Login
    response = test_client.post('/api/auth/login', json={
        'username': 'testuser',
        'password': 'testpass123'
    })
    token = response.json['token']
    
    # Test getting search history
    response = test_client.get(
        '/api/learning/history',
        headers={'Authorization': f'Bearer {token}'}
    )
    
    assert response.status_code == 200
    assert len(response.json) == 1
    assert response.json[0]['topic'] == 'Python'
