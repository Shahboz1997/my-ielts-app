# Install Python deps on Windows (handles SOCKS proxy via Clash/V2Ray).
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Write-Host "Installing telegram-bot dependencies..." -ForegroundColor Cyan

# PySocks must be present before pip can use a SOCKS system proxy.
$pysocksOk = python -c "import socks" 2>$null
if (-not $pysocksOk) {
    Write-Host "PySocks not found — downloading wheel (SOCKS proxy workaround)..." -ForegroundColor Yellow
    $dir = Join-Path $env:TEMP "pip-offline"
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
    [System.Net.WebRequest]::DefaultWebProxy = $null
    $json = Invoke-RestMethod -Uri "https://pypi.org/pypi/PySocks/json"
    $url = ($json.urls | Where-Object { $_.packagetype -eq "bdist_wheel" } | Select-Object -First 1).url
    $wheel = Join-Path $dir "PySocks-1.7.1-py3-none-any.whl"
    Invoke-WebRequest -Uri $url -OutFile $wheel
    python -m pip install $wheel
}

python -m pip install -r requirements.txt
Write-Host "Done. Run: .\run.ps1" -ForegroundColor Green
