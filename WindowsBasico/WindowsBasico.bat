<# :
@echo off
REM ============================================================
REM  WINDOWS BASICO - un solo archivo. Doble clic para abrir.
REM  (La parte de abajo es el programa en PowerShell.)
REM ============================================================
title Windows Basico
set "WB_BAT=%~f0"
powershell -NoProfile -ExecutionPolicy Bypass -STA -Command "Invoke-Expression ([IO.File]::ReadAllText($env:WB_BAT))"
if errorlevel 1 (
  echo.
  echo  Ocurrio un problema. Tome una foto de esta pantalla.
  pause
)
exit /b
#>
# ============================================================
#  WINDOWS BASICO - Windows 7 / 8 / 10 / 11
#  Deja Windows en modo MINIMO para que consuma poca RAM:
#  sin animaciones, sin apps en segundo plano, sin widgets,
#  sin servicios innecesarios y sin programas al inicio.
#  Crea un PUNTO DE RESTAURACION y un RESPALDO de todo lo que
#  cambia: la opcion 5 lo deja todo como estaba.
# ============================================================
$ErrorActionPreference = 'SilentlyContinue'
$Host.UI.RawUI.WindowTitle = 'Windows Basico'

$esAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $esAdmin) {
    Write-Host 'Pidiendo permiso de ADMINISTRADOR... (responda SI en la ventana de Windows)' -ForegroundColor Yellow
    Start-Process -FilePath $env:WB_BAT -Verb RunAs
    exit
}

$Respaldo   = Join-Path $env:ProgramData 'WindowsBasico'
$ArchReg    = Join-Path $Respaldo 'registro.csv'
$ArchServ   = Join-Path $Respaldo 'servicios.csv'
$ArchInicio = Join-Path $Respaldo 'inicio.csv'
$CarpInicio = Join-Path $Respaldo 'Inicio'
New-Item -ItemType Directory -Path $CarpInicio -Force | Out-Null

function Titulo($t) { Write-Host "`n>> $t" -ForegroundColor Cyan }
function Ok($t)     { Write-Host "   [OK] $t" -ForegroundColor Green }
function Aviso($t)  { Write-Host "   [!] $t" -ForegroundColor Yellow }
function Leer-Csv($a) { if (Test-Path -LiteralPath $a) { return @(Import-Csv -LiteralPath $a) } return @() }
function Si($pregunta) { return ((Read-Host $pregunta) -match '^\s*[sS]') }

function Ram {
    $os = Get-WmiObject Win32_OperatingSystem
    $total = [math]::Round($os.TotalVisibleMemorySize / 1MB, 1)
    $usada = [math]::Round(($os.TotalVisibleMemorySize - $os.FreePhysicalMemory) / 1MB, 1)
    return New-Object PSObject -Property @{ Total = $total; Usada = $usada; Porc = [math]::Round($usada * 100 / $total) }
}

# ---------------- REGISTRO (con respaldo del valor original) ----------------
$script:RegBak = Leer-Csv $ArchReg
function Set-Reg($ruta, $nombre, $valor, $tipo) {
    $ya = $script:RegBak | Where-Object { $_.Ruta -eq $ruta -and $_.Nombre -eq $nombre }
    if (-not $ya) {
        $existia = 'no'; $antes = ''; $tipoAntes = ''
        $k = Get-Item -LiteralPath $ruta
        if ($k -and ($k.GetValueNames() -contains $nombre)) {
            $existia = 'si'; $tipoAntes = [string]$k.GetValueKind($nombre)
            $v = $k.GetValue($nombre)
            if ($tipoAntes -eq 'Binary') { $antes = ($v | ForEach-Object { $_.ToString('X2') }) -join ' ' } else { $antes = [string]$v }
        }
        $script:RegBak += New-Object PSObject -Property @{ Ruta = $ruta; Nombre = $nombre; Existia = $existia; Valor = $antes; Tipo = $tipoAntes }
        $script:RegBak | Select-Object Ruta, Nombre, Existia, Valor, Tipo | Export-Csv -LiteralPath $ArchReg -NoTypeInformation -Encoding UTF8
    }
    if (-not (Test-Path -LiteralPath $ruta)) { New-Item -Path $ruta -Force | Out-Null }
    New-ItemProperty -LiteralPath $ruta -Name $nombre -Value $valor -PropertyType $tipo -Force | Out-Null
}
function Hex($t) { return ,([byte[]]($t -split ' ' | Where-Object { $_ } | ForEach-Object { [Convert]::ToByte($_, 16) })) }

