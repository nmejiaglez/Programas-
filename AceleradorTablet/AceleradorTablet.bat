<# :
@echo off
REM ============================================================
REM  ACELERADOR TABLET - un solo archivo. Doble clic para abrir.
REM  Se usa desde la COMPUTADORA con la tablet Android conectada
REM  por cable USB. (La parte de abajo es el programa en PowerShell.)
REM ============================================================
title Acelerador Tablet
set "AT_BAT=%~f0"
powershell -NoProfile -ExecutionPolicy Bypass -STA -Command "Invoke-Expression ([IO.File]::ReadAllText($env:AT_BAT))"
if errorlevel 1 (
  echo.
  echo  Ocurrio un problema. Tome una foto de esta pantalla.
  pause
)
exit /b
#>
# ============================================================
#  ACELERADOR TABLET - tablets y celulares Android 5 o mas nuevo
#  Hace la tablet mas rapida con ajustes reales y reversibles:
#  animaciones mas cortas, cierra apps en segundo plano, libera
#  cache, optimiza (compila) las apps y desactiva apps
#  preinstaladas que no se usan (solo las que usted acepte).
#  NO borra fotos, videos, documentos, WhatsApp ni contactos.
#  Guarda un RESPALDO de lo que cambia: la opcion 8 lo deshace.
# ============================================================
$ErrorActionPreference = 'SilentlyContinue'
$Host.UI.RawUI.WindowTitle = 'Acelerador Tablet'

$Base = Join-Path $env:LOCALAPPDATA 'AceleradorTablet'
New-Item -ItemType Directory -Path $Base -Force | Out-Null

function Titulo($t) { Write-Host "`n>> $t" -ForegroundColor Cyan }
function Ok($t)     { Write-Host "   [OK] $t" -ForegroundColor Green }
function Aviso($t)  { Write-Host "   [!] $t" -ForegroundColor Yellow }
function Info($t)   { Write-Host "   $t" }
function Pregunta-Si($pregunta) { return ((Read-Host $pregunta) -match '^\s*[sS]') }
function Pausa { Read-Host "`nPresione ENTER para volver al menu" | Out-Null }

# ---------------- ADB (herramienta oficial de Google) ----------------
function Buscar-Adb {
    $lugares = @(
        (Join-Path (Split-Path $env:AT_BAT) 'platform-tools\adb.exe'),
        (Join-Path $Base 'platform-tools\adb.exe')
    )
    foreach ($l in $lugares) { if (Test-Path -LiteralPath $l) { return $l } }
    $cmd = Get-Command adb.exe
    if ($cmd) { return $cmd.Path }
    return $null
}

function Descargar-Adb {
    Titulo 'Falta la herramienta ADB de Google (unos 7 MB). Se descargara una sola vez.'
    if (-not (Pregunta-Si '   Descargar ahora? (S/N)')) { return $null }
    $zip = Join-Path $Base 'platform-tools.zip'
    $url = 'https://dl.google.com/android/repository/platform-tools-latest-windows.zip'
    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor 3072
        Info 'Descargando...'
        (New-Object Net.WebClient).DownloadFile($url, $zip)
    } catch { }
    if (-not (Test-Path -LiteralPath $zip)) {
        Aviso 'No se pudo descargar. Revise el internet o descargue "platform-tools" de Google'
        Aviso 'y descomprimalo junto a este archivo (carpeta platform-tools).'
        return $null
    }
    Info 'Descomprimiendo...'
    if (Get-Command Expand-Archive) {
        Expand-Archive -LiteralPath $zip -DestinationPath $Base -Force
    } else {
        $sh = New-Object -ComObject Shell.Application
        $sh.NameSpace($Base).CopyHere($sh.NameSpace($zip).Items(), 16)
    }
    Remove-Item -LiteralPath $zip -Force
    $adb = Join-Path $Base 'platform-tools\adb.exe'
    if (Test-Path -LiteralPath $adb) { Ok 'ADB listo'; return $adb }
    Aviso 'No se pudo descomprimir.'
    return $null
}

$script:Adb = Buscar-Adb
if (-not $script:Adb) { $script:Adb = Descargar-Adb }
if (-not $script:Adb) { Read-Host "`nPresione ENTER para salir" | Out-Null; exit }
& $script:Adb start-server 2>&1 | Out-Null

