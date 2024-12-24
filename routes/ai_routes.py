from flask import Blueprint, request, jsonify, current_app
import os
from functools import wraps
from jose import jwt
from models.user import User
from models.database import db
from datetime import datetime
import logging
import requests
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from models.search_history import SearchHistory
import json
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import re
from openai import OpenAI
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
    errors = []
    
    if topic is not None and (not isinstance(topic, str) or len(topic) > MAX_TOPIC_LENGTH):
        errors.append(f"Topic must be a string less than {MAX_TOPIC_LENGTH} characters")
            
    if difficulty is not None and difficulty not in VALID_DIFFICULTIES:
        errors.append(f"Difficulty must be one of: {', '.join(VALID_DIFFICULTIES)}")
            
    if answer is not None and (not isinstance(answer, str) or len(answer) > MAX_ANSWER_LENGTH):
        errors.append(f"Answer must be a string less than {MAX_ANSWER_LENGTH} characters")
            
    return errors

def get_openai_response(messages):
    api_key = current_app.config.get('OPENAI_API_KEY')
    
    if not api_key:
        logger.error("Missing OpenAI API key")
        raise ValueError("Missing OpenAI API key configuration")

    logger.info("Initializing OpenAI client...")
    try:
        client = OpenAI(
            api_key=api_key
        )

        # Create an Assistant
        assistant = client.beta.assistants.create(
            name="AI Learning Companion",
            instructions="You are a knowledgeable tutor helping students learn various subjects.",
            model="gpt-3.5-turbo"
        )

        # Create a Thread
        thread = client.beta.threads.create()

        # Add Message to Thread
        message = client.beta.threads.messages.create(
            thread_id=thread.id,
            role="user",
            content=messages[-1]["content"]  # Get the last message from the messages list
        )

        # Run the Assistant
        run = client.beta.threads.runs.create(
            thread_id=thread.id,
            assistant_id=assistant.id
        )

        # Wait for completion
        while True:
            run = client.beta.threads.runs.retrieve(
                thread_id=thread.id,
                run_id=run.id
            )
            if run.status == 'completed':
                break
            elif run.status in ['failed', 'cancelled', 'expired']:
                raise ValueError(f"Assistant run failed with status: {run.status}")
            time.sleep(1)  # Wait before checking again

        # Get the response
        messages = client.beta.threads.messages.list(thread_id=thread.id)
        response = messages.data[0].content[0].text.value

        # Clean up
        client.beta.assistants.delete(assistant_id=assistant.id)

        return response

    except Exception as e:
        logger.error(f"OpenAI API request failed: {str(e)}")
        raise ValueError("Failed to get response from OpenAI API") from e

def get_subject_type(topic):
    categories = {
        'math': ['calculus', 'algebra', 'geometry', 'mathematics', 'trigonometry', 'statistics'],
        'science': ['physics', 'chemistry', 'biology', 'astronomy', 'geology'],
        'practical': ['cooking', 'baking', 'gardening', 'woodworking', 'crafts', 'diy', 'biking', 'sports'],
        'technology': ['programming', 'coding', 'computer', 'software', 'hardware', 'networking'],
        'language': ['english', 'spanish', 'french', 'grammar', 'writing', 'literature'],
        'arts': ['music', 'painting', 'drawing', 'photography', 'design'],
        'business': ['economics', 'finance', 'marketing', 'management', 'accounting']
    }
    
    topic_lower = topic.lower()
    for category, keywords in categories.items():
        if any(keyword in topic_lower for keyword in keywords):
            return category
    return 'general'

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