# ---------------- SERVICIOS ----------------
# Solo servicios que una computadora de casa/consultorio no necesita.
# NO se tocan: impresoras, red, wifi, sonido, Windows Update, antivirus.
$Servicios = @(
  @('DiagTrack','Telemetria (envia datos a Microsoft)'),
  @('dmwappushservice','Mensajes de telemetria'),
  @('SysMain','Superfetch (precarga programas en la RAM)'),
  @('WSearch','Indexado de busqueda (la busqueda sigue funcionando, mas lenta)'),
  @('MapsBroker','Mapas sin conexion'),
  @('Fax','Fax'),
  @('RetailDemo','Modo demostracion de tienda'),
  @('WMPNetworkSvc','Compartir musica de Windows Media Player'),
  @('RemoteRegistry','Registro remoto'),
  @('XblAuthManager','Xbox'), @('XblGameSave','Xbox (partidas guardadas)'),
  @('XboxNetApiSvc','Xbox (red)'), @('XboxGipSvc','Xbox (controles)'),
  @('WerSvc','Informe de errores a Microsoft'),
  @('lfsvc','Ubicacion (GPS)'),
  @('DoSvc','Optimizacion de entrega (comparte actualizaciones con otras PC)')
)

function Servicios-Basico {
    Titulo 'Apagando servicios innecesarios...'
    $bak = Leer-Csv $ArchServ
    foreach ($s in $Servicios) {
        $w = Get-WmiObject Win32_Service -Filter "Name='$($s[0])'"
        if (-not $w) { continue }
        if (-not ($bak | Where-Object { $_.Nombre -eq $s[0] })) {
            $bak += New-Object PSObject -Property @{ Nombre = $s[0]; Inicio = $w.StartMode; Estado = $w.State }
        }
        Stop-Service -Name $s[0] -Force
        Set-Service -Name $s[0] -StartupType Disabled
        if ($s[0] -eq 'DoSvc') { Set-Reg 'HKLM:\SYSTEM\CurrentControlSet\Services\DoSvc' 'Start' 4 'DWord' }
        Ok $s[1]
    }
    $bak | Select-Object Nombre, Inicio, Estado | Export-Csv -LiteralPath $ArchServ -NoTypeInformation -Encoding UTF8
}

