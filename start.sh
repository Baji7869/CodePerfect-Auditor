#!/bin/bash

echo "============================================"
echo "  CodePerfect Auditor - Starting..."
echo "============================================"

# Check .env
if [ ! -f "backend/.env" ]; then
    echo "ERROR: backend/.env not found!"
    echo "Please copy backend/.env.example to backend/.env"
    echo "and add your ANTHROPIC_API_KEY"
    exit 1
fi

# Start backend
echo "Starting Backend (FastAPI)..."
cd backend
source venv/bin/activate 2>/dev/null || python -m venv venv && source venv/bin/activate
python main.py &
BACKEND_PID=$!
cd ..

sleep 2

# Start frontend  
echo "Starting Frontend (React)..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "============================================"
echo "  Backend:  http://localhost:8000"
echo "  Frontend: http://localhost:5173"
echo "  API Docs: http://localhost:8000/docs"
echo "============================================"
echo ""
echo "Press Ctrl+C to stop all services"

# Trap to kill both on exit
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
