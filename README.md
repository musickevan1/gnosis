# Gnosis - AI Learning Companion

Gnosis is an intelligent learning platform that leverages OpenAI's advanced language models to provide personalized education experiences. The application helps users learn new subjects through interactive lessons, quizzes, and adaptive learning paths.

## Features

- **Personalized Learning**: AI-driven content generation tailored to your learning style and pace
- **Interactive Lessons**: Dynamic lesson generation across various subjects
- **Practice Quizzes**: Auto-generated quizzes to test understanding
- **Progress Tracking**: Monitor your learning journey
- **Multi-subject Support**: Learn anything from mathematics to programming
- **Adaptive Learning**: Content difficulty adjusts based on your performance

## Tech Stack

### Backend
- Python 3.11
- Flask (Web Framework)
- SQLAlchemy (ORM)
- OpenAI API (GPT-3.5 Turbo)
- JWT Authentication

### Frontend
- React 18
- Vite
- Material-UI
- Axios

### Infrastructure
- Docker
- Docker Compose
- SQLite Database

## Project Structure

```
gnosis/
├── .env.example             # Example environment variables
├── .gitignore              # Git ignore rules
├── Dockerfile              # Backend Dockerfile
├── README.md               # Project documentation
├── app.py                  # Flask application entry point
├── docker-compose.yml      # Docker compose configuration
├── init_db.py             # Database initialization script
├── requirements.txt        # Python dependencies
│
├── frontend/              # React frontend application
│   ├── Dockerfile        # Frontend Dockerfile
│   ├── package.json      # Node.js dependencies
│   ├── public/          # Static assets
│   └── src/             # React source code
│       ├── components/  # Reusable React components
│       ├── contexts/    # React contexts
│       ├── hooks/       # Custom React hooks
│       ├── pages/       # Page components
│       ├── services/    # API services
│       └── theme/       # UI theming
│
├── models/               # Database models
│   ├── __init__.py
│   ├── database.py      # Database configuration
│   ├── search_history.py # Search history model
│   └── user.py          # User model
│
├── routes/              # API routes
│   ├── __init__.py
│   ├── ai_routes.py     # AI-related endpoints
│   ├── auth_routes.py   # Authentication endpoints
│   └── learning_routes.py # Learning-related endpoints
│
└── utils/              # Utility functions
    └── openai_client.py # OpenAI client configuration
```

## Setup and Installation

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)
- OpenAI API Key

### Environment Variables
Copy `.env.example` to `.env` and fill in the required values:
```bash
FLASK_APP=app.py
FLASK_DEBUG=1
FLASK_ENV=development
SECRET_KEY=your_secret_key
DATABASE_URL=sqlite:///instance/app.db
OPENAI_API_KEY=your_openai_api_key
```

### Running with Docker
1. Build and start the containers:
```bash
docker-compose up --build
```
2. Access the application:
   - Frontend: http://localhost:5177
   - Backend API: http://localhost:5000

### Local Development Setup
1. Backend Setup:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
flask run
```

2. Frontend Setup:
```bash
cd frontend
npm install
npm run dev
```

## Development

### Branch Strategy
- `main`: Production-ready code
- `develop`: Main development branch
- Feature branches: `feature/*`
- Release branches: `release/*`
- Hotfix branches: `hotfix/*`

### Contributing
1. Create a feature branch from `develop`
2. Make your changes
3. Submit a pull request to `develop`

## Testing
- Backend tests: `python -m pytest`
- Frontend tests: `cd frontend && npm test`

## License
[MIT License](LICENSE)
