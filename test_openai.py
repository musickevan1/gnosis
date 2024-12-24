from dotenv import load_dotenv
import os
from openai import OpenAI
from pathlib import Path

# Load environment variables from absolute path
env_path = Path(__file__).parent / '.env'
load_dotenv(env_path)

def test_openai():
    try:
        # Get API key from environment
        api_key = os.getenv('OPENAI_API_KEY')
        print(f"API Key present: {bool(api_key)}")
        if api_key:
            print(f"API Key starts with: {api_key[:15]}...")
        else:
            print("No API key found!")
        
        # Initialize client with project API endpoint
        client = OpenAI(
            api_key=api_key,
            base_url="https://api.projectapi.openai.com/v1"
        )
        
        # Try a simple completion
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "Say hello!"}
            ]
        )
        
        # Print response
        print("\nResponse from OpenAI:")
        print(response.choices[0].message.content)
        print("\nAPI test successful!")
        
    except Exception as e:
        print(f"\nError testing OpenAI API: {str(e)}")

if __name__ == "__main__":
    test_openai()
