# AI Learning Companion

An intelligent learning platform that provides personalized education using advanced AI features.

## Features

- Personalized learning paths based on user progress and preferences
- AI-powered content recommendations
- Interactive learning sessions with real-time feedback
- Progress tracking and analytics
- Adaptive quiz generation
- Social learning features

## Tech Stack

- Backend: Python/Flask
- Frontend: React
- Database: SQLite
- AI Integration: OpenAI API

## Setup Instructions

1. Create a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Set up environment variables:
   Create a `.env` file with:
   ```
   OPENAI_API_KEY=your_api_key_here
   SECRET_KEY=your_secret_key
   ```

4. Run the application:
   ```
   python app.py
   ```

## Project Structure

```
/
├── app.py              # Main Flask application
├── config.py           # Configuration settings
├── models/            # Database models
├── routes/            # API routes
├── services/          # Business logic and AI services
├── static/            # Static files (CSS, JS)
└── templates/         # HTML templates
```
