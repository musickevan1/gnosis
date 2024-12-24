"""OpenAI client utilities."""
from openai import OpenAI
import os
import logging
from flask import current_app
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

def get_openai_client():
    """Get OpenAI client instance."""
    # Reload environment variables
    load_dotenv()
    
    # Debug: print environment variable
    logger.info(f"Environment OPENAI_API_KEY: {os.getenv('OPENAI_API_KEY')[:10]}...")
    
    api_key = current_app.config.get('OPENAI_API_KEY')
    if not api_key:
        raise ValueError("OpenAI API key not found in app configuration")
    
    # Debug: print config key
    logger.info(f"Config OPENAI_API_KEY: {api_key[:10]}...")
    
    logger.info("Setting up OpenAI client...")
    client = OpenAI(api_key=api_key)
    logger.info("OpenAI client setup successfully")
    return client

def get_openai_response(messages, model="gpt-3.5-turbo"):
    """Get response from OpenAI API."""
    try:
        logger.info(f"Getting OpenAI response with model {model}")
        logger.info(f"Messages: {messages}")
        client = get_openai_client()
        
        # Check if we need JSON response
        needs_json = any("JSON" in msg["content"] for msg in messages if msg["role"] == "system")
        
        # Add system message for JSON responses
        if needs_json:
            messages = [
                {"role": "system", "content": "You are a helpful assistant that always responds in valid JSON format."},
                *messages
            ]
        
        # Create completion with appropriate format
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=0.7,
            max_tokens=2000,
            response_format={"type": "json_object"} if needs_json else None
        )
        
        logger.info("Successfully received OpenAI response")
        content = response.choices[0].message.content
        logger.info(f"Response content: {content[:200]}...")  # Log first 200 chars
        return content
    except Exception as e:
        logger.error(f"Error getting OpenAI response: {str(e)}")
        logger.error(f"Error type: {type(e)}")
        raise
