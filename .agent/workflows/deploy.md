---
description: Deploy the application using Docker Compose
---

# Deploy Application

1. Ensure Docker Desktop is running.
2. Build and start the containers:
   ```bash
   docker-compose up --build -d
   ```
   // turbo
3. Verify the application is running:
   - Frontend: [http://localhost:8080](http://localhost:8080)
   - Backend Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
4. To stop the application:
   ```bash
   docker-compose down
   ```
