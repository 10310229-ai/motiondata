# Auto-commit, push, and deploy script
# This will watch for changes and automatically push to both main and gh-pages

Write-Host "Auto-Push & Deploy Script Started" -ForegroundColor Green
Write-Host "This will automatically commit, push to main, and deploy to gh-pages." -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop." -ForegroundColor Yellow
Write-Host ""

# Navigate to project directory
Set-Location "c:\Users\AYISI ARKO PRINCE\Desktop\MOTIONDATASOLUTIONS"

# Ensure we're on main branch
$currentBranch = git rev-parse --abbrev-ref HEAD
if ($currentBranch -ne "main") {
    Write-Host "Switching to main branch..." -ForegroundColor Yellow
    git checkout main 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Could not switch to main branch. Please checkout main manually." -ForegroundColor Red
        exit 1
    }
}

# Function to publish to gh-pages (using approved PowerShell verb)
function Publish-ToGHPages {
    Write-Host "Deploying to gh-pages..." -ForegroundColor Magenta
    
    # Checkout gh-pages
    git checkout gh-pages 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to checkout gh-pages" -ForegroundColor Red
        git checkout main
        return
    }
    
    # Reset to match main
    git reset --hard main 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to reset gh-pages" -ForegroundColor Red
        git checkout main
        return
    }
    
    # Force push
    git push -f origin gh-pages 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to push gh-pages" -ForegroundColor Red
        git checkout main
        return
    }
    
    # Return to main branch
    git checkout main 2>$null
    
    Write-Host "Successfully deployed to gh-pages!" -ForegroundColor Green
}

# Initial check
git add .
$changes = git status --porcelain
if ($changes) {
    Write-Host "Found uncommitted changes. Pushing now..." -ForegroundColor Yellow
    git commit -m "Auto-commit: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    git push origin main
    Publish-ToGHPages
    Write-Host "Changes pushed and deployed!" -ForegroundColor Green
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
        
        # Commit and push to main
        git commit -m "Auto-commit: $timestamp"
        git push origin main
        
        Write-Host "Changes pushed to main!" -ForegroundColor Green
        
        # Publish to gh-pages
        Publish-ToGHPages
        
        Write-Host ""
        Write-Host "Watching for more changes..." -ForegroundColor Cyan
    }
}
