# ============================================================
#  ACELERADOR PC - Windows 7 / 8 / 10 / 11
#  Mejora rapidez general, de internet y de apertura de archivos
#  usando solo ajustes seguros y reversibles de Windows.
#  Crea un PUNTO DE RESTAURACION antes de cambiar nada.
# ============================================================
$ErrorActionPreference = 'SilentlyContinue'
$Host.UI.RawUI.WindowTitle = 'Acelerador PC'

$esAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $esAdmin) {
    Write-Host 'Reiniciando como ADMINISTRADOR...' -ForegroundColor Yellow
    Start-Process powershell -Verb RunAs -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`""
    exit
}

function Titulo($t) { Write-Host "`n>> $t" -ForegroundColor Cyan }
function Ok($t)     { Write-Host "   [OK] $t" -ForegroundColor Green }

function Punto-Restauracion {
    Titulo 'Creando punto de restauracion (para poder deshacer todo)...'
    Enable-ComputerRestore -Drive "$env:SystemDrive\"
    # Windows limita a 1 punto cada 24 h; se permite crear ahora
    New-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\SystemRestore' -Name SystemRestorePointCreationFrequency -Value 0 -PropertyType DWord -Force | Out-Null
    Checkpoint-Computer -Description 'Antes de Acelerador PC' -RestorePointType MODIFY_SETTINGS
    if ($?) { Ok 'Punto de restauracion creado' } else { Write-Host '   [!] No se pudo crear (Proteccion del sistema desactivada). Se continua.' -ForegroundColor Yellow }
}

# ---------------- RAPIDEZ GENERAL ----------------
function Acelerar-General {
    Titulo 'RAPIDEZ GENERAL'

    # Plan de energia de alto rendimiento (en portatiles gasta mas bateria)
    $alto = '8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c'
    powercfg -setactive $alto 2>$null
    if ($LASTEXITCODE -ne 0) { powercfg -duplicatescheme $alto | Out-Null; powercfg -setactive $alto }
    Ok 'Plan de energia: Alto rendimiento'

    # Efectos visuales: mejor rendimiento, pero conservando letras suaves y miniaturas
    Set-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\VisualEffects' -Name VisualFXSetting -Value 3
    Set-ItemProperty 'HKCU:\Control Panel\Desktop' -Name UserPreferencesMask -Value ([byte[]](0x90,0x12,0x03,0x80,0x10,0x00,0x00,0x00))
    Set-ItemProperty 'HKCU:\Control Panel\Desktop' -Name FontSmoothing -Value '2'
    Set-ItemProperty 'HKCU:\Control Panel\Desktop\WindowMetrics' -Name MinAnimate -Value '0'
    Set-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced' -Name TaskbarAnimations -Value 0
    Ok 'Efectos visuales optimizados (animaciones desactivadas)'

    # Menus mas rapidos
    Set-ItemProperty 'HKCU:\Control Panel\Desktop' -Name MenuShowDelay -Value '100'
    Ok 'Menus aparecen mas rapido'

    # Cerrar programas colgados mas rapido al apagar
    Set-ItemProperty 'HKCU:\Control Panel\Desktop' -Name WaitToKillAppTimeout -Value '5000'
    Set-ItemProperty 'HKCU:\Control Panel\Desktop' -Name HungAppTimeout -Value '3000'
    Ok 'Apagado mas rapido'

    # Quitar retraso de programas de inicio (Windows 8/10/11)
    New-Item 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Serialize' -Force | Out-Null
    Set-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Serialize' -Name StartupDelayInMSec -Value 0 -Type DWord
    Ok 'Sin retraso artificial al iniciar sesion'

    # Desactivar aplicaciones en segundo plano (Windows 10)
    New-Item 'HKCU:\Software\Microsoft\Windows\CurrentVersion\BackgroundAccessApplications' -Force | Out-Null
    Set-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\BackgroundAccessApplications' -Name GlobalUserDisabled -Value 1 -Type DWord
    Ok 'Apps de la Tienda no corren en segundo plano'

    # Limpiar temporales
    $antes = (Get-PSDrive C).Free
    Remove-Item "$env:TEMP\*", "$env:windir\Temp\*", "$env:windir\Prefetch\*.tmp" -Recurse -Force
    Ok ("Temporales borrados ({0:N0} MB liberados)" -f (((Get-PSDrive C).Free - $antes) / 1MB))
}

# ---------------- RAPIDEZ DE INTERNET ----------------
function Acelerar-Internet {
    Titulo 'RAPIDEZ DE INTERNET'

    ipconfig /flushdns | Out-Null;          Ok 'Cache DNS limpiada'
    netsh int tcp set global autotuninglevel=normal | Out-Null; Ok 'Ajuste automatico de ventana TCP: normal'
    netsh int tcp set global rss=enabled | Out-Null;            Ok 'Escalado en varios nucleos (RSS) activado'
    netsh int tcp set heuristics disabled | Out-Null;           Ok 'Heuristicas que limitan TCP desactivadas'
    netsh int tcp set global ecncapability=disabled | Out-Null

    # Quitar reserva de ancho de banda de QoS
    New-Item 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\Psched' -Force | Out-Null
    Set-ItemProperty 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\Psched' -Name NonBestEffortLimit -Value 0 -Type DWord
    Ok 'Reserva de ancho de banda liberada'

    # Optimizacion de entrega de Windows Update: no compartir con otras PCs de internet
    New-Item 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\DeliveryOptimization' -Force | Out-Null
    Set-ItemProperty 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\DeliveryOptimization' -Name DODownloadMode -Value 0 -Type DWord
    Ok 'Windows Update ya no sube datos a otras PCs'

    # DNS rapido opcional
    Write-Host "`n   Cambiar DNS a uno mas rapido?" -ForegroundColor Yellow
    Write-Host '   1 = Cloudflare (1.1.1.1)   2 = Google (8.8.8.8)   3 = Automatico del proveedor   ENTER = no cambiar'
    $d = Read-Host '   Opcion'
    $dns = switch ($d) { '1' { '1.1.1.1','1.0.0.1' } '2' { '8.8.8.8','8.8.4.4' } default { $null } }
    $adaptadores = Get-WmiObject Win32_NetworkAdapterConfiguration -Filter 'IPEnabled=True'
    if ($dns) {
        $adaptadores | ForEach-Object { $_.SetDNSServerSearchOrder($dns) | Out-Null }
        Ok "DNS cambiado a $($dns -join ', ')"
    } elseif ($d -eq '3') {
        $adaptadores | ForEach-Object { $_.SetDNSServerSearchOrder() | Out-Null }
        Ok 'DNS automatico restaurado'
    }
    ipconfig /flushdns | Out-Null

    Write-Host "`n   Si internet sigue lento o falla, use la opcion 6 (Reparar red)." -ForegroundColor Gray
}

# ---------------- RAPIDEZ DE ARCHIVOS ----------------
function Acelerar-Archivos {
    Titulo 'RAPIDEZ AL ABRIR ARCHIVOS Y CARPETAS'

    # No actualizar "ultimo acceso" en cada lectura (menos escrituras al disco)
    fsutil behavior set disablelastaccess 1 | Out-Null; Ok 'Registro de ultimo acceso desactivado'
    # No crear nombres cortos 8.3 en archivos nuevos
    fsutil behavior set disable8dot3 1 | Out-Null;      Ok 'Nombres cortos 8.3 desactivados'

    # El Explorador abre en "Este equipo" y no busca en red al abrir carpetas
    Set-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced' -Name LaunchTo -Value 1
    Set-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced' -Name NoNetCrawling -Value 1 -Type DWord
    Ok 'Explorador abre mas rapido'

    # Arreglar carpetas que tardan en "Trabajando en ello..." (descubrimiento de tipo de carpeta)
    Remove-Item 'HKCU:\Software\Classes\Local Settings\Software\Microsoft\Windows\Shell\Bags' -Recurse -Force
    Remove-Item 'HKCU:\Software\Classes\Local Settings\Software\Microsoft\Windows\Shell\BagMRU' -Recurse -Force
    New-Item 'HKCU:\Software\Classes\Local Settings\Software\Microsoft\Windows\Shell\Bags\AllFolders\Shell' -Force | Out-Null
    Set-ItemProperty 'HKCU:\Software\Classes\Local Settings\Software\Microsoft\Windows\Shell\Bags\AllFolders\Shell' -Name FolderType -Value 'NotSpecified'
    Ok 'Carpetas grandes ya no se quedan "Trabajando en ello..."'

    # Reconstruir cache de miniaturas
    Stop-Process -Name explorer -Force
    Start-Sleep 2
    Remove-Item "$env:LOCALAPPDATA\Microsoft\Windows\Explorer\thumbcache_*.db" -Force
    Start-Process explorer
    Ok 'Cache de miniaturas reconstruida'

    # SSD: TRIM / Disco duro: desfragmentar
    $ssd = $false
    if (Get-Command Get-PhysicalDisk) { $ssd = [bool](Get-PhysicalDisk | Where-Object MediaType -eq 'SSD') }
    if ($ssd) {
        fsutil behavior set DisableDeleteNotify 0 | Out-Null
        Write-Host '   Optimizando SSD (TRIM)...'
        Optimize-Volume -DriveLetter C -ReTrim
        Ok 'SSD optimizado con TRIM'
    } else {
        $r = Read-Host '   Disco duro mecanico detectado. Desfragmentar C: ahora? Puede tardar mucho (S/N)'
        if ($r -match '^[sS]') { defrag C: /O /U; Ok 'Disco desfragmentado' }
    }
}

# ---------------- PROGRAMAS DE INICIO ----------------
function Ver-Inicio {
    Titulo 'PROGRAMAS QUE ARRANCAN CON WINDOWS'
    Write-Host '   Cada programa aqui hace que la PC encienda mas lento.'
    Write-Host '   Se abrira el Administrador de tareas: desactive los que no use.' -ForegroundColor Yellow
    Get-CimInstance Win32_StartupCommand | Select-Object Name, Location | Format-Table -AutoSize
    if ([Environment]::OSVersion.Version -ge [Version]'6.2') { Start-Process taskmgr -ArgumentList '/0 /startup' } else { Start-Process msconfig }
}

# ---------------- REPARAR ----------------
function Reparar-Red {
    Titulo 'REPARAR RED (requiere reiniciar)'
    ipconfig /release | Out-Null; ipconfig /flushdns | Out-Null; ipconfig /renew | Out-Null
    netsh winsock reset | Out-Null
    netsh int ip reset | Out-Null
    Ok 'Red restablecida. REINICIE la computadora.'
}

function Reparar-Windows {
    Titulo 'REPARAR ARCHIVOS DE WINDOWS (puede tardar 15-30 min)'
    if ([Environment]::OSVersion.Version -ge [Version]'6.2') { DISM /Online /Cleanup-Image /RestoreHealth }
    sfc /scannow
}

function Info-PC {
    Titulo 'DIAGNOSTICO'
    $so  = Get-CimInstance Win32_OperatingSystem
    $cpu = Get-CimInstance Win32_Processor | Select-Object -First 1
    $c   = Get-PSDrive C
    Write-Host ("   Sistema:   {0}" -f $so.Caption)
    Write-Host ("   Procesador:{0}" -f $cpu.Name)
    Write-Host ("   RAM:       {0:N1} GB total, {1:N1} GB libre" -f ($so.TotalVisibleMemorySize/1MB), ($so.FreePhysicalMemory/1MB))
    Write-Host ("   Disco C:   {0:N1} GB libres de {1:N1} GB" -f ($c.Free/1GB), (($c.Used+$c.Free)/1GB))
    if (Get-Command Get-PhysicalDisk) { Get-PhysicalDisk | ForEach-Object { Write-Host ("   Disco:     {0} ({1}) estado: {2}" -f $_.FriendlyName, $_.MediaType, $_.HealthStatus) } }
    if ($so.TotalVisibleMemorySize/1MB -lt 4) { Write-Host '   >> Consejo: menos de 4 GB de RAM. Agregar memoria acelera mucho.' -ForegroundColor Yellow }
    if (($c.Free/($c.Used+$c.Free)) -lt 0.15) { Write-Host '   >> Consejo: disco C: casi lleno (<15% libre). Libere espacio.' -ForegroundColor Yellow }
    if (Get-Command Get-PhysicalDisk) { if (-not (Get-PhysicalDisk | Where-Object MediaType -eq 'SSD')) { Write-Host '   >> Consejo: cambiar el disco duro por un SSD es la mejora mas grande posible.' -ForegroundColor Yellow } }
    Write-Host "`n   Los 5 procesos que mas memoria usan ahora:"
    Get-Process | Sort-Object WorkingSet -Descending | Select-Object -First 5 |
        ForEach-Object { Write-Host ("     {0,-30} {1,8:N0} MB" -f $_.ProcessName, ($_.WorkingSet/1MB)) }
}

# ======================= MENU =======================
$restauracionHecha = $false
while ($true) {
    Clear-Host
    Write-Host '============================================================' -ForegroundColor Cyan
    Write-Host '                    ACELERADOR  PC' -ForegroundColor Cyan
    Write-Host '============================================================' -ForegroundColor Cyan
    Write-Host '  1. TODO (recomendado: general + internet + archivos)'
    Write-Host '  2. Rapidez general de la computadora'
    Write-Host '  3. Rapidez de internet'
    Write-Host '  4. Rapidez al abrir archivos y carpetas'
    Write-Host '  5. Programas que arrancan con Windows'
    Write-Host '  6. Reparar red (si internet falla)'
    Write-Host '  7. Reparar archivos de Windows'
    Write-Host '  8. Diagnostico: que hace lenta esta PC'
    Write-Host '  9. DESHACER cambios (Restaurar sistema)'
    Write-Host '  0. Salir'
    $op = Read-Host "`nElija una opcion"
    if ($op -eq '0') { break }
    if ($op -in '1','2','3','4' -and -not $restauracionHecha) { Punto-Restauracion; $restauracionHecha = $true }
    switch ($op) {
        '1' { Acelerar-General; Acelerar-Internet; Acelerar-Archivos; Write-Host "`nListo. REINICIE la computadora para aplicar todo." -ForegroundColor Green }
        '2' { Acelerar-General;  Write-Host "`nListo. Reinicie para aplicar todo." -ForegroundColor Green }
        '3' { Acelerar-Internet; Write-Host "`nListo. Reinicie para aplicar todo." -ForegroundColor Green }
        '4' { Acelerar-Archivos; Write-Host "`nListo. Reinicie para aplicar todo." -ForegroundColor Green }
        '5' { Ver-Inicio }
        '6' { Reparar-Red }
        '7' { Reparar-Windows }
        '8' { Info-PC }
        '9' { Start-Process rstrui }
        default { continue }
    }
    pause
}
