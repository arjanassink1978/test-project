#!/bin/bash

ROOT="$(cd "$(dirname "$0")" && pwd)"

# Kill any processes using ports 3000 and 8080
kill_port() {
  local port=$1
  local pid=$(lsof -ti :$port 2>/dev/null)
  if [ ! -z "$pid" ]; then
    echo "Killing process on port $port (PID: $pid)..."
    kill -9 $pid 2>/dev/null || true
    sleep 1
  fi
}

echo "Checking ports..."
kill_port 3000
kill_port 8080

echo "Starting backend..."
cd "$ROOT/backend" && mvn spring-boot:run &
BACKEND_PID=$!

echo "Starting frontend..."
cd "$ROOT/frontend" && npm run dev &
FRONTEND_PID=$!

echo ""
echo "Backend:  http://localhost:8080"
echo "Frontend: http://localhost:3000"
echo "Swagger:  http://localhost:8080/swagger-ui/index.html"
echo ""
echo "Press Ctrl+C to stop both..."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
wait
