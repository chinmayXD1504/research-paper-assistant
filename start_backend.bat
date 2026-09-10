@echo off
title Research Assistant - FastAPI Backend (Port 8000)
cd /d "%~dp0"
echo Starting FastAPI Backend Server on http://localhost:8000 ...
python -m uvicorn main:app --reload --port 8000
pause
