"""AI routes for generating lessons and quizzes."""
from flask import Blueprint, request, jsonify, current_app
from src.core.models.search_history import SearchHistory
from src.core.models.database import db
from src.core.utils.openai_client import get_openai_response
from src.api.routes.auth_routes import token_required
import os
import logging
import requests
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import json
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import re
import time

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize rate limiter
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://"
)

bp = Blueprint('ai', __name__, url_prefix='/api/ai')

VALID_DIFFICULTIES = ['beginner', 'intermediate', 'advanced']
MAX_TOPIC_LENGTH = 200
MAX_ANSWER_LENGTH = 1000

def validate_input(topic=None, difficulty=None, answer=None):
    """Validate input parameters."""
    errors = []
    
    if topic is not None and (not isinstance(topic, str) or len(topic) > MAX_TOPIC_LENGTH):
        errors.append(f"Topic must be a string less than {MAX_TOPIC_LENGTH} characters")
            
    if difficulty is not None and difficulty not in VALID_DIFFICULTIES:
        errors.append(f"Difficulty must be one of: {', '.join(VALID_DIFFICULTIES)}")
            
    if answer is not None and (not isinstance(answer, str) or len(answer) > MAX_ANSWER_LENGTH):
        errors.append(f"Answer must be a string less than {MAX_ANSWER_LENGTH} characters")
            
    return errors

def get_subject_type(topic):
    """Determine the subject type from the topic."""
    topic = topic.lower()
    if any(word in topic for word in ['math', 'algebra', 'calculus', 'geometry']):
        return 'math'
    elif any(word in topic for word in ['physics', 'chemistry', 'biology']):
        return 'science'
    elif any(word in topic for word in ['history', 'geography', 'economics']):
        return 'social_studies'
    elif any(word in topic for word in ['python', 'java', 'programming', 'code']):
        return 'programming'
    else:
        return 'general'

def get_lesson_prompt(topic, difficulty, subject_type):
    """Get the prompt for lesson generation."""
    return [
        {"role": "system", "content": f"You are an expert {subject_type} tutor. Create a detailed lesson about {topic} for {difficulty} level students."},
        {"role": "user", "content": f"Please create a lesson about {topic} that is suitable for {difficulty} level students. Include examples and explanations."}
    ]

def get_quiz_prompt(topic, difficulty, subject_type):
    """Get the prompt for quiz generation."""
    return [
        {"role": "system", "content": f"You are an expert {subject_type} tutor. Create a quiz about {topic} for {difficulty} level students. Return the response in JSON format with the following structure: {{\"questions\": [{{\"question\": \"...\", \"options\": [\"A\", \"B\", \"C\", \"D\"], \"correct_answer\": \"...\", \"explanation\": \"...\"}}]}}"},
        {"role": "user", "content": f"Please create a quiz about {topic} that is suitable for {difficulty} level students. Include 5 multiple choice questions with answers. Format your response as a valid JSON object."}
    ]

def format_latex_content(content):
    if not content:
        return content

    try:
        content = (
            content
            .replace('\\\\', '\\')
            .replace(' $ ', '$')
            .replace(' $$ ', '$$')
            .replace('\n$$', '\n\n$$\n\n')
            .replace('\\frac', '\\\\frac')
            .replace('\\sqrt', '\\\\sqrt')
            .replace('\\sum', '\\\\sum')
            .replace('\\int', '\\\\int')
        )

        return content
    except Exception as e:
        logger.error(f"Error formatting LaTeX content: {str(e)}")
        return content

