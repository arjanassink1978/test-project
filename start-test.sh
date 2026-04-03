#!/bin/bash

set -e

echo "=== Starting Playwright E2E Tests with Docker Compose ==="
echo ""

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

# Start all services (PostgreSQL, Backend, Frontend) with Docker Compose
echo "1. Starting services with Docker Compose..."
docker-compose up -d

# Wait for backend to be healthy
echo ""
echo "2. Waiting for backend to be healthy..."
max_attempts=60
attempt=0
while ! curl -s http://localhost:8080/actuator/health >/dev/null 2>&1; do
  attempt=$((attempt + 1))
  if [ $attempt -gt $max_attempts ]; then
    echo "Backend failed to start"
    docker-compose logs backend
    docker-compose down
    exit 1
  fi
  echo "   Waiting... ($attempt/$max_attempts)"
  sleep 1
done
echo "   Backend is healthy!"

# Wait for frontend to be healthy
echo ""
echo "3. Waiting for frontend to be healthy..."
max_attempts=60
attempt=0
while ! curl -s http://localhost:3000 >/dev/null 2>&1; do
  attempt=$((attempt + 1))
  if [ $attempt -gt $max_attempts ]; then
    echo "Frontend failed to start"
    docker-compose logs frontend
    docker-compose down
    exit 1
  fi
  echo "   Waiting... ($attempt/$max_attempts)"
  sleep 1
done
echo "   Frontend is healthy!"
echo ""

# Run Playwright tests
echo "4. Running Playwright E2E tests..."
cd playwright-tests
npm install -q 2>/dev/null || true
npm test
TEST_RESULT=$?

# Cleanup
echo ""
echo "5. Cleaning up..."
cd "$ROOT"
docker-compose down -v

if [ $TEST_RESULT -eq 0 ]; then
  echo ""
  echo "✅ E2E Test Suite Complete - All tests passed!"
  exit 0
else
  echo ""
  echo "❌ E2E Test Suite Complete - Some tests failed!"
  exit 1
fi