function Ajustes-Basico {
    Titulo 'Quitando animaciones, transparencias y sombras (el texto sigue nitido)...'
    Set-Reg 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\VisualEffects' 'VisualFXSetting' 3 'DWord'
    Set-Reg 'HKCU:\Control Panel\Desktop' 'UserPreferencesMask' (Hex '90 12 03 80 10 00 00 00') 'Binary'
    Set-Reg 'HKCU:\Control Panel\Desktop' 'FontSmoothing' '2' 'String'
    Set-Reg 'HKCU:\Control Panel\Desktop' 'MenuShowDelay' '0' 'String'
    Set-Reg 'HKCU:\Control Panel\Desktop\WindowMetrics' 'MinAnimate' '0' 'String'
    Set-Reg 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced' 'TaskbarAnimations' 0 'DWord'
    Set-Reg 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced' 'ListviewAlphaSelect' 0 'DWord'
    Set-Reg 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced' 'ListviewShadow' 0 'DWord'
    Set-Reg 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Themes\Personalize' 'EnableTransparency' 0 'DWord'
    Set-Reg 'HKCU:\Software\Microsoft\Windows\DWM' 'EnableAeroPeek' 0 'DWord'
    Ok 'Efectos visuales al minimo'

    Titulo 'Bloqueando apps en segundo plano, widgets, noticias, Copilot y Cortana...'
    Set-Reg 'HKCU:\Software\Microsoft\Windows\CurrentVersion\BackgroundAccessApplications' 'GlobalUserDisabled' 1 'DWord'
    Set-Reg 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Search' 'BackgroundAppGlobalToggle' 0 'DWord'
    Set-Reg 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\AppPrivacy' 'LetAppsRunInBackground' 2 'DWord'
    Set-Reg 'HKLM:\SOFTWARE\Policies\Microsoft\Dsh' 'AllowNewsAndInterests' 0 'DWord'
    Set-Reg 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\Windows Feeds' 'EnableFeeds' 0 'DWord'
    Set-Reg 'HKCU:\Software\Policies\Microsoft\Windows\WindowsCopilot' 'TurnOffWindowsCopilot' 1 'DWord'
    Set-Reg 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\WindowsCopilot' 'TurnOffWindowsCopilot' 1 'DWord'
    Set-Reg 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\Windows Search' 'AllowCortana' 0 'DWord'
    Set-Reg 'HKCU:\Software\Policies\Microsoft\Windows\Explorer' 'DisableSearchBoxSuggestions' 1 'DWord'
    Ok 'Apps en segundo plano, widgets, noticias, Copilot y Cortana apagados'

    Titulo 'Quitando sugerencias, publicidad y telemetria...'
    $cdm = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\ContentDeliveryManager'
    foreach ($n in @('SystemPaneSuggestionsEnabled','SilentInstalledAppsEnabled','SoftLandingEnabled','SubscribedContent-338388Enabled',
                     'SubscribedContent-338389Enabled','SubscribedContent-353698Enabled','SubscribedContent-310093Enabled','RotatingLockScreenOverlayEnabled')) {
        Set-Reg $cdm $n 0 'DWord'
    }
    Set-Reg 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\DataCollection' 'AllowTelemetry' 0 'DWord'
    Set-Reg 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\CloudContent' 'DisableWindowsConsumerFeatures' 1 'DWord'
    Ok 'Sugerencias y telemetria apagadas'

    Titulo 'Apagando grabacion de juegos (Xbox Game Bar)...'
    Set-Reg 'HKCU:\System\GameConfigStore' 'GameDVR_Enabled' 0 'DWord'
    Set-Reg 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\GameDVR' 'AllowGameDVR' 0 'DWord'
    Ok 'Game Bar apagada'

    Titulo 'Evitando que Edge y Chrome se queden abiertos escondidos...'
    Set-Reg 'HKLM:\SOFTWARE\Policies\Microsoft\Edge' 'StartupBoostEnabled' 0 'DWord'
    Set-Reg 'HKLM:\SOFTWARE\Policies\Microsoft\Edge' 'BackgroundModeEnabled' 0 'DWord'
    Set-Reg 'HKLM:\SOFTWARE\Policies\Google\Chrome' 'BackgroundModeEnabled' 0 'DWord'
    Ok 'Navegadores ya no consumen RAM cuando estan cerrados'
}

function Punto-Restauracion {
    Titulo 'Creando punto de restauracion (seguridad extra)...'
    Enable-ComputerRestore -Drive "$env:SystemDrive\"
    New-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\SystemRestore' -Name SystemRestorePointCreationFrequency -Value 0 -PropertyType DWord -Force | Out-Null
    Checkpoint-Computer -Description 'Antes de Windows Basico' -RestorePointType MODIFY_SETTINGS
    if ($?) { Ok 'Punto de restauracion creado' } else { Aviso 'No se pudo crear (Proteccion del sistema desactivada). Igual se guarda un respaldo propio.' }
}

function Modo-Basico {
    $antes = Ram
    Titulo 'Se aplicara el MODO BASICO:'
    Write-Host '   - Sin animaciones, transparencias ni sombras'
    Write-Host '   - Sin apps en segundo plano, widgets, noticias, Copilot ni Cortana'
    Write-Host '   - Sin sugerencias, publicidad ni telemetria'
    Write-Host '   - Sin servicios innecesarios (Xbox, fax, mapas, Superfetch, indexado...)'
    Write-Host '   - Edge y Chrome no se quedan abiertos escondidos'
    Write-Host '   NO se toca: internet, wifi, impresoras, sonido, antivirus ni Windows Update.' -ForegroundColor Gray
    if (-not (Si "`n   Aplicar ahora? (S/N)")) { Aviso 'Cancelado.'; return }
    Punto-Restauracion
    Ajustes-Basico
    Servicios-Basico
    $despues = Ram
    Titulo 'LISTO.'
    Write-Host ("   RAM en uso antes: {0} GB  -  ahora: {1} GB de {2} GB" -f $antes.Usada, $despues.Usada, $despues.Total)
    Write-Host '   El mayor ahorro se nota despues de REINICIAR la computadora.' -ForegroundColor Yellow
    Write-Host '   Recomendado: use tambien la opcion 2 (programas que arrancan con Windows).' -ForegroundColor Gray
}