function Limpiar($lineas) { return @($lineas | ForEach-Object { ([string]$_).TrimEnd("`r") }) }
function Sh($comando) { return Limpiar (& $script:Adb -s $script:Serie shell $comando 2>&1) }
function Sh1($comando) { $r = Sh $comando; if ($r.Count) { return ([string]$r[0]).Trim() } return '' }

function Mostrar-Pasos-Depuracion {
    Write-Host ''
    Write-Host '   COMO ACTIVAR LA DEPURACION USB EN LA TABLET (solo la primera vez):' -ForegroundColor Yellow
    Info '   1. Ajustes > Acerca de la tablet (o Acerca del telefono).'
    Info '      En Samsung: Ajustes > Acerca de la tablet > Informacion de software.'
    Info '   2. Toque 7 veces seguidas "Numero de compilacion" hasta que diga'
    Info '      "Ahora eres desarrollador" (puede pedir el PIN).'
    Info '   3. Vuelva a Ajustes > Sistema (o al final de Ajustes) > Opciones de desarrollador.'
    Info '   4. Active "Depuracion USB".'
    Info '   5. Conecte el cable USB a la computadora. En la tablet aparecera'
    Info '      "Permitir depuracion USB?": marque "Permitir siempre" y toque PERMITIR.'
    Info '   Si no aparece nada, cambie el modo USB a "Transferencia de archivos".'
}

function Conectar {
    while ($true) {
        $lista = Limpiar (& $script:Adb devices 2>&1) | Where-Object { $_ -match '^\S+\s+(device|unauthorized|offline)$' }
        $listos = @($lista | Where-Object { $_ -match '\sdevice$' })
        if ($listos.Count -ge 1) {
            $script:Serie = ($listos[0] -split '\s+')[0]
            if ($listos.Count -gt 1) { Aviso "Hay $($listos.Count) equipos conectados; se usara el primero." }
            return $true
        }
        Clear-Host
        Write-Host '=============== ACELERADOR TABLET ===============' -ForegroundColor Cyan
        if (@($lista | Where-Object { $_ -match 'unauthorized' }).Count) {
            Aviso 'La tablet esta conectada pero NO ha dado permiso.'
            Aviso 'Mire la pantalla de la tablet y toque PERMITIR (marque "Permitir siempre").'
        } else {
            Aviso 'No se encuentra ninguna tablet conectada.'
            Mostrar-Pasos-Depuracion
        }
        $r = Read-Host "`n   Presione ENTER para buscar otra vez, o escriba X para salir"
        if ($r -match '^\s*[xX]') { return $false }
    }
}

# ---------------- DATOS DE LA TABLET ----------------
function Kb-a-Gb($kb) { return [math]::Round([double]$kb / 1MB, 1) }

function Ram {
    $m = @{}
    foreach ($l in (Sh 'cat /proc/meminfo')) { if ($l -match '^(\w+):\s+(\d+)') { $m[$matches[1]] = [double]$matches[2] } }
    $total = $m['MemTotal']
    if ($m.ContainsKey('MemAvailable')) { $libre = $m['MemAvailable'] } else { $libre = $m['MemFree'] + $m['Cached'] }
    if (-not $total) { return $null }
    return New-Object PSObject -Property @{ Total = (Kb-a-Gb $total); Libre = (Kb-a-Gb $libre); Porc = [math]::Round(($total - $libre) * 100 / $total) }
}

function Almacenamiento {
    $lineas = Sh 'df -k /data'
    $ult = ([string]$lineas[-1]).Trim() -split '\s+'
    if ($ult.Count -ge 4 -and $ult[1] -match '^\d+$' -and $ult[3] -match '^\d+$') {
        $total = [double]$ult[1]; $libre = [double]$ult[3]
        return New-Object PSObject -Property @{ Total = (Kb-a-Gb $total); Libre = (Kb-a-Gb $libre); PorcLibre = [math]::Round($libre * 100 / $total) }
    }
    return $null
}