def get_lesson_prompt(topic, difficulty, subject_type):
    base_prompt = f"""Create a {difficulty} level lesson about {topic}. 
    Format the lesson with the following structure:
    1. Use '**' for bold text to emphasize key points and terms
    2. Use proper markdown formatting:
       - Headers with '#' for sections
       - Bullet points with '-' for lists
       - Numbered lists for steps
    3. For mathematical content:
       - Use $ for inline math
       - Use $$ for display math
       - Format fractions as \\frac{{numerator}}{{denominator}}
       - Format exponents as ^{{power}}
       - Format square roots as \\sqrt{{x}}
    4. Organize the content with clear sections:
       - Introduction
       - Key Concepts (with bold terms)
       - Detailed Explanation
       - Examples
    5. DO NOT include practice problems at the end
    6. DO NOT use backslashes except in LaTeX commands
    """
    
    if subject_type == 'math':
        return base_prompt + """
        Include step-by-step solutions with clear explanations.
        Format all mathematical expressions using LaTeX.
        Make sure to bold key mathematical terms and concepts.
        """
    elif subject_type == 'programming':
        return base_prompt + """
        Include code examples in proper markdown code blocks.
        Bold important programming concepts and terms.
        Use proper indentation in code examples.
        """
    elif subject_type == 'science':
        return base_prompt + """
        Include scientific terms in bold.
        Use LaTeX for any mathematical formulas.
        Clearly explain scientific concepts with examples.
        """
    else:
        return base_prompt + """
        Focus on clear explanations with key terms in bold.
        Use examples to illustrate concepts.
        """

def get_quiz_prompt(topic, difficulty, subject_type):
    base_prompt = f"Create 5 {difficulty} level quiz questions about {topic}. "
    
    if subject_type == 'math':
        return base_prompt + """
        Include calculation problems. Use LaTeX for equations. Provide answers.
        """
    elif subject_type == 'programming':
        return base_prompt + """
        Include coding problems. Show expected outputs. Provide solutions.
        """
    elif subject_type == 'science':
        return base_prompt + """
        Mix conceptual and numerical problems. Provide answers.
        """
    else:
        return base_prompt + """
        Focus on key concepts. Provide clear answers.
        """

def generate_lesson_content(topic, difficulty, subject_type):
    try:
        prompt = get_lesson_prompt(topic, difficulty, subject_type)
        response = get_openai_response([
            {"role": "system", "content": "You are a knowledgeable tutor."},
            {"role": "user", "content": prompt}
        ])
        return format_lesson_content(response)
    except Exception as e:
        logger.error(f"Error generating lesson content: {str(e)}")
        raise

def generate_quiz_content(topic, difficulty, subject_type):
    try:
        prompt = get_quiz_prompt(topic, difficulty, subject_type)
        response = get_openai_response([
            {"role": "system", "content": "You are a knowledgeable quiz creator."},
            {"role": "user", "content": prompt}
        ])
        return format_quiz_content(response)
    except Exception as e:
        logger.error(f"Error generating quiz content: {str(e)}")
        raise

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            logger.warning("Token missing in request")
            return jsonify({"error": "Token is missing"}), 401
        
        try:
            if not token.startswith('Bearer '):
                raise jwt.JWTError("Invalid token format")
                
            token = token.split()[1]
            data = jwt.decode(
                token, 
                os.getenv('SECRET_KEY', 'default-secret-key'), 
                algorithms=['HS256']
            )
            
            current_user = User.query.get(data['user_id'])
            if not current_user:
                raise ValueError("User not found")
                
        except jwt.ExpiredSignatureError:
            logger.warning("Expired token used")
            return jsonify({"error": "Token has expired"}), 401
        except jwt.JWTError as e:
            logger.warning(f"JWT validation failed: {str(e)}")
            return jsonify({"error": "Invalid token"}), 401
        except Exception as e:
            logger.error(f"Token validation error: {str(e)}")
            return jsonify({"error": "Token validation failed"}), 401
            
        return f(current_user, *args, **kwargs)
    return decorated