# ---------------- PROGRAMAS DE INICIO ----------------
$Recomendado = @('SecurityHealth','Windows Defender','Avast*','AVG*','Kaspersky*','ESET*','egui','McAfee*','Norton*','Bitdefender*','Realtek*','RtkAudUService','Synaptics*','IgfxTray','HotKeysCmds','Persistence')
function Es-Recomendado($n) { foreach ($r in $Recomendado) { if ($n -like $r) { return $true } } return $false }

function Lista-Inicio {
    $l = @()
    foreach ($ruta in @('HKCU:\Software\Microsoft\Windows\CurrentVersion\Run','HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run','HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Run')) {
        $k = Get-Item -LiteralPath $ruta
        if (-not $k) { continue }
        foreach ($n in $k.GetValueNames()) {
            if ($n -eq '') { continue }
            $l += New-Object PSObject -Property @{ Tipo = 'Registro'; Ruta = $ruta; Nombre = $n; Valor = [string]$k.GetValue($n) }
        }
    }
    foreach ($c in @([Environment]::GetFolderPath('Startup'), [Environment]::GetFolderPath('CommonStartup'))) {
        if (-not $c -or -not (Test-Path -LiteralPath $c)) { continue }
        Get-ChildItem -LiteralPath $c -Force | Where-Object { -not $_.PSIsContainer -and $_.Name -ne 'desktop.ini' } | ForEach-Object {
            $l += New-Object PSObject -Property @{ Tipo = 'Carpeta'; Ruta = $c; Nombre = $_.Name; Valor = $_.FullName }
        }
    }
    return $l
}

function Programas-Inicio {
    $l = @(Lista-Inicio)
    if ($l.Count -eq 0) { Ok 'No hay programas que arranquen solos con Windows.'; return }
    Titulo 'Programas que arrancan solos al prender la computadora:'
    for ($i = 0; $i -lt $l.Count; $i++) {
        $nota = ''; if (Es-Recomendado $l[$i].Nombre) { $nota = '  (antivirus/sonido: mejor dejarlo)' }
        Write-Host ("   {0,2}. {1}{2}" -f ($i + 1), $l[$i].Nombre, $nota)
    }
    Write-Host "`n   Escriba los NUMEROS que quiere quitar del inicio separados por coma (ej: 1,3,4)."
    Write-Host '   Escriba T para quitar todos menos los marcados "mejor dejarlo". Enter = ninguno.'
    $r = Read-Host '   Numeros'
    if (-not $r.Trim()) { Aviso 'No se cambio nada.'; return }
    if ($r.Trim() -match '^[tT]') { $sel = @(0..($l.Count - 1) | Where-Object { -not (Es-Recomendado $l[$_].Nombre) }) }
    else { $sel = @($r -split '[,; ]+' | Where-Object { $_ -match '^\d+$' } | ForEach-Object { [int]$_ - 1 } | Where-Object { $_ -ge 0 -and $_ -lt $l.Count }) }
    $bak = Leer-Csv $ArchInicio
    foreach ($i in $sel) {
        $e = $l[$i]
        if ($e.Tipo -eq 'Registro') {
            Remove-ItemProperty -LiteralPath $e.Ruta -Name $e.Nombre
            if ($?) { $bak += $e; Ok "Quitado: $($e.Nombre)" }
        } else {
            $dest = Join-Path $CarpInicio $e.Nombre
            Move-Item -LiteralPath $e.Valor -Destination $dest -Force
            if ($?) { $bak += New-Object PSObject -Property @{ Tipo = 'Carpeta'; Ruta = $e.Ruta; Nombre = $e.Nombre; Valor = $dest }; Ok "Quitado: $($e.Nombre)" }
        }
    }
    $bak | Select-Object Tipo, Ruta, Nombre, Valor | Export-Csv -LiteralPath $ArchInicio -NoTypeInformation -Encoding UTF8
    Write-Host '   Los programas siguen instalados: solo ya no se abren solos. Se notara al reiniciar.' -ForegroundColor Gray
}

