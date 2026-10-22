#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "      ORoXLAB • Automated Production Deployment Suite     "
echo "=========================================================="

echo "[1/4] Running Backend Test Suite (Pytest)..."
cd backend
if [ -d "venv" ]; then
    ./venv/bin/pytest -v
else
    pytest -v
fi
cd ..
echo "✓ Backend tests passed!"

echo "[2/4] Running Frontend Test Suite (Vitest)..."
cd frontend
npm test -- --run
echo "✓ Frontend tests passed!"

echo "[3/4] Building Frontend Production Distribution..."
npm run build
cd ..
echo "✓ Frontend build complete! Static assets generated in frontend/dist/"

echo "[4/4] Verifying Docker Container Build Configurations..."
if command -v docker &> /dev/null; then
    echo "Docker detected. Building containers with Docker Compose..."
    docker compose build
    echo "✓ Docker containers built successfully!"
    echo "To launch in production: docker compose up -d"
else
    echo "Docker not found in PATH; skipping container image generation."
fi

echo "=========================================================="
echo "✓ ORoXLAB Deployment Preflight Checks Passed 100%!"
echo "=========================================================="
