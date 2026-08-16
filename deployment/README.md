#  DevOps & Containerized Deployment Guide

This directory contains the production-ready infrastructure configurations, Docker container definitions, Nginx proxy setups, and orchestration manifests for the **AI-Powered Personalized Movie Recommendation System**, created under the **QA, DevOps & Research Engineer** role.

---

##  Architecture & Service Topology

```
                       ┌─────────────────────────┐
                       │   Client Web Browser    │
                       └────────────┬────────────┘
                                    │ Port 80 (HTTP)
                                    ▼
                       ┌─────────────────────────┐
                       │   Nginx Reverse Proxy   │
                       │   (Frontend Container)  │
                       └─────┬──────────────┬────┘
                             │              │
       /api/* Request Proxy  │              │ /recommend & /sentiment Proxy
                             ▼              ▼
     ┌──────────────────────────┐      ┌──────────────────────────┐
     │   Spring Boot Backend    │      │  Python FastAPI AI       │
     │   (Port 8080 Container)  │      │  (Port 8000 Container)  │
     └─────────────┬────────────┘      └──────────────────────────┘
                   │
                   ▼ Database Connection (Port 3306)
     ┌──────────────────────────┐
     │    MySQL 8.0 Database    │
     │   (Persistent Volume)    │
     └──────────────────────────┘
```

---

##  Container Manifests

| Service | Dockerfile Location | Base Image | Function |
|---------|---------------------|------------|----------|
| **MySQL Database** | Official Image | `mysql:8.0` | Relational storage for users, ratings, and favorites. |
| **Spring Boot Backend** | `deployment/docker/backend.Dockerfile` | `eclipse-temurin:17-jre-alpine` | REST API layer, authentication, business logic. |
| **Python AI Service** | `deployment/docker/ai-service.Dockerfile` | `python:3.10-slim` | TF-IDF, Cosine Similarity, Sentiment Analysis & Hybrid ML engine. |
| **React Frontend** | `deployment/docker/frontend.Dockerfile` | `node:18-alpine` -> `nginx:alpine` | Static Web SPA served via Nginx reverse proxy. |

---

##  Quick Start Guide: Deploying with Docker Compose

### Prerequisites
- [Docker Engine](https://docs.docker.com/get-docker/) (v20.10+)
- [Docker Compose](https://docs.docker.com/compose/install/) (v2.0+)

---

### Step 1: Environment Setup
Copy the environment template and customize passwords if needed:

```bash
cp deployment/.env.example .env
```

---

### Step 2: Build and Launch Containers

Run Docker Compose from the root directory:

```bash
# Build images and launch all services in detached background mode
docker-compose up -d --build
```

---

### Step 3: Verify Deployment Health

Check container status and logs:

```bash
# View active container status
docker-compose ps

# Monitor real-time logs across services
docker-compose logs -f

# Check AI Service Health
curl http://localhost:8000/health

# Check Spring Boot Backend Health
curl http://localhost:8080/api/health
```

---

### Step 4: Access Application Interfaces

- **React Web App**: `http://localhost`
- **Spring Boot REST API**: `http://localhost:8080`
- **FastAPI AI Service Interactive Docs**: `http://localhost:8000/docs`

---

##  Container Shutdown & Cleanup

To stop and remove containers and networks:

```bash
# Stop containers
docker-compose down

# Stop containers and remove persistent volumes (WARNING: clears local MySQL DB data)
docker-compose down -v
```

---

## ☁️ Production Cloud Deployment Guidelines

1. **AWS Container Service (ECS / App Runner)**: Push images to AWS ECR and deploy `docker-compose` definition using ECS tasks.
2. **GCP Cloud Run / GKE**: Build images using Google Cloud Build and deploy `backend` & `ai-service` as autoscaling Cloud Run instances.
3. **Database Security**: Enforce TLS/SSL for MySQL connections and store secrets using AWS Secrets Manager or GCP Secret Manager.
