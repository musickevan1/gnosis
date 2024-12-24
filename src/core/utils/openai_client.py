from openai import OpenAI
import os
import logging

logger = logging.getLogger(__name__)

def get_openai_client():
    """Get OpenAI client with proper error handling"""
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        logger.error("OpenAI API key not found in environment variables")
        raise ValueError("OpenAI API key not configured")
        
    try:
        client = OpenAI(
            api_key=api_key,
            base_url="https://api.projectapi.openai.com/v1"
        )
        return client
    except Exception as e:
        logger.error(f"Failed to initialize OpenAI client: {str(e)}")
        raise
