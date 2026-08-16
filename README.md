# AI-Powered Personalized Movie Recommendation System

Coursework: Microservices-Based System Architecture  
Module: Service-Oriented Computing (IT41033 - NIA Mini Project)  

Project Overview

The AI-Powered Personalized Movie Recommendation System is a distributed microservices web application designed to provide personalized movie recommendations using Machine Learning, Natural Language Processing (NLP), Deep Learning, Sentiment Analysis, and Hybrid Recommendation techniques.

System Architecture and Components

The system architecture consists of a client application, an API gateway and security layer, a Spring Boot backend API service, a Python AI recommendation microservice, and a MySQL relational database.

Client Application (React Frontend) -> Nginx Reverse Proxy (Port 80) -> Spring Boot Backend API (Port 8080) -> Python AI Service (Port 8000) -> MySQL 8.0 Database (Port 3306)


Team Member Work Breakdown Matrix

| Student Name | Role | Microservice / Domain | Key Responsibilities and Endpoints |
|--------------|------|-----------------------|------------------------------------|
| Student 1 | Gateway Lead / Member | User and Auth Service | API Gateway, OAuth 2.0 / JWT Auth, Rate Limiting. Endpoints: /api/auth/login, /api/auth/register |
| Student 2 | Backend Engineer / Member | Movie Management Service | API Key auth, Spring Boot REST API. Endpoints: /api/movies, /api/movies/{id}, /api/movies/search |
| Student 3 | Recommender Engineer / Member | Recommendation Service | API Key auth, Hybrid RS Engine. Endpoints: /recommend, /api/recommendations |
| Student 4 | NLP Engineer / Member | Sentiment Analysis Service | API Key auth, NLP Sentiment Model. Endpoints: /sentiment, /api/reviews |
| Student 5 | QA, DevOps & Research Engineer | Infrastructure, QA & Testing | Docker containerization, docker-compose orchestration, GitHub Actions CI/CD, Postman/JMeter test suites |


Prerequisites and Instructions to Run via Docker

Prerequisites:
- Docker Engine (v20.10 or higher)
- Docker Compose (v2.0 or higher)

Step 1: Clone the repository
git clone https://github.com/Thilini-samanthika/Movie-recommendation-ai.git
cd Movie-recommendation-ai

Step 2: Start all microservices with a single command
docker-compose up -d --build

Step 3: Verify running containers
docker-compose ps


Interactive Swagger UI and API Documentation URLs

- Spring Boot Backend Swagger UI: http://localhost:8080/swagger-ui/index.html
- Spring Boot OpenAPI JSON Docs: http://localhost:8080/v3/api-docs
- Python FastAPI Interactive Docs: http://localhost:8000/docs
- Python FastAPI ReDoc Documentation: http://localhost:8000/redoc


API Security, Headers, and Test Credentials

API Key Security Header Format:
X-API-KEY: movieai-secret-api-key-2026

OAuth 2.0 / JWT Authorization Header Format:
Authorization: Bearer <your_jwt_token>

Default Test Credentials:
- Username: testuser_qa
- Password: Password123!
- Test API Key: movieai-secret-api-key-2026


Testing Infrastructure

The repository includes complete automated test suites inside the tests/ directory:
- Postman Collection: tests/api/postman_collection.json
- Postman Environment: tests/api/postman_environment.json
- Automated System Integration Script: tests/system/system_integration_test.py
- Apache JMeter Load Test Plan: tests/performance/load_test_plan.jmx
- Locust Performance Test Script: tests/performance/locustfile.py

To execute tests via Newman CLI:
newman run tests/api/postman_collection.json -e tests/api/postman_environment.json


License

Developed for academic evaluation as part of the Service-Oriented Computing module (IT41033 - NIA Mini Project).
