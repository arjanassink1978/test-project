#!/bin/bash

ROOT="$(cd "$(dirname "$0")" && pwd)"

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
