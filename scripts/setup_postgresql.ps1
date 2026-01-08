# PostgreSQL Setup Script for Compario Project
# This script helps verify PostgreSQL installation and create the database

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Compario - PostgreSQL Setup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if PostgreSQL is installed
Write-Host "Step 1: Checking PostgreSQL installation..." -ForegroundColor Yellow
try {
    $psqlVersion = psql --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ PostgreSQL found: $psqlVersion" -ForegroundColor Green
    } else {
        throw "PostgreSQL not found"
    }
} catch {
    Write-Host "✗ PostgreSQL is not installed or not in PATH" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install PostgreSQL first:" -ForegroundColor Yellow
    Write-Host "1. Visit: https://www.postgresql.org/download/windows/" -ForegroundColor White
    Write-Host "2. Download and install PostgreSQL 15 or later" -ForegroundColor White
    Write-Host "3. Make sure to add PostgreSQL bin to PATH" -ForegroundColor White
    Write-Host "   (Default: C:\Program Files\PostgreSQL\15\bin)" -ForegroundColor White
    exit 1
}

# Check if PostgreSQL service is running
Write-Host ""
Write-Host "Step 2: Checking PostgreSQL service..." -ForegroundColor Yellow
$service = Get-Service -Name postgresql* -ErrorAction SilentlyContinue
if ($service) {
    if ($service.Status -eq 'Running') {
        Write-Host "✓ PostgreSQL service is running" -ForegroundColor Green
    } else {
        Write-Host "⚠ PostgreSQL service is not running. Attempting to start..." -ForegroundColor Yellow
        try {
            Start-Service -Name $service.Name
            Write-Host "✓ PostgreSQL service started" -ForegroundColor Green
        } catch {
            Write-Host "✗ Failed to start PostgreSQL service. Please start it manually." -ForegroundColor Red
            Write-Host "  Run: Start-Service postgresql-x64-15" -ForegroundColor White
        }
    }
} else {
    Write-Host "⚠ Could not find PostgreSQL service" -ForegroundColor Yellow
    Write-Host "  This might be okay if PostgreSQL is running differently" -ForegroundColor White
}

# Prompt for database credentials
Write-Host ""
Write-Host "Step 3: Database Configuration" -ForegroundColor Yellow
$dbName = "compario_db"
$dbUser = Read-Host "Enter PostgreSQL username (default: postgres)"
if ([string]::IsNullOrWhiteSpace($dbUser)) {
    $dbUser = "postgres"
}

$securePassword = Read-Host "Enter PostgreSQL password" -AsSecureString
$dbPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
)

# Test connection
Write-Host ""
Write-Host "Step 4: Testing connection..." -ForegroundColor Yellow
$env:PGPASSWORD = $dbPassword
try {
    $testConnection = psql -U $dbUser -d postgres -c "SELECT version();" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Connection successful!" -ForegroundColor Green
    } else {
        throw "Connection failed"
    }
} catch {
    Write-Host "✗ Connection failed. Please check your credentials." -ForegroundColor Red
    Write-Host "  Error: $testConnection" -ForegroundColor Red
    exit 1
}

# Check if database exists
Write-Host ""
Write-Host "Step 5: Checking if database exists..." -ForegroundColor Yellow
$dbExists = psql -U $dbUser -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$dbName'" 2>&1
if ($dbExists -match "1") {
    Write-Host "⚠ Database '$dbName' already exists" -ForegroundColor Yellow
    $overwrite = Read-Host "Do you want to drop and recreate it? (y/N)"
    if ($overwrite -eq "y" -or $overwrite -eq "Y") {
        Write-Host "Dropping existing database..." -ForegroundColor Yellow
        psql -U $dbUser -d postgres -c "DROP DATABASE $dbName;" 2>&1 | Out-Null
        Write-Host "✓ Database dropped" -ForegroundColor Green
    } else {
        Write-Host "✓ Using existing database '$dbName'" -ForegroundColor Green
        $env:PGPASSWORD = ""
        exit 0
    }
}

# Create database
Write-Host ""
Write-Host "Step 6: Creating database '$dbName'..." -ForegroundColor Yellow
try {
    $createDb = psql -U $dbUser -d postgres -c "CREATE DATABASE $dbName;" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Database '$dbName' created successfully!" -ForegroundColor Green
    } else {
        throw "Failed to create database"
    }
} catch {
    Write-Host "✗ Failed to create database" -ForegroundColor Red
    Write-Host "  Error: $createDb" -ForegroundColor Red
    $env:PGPASSWORD = ""
    exit 1
}

# Verify database
Write-Host ""
Write-Host "Step 7: Verifying database..." -ForegroundColor Yellow
try {
    $verifyDb = psql -U $dbUser -d $dbName -c "\dt" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Database verification successful!" -ForegroundColor Green
        Write-Host "  Database is empty (no tables yet - this is expected)" -ForegroundColor White
    } else {
        throw "Verification failed"
    }
} catch {
    Write-Host "✗ Database verification failed" -ForegroundColor Red
    $env:PGPASSWORD = ""
    exit 1
}

# Clear password from environment
$env:PGPASSWORD = ""

# Success message
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✓ PostgreSQL Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Database Configuration:" -ForegroundColor Cyan
Write-Host "  Database Name: $dbName" -ForegroundColor White
Write-Host "  Database User: $dbUser" -ForegroundColor White
Write-Host "  Database Host: localhost" -ForegroundColor White
Write-Host "  Database Port: 5432" -ForegroundColor White
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Save these credentials for MODULE 2 (Django Setup)" -ForegroundColor White
Write-Host "  2. Proceed to MODULE 2 - Backend Foundation" -ForegroundColor White
Write-Host ""


