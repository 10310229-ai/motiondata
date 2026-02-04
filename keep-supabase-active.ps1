# Supabase Keep-Alive Script
# Runs a simple health check to prevent auto-pausing on free tier
# Schedule this to run daily or weekly using Windows Task Scheduler

$SUPABASE_URL = "https://njsjihfpggbpfdpdgzzx.supabase.co"
$SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qc2ppaGZwZ2dicGZkcGRnenp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMjI3NzYsImV4cCI6MjA4MDY5ODc3Nn0.JZ5vEAnxPiWjwb0aGnxEbM0pI-FQ6hvuH2iKHHFZR2k"

Write-Host "Supabase Keep-Alive Health Check" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

try {
    $headers = @{
        "apikey" = $SUPABASE_ANON_KEY
        "Authorization" = "Bearer $SUPABASE_ANON_KEY"
    }
    
    # Simple health check query - counts users table
    $response = Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/users?select=count" -Method Get -Headers $headers -TimeoutSec 10
    
    Write-Host "✓ Supabase is ACTIVE" -ForegroundColor Green
    Write-Host "  Response received: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
    Write-Host "  Status: Project is healthy" -ForegroundColor Green
    Write-Host ""
    
    # Log success
    $logEntry = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - Supabase health check PASSED"
    Add-Content -Path "supabase-healthcheck.log" -Value $logEntry
    
    exit 0
    
} catch {
    Write-Host "✗ Supabase health check FAILED" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    
    # Log failure
    $logEntry = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - Supabase health check FAILED: $($_.Exception.Message)"
    Add-Content -Path "supabase-healthcheck.log" -Value $logEntry
    
    exit 1
}