$script:Sdk = 0
function Datos-Equipo {
    $script:Marca   = Sh1 'getprop ro.product.manufacturer'
    $script:Modelo  = Sh1 'getprop ro.product.model'
    $script:Version = Sh1 'getprop ro.build.version.release'
    [int]::TryParse((Sh1 'getprop ro.build.version.sdk'), [ref]$script:Sdk) | Out-Null
    $script:CarpResp = Join-Path $Base ($script:Serie -replace '[^\w\.-]', '_')
    New-Item -ItemType Directory -Path $script:CarpResp -Force | Out-Null
    $script:ArchAnim = Join-Path $script:CarpResp 'animaciones.txt'
    $script:ArchApps = Join-Path $script:CarpResp 'apps_desactivadas.txt'
}

function Diagnostico {
    Titulo "DIAGNOSTICO: $script:Marca $script:Modelo - Android $script:Version"
    $r = Ram
    if ($r) {
        Info ("Memoria RAM: {0} GB en total, {1} GB libres ({2}% en uso)" -f $r.Total, $r.Libre, $r.Porc)
        if ($r.Total -lt 2.5) { Aviso 'La tablet tiene poca RAM: conviene tener pocas apps abiertas y usar versiones "Lite".' }
    }
    $a = Almacenamiento
    if ($a) {
        Info ("Almacenamiento: {0} GB en total, {1} GB libres ({2}% libre)" -f $a.Total, $a.Libre, $a.PorcLibre)
        if ($a.PorcLibre -lt 15) { Aviso 'Queda poco espacio. Con menos de 15% libre Android se pone LENTO. Pase fotos/videos a la PC.' }
    }
    $bat = Sh 'dumpsys battery'
    $nivel = ($bat | Where-Object { $_ -match '^\s*level:\s*(\d+)' } | Select-Object -First 1) -replace '\D', ''
    $temp  = ($bat | Where-Object { $_ -match '^\s*temperature:\s*(\d+)' } | Select-Object -First 1) -replace '\D', ''
    if ($nivel) { Info "Bateria: $nivel%" }
    if ($temp) {
        $c = [math]::Round([double]$temp / 10, 1)
        Info "Temperatura de bateria: $c C"
        if ($c -ge 40) { Aviso 'La tablet esta CALIENTE: cuando se calienta, Android baja la velocidad a proposito.' }
    }
    $apps = @(Sh 'pm list packages -3' | Where-Object { $_ -match '^package:' }).Count
    Info "Apps instaladas por el usuario: $apps"
    if ($script:Sdk -lt 21) { Aviso 'Android muy antiguo: algunas opciones no funcionaran.' }

    Titulo 'Apps que mas memoria usan ahora mismo:'
    $mem = Sh 'dumpsys meminfo'
    $dentro = $false; $n = 0
    foreach ($l in $mem) {
        if ($l -match '^Total (PSS|RSS) by process') { $dentro = $true; continue }
        if ($dentro) {
            if ($l.Trim() -eq '') { if ($n -gt 0) { break } else { continue } }
            if ($l -match '^\s*([\d,]+)K:\s+(\S+)') {
                $mb = [math]::Round(([double]($matches[1] -replace ',', '')) / 1024)
                Info ("{0,6} MB  {1}" -f $mb, $matches[2])
                $n++; if ($n -ge 10) { break }
            }
        }
    }
    if ($n -eq 0) { Info '(Esta tablet no permite ver este dato)' }
}

# ---------------- ACCIONES ----------------
$Animaciones = @('window_animation_scale', 'transition_animation_scale', 'animator_duration_scale')

function Animaciones-Rapidas {
    Titulo 'Animaciones mas cortas (la tablet se siente mucho mas agil)'
    if (-not (Test-Path -LiteralPath $script:ArchAnim)) {
        $orig = foreach ($k in $Animaciones) { "$k=$(Sh1 "settings get global $k")" }
        Set-Content -LiteralPath $script:ArchAnim -Value $orig
    }
    foreach ($k in $Animaciones) { Sh "settings put global $k 0.5" | Out-Null }
    Ok 'Animaciones a la mitad del tiempo (0.5x). Siguen viendose, pero el doble de rapido.'
}

function Cerrar-Segundo-Plano {
    Titulo 'Cerrando apps que quedaron abiertas en segundo plano'
    $antes = Ram
    Sh 'am kill-all' | Out-Null
    Start-Sleep -Seconds 2
    $despues = Ram
    if ($antes -and $despues) {
        $ganado = [math]::Max(0, [math]::Round(($despues.Libre - $antes.Libre) * 1024))
        Ok ("Listo. RAM libre: {0} GB -> {1} GB (+{2} MB)" -f $antes.Libre, $despues.Libre, $ganado)
    } else { Ok 'Listo' }
    Info '(No se cierran WhatsApp ni la app que este en pantalla; solo lo que estaba de sobra.)'
}

