# نسخ إلى مجلد التطوير المحلي ثم npm install (اختياري) و npm run dev
# الوجهة الافتراضية C:\dev\mathwa — أو عيّن: $env:MATHWA_DEV_DIR = "D:\work\mathwa"
# التشغيل: powershell -ExecutionPolicy Bypass -File .\scripts\dev-on-local-disk.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path (Join-Path $root "package.json"))) {
  $root = (Get-Location).Path
}

$dest = if ($env:MATHWA_DEV_DIR) { $env:MATHWA_DEV_DIR } else { "C:\dev\mathwa" }
Write-Host "من: $root"
Write-Host "إلى: $dest"

New-Item -ItemType Directory -Force -Path $dest | Out-Null
robocopy $root $dest /E /XD node_modules .next .next-local .git /NFL /NDL /NJH /NJS | Out-Null
if ($LASTEXITCODE -ge 8) {
  Write-Host "تحذير: رمز خروج robocopy $LASTEXITCODE"
}

if (-not (Test-Path (Join-Path $dest "package.json"))) {
  Write-Host "خطأ: فشل النسخ."
  exit 1
}

Set-Location $dest
if (-not (Test-Path (Join-Path $dest "node_modules\next"))) {
  npm install
}
npm run dev
