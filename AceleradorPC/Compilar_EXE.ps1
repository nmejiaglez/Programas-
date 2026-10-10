# Genera AceleradorPC_UltraPro.exe a partir del script (ejecutar en Windows con PowerShell 5.1)
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
if (-not (Get-Module -ListAvailable ps2exe)) {
    [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor 3072
    Install-PackageProvider NuGet -MinimumVersion 2.8.5.201 -Force -Scope CurrentUser | Out-Null
    Install-Module ps2exe -Scope CurrentUser -Force
}
Import-Module ps2exe
Invoke-ps2exe -inputFile '.\AceleradorPC_UltraPro.ps1' -outputFile '.\AceleradorPC_UltraPro.exe' `
    -noConsole -requireAdmin -STA -x64 `
    -title 'Acelerador PC Ultra Pro 2026' -product 'Acelerador PC Ultra Pro 2026' `
    -description 'Mantenimiento y optimizacion segura de Windows' -version '2026.1.0.0'
Write-Host 'Listo: AceleradorPC_UltraPro.exe' -ForegroundColor Green