function Liberar-Cache {
    Titulo 'Borrando la cache (archivos temporales) de todas las apps'
    $antes = Almacenamiento
    Sh 'pm trim-caches 999G' | Out-Null
    Start-Sleep -Seconds 2
    $despues = Almacenamiento
    if ($antes -and $despues) {
        $ganado = [math]::Max(0, [math]::Round(($despues.Libre - $antes.Libre) * 1024))
        Ok ("Listo. Espacio libre: {0} GB -> {1} GB (+{2} MB)" -f $antes.Libre, $despues.Libre, $ganado)
    } else { Ok 'Listo' }
    Info '(No borra fotos, chats ni sesiones iniciadas; las apps rehacen su cache poco a poco.)'
}

function Optimizar-Apps {
    Titulo 'Optimizando (compilando) las apps para que abran mas rapido'
    if ($script:Sdk -lt 24) { Aviso 'Requiere Android 7 o mas nuevo. Se omite.'; return }
    Info 'Esto tarda de 2 a 15 minutos. NO desconecte el cable mientras tanto...'
    $r = Sh 'cmd package bg-dexopt-job'
    if (($r -join ' ') -match 'Failure|Error|Unknown') {
        Aviso 'Esta tablet no permitio la optimizacion completa; Android la hara solo cuando este cargando.'
    } else {
        Ok 'Apps optimizadas'
    }
}

# Apps preinstaladas que no son necesarias para que la tablet funcione.
# Se DESACTIVAN (no se borran): se pueden volver a activar con la opcion 8
# o desde Ajustes > Aplicaciones. Se pregunta una por una.
$Preinstaladas = @(
  @('com.facebook.system',                    'Facebook (servicio preinstalado)'),
  @('com.facebook.appmanager',                'Facebook App Manager (actualiza Facebook en segundo plano)'),
  @('com.facebook.services',                  'Facebook Services (corre en segundo plano)'),
  @('com.netflix.partner.activation',         'Activacion de Netflix (preinstalado)'),
  @('com.linkedin.android',                   'LinkedIn'),
  @('com.microsoft.skydrive',                 'OneDrive'),
  @('com.samsung.android.bixby.agent',        'Bixby (asistente de Samsung)'),
  @('com.samsung.android.bixby.wakeup',       'Bixby (escucha "Hi Bixby")'),
  @('com.samsung.android.visionintelligence', 'Bixby Vision'),
  @('com.samsung.android.app.spage',          'Samsung Free / Bixby Home'),
  @('com.samsung.android.ardrawing',          'AR Doodle (Samsung)'),
  @('com.samsung.android.aremoji',            'AR Emoji (Samsung)'),
  @('com.samsung.android.app.tips',           'Consejos de Samsung'),
  @('com.miui.msa.global',                    'Anuncios de Xiaomi (MSA)'),
  @('com.miui.analytics',                     'Estadisticas de Xiaomi'),
  @('com.xiaomi.mipicks',                     'GetApps (tienda de Xiaomi)'),
  @('com.google.android.apps.tachyon',        'Google Meet / Duo'),
  @('com.google.android.videos',              'Google TV / Play Peliculas'),
  @('com.google.android.music',               'Google Play Musica (ya no existe)'),
  @('com.google.android.apps.magazines',      'Google Noticias'),
  @('com.google.android.apps.subscriptions.red', 'Google One'),
  @('com.google.android.apps.youtube.music',  'YouTube Music'),
  @('com.amazon.mShop.android.shopping',      'Amazon Compras'),
  @('com.amazon.appmanager',                  'Amazon App Manager'),
  @('com.booking',                            'Booking'),
  @('com.spotify.music',                      'Spotify'),
  @('com.tencent.ig',                         'Juego preinstalado PUBG'),
  @('com.king.candycrushsaga',                'Candy Crush')
)

