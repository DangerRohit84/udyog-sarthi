# Udyog Sarthi (SIH-26130) - one-click Windows start script.
# Run: powershell -ExecutionPolicy Bypass -File .\start.ps1
# Does: checks Node, runs npm install if node_modules missing, opens http://localhost:3000, runs npm start.

$Port = 3000
$Url = "http://localhost:$Port"
$ScriptDir = $PSScriptRoot

Write-Host "Udyog Sarthi - starting (port $Port)..." -ForegroundColor Cyan

# 1. Check Node.js is installed.
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Node.js not found. Install Node.js 18+ from https://nodejs.org/ then re-run .\start.ps1" -ForegroundColor Red
    exit 1
}
$NodeVersion = (& node --version) 2>$null
Write-Host "Found $NodeVersion"

# 2. Check npm is installed.
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: npm not found. Reinstall Node.js (includes npm) then re-run .\start.ps1" -ForegroundColor Red
    exit 1
}

# 3. Run from the script folder and confirm project files exist.
Set-Location -LiteralPath $ScriptDir
if (-not (Test-Path -LiteralPath "$ScriptDir\package.json")) {
    Write-Host "ERROR: package.json not found in $ScriptDir. Run this script from the udyog-sarthi folder." -ForegroundColor Red
    exit 1
}

# 4. Install dependencies only if node_modules is missing.
if (-not (Test-Path -LiteralPath "$ScriptDir\node_modules")) {
    Write-Host "node_modules missing - running npm install..." -ForegroundColor Yellow
    & npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: npm install failed (exit code $LASTEXITCODE). Check your internet connection and try again." -ForegroundColor Red
        exit 1
    }
    Write-Host "Dependencies installed."
} else {
    Write-Host "Dependencies found (node_modules exists) - skipping npm install."
}

# 5. Open the app in the default browser.
Write-Host "Opening $Url in your browser..."
try {
    Start-Process $Url
} catch {
    Write-Host "WARNING: Could not open browser automatically. Open $Url manually." -ForegroundColor Yellow
}

# 6. Start the server (blocks until you press Ctrl+C).
Write-Host "Starting server with npm start - press Ctrl+C to stop." -ForegroundColor Green
& npm start
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: npm start failed (exit code $LASTEXITCODE). See the output above for details." -ForegroundColor Red
    exit 1
}
