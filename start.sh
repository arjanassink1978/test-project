#!/bin/bash

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "Starting services with Docker Compose..."
echo ""

# Check if Docker daemon is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ ERROR: Docker daemon is not running"
    echo "Please start Docker Desktop and try again."
    exit 1
fi

echo "✅ Docker daemon is running"
echo ""

echo "Which images would you like to build?"
echo "  1) Both (Backend + Frontend)"
echo "  2) Backend only"
echo "  3) Frontend only"
echo "  4) Neither (use existing images)"
read -p "Enter choice (1-4) [default: 1]: " BUILD_CHOICE
BUILD_CHOICE=${BUILD_CHOICE:-1}

case $BUILD_CHOICE in
    1)
        BUILD_BACKEND=true
        BUILD_FRONTEND=true
        ;;
    2)
        BUILD_BACKEND=true
        BUILD_FRONTEND=false
        ;;
    3)
        BUILD_BACKEND=false
        BUILD_FRONTEND=true
        ;;
    4)
        BUILD_BACKEND=false
        BUILD_FRONTEND=false
        ;;
    *)
        echo "❌ Invalid choice. Using default (both)."
        BUILD_BACKEND=true
        BUILD_FRONTEND=true
        ;;
esac

echo ""

if [ "$BUILD_BACKEND" = true ] || [ "$BUILD_FRONTEND" = true ]; then
    echo "Building Docker images..."
    echo ""
fi

# Build backend image
if [ "$BUILD_BACKEND" = true ]; then
    echo "🔨 Building backend image (test-project-backend)..."
    docker build -f "$ROOT/backend/Dockerfile" -t test-project-backend:latest "$ROOT" >/dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ Backend image built successfully"
    else
        echo "❌ Failed to build backend image"
        exit 1
    fi
fi

# Build frontend image
if [ "$BUILD_FRONTEND" = true ]; then
    echo "🔨 Building frontend image (test-project-frontend)..."
    docker build -f "$ROOT/frontend/Dockerfile" -t test-project-frontend:latest "$ROOT" >/dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ Frontend image built successfully"
    else
        echo "❌ Failed to build frontend image"
        exit 1
    fi
fi

if [ "$BUILD_BACKEND" = true ] || [ "$BUILD_FRONTEND" = true ]; then
    echo ""
fi

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
echo "📋 View logs with: docker-compose logs -f"
echo "🛑 Stop services with: docker-compose down"
echo ""

cd "$ROOT"

# Check if any services are already running
RUNNING_CONTAINERS=$(docker compose ps -q 2>/dev/null)
if [ -n "$RUNNING_CONTAINERS" ]; then
    echo "⚠️  Found running containers from a previous session"
    read -p "Stop them now? (y/n) [default: y]: " STOP_CHOICE
    STOP_CHOICE=${STOP_CHOICE:-y}
    if [ "$STOP_CHOICE" = "y" ] || [ "$STOP_CHOICE" = "Y" ]; then
        echo "Stopping existing containers..."
        docker compose down -v >/dev/null 2>&1
        sleep 2
        echo "✅ Cleaned up previous session"
        echo ""
    else
        echo "❌ Cannot start services while containers are running"
        echo "Please run 'docker-compose down -v' first"
        exit 1
    fi
fi

# Start services in foreground (shows only essential info)
# Suppress verbose initialization messages but keep errors and status
docker compose up 2>&1 | grep -E "^\[.*\]|\s(error|ERROR|exited|WARN)" || docker compose up