function Desactivar-Preinstaladas {
    Titulo 'Apps preinstaladas que gastan memoria y no son necesarias'
    $instaladas = @{}
    foreach ($l in (Sh 'pm list packages -e')) { if ($l -match '^package:(.+)$') { $instaladas[$matches[1].Trim()] = $true } }
    $encontradas = @($Preinstaladas | Where-Object { $instaladas.ContainsKey($_[0]) })
    if (-not $encontradas.Count) { Ok 'No se encontro ninguna de la lista. Nada que hacer.'; return }
    Info "Se encontraron $($encontradas.Count). Se preguntara una por una (S = desactivar, N = dejarla)."
    Info 'Si usted usa alguna, responda N.'
    foreach ($p in $encontradas) {
        if (-not (Pregunta-Si "   Desactivar $($p[1])? (S/N)")) { continue }
        $r = Sh "pm disable-user --user 0 $($p[0])"
        if (($r -join ' ') -match 'disabled') {
            Add-Content -LiteralPath $script:ArchApps -Value $p[0]
            Ok "$($p[1]) desactivada"
        } else {
            Aviso "$($p[1]): la tablet no lo permitio"
        }
    }
}

function Deshacer {
    Titulo 'Dejando la tablet como estaba'
    if (Test-Path -LiteralPath $script:ArchAnim) {
        foreach ($l in (Get-Content -LiteralPath $script:ArchAnim)) {
            $k, $v = $l -split '=', 2
            if ($v -notmatch '^[\d\.]+$') { $v = '1' }
            Sh "settings put global $k $v" | Out-Null
        }
        Remove-Item -LiteralPath $script:ArchAnim -Force
        Ok 'Animaciones restauradas'
    } else {
        foreach ($k in $Animaciones) { Sh "settings put global $k 1" | Out-Null }
        Ok 'Animaciones en velocidad normal (1x)'
    }
    if (Test-Path -LiteralPath $script:ArchApps) {
        foreach ($pkg in (Get-Content -LiteralPath $script:ArchApps | Where-Object { $_.Trim() } | Select-Object -Unique)) {
            Sh "pm enable $pkg" | Out-Null
            Ok "Reactivada: $pkg"
        }
        Remove-Item -LiteralPath $script:ArchApps -Force
    } else {
        Info 'No hay apps desactivadas por este programa.'
    }
    Info '(La cache borrada y las apps cerradas no necesitan deshacerse.)'
}

function Todo {
    Diagnostico
    Animaciones-Rapidas
    Cerrar-Segundo-Plano
    Liberar-Cache
    Optimizar-Apps
    Write-Host ''
    if (Pregunta-Si '   Revisar tambien las apps preinstaladas innecesarias? (S/N)') { Desactivar-Preinstaladas }
    Titulo 'TERMINADO'
    Ok 'Reinicie la tablet (apagar y encender) para notar todo el cambio.'
}

# ---------------- MENU ----------------
if (-not (Conectar)) { exit }
Datos-Equipo

while ($true) {
    Clear-Host
    Write-Host '=============== ACELERADOR TABLET ===============' -ForegroundColor Cyan
    Write-Host "  Conectada: $script:Marca $script:Modelo - Android $script:Version" -ForegroundColor Green
    Write-Host ''
    Write-Host '  1. TODO (recomendado)'
    Write-Host '  2. Diagnostico (que hace lenta la tablet)'
    Write-Host '  3. Animaciones mas rapidas'
    Write-Host '  4. Cerrar apps en segundo plano (libera RAM)'
    Write-Host '  5. Borrar cache de las apps (libera espacio)'
    Write-Host '  6. Optimizar apps para que abran mas rapido'
    Write-Host '  7. Desactivar apps preinstaladas innecesarias'
    Write-Host '  8. DESHACER (dejar como estaba)'
    Write-Host '  0. Salir'
    $op = Read-Host "`n  Elija una opcion"
    if ($op -match '^\s*0\s*$') { break }
    if (-not (Conectar)) { break }
    switch -regex ($op) {
        '^\s*1\s*$' { Todo }
        '^\s*2\s*$' { Diagnostico }
        '^\s*3\s*$' { Animaciones-Rapidas }
        '^\s*4\s*$' { Cerrar-Segundo-Plano }
        '^\s*5\s*$' { Liberar-Cache }
        '^\s*6\s*$' { Optimizar-Apps }
        '^\s*7\s*$' { Desactivar-Preinstaladas }
        '^\s*8\s*$' { Deshacer }
        default     { Aviso 'Opcion no valida' }
    }
    Pausa
}
