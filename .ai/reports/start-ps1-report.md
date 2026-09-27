# start.ps1 Report — Udyog Sarthi (SIH-26130)

Date: 2026-09-09
Task: Add Windows one-click `start.ps1` (PowerShell 5.1 compatible)

## Confirmed from source
- `package.json`: `scripts.start = "node server.js"`, `engines.node >= 18`, dependency `express ^4.19.2`
- `README.md`: run via `npm install && npm start`, open `http://localhost:3000`
- `server.js`: `const PORT = process.env.PORT || 3000` — default port 3000 confirmed

## What start.ps1 does
File: `D:\SIH\udyog-sarthi\start.ps1`
1. Checks `node` exists (`Get-Command node`), prints version, exits 1 with install hint if missing
2. Checks `npm` exists, exits 1 with message if missing
3. `Set-Location $PSScriptRoot`, verifies `package.json` exists
4. Runs `npm install` only if `node_modules` folder is missing; checks `$LASTEXITCODE`
5. Opens `http://localhost:3000` via `Start-Process` (warns, does not fail, if browser open fails)
6. Runs `npm start` (blocking); checks `$LASTEXITCODE` and reports failure
- PowerShell 5.1 compatible: no ternary/`??`/new operators; uses `$PSScriptRoot`, `Get-Command`, `Test-Path`, `Start-Process`, `$LASTEXITCODE`

## README update
- Added `### Windows one-click` section with `powershell -ExecutionPolicy Bypass -File .\start.ps1` usage

## Verification
- `powershell -NoProfile -Command "Get-Content start.ps1"` — OK, file prints correctly
- PowerShell parser check `[System.Management.Automation.Language.Parser]::ParseFile` — `SYNTAX OK: 0 parse errors`
- PSScriptAnalyzer — not installed, parse check only (noted as limitation)
- `node --check server.js` — OK
- `node --version` v24.11.1, `npm --version` 11.7.0 (env supports `engines >= 18`)
- Did NOT run `npm start` blocking server or auto `npm install` (node_modules already present); no test suite exists in repo (`package.json` has no test script)

## Usage
```powershell
cd D:\SIH\udyog-sarthi\
powershell -ExecutionPolicy Bypass -File .\start.ps1
```

## Blockers / notes
- Sprint DB update skipped: no `task_id` was provided in the request (`sprint-manager.py` requires one; `status` requires `sprint_id`)
