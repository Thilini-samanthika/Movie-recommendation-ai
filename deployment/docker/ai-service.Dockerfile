# Dockerfile for Python FastAPI AI Recommendation Microservice
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies needed for C extension builds
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements from ai-service
COPY ai-service/requirements.txt .

# Install Python packages
RUN pip install --no-cache-dir -r requirements.txt

# Copy ai-service source code and datasets into container
COPY ai-service/ .
COPY datasets /datasets

# Expose FastAPI Port
EXPOSE 8000

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

# Health check instruction with 30s start period to allow model initialization
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Launch FastAPI Uvicorn Server
CMD ["python", "-m", "uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