# ---------------- APPS DE WINDOWS QUE NO SE USAN ----------------
$AppsQuitar = @(
  @('Microsoft.BingNews','Noticias'), @('Microsoft.BingWeather','El Tiempo'), @('Microsoft.GetHelp','Obtener ayuda'),
  @('Microsoft.Getstarted','Sugerencias'), @('Microsoft.MicrosoftSolitaireCollection','Solitario'), @('Microsoft.People','Contactos'),
  @('Microsoft.WindowsFeedbackHub','Centro de opiniones'), @('Microsoft.XboxApp','Xbox'), @('Microsoft.GamingApp','Xbox'),
  @('Microsoft.Xbox.TCUI','Xbox'), @('Microsoft.XboxGamingOverlay','Xbox Game Bar'), @('Microsoft.XboxGameOverlay','Xbox Game Bar'),
  @('Microsoft.XboxSpeechToTextOverlay','Xbox voz'), @('Microsoft.ZuneVideo','Peliculas y TV'), @('Clipchamp.Clipchamp','Clipchamp (videos)'),
  @('MicrosoftTeams','Teams personal'), @('MSTeams','Teams personal'), @('Microsoft.Todos','To Do'), @('Microsoft.PowerAutomateDesktop','Power Automate'),
  @('Microsoft.YourPhone','Enlace movil'), @('Microsoft.549981C3F5F10','Cortana'), @('Microsoft.MixedReality.Portal','Realidad mixta'),
  @('Microsoft.SkypeApp','Skype'), @('Microsoft.Microsoft3DViewer','Visor 3D'), @('Microsoft.WindowsMaps','Mapas'),
  @('Microsoft.Copilot','Copilot'), @('Microsoft.BingSearch','Busqueda Bing'), @('Microsoft.MicrosoftOfficeHub','Office (anuncio)')
)
function Quitar-Apps {
    if (-not (Get-Command Get-AppxPackage)) { Aviso 'Esta opcion es solo para Windows 10 y 11.'; return }
    $hay = @()
    foreach ($a in $AppsQuitar) { $p = Get-AppxPackage -Name $a[0]; if ($p) { $hay += New-Object PSObject -Property @{ Id = $a[0]; Nombre = $a[1]; Paquete = $p } } }
    if ($hay.Count -eq 0) { Ok 'No quedan apps innecesarias.'; return }
    Titulo 'Apps de Windows que casi nadie usa y se pueden quitar:'
    $hay | ForEach-Object { Write-Host "   - $($_.Nombre)" }
    Write-Host '   (Si algun dia necesita una, se vuelve a instalar gratis desde Microsoft Store.)' -ForegroundColor Gray
    if (-not (Si "`n   Quitarlas? (S/N)")) { Aviso 'Cancelado.'; return }
    foreach ($a in $hay) { $a.Paquete | Remove-AppxPackage; if ($?) { Ok "Quitada: $($a.Nombre)" } else { Aviso "No se pudo quitar: $($a.Nombre)" } }
}

# ---------------- VER RAM ----------------
function Ver-Ram {
    $r = Ram
    Titulo ("RAM en uso: {0} GB de {1} GB ({2}%)" -f $r.Usada, $r.Total, $r.Porc)
    Write-Host '   Programas que mas RAM consumen ahora:' -ForegroundColor Gray
    Get-Process | Group-Object ProcessName | ForEach-Object {
        New-Object PSObject -Property @{ Nombre = $_.Name; MB = [math]::Round((($_.Group | Measure-Object WorkingSet -Sum).Sum) / 1MB); Ventanas = $_.Count }
    } | Sort-Object MB -Descending | Select-Object -First 15 | ForEach-Object {
        Write-Host ("   {0,-28} {1,6} MB   ({2} procesos)" -f $_.Nombre, $_.MB, $_.Ventanas)
    }
    Write-Host "`n   Consejo: cada pestana del navegador consume RAM. Cierre las que no use." -ForegroundColor Gray
}

