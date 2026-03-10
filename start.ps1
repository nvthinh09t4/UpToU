Write-Host "Starting UpToU services..." -ForegroundColor Cyan

Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location 'D:\Source\UpToU\src\UpToU.API'; Write-Host 'Starting API...' -ForegroundColor Green; dotnet watch run"

Start-Sleep -Seconds 3

Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location 'D:\Source\UpToU\client'; Write-Host 'Starting Client...' -ForegroundColor Green; npm run dev"

Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location 'D:\Source\UpToU\crm'; Write-Host 'Starting CRM...' -ForegroundColor Green; npm run dev"

Write-Host "All services launched in separate windows." -ForegroundColor Cyan
