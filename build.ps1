param(
    [string]$OutputDir = "$PSScriptRoot\publish",
    [switch]$SkipApi,
    [switch]$SkipClient,
    [switch]$SkipCrm,
    [switch]$ZipOutput
)

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

function Write-Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }
function Write-Ok($msg)   { Write-Host "    OK: $msg" -ForegroundColor Green }
function Write-Fail($msg) { Write-Host "    FAILED: $msg" -ForegroundColor Red }

$failed = @()

Write-Host "`nUpToU Build Script" -ForegroundColor Yellow
Write-Host "Output: $OutputDir"
Write-Host "-------------------------------------------"

# --- API ---
if (-not $SkipApi) {
    Write-Step "Building API (Release)"
    $apiOut = "$OutputDir\api"
    Push-Location "$root\src\UpToU.API"
    try {
        dotnet publish -c Release -o $apiOut --nologo 2>&1 | ForEach-Object { "  $_" } | Write-Host
        if ($LASTEXITCODE -ne 0) { throw "dotnet publish failed" }
        Write-Ok "API published to $apiOut"
    } catch {
        Write-Fail "API build failed: $_"
        $failed += "API"
    } finally {
        Pop-Location
    }
}

# --- Client ---
if (-not $SkipClient) {
    Write-Step "Building Client (Vite)"
    $clientOut = "$OutputDir\client"
    Push-Location "$root\client"
    try {
        npm run build 2>&1 | ForEach-Object { "  $_" } | Write-Host
        if ($LASTEXITCODE -ne 0) { throw "npm run build failed" }
        Copy-Item -Recurse -Force "dist\*" $clientOut
        Write-Ok "Client built to $clientOut"
    } catch {
        Write-Fail "Client build failed: $_"
        $failed += "Client"
    } finally {
        Pop-Location
    }
}

# --- CRM ---
if (-not $SkipCrm) {
    Write-Step "Building CRM (Vite)"
    $crmOut = "$OutputDir\crm"
    Push-Location "$root\crm"
    try {
        npm run build 2>&1 | ForEach-Object { "  $_" } | Write-Host
        if ($LASTEXITCODE -ne 0) { throw "npm run build failed" }
        Copy-Item -Recurse -Force "dist\*" $crmOut
        Write-Ok "CRM built to $crmOut"
    } catch {
        Write-Fail "CRM build failed: $_"
        $failed += "CRM"
    } finally {
        Pop-Location
    }
}

# --- Zip ---
if ($ZipOutput -and $failed.Count -eq 0) {
    Write-Step "Zipping output"
    $zipPath = "$root\uptou-deploy-$(Get-Date -Format 'yyyyMMdd-HHmmss').zip"
    Compress-Archive -Path "$OutputDir\*" -DestinationPath $zipPath -Force
    Write-Ok "Archive created: $zipPath"
}

# --- Summary ---
Write-Host "`n-------------------------------------------"
if ($failed.Count -eq 0) {
    Write-Host "Build complete. All artifacts in: $OutputDir" -ForegroundColor Green
} else {
    Write-Host "Build finished with errors in: $($failed -join ', ')" -ForegroundColor Red
    exit 1
}
