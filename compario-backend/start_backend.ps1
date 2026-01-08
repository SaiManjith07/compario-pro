# Compario Backend Startup Script
# This script activates the virtual environment and starts the Django server

Write-Host "`n🚀 Starting Compario Backend..." -ForegroundColor Green
Write-Host "`n" -ForegroundColor White

# Check if virtual environment exists
if (-not (Test-Path "venv\Scripts\activate")) {
    Write-Host "❌ Virtual environment not found!" -ForegroundColor Red
    Write-Host "   Please create it first: python -m venv venv" -ForegroundColor Yellow
    exit 1
}

# Activate virtual environment
Write-Host "📦 Activating virtual environment..." -ForegroundColor Cyan
& "venv\Scripts\activate"

# Check if migrations are needed (optional - only runs if needed)
Write-Host "`n🔍 Checking for pending migrations..." -ForegroundColor Cyan
$migrations = python manage.py showmigrations --plan 2>&1 | Select-String "\[ \]" | Measure-Object
if ($migrations.Count -gt 0) {
    Write-Host "⚠️  Found pending migrations!" -ForegroundColor Yellow
    Write-Host "   Running migrations..." -ForegroundColor Cyan
    python manage.py migrate
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Migration failed!" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Migrations applied successfully!" -ForegroundColor Green
} else {
    Write-Host "✅ All migrations are up to date!" -ForegroundColor Green
}

# Start Django server
Write-Host "`n🌐 Starting Django development server..." -ForegroundColor Cyan
Write-Host "   Server will be available at: http://localhost:8000" -ForegroundColor Gray
Write-Host "   API Documentation: http://localhost:8000/swagger/" -ForegroundColor Gray
Write-Host "`n   Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host "`n" -ForegroundColor White

python manage.py runserver
