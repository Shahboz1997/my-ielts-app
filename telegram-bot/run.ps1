# Start the Telegram bot (PowerShell).
# Usage:
#   .\run.ps1              — normal mode (scheduler only)
#   .\run.ps1 -TestPost    — publish one morning post on startup

param([switch]$TestPost)

Set-Location $PSScriptRoot

if ($TestPost) {
    $env:RUN_ON_START = "1"
}

python bot.py
