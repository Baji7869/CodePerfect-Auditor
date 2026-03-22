@echo off
echo ============================================
echo   CodePerfect Auditor v2 - Starting...
echo ============================================
if not exist backend\.env (
    echo ERROR: backend\.env not found!
    echo Copy backend\.env.example to backend\.env
    echo and add your OPENAI_API_KEY
    pause & exit /b 1
)
echo Starting Backend...
start "CP Backend" cmd /k "cd backend && venv\Scripts\activate && python main.py"
timeout /t 4 /nobreak > nul
echo Starting Frontend...
start "CP Frontend" cmd /k "cd frontend && npm run dev"
echo.
echo  Backend:  http://localhost:8000
echo  Frontend: http://localhost:5173
echo  API Docs: http://localhost:8000/docs
pause
