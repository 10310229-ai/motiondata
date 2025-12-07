# Database Setup and Test Script for Motion Data Solutions
# This script installs dependencies and tests the database connection

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Motion Data Solutions - Database Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to server directory
$serverPath = Join-Path $PSScriptRoot "."
Set-Location $serverPath

Write-Host "Step 1: Installing dependencies..." -ForegroundColor Yellow
Write-Host ""

# Check if package.json exists
if (Test-Path "package.json") {
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Dependencies installed successfully!" -ForegroundColor Green
    } else {
        Write-Host "Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "package.json not found!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 2: Testing database..." -ForegroundColor Yellow
Write-Host ""

# Run the test
node test-db.js

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Database setup completed successfully!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Database file created at: server/orders.db" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "To start the server:" -ForegroundColor Yellow
    Write-Host "  cd server" -ForegroundColor White
    Write-Host "  npm start" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "Database setup failed. Please check the errors above." -ForegroundColor Red
    exit 1
}
