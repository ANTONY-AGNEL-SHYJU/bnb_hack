# ScanChain Python Flask Server Startup Script (PowerShell)
# Run this script to start the ScanChain backend server

Write-Host "🚀 Starting ScanChain Python Flask Server..." -ForegroundColor Green
Write-Host "=" * 50 -ForegroundColor Cyan

# Check if Python is installed
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Python 3.7+ from https://www.python.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if we're in the correct directory
if (-not (Test-Path "server.py")) {
    Write-Host "❌ server.py not found. Please run this script from the project root directory." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Run the startup script
try {
    python run_server.py
} catch {
    Write-Host "❌ Error running server: $_" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
