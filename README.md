# Ops Monitor

This project is a demonstration of running a multi-service application with **Docker Compose**.  
It shows how to connect a web server, an API, a database, and a cache each running in its own container.

1-Components (all run as Docker containers)
- **Nginx (Docker image: nginx:alpine)**  
  Serves static content and proxies API requests
- **Node.js/Express (custom Docker image built from webapp/Dockerfile)**  
  Backend API with login and project endpoints
- **MySQL (Docker image: mysql:8.0)**  
  Relational database seeded with demo data using `init.sql`
- **Redis (Docker image: redis:7-alpine)**  
  In-memory cache for faster responses

2-Features
- Login endpoint that issues a JWT token
- Projects endpoint that retrieves demo data from MySQL
- Health check endpoint to verify system status
- All services orchestrated and networked together by **Docker Compose**