def format_lesson_content(content):
    if not content:
        return content

    try:
        content = (
            content
            .replace('\\_', '_')
            .replace('\\*', '*')
            .replace('\\-', '-')
            .replace('\\#', '#')
            .replace('\\[', '[')
            .replace('\\]', ']')
            .replace('\\(', '(')
            .replace('\\)', ')')
            .replace('\n\n\n', '\n\n')
            .replace('\n\n#', '\n#')
            .replace('\n- ', '\n\n- ')
            .replace('\n  - ', '\n- ')
            .replace('\n1. ', '\n\n1. ')
        )

        content = (
            content
            .replace('\\\\', '\\')
            .replace(' $', '$')
            .replace('$ ', '$')
            .replace('\n$$', '\n\n$$')
            .replace('$$\n', '$$\n\n')
        )

        import re
        content = re.sub(r'\\(?![a-zA-Z{])', '', content)
        
        latex_commands = [
            'frac', 'sqrt', 'sum', 'int', 'prod', 'lim',
            'alpha', 'beta', 'gamma', 'delta', 'theta',
            'pi', 'sigma', 'omega', 'infty', 'cdot',
            'times', 'div', 'pm', 'mp', 'leq', 'geq',
            'neq', 'approx', 'equiv', 'rightarrow'
        ]
        
        for cmd in latex_commands:
            content = re.sub(f'(?<!\\\\){cmd}(?={{|\\s|\\()', f'\\{cmd}', content)
            content = content.replace(f'\\\\{cmd}', f'\\{cmd}')

        return content.strip()
    except Exception as e:
        logger.error(f"Error formatting lesson content: {str(e)}")
        return content.strip()

def format_quiz_content(content):
    if not content:
        return content

    try:
        content = (
            content
            .replace('\\_', '_')
            .replace('\\*', '*')
            .replace('\\-', '-')
            .replace('\\#', '#')
            .replace('\\[', '[')
            .replace('\\]', ']')
            .replace('\\(', '(')
            .replace('\\)', ')')
            .replace('\n\n\n', '\n\n')
            .replace('\n\n#', '\n#')
            .replace('\n- ', '\n\n- ')
            .replace('\n  - ', '\n- ')
            .replace('\n1. ', '\n\n1. ')
        )

        content = (
            content
            .replace('\\\\', '\\')
            .replace(' $', '$')
            .replace('$ ', '$')
            .replace('\n$$', '\n\n$$')
            .replace('$$\n', '$$\n\n')
        )

        import re
        content = re.sub(r'\\(?![a-zA-Z{])', '', content)
        
        latex_commands = [
            'frac', 'sqrt', 'sum', 'int', 'prod', 'lim',
            'alpha', 'beta', 'gamma', 'delta', 'theta',
            'pi', 'sigma', 'omega', 'infty', 'cdot',
            'times', 'div', 'pm', 'mp', 'leq', 'geq',
            'neq', 'approx', 'equiv', 'rightarrow'
        ]
        
        for cmd in latex_commands:
            content = re.sub(f'(?<!\\\\){cmd}(?={{|\\s|\\()', f'\\{cmd}', content)
            content = content.replace(f'\\\\{cmd}', f'\\{cmd}')

        return content.strip()
    except Exception as e:
        logger.error(f"Error formatting quiz content: {str(e)}")
        return content.strip()

@bp.route('/generate-lesson', methods=['POST'])
@token_required
@limiter.limit("10 per minute")
def generate_lesson(current_user):
    """Generate a lesson based on the given topic and difficulty."""
    data = request.get_json()
    
    # Validate input
    if not data or not data.get('topic') or not data.get('difficulty'):
        logger.error(f"Missing required fields in request data: {data}")
        return jsonify({"error": "Missing required fields"}), 400
        
    topic = data['topic']
    difficulty = data['difficulty']
    
    # Validate input parameters
    errors = validate_input(topic=topic, difficulty=difficulty)
    if errors:
        logger.error(f"Input validation errors: {errors}")
        return jsonify({"errors": errors}), 400
    
    try:
        # Get subject type for specialized prompts
        subject_type = get_subject_type(topic)
        logger.info(f"Subject type determined: {subject_type}")
        
        # Generate lesson content
        prompt = get_lesson_prompt(topic, difficulty, subject_type)
        logger.info(f"Generated lesson prompt: {prompt}")
        
        lesson_content = get_openai_response(prompt)
        logger.info(f"Received lesson content (first 200 chars): {lesson_content[:200]}")
        
        if not lesson_content:
            logger.error("Empty lesson content received from OpenAI")
            return jsonify({"error": "Failed to generate lesson content"}), 500
            
        # Save to search history
        try:
            history = SearchHistory(
                user_id=current_user.id,
                topic=topic,
                difficulty=difficulty,
                content_type='lesson',
                content=lesson_content
            )
            db.session.add(history)
            db.session.commit()
            logger.info(f"Lesson saved to history with ID: {history.id}")
        except Exception as db_error:
            logger.error(f"Database error saving lesson: {str(db_error)}")
            # Continue even if history save fails
        
        return jsonify({
            "lesson": format_lesson_content(lesson_content),
            "history_id": history.id if 'history' in locals() else None
        }), 200
        
    except Exception as e:
        logger.error(f"Error generating lesson: {str(e)}")
        logger.error(f"Error type: {type(e)}")
        logger.exception("Full traceback:")
        return jsonify({"error": str(e)}), 500

