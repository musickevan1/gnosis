# Use Python 3.11 slim image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first to leverage Docker cache
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY src/ ./src/
COPY scripts/ ./scripts/
COPY .env.example .

# Create instance directory for SQLite database
RUN mkdir -p instance

# Set environment variables
ENV PYTHONPATH=/app
ENV FLASK_APP=src/app.py

# Run the application
CMD ["flask", "run", "--host=0.0.0.0"]
