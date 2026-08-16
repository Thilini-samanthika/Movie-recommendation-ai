DevOps and Deployment Guide

This directory contains the Docker configuration files, Dockerfiles, and Nginx proxy setups for running the AI-Powered Personalized Movie Recommendation System.

System Overview

The system runs as four separate containers connected through a Docker network:
1. MySQL Database (Port 3306) - Stores user profiles, ratings, and favorites.
2. Spring Boot Backend (Port 8080) - Handles authentication, user management, and business logic.
3. Python FastAPI AI Service (Port 8000) - Runs TF-IDF, recommendation algorithm, and sentiment analysis models.
4. React Frontend (Port 80) - Serves the web interface through Nginx reverse proxy.


Container Setup

MySQL Database: Uses official mysql:8.0 image with persistent volume storage.
Spring Boot Backend: Multi-stage build defined in deployment/docker/backend.Dockerfile.
Python AI Service: Built using deployment/docker/ai-service.Dockerfile with Python 3.10 slim.
React Frontend: Multi-stage build in deployment/docker/frontend.Dockerfile served with Nginx.


How to Deploy Using Docker Compose

Step 1: Setup Environment File
Copy the example environment file:
cp deployment/.env.example .env

Step 2: Build and Start Containers
From the main project directory, run:
docker-compose up -d --build

Step 3: Check Container Status
To check if all containers are running properly:
docker-compose ps

To view container logs:
docker-compose logs -f

To test endpoint health:
curl http://localhost:8000/health
curl http://localhost:8080/api/health

Step 4: Access the Application
React Web App: http://localhost
Spring Boot API: http://localhost:8080
FastAPI AI Service Docs: http://localhost:8000/docs


Stopping the Containers

To stop the running containers:
docker-compose down

To stop containers and clean up data volumes:
docker-compose down -v