@bp.route('/generate-lesson', methods=['POST'])
@token_required
@limiter.limit("10 per minute")
def generate_lesson(current_user):
    try:
        data = request.get_json()
        logger.info("Received generate lesson request")
        
        topic = data.get('topic')
        difficulty = data.get('difficulty', 'intermediate')
        
        if not topic:
            return jsonify({'error': 'Topic is required'}), 400

        subject_type = get_subject_type(topic.lower())
        
        logger.info(f"Generating lesson for topic: {topic}, difficulty: {difficulty}")
        
        try:
            lesson_content = generate_lesson_content(topic, difficulty, subject_type)
            
            if not lesson_content:
                logger.error("Empty response from OpenAI API")
                return jsonify({'error': 'Failed to generate lesson content'}), 500

            try:
                search_history = SearchHistory(
                    user_id=current_user.id,
                    topic=topic,
                    difficulty=difficulty,
                    subject_type=subject_type,
                    lesson_content=lesson_content
                )
                db.session.add(search_history)
                db.session.commit()

                return jsonify({
                    'lesson': lesson_content,
                    'subject_type': subject_type,
                    'history_id': search_history.id
                })
            except Exception as db_error:
                logger.error(f"Database error: {str(db_error)}")
                db.session.rollback()
                return jsonify({'error': 'Error saving lesson to database'}), 500

        except Exception as e:
            logger.error(f"Error generating lesson content: {str(e)}")
            return jsonify({'error': str(e)}), 500

    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@bp.route('/generate-quiz', methods=['POST'])
@token_required
@limiter.limit("20 per hour")
def generate_quiz(current_user):
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
            
        topic = data.get('topic')
        difficulty = data.get('difficulty', 'intermediate')
        history_id = data.get('history_id')
        
        errors = validate_input(topic=topic, difficulty=difficulty)
        if errors:
            return jsonify({'errors': errors}), 400

        subject_type = get_subject_type(topic)
        quiz_content = generate_quiz_content(topic, difficulty, subject_type)

        try:
            quiz_json = json.loads(quiz_content)
            
            if subject_type in ['math', 'science']:
                for question in quiz_json['questions']:
                    question['question'] = format_latex_content(question['question'])
                    question['options'] = [format_latex_content(opt) for opt in question['options']]
                    question['correct_answer'] = format_latex_content(question['correct_answer'])
                    if 'explanation' in question:
                        question['explanation'] = format_latex_content(question['explanation'])

            if history_id:
                search_history = SearchHistory.query.get(history_id)
                if search_history and search_history.user_id == current_user.id:
                    search_history.quiz_content = json.dumps(quiz_json)
                else:
                    return jsonify({'error': 'Invalid history ID'}), 400
            else:
                search_history = SearchHistory(
                    user_id=current_user.id,
                    topic=topic,
                    difficulty=difficulty,
                    subject_type=subject_type,
                    quiz_content=json.dumps(quiz_json)
                )
                db.session.add(search_history)
            
            db.session.commit()
            logger.info(f"Generated quiz for topic '{topic}' with difficulty '{difficulty}'")

            return jsonify({
                **quiz_json,
                'subject_type': subject_type,
                'history_id': search_history.id
            })

        except json.JSONDecodeError as e:
            logger.error(f"JSON parsing error: {str(e)}\nRaw content: {quiz_content}")
            return jsonify({'error': 'Failed to parse quiz content', 'details': str(e)}), 500

    except Exception as e:
        logger.error(f"Error in generate_quiz: {str(e)}")
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500

@bp.route('/search-history', methods=['GET'])
@token_required
def get_search_history(current_user):
    try:
        topic = request.args.get('topic')
        subject_type = request.args.get('subject_type')
        
        query = SearchHistory.query.filter_by(user_id=current_user.id)
        
        if topic:
            query = query.filter(SearchHistory.topic.ilike(f'%{topic}%'))
        if subject_type:
            query = query.filter_by(subject_type=subject_type)
            
        history = query.order_by(SearchHistory.created_at.desc()).all()
        
        return jsonify({
            'history': [item.to_dict() for item in history]
        })
        
    except Exception as e:
        logger.error(f"Error getting search history: {str(e)}")
        return jsonify({'error': 'Failed to get search history'}), 500

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
        
        response = get_openai_response([
            {"role": "system", "content": "You are an encouraging tutor providing constructive feedback."},
            {"role": "user", "content": f"Compare this answer: '{answer}' with the correct answer: '{correct_answer}'. Provide constructive feedback."}
        ])
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
            
        youtube_api_key = current_app.config.get('YOUTUBE_API_KEY')
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
        response = get_openai_response([
            {"role": "user", "content": "Hello!"}
        ])
        return jsonify({'status': 'success', 'message': 'API key is valid'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500