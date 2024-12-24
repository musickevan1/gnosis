"""Service for generating lesson content using AI."""
from src.core.utils.openai_client import get_openai_client

def generate_lesson_content(topic: str, difficulty: str) -> str:
    """Generate lesson content using OpenAI."""
    client = get_openai_client()
    
    # Create the prompt
    prompt = f"""Create a lesson about {topic} for {difficulty} level students.
    Include:
    1. Introduction
    2. Key concepts
    3. Examples
    4. Practice exercises
    5. Summary
    """
    
    # Call OpenAI API
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "You are a knowledgeable teacher."},
            {"role": "user", "content": prompt}
        ]
    )
    
    return response.choices[0].message.content
