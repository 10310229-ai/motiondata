# Auto-commit and push script
# This will watch for changes and automatically push to GitHub

Write-Host "Auto-Push Script Started" -ForegroundColor Green
Write-Host "This will automatically commit and push any changes you make." -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop." -ForegroundColor Yellow
Write-Host ""

$projectPath = "c:\Users\AYISI ARKO PRINCE\Desktop\MOTIONDATASOLUTIONS"
Set-Location $projectPath

# Initial check
git add .
$changes = git status --porcelain
if ($changes) {
    Write-Host "Found uncommitted changes. Pushing now..." -ForegroundColor Yellow
    git commit -m "Auto-commit: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    git push origin main
    Write-Host "Changes pushed!" -ForegroundColor Green
}

Write-Host ""
Write-Host "Watching for changes..." -ForegroundColor Cyan

# Watch for changes every 30 seconds
while ($true) {
    Start-Sleep -Seconds 30
    
    git add .
    $status = git status --porcelain
    
    if ($status) {
        $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
        Write-Host ""
        Write-Host "Changes detected at $timestamp" -ForegroundColor Yellow
        
        # Show what changed
        Write-Host "Modified files:" -ForegroundColor Cyan
        git status --short
        
        # Commit and push
        git commit -m "Auto-commit: $timestamp"
        git push origin main
        
        Write-Host "Changes pushed to GitHub!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Watching for more changes..." -ForegroundColor Cyan
    }
}
