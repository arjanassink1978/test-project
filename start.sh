#!/bin/bash

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "Starting services with Docker Compose..."
echo ""
echo "This will start:"
echo "  - PostgreSQL database (port 5432)"
echo "  - Backend (port 8080)"
echo "  - Frontend (port 3000)"
echo ""
echo "Services will be available at:"
echo "  - Frontend:  http://localhost:3000"
echo "  - Backend:   http://localhost:8080"
echo "  - Swagger:   http://localhost:8080/swagger-ui/index.html"
echo ""
echo "Press Ctrl+C to stop all services..."
echo ""

cd "$ROOT"
docker-compose up --build
