"""Test AI service functionality."""
import pytest
from unittest.mock import patch, MagicMock
from src.core.services.ai.lesson_service import generate_lesson_content
from src.core.models.search_history import SearchHistory
import json

@pytest.fixture
def mock_openai_response():
    """Mock OpenAI API response."""
    return "Test lesson content"

@pytest.fixture
def mock_openai_client():
    """Mock OpenAI client."""
    client = MagicMock()
    response = MagicMock()
    response.choices = [MagicMock()]
    response.choices[0].message.content = "Test lesson content"
    client.chat.completions.create.return_value = response
    return client

@pytest.fixture
def mock_quiz_response():
    """Mock OpenAI API quiz response."""
    return {
        "questions": [
            {
                "question": "What is Python?",
                "options": [
                    "A programming language",
                    "A snake",
                    "A text editor",
                    "An operating system"
                ],
                "correct_answer": "A programming language",
                "explanation": "Python is a high-level programming language."
            }
        ]
    }

@pytest.fixture
def mock_quiz_openai_client():
    """Mock OpenAI client for quiz generation."""
    client = MagicMock()
    response = MagicMock()
    response.choices = [MagicMock()]
    response.choices[0].message.content = '''
    {
        "questions": [
            {
                "question": "What is Python?",
                "options": [
                    "A programming language",
                    "A snake",
                    "A text editor",
                    "An operating system"
                ],
                "correct_answer": "A programming language",
                "explanation": "Python is a high-level programming language."
            }
        ]
    }
    '''
    client.chat.completions.create.return_value = response
    return client

def test_generate_lesson(test_client, test_user, mock_openai_client, mock_openai_response):
    """Test lesson generation endpoint."""
    # Login to get token
    response = test_client.post('/api/auth/login', json={
        'username': 'testuser',
        'password': 'testpass123'
    })
    token = response.json['token']
    
    # Mock the OpenAI response
    mock_openai_client.chat.completions.create.return_value.choices[0].message.content = mock_openai_response
    
    # Test lesson generation
    with patch('src.core.utils.openai_client.get_openai_client', return_value=mock_openai_client):
        response = test_client.post(
            '/api/ai/generate-lesson',
            json={
                'topic': 'Python programming',
                'difficulty': 'beginner'
            },
            headers={'Authorization': f'Bearer {token}'}
        )
        
        assert response.status_code == 200
        assert 'lesson' in response.json
        assert 'history_id' in response.json

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
        '/api/ai/search-history',
        headers={'Authorization': f'Bearer {token}'}
    )
    
    assert response.status_code == 200
    assert isinstance(response.json, list)
    assert len(response.json) == 1
    assert response.json[0]['topic'] == 'Python'

def test_generate_quiz(test_client, test_user, mock_quiz_openai_client):
    """Test quiz generation endpoint."""
    # Login to get token
    response = test_client.post('/api/auth/login', json={
        'username': 'testuser',
        'password': 'testpass123'
    })
    token = response.json['token']
    
    # Mock the quiz response
    mock_quiz_openai_client.chat.completions.create.return_value.choices[0].message.content = '''
    {
        "questions": [
            {
                "question": "What is Python?",
                "options": [
                    "A programming language",
                    "A snake",
                    "A text editor",
                    "An operating system"
                ],
                "correct_answer": "A programming language",
                "explanation": "Python is a high-level programming language."
            }
        ]
    }
    '''
    
    # Test quiz generation
    with patch('src.core.utils.openai_client.get_openai_client', return_value=mock_quiz_openai_client):
        response = test_client.post(
            '/api/ai/generate-quiz',
            json={
                'topic': 'Python programming',
                'difficulty': 'beginner'
            },
            headers={'Authorization': f'Bearer {token}'}
        )
        
        assert response.status_code == 200
        data = response.json
        assert 'questions' in data
        assert len(data['questions']) > 0
        question = data['questions'][0]
        assert 'question' in question
        assert 'options' in question
        assert 'correct_answer' in question
        assert 'explanation' in question

def test_generate_quiz_with_math(test_client, test_user, mock_quiz_openai_client):
    """Test quiz generation with math content."""
    # Login to get token
    response = test_client.post('/api/auth/login', json={
        'username': 'testuser',
        'password': 'testpass123'
    })
    token = response.json['token']
    
    # Mock the OpenAI response with LaTeX content
    mock_quiz_openai_client.chat.completions.create.return_value.choices[0].message.content = json.dumps({
        "questions": [
            {
                "question": "What is the solution to \\frac{1}{2} + \\frac{1}{3}?",
                "options": [
                    "\\frac{5}{6}",
                    "\\frac{2}{5}",
                    "\\frac{2}{6}",
                    "\\frac{3}{5}"
                ],
                "correct_answer": "\\frac{5}{6}",
                "explanation": "To add fractions, we need a common denominator: \\frac{3}{6} + \\frac{2}{6} = \\frac{5}{6}"
            }
        ]
    })
    
    # Test quiz generation with math content
    with patch('src.core.utils.openai_client.get_openai_client', return_value=mock_quiz_openai_client):
        response = test_client.post(
            '/api/ai/generate-quiz',
            json={
                'topic': 'Fractions',
                'difficulty': 'beginner'
            },
            headers={'Authorization': f'Bearer {token}'}
        )
        
        assert response.status_code == 200
        data = response.json
        assert 'questions' in data
        assert len(data['questions']) > 0
        question = data['questions'][0]
        assert 'frac' in question['question']
        assert 'frac' in question['correct_answer']
        assert 'frac' in question['explanation']

def test_generate_quiz_invalid_input(test_client, test_user):
    """Test quiz generation with invalid input."""
    # Login to get token
    response = test_client.post('/api/auth/login', json={
        'username': 'testuser',
        'password': 'testpass123'
    })
    token = response.json['token']
    
    # Test with missing topic
    response = test_client.post(
        '/api/ai/generate-quiz',
        json={
            'difficulty': 'beginner'
        },
        headers={'Authorization': f'Bearer {token}'}
    )
    assert response.status_code == 400
    assert 'error' in response.json

def test_generate_lesson_invalid_input(test_client, test_user):
    """Test lesson generation with invalid input."""
    # Login to get token
    response = test_client.post('/api/auth/login', json={
        'username': 'testuser',
        'password': 'testpass123'
    })
    token = response.json['token']
    
    # Test with missing topic
    response = test_client.post(
        '/api/ai/generate-lesson',
        json={
            'difficulty': 'beginner'
        },
        headers={'Authorization': f'Bearer {token}'}
    )
    assert response.status_code == 400
    assert 'error' in response.json