@bp.route('/generate-quiz', methods=['POST'])
@token_required
@limiter.limit("20 per hour")
def generate_quiz(current_user):
    """Generate a quiz based on the given topic and difficulty."""
    try:
        data = request.get_json()
        if not data:
            logger.error("No JSON data provided in quiz request")
            return jsonify({'error': 'No JSON data provided'}), 400
            
        topic = data.get('topic')
        if not topic:
            logger.error("Missing topic in quiz request")
            return jsonify({'error': 'Missing required field: topic'}), 400
            
        difficulty = data.get('difficulty', 'intermediate')
        history_id = data.get('history_id')
        
        logger.info(f"Generating quiz for topic: {topic}, difficulty: {difficulty}")
        
        errors = validate_input(topic=topic, difficulty=difficulty)
        if errors:
            logger.error(f"Quiz input validation errors: {errors}")
            return jsonify({'errors': errors}), 400

        subject_type = get_subject_type(topic)
        logger.info(f"Quiz subject type determined: {subject_type}")
        
        prompt = get_quiz_prompt(topic, difficulty, subject_type)
        logger.info(f"Generated quiz prompt: {prompt}")
        
        try:
            quiz_content = get_openai_response(prompt)
            logger.info(f"Received quiz content (first 200 chars): {quiz_content[:200]}")
        except Exception as openai_error:
            logger.error(f"OpenAI API error: {str(openai_error)}")
            logger.exception("Full OpenAI error traceback:")
            return jsonify({'error': str(openai_error)}), 500

        try:
            quiz_json = json.loads(quiz_content)
            logger.info("Successfully parsed quiz JSON")
            
            if 'questions' not in quiz_json:
                logger.error(f"Invalid quiz format - missing 'questions' key. Content: {quiz_content}")
                return jsonify({'error': 'Invalid quiz format - missing questions'}), 500
            
            if subject_type in ['math', 'science']:
                for question in quiz_json['questions']:
                    question['question'] = format_latex_content(question['question'])
                    question['options'] = [format_latex_content(opt) for opt in question['options']]
                    question['correct_answer'] = format_latex_content(question['correct_answer'])
                    if 'explanation' in question:
                        question['explanation'] = format_latex_content(question['explanation'])
            
            # Save to search history
            try:
                history = SearchHistory(
                    user_id=current_user.id,
                    topic=topic,
                    difficulty=difficulty,
                    content_type='quiz',
                    content=json.dumps(quiz_json)
                )
                db.session.add(history)
                db.session.commit()
                logger.info(f"Quiz saved to history with ID: {history.id}")
            except Exception as db_error:
                logger.error(f"Database error saving quiz: {str(db_error)}")
                # Continue even if history save fails
            
            return jsonify({
                "questions": quiz_json['questions'],
                "history_id": history.id if 'history' in locals() else None
            }), 200
            
        except json.JSONDecodeError as json_error:
            logger.error(f"JSON parsing error: {str(json_error)}")
            logger.error(f"Invalid JSON content: {quiz_content}")
            return jsonify({'error': 'Invalid quiz format - failed to parse JSON'}), 500
            
    except Exception as e:
        logger.error(f"Error generating quiz: {str(e)}")
        logger.error(f"Error type: {type(e)}")
        logger.exception("Full traceback:")
        return jsonify({'error': str(e)}), 500

@bp.route('/search-history', methods=['GET'])
@token_required
def get_search_history(current_user):
    """Get search history for the current user."""
    try:
        history = SearchHistory.query.filter_by(user_id=current_user.id).order_by(SearchHistory.created_at.desc()).all()
        return jsonify([{
            'id': item.id,
            'topic': item.topic,
            'difficulty': item.difficulty,
            'content_type': item.content_type,
            'created_at': item.created_at.isoformat()
        } for item in history]), 200
    except Exception as e:
        logger.error(f"Error retrieving search history: {str(e)}")
        return jsonify({'error': 'Failed to retrieve search history'}), 500

