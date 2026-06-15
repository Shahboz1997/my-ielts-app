# Migrate Telegram bot: commands, descriptions, webhook, channel test post.
# Usage: .\scripts\telegram-migrate.ps1

$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$envFile = Join-Path $root '.env.local'

function Get-EnvValue([string]$key) {
  (Get-Content $envFile | Where-Object { $_ -match "^$key=" }) -replace "^$key=", ''
}

$token = Get-EnvValue 'TELEGRAM_BOT_TOKEN'
$secret = Get-EnvValue 'TELEGRAM_WEBHOOK_SECRET'
$chatId = Get-EnvValue 'TELEGRAM_CHANNEL_ID'
if (-not $chatId) { $chatId = Get-EnvValue 'TELEGRAM_GROUP_ID' }

if (-not $token) { throw 'TELEGRAM_BOT_TOKEN missing in .env.local' }

$base = "https://api.telegram.org/bot$token"

function Invoke-Tg([string]$method, $body = $null) {
  if ($null -ne $body) {
    $json = $body | ConvertTo-Json -Depth 8 -Compress
    return Invoke-RestMethod -Uri "$base/$method" -Method Post -ContentType 'application/json; charset=utf-8' -Body ([System.Text.Encoding]::UTF8.GetBytes($json))
  }
  return Invoke-RestMethod -Uri "$base/$method"
}

$me = Invoke-Tg 'getMe'
Write-Host "Bot: @$($me.result.username)"

$commands = Get-Content (Join-Path $PSScriptRoot 'telegram-commands.json') -Raw | ConvertFrom-Json
Invoke-Tg 'setMyCommands' $commands | Out-Null
Write-Host 'Commands registered'

Invoke-Tg 'setMyDescription' @{
  description = 'IELTS Writing checker - paste Task 1 or Task 2 for band scores (TA, CC, LR, GRA), vocabulary upgrades, and rewrite tips.'
} | Out-Null
Write-Host 'Description set'

Invoke-Tg 'setMyShortDescription' @{
  short_description = 'IELTS Writing AI checker - /check your essay'
} | Out-Null
Write-Host 'Short description set'

$webhook = @{
  url = 'https://stratumielts.com/api/telegram/webhook'
  allowed_updates = @('message')
  drop_pending_updates = $true
}
if ($secret) { $webhook.secret_token = $secret }
Invoke-Tg 'setWebhook' $webhook | Out-Null
Write-Host 'Webhook set'

$listed = Invoke-Tg 'getMyCommands'
$names = ($listed.result | ForEach-Object { "/$($_.command)" }) -join ', '
Write-Host "Verified commands: $names"

if ($chatId) {
  $text = @(
    "✅ <b>Bot migrated - @$($me.result.username)</b>"
    ''
    'DM commands:'
    '• /check — essay scores'
    '• /tip — IELTS tip'
    '• /topic — practice prompt'
    '• /resource — study link'
    '• /help — command list'
    ''
    '<a href="https://stratumielts.com/">stratumielts.com</a>'
  ) -join "`n"

  $sent = Invoke-Tg 'sendMessage' @{
    chat_id = $chatId
    text = $text
    parse_mode = 'HTML'
    disable_web_page_preview = $true
  }
  Write-Host "Channel post id: $($sent.result.message_id)"
}
