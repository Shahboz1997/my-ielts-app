# Trigger telegram-daily cron (PowerShell-native — Invoke-WebRequest, not curl -H).
# Usage:
#   .\scripts\telegram-test-cron.ps1
#   .\scripts\telegram-test-cron.ps1 evening
#   $env:CRON_BASE_URL = "http://localhost:3000"; .\scripts\telegram-test-cron.ps1 morning

param(
    [ValidateSet('morning', 'evening')]
    [string]$Slot = 'morning'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$root = Split-Path $PSScriptRoot -Parent
$envFile = Join-Path $root '.env.local'

if (-not (Test-Path $envFile)) {
    Write-Error ".env.local not found at $envFile"
}

$secret = $null
Get-Content $envFile | ForEach-Object {
    if ($_ -match '^\s*CRON_SECRET\s*=\s*(.+)\s*$') {
        $secret = $matches[1].Trim().Trim('"').Trim("'")
    }
}

if (-not $secret) {
    Write-Error 'CRON_SECRET is not set in .env.local'
}

$base = if ($env:CRON_BASE_URL) { $env:CRON_BASE_URL.TrimEnd('/') } else { 'http://localhost:3000' }
$url = "$base/api/cron/telegram-daily?slot=$Slot"

Write-Host "GET $url" -ForegroundColor Cyan

$response = Invoke-WebRequest -Uri $url -Headers @{ Authorization = "Bearer $secret" } -UseBasicParsing
Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
Write-Host $response.Content
