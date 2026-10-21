#!/usr/bin/env bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "=========================================================="
echo " Starting CardPulse Business Card Scanner (Python + Next.js)"
echo "=========================================================="

# 1. Ensure Apple Vision ML Scanner binary is compiled
if [ ! -f "$DIR/backend/scanner_tool" ]; then
  echo "Compiling Apple Vision ML Scanner binary..."
  swiftc -O "$DIR/backend/scanner_tool.swift" -o "$DIR/backend/scanner_tool"
fi

# 2. Start Python FastAPI backend on port 8080
echo "Starting Python FastAPI Backend on http://localhost:8080..."
cd "$DIR/backend"
source .venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8080 --reload &
BACKEND_PID=$!

# Trap Ctrl+C to shut down both processes cleanly
cleanup() {
  echo ""
  echo "Stopping CardPulse servers..."
  kill $BACKEND_PID 2>/dev/null || true
  exit 0
}
trap cleanup SIGINT SIGTERM

# 2. Start Next.js frontend on port 3001
echo "Starting Next.js Frontend on http://localhost:3001..."
cd "$DIR/frontend"
npm run dev

wait $BACKEND_PID
