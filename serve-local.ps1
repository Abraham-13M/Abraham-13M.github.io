# Simple PowerShell static server using Python if available
# Usage: Right-click -> Run with PowerShell, or run in PowerShell: ./serve-local.ps1

$port = 8000
Write-Host "Starting local static server on http://localhost:$port/"

# Try python3 then python
$python = Get-Command python3 -ErrorAction SilentlyContinue
if(-not $python){ $python = Get-Command python -ErrorAction SilentlyContinue }
if($python){
    & $python.Source -m http.server $port
} else {
    Write-Host "Python is not installed or not in PATH. Install Python 3 or run a different static server." -ForegroundColor Yellow
}