# ---------------- DESHACER ----------------
function Deshacer {
    if (-not (Si "`n   Volver TODO como estaba antes de Windows Basico? (S/N)")) { Aviso 'Cancelado.'; return }
    Titulo 'Restaurando ajustes...'
    foreach ($b in (Leer-Csv $ArchReg)) {
        if ($b.Existia -eq 'si') {
            if ($b.Tipo -eq 'Binary') { $v = Hex $b.Valor } elseif ($b.Tipo -eq 'DWord') { $v = [int]$b.Valor } elseif ($b.Tipo -eq 'QWord') { $v = [int64]$b.Valor } else { $v = $b.Valor }
            New-ItemProperty -LiteralPath $b.Ruta -Name $b.Nombre -Value $v -PropertyType $b.Tipo -Force | Out-Null
        } else { Remove-ItemProperty -LiteralPath $b.Ruta -Name $b.Nombre }
    }
    Ok 'Ajustes visuales y de Windows restaurados'
    Titulo 'Restaurando servicios...'
    foreach ($b in (Leer-Csv $ArchServ)) {
        $modo = @{ 'Auto' = 'Automatic'; 'Manual' = 'Manual'; 'Disabled' = 'Disabled' }[$b.Inicio]
        if ($modo) { Set-Service -Name $b.Nombre -StartupType $modo }
        if ($b.Estado -eq 'Running') { Start-Service -Name $b.Nombre }
    }
    Ok 'Servicios restaurados'
    Titulo 'Restaurando programas de inicio...'
    foreach ($b in (Leer-Csv $ArchInicio)) {
        if ($b.Tipo -eq 'Registro') { New-ItemProperty -LiteralPath $b.Ruta -Name $b.Nombre -Value $b.Valor -PropertyType String -Force | Out-Null }
        else { Move-Item -LiteralPath $b.Valor -Destination (Join-Path $b.Ruta $b.Nombre) -Force }
    }
    Ok 'Programas de inicio restaurados'
    foreach ($a in @($ArchReg, $ArchServ, $ArchInicio)) { if (Test-Path -LiteralPath $a) { Rename-Item -LiteralPath $a -NewName ((Split-Path $a -Leaf) + '.deshecho_' + (Get-Date -Format 'yyyyMMdd_HHmmss')) } }
    Write-Host '   Las apps quitadas (opcion 3) se reinstalan desde Microsoft Store si las necesita.' -ForegroundColor Gray
    Write-Host '   REINICIE la computadora para terminar.' -ForegroundColor Yellow
}

# ---------------- MENU ----------------
do {
    Clear-Host
    $r = Ram
    Write-Host '============================================================' -ForegroundColor Cyan
    Write-Host '                    WINDOWS  BASICO' -ForegroundColor White
    Write-Host '        Windows minimo para que consuma poca RAM' -ForegroundColor Gray
    Write-Host '============================================================' -ForegroundColor Cyan
    Write-Host ("  RAM en uso ahora: {0} GB de {1} GB ({2}%)`n" -f $r.Usada, $r.Total, $r.Porc) -ForegroundColor Yellow
    Write-Host '  1. Aplicar MODO BASICO (recomendado)  << empiece aqui'
    Write-Host '  2. Quitar programas que arrancan solos con Windows'
    Write-Host '  3. Quitar apps de Windows que no usa (Xbox, Noticias, Solitario...)'
    Write-Host '  4. Ver que programas consumen mas RAM'
    Write-Host '  5. DESHACER todo (dejar Windows como estaba)'
    Write-Host '  6. Reiniciar la computadora'
    Write-Host '  0. Salir'
    $op = Read-Host "`n  Elija una opcion"
    switch ($op) {
        '1' { Modo-Basico }
        '2' { Programas-Inicio }
        '3' { Quitar-Apps }
        '4' { Ver-Ram }
        '5' { Deshacer }
        '6' { if (Si '   Guarde sus trabajos. Reiniciar ahora? (S/N)') { Restart-Computer -Force } }
    }
    if ($op -ne '0') { Read-Host "`n  Pulse Enter para volver al menu" | Out-Null }
} while ($op -ne '0')