@bp.route('/search-history/<int:history_id>', methods=['GET'])
@token_required
def get_search_history_item(current_user, history_id):
    try:
        history_item = SearchHistory.query.get(history_id)
        
        if not history_item:
            return jsonify({'error': 'History item not found'}), 404
            
        if history_item.user_id != current_user.id:
            return jsonify({'error': 'Unauthorized'}), 403
            
        return jsonify(history_item.to_dict())
        
    except Exception as e:
        logger.error(f"Error getting history item: {str(e)}")
        return jsonify({'error': 'Failed to get history item'}), 500

@bp.route('/search-history/<int:history_id>', methods=['DELETE'])
@token_required
def delete_search_history(current_user, history_id):
    try:
        history_item = SearchHistory.query.filter_by(
            id=history_id,
            user_id=current_user.id
        ).first()
        
        if not history_item:
            return jsonify({'error': 'History item not found'}), 404
            
        db.session.delete(history_item)
        db.session.commit()
        
        return jsonify({'message': 'History item deleted successfully'})
        
    except Exception as e:
        logger.error(f"Error deleting search history: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to delete history item'}), 500

@bp.route('/search-history/clear-all', methods=['DELETE'])
@token_required
def clear_search_history(current_user):
    try:
        SearchHistory.query.filter_by(user_id=current_user.id).delete()
        db.session.commit()
        return jsonify({'message': 'All history items deleted successfully'})
    except Exception as e:
        logger.error(f"Error clearing search history: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to clear history'}), 500

@bp.route('/get-feedback', methods=['POST'])
@token_required
def get_feedback(current_user):
    try:
        data = request.get_json()
        answer = data.get('answer', '')
        correct_answer = data.get('correct_answer', '')
        
        errors = validate_input(answer=answer)
        if errors:
            return jsonify({'errors': errors}), 400
        
        prompt = [
            {"role": "system", "content": "You are an encouraging tutor providing constructive feedback."},
            {"role": "user", "content": f"Compare this answer: '{answer}' with the correct answer: '{correct_answer}'. Provide constructive feedback."}
        ]
        response = get_openai_response(prompt)
        feedback_content = response
        
        return jsonify({
            "feedback": feedback_content
        })
    except Exception as e:
        logger.error(f"Feedback generation error: {str(e)}")
        return jsonify({"error": str(e)}), 500

@bp.route('/search-video', methods=['POST'])
@token_required
def search_video(current_user):
    try:
        data = request.get_json()
        topic = data.get('topic')
        difficulty = data.get('difficulty', 'intermediate')
        
        if not topic:
            return jsonify({"error": "Topic is required"}), 400
            
        youtube_api_key = current_app.config['YOUTUBE_API_KEY']
        if not youtube_api_key:
            return jsonify({
                "error": "YouTube API key not configured. Please add YOUTUBE_API_KEY to your environment variables."
            }), 500

        search_query = f"{topic} {difficulty} level tutorial explanation"
        
        youtube = build('youtube', 'v3', developerKey=youtube_api_key)
        
        try:
            search_response = youtube.search().list(
                q=search_query,
                part='id,snippet',
                maxResults=1,
                type='video',
                videoDuration='medium',  
                relevanceLanguage='en',
                safeSearch='strict',
                videoEmbeddable='true',  
                fields='items(id/videoId,snippet/title,snippet/description)'  
            ).execute()
            
            if search_response.get('items'):
                video = search_response['items'][0]
                video_id = video['id']['videoId']
                video_title = video['snippet']['title']
                video_description = video['snippet']['description']
                
                return jsonify({
                    "videoId": video_id,
                    "title": video_title,
                    "description": video_description
                })
            else:
                return jsonify({"error": "No suitable videos found for this topic"}), 404
                
        except HttpError as e:
            logger.error(f"YouTube API error: {str(e)}")
            return jsonify({"error": "Failed to search YouTube. Please try again later."}), 500
            
    except Exception as e:
        logger.error(f"Video search error: {str(e)}")
        return jsonify({"error": str(e)}), 500

@bp.route('/test-api-key', methods=['GET'])
@token_required
def test_api_key(current_user):
    try:
        prompt = [
            {"role": "user", "content": "Hello!"}
        ]
        response = get_openai_response(prompt)
        return jsonify({'status': 'success', 'message': 'API key is valid'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500