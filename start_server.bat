@echo off
echo Starting ScanChain Python Flask Server...
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed or not in PATH
    echo Please install Python 3.7+ from https://www.python.org/
    pause
    exit /b 1
)

REM Run the startup script
python run_server.py

REM Keep window open if there's an error
if errorlevel 1 (
    echo.
    echo Server failed to start. Press any key to exit...
    pause >nul
)
