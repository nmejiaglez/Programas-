# ============================================================
#  DESINSTALADOR TOTAL - Windows 7 / 8 / 10 / 11
#  1) Ejecuta el desinstalador oficial del programa.
#  2) Busca y elimina los restos: carpetas, registro,
#     accesos directos, servicios y tareas programadas.
#  Siempre muestra la lista y pide confirmacion antes de borrar.
#  Crea copia de seguridad del registro en el Escritorio.
# ============================================================
$ErrorActionPreference = 'SilentlyContinue'
$Host.UI.RawUI.WindowTitle = 'Desinstalador Total'

# --- Requiere administrador ---
$esAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $esAdmin) {
    Write-Host 'Debe ejecutarse como ADMINISTRADOR. Reiniciando con permisos...' -ForegroundColor Yellow
    Start-Process powershell -Verb RunAs -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`""
    exit
}

# Palabras que nunca se usan como criterio de busqueda (demasiado genericas)
$Genericas = @('microsoft','windows','update','program','programs','files','software','system','setup',
               'version','edition','driver','drivers','runtime','x64','x86','bit','inc','corporation',
               'corp','ltd','llc','the','for','and','tools','free','pro','app','service','common')

# Rutas que JAMAS se borran
$Protegidas = @($env:windir, $env:ProgramFiles, ${env:ProgramFiles(x86)}, $env:ProgramData,
                $env:APPDATA, $env:LOCALAPPDATA, $env:USERPROFILE, $env:SystemDrive + '\',
                "$env:ProgramFiles\Common Files", "${env:ProgramFiles(x86)}\Common Files") |
              Where-Object { $_ } | ForEach-Object { $_.TrimEnd('\').ToLower() }

function Obtener-Programas {
    $claves = 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*',
              'HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*',
              'HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*'
    Get-ItemProperty $claves | Where-Object { $_.DisplayName -and -not $_.SystemComponent } |
        Select-Object DisplayName, Publisher, InstallLocation, UninstallString, QuietUninstallString, PSPath |
        Sort-Object DisplayName -Unique
}

function Palabras-Clave($nombre, $editor) {
    $p = @()
    foreach ($t in @($nombre, $editor)) {
        if (-not $t) { continue }
        $p += ($t -replace '[\(\)\[\],\.\-_]', ' ' -split '\s+') |
              Where-Object { $_.Length -ge 4 -and $_ -notmatch '^\d' -and $Genericas -notcontains $_.ToLower() }
    }
    $p | Select-Object -Unique
}

function Es-Segura($ruta) {
    $r = $ruta.TrimEnd('\').ToLower()
    return -not ($Protegidas -contains $r)
}

function Buscar-Restos($prog, $claves) {
    $restos = New-Object System.Collections.ArrayList
    $nombre = $prog.DisplayName
    $principal = $claves | Select-Object -First 1   # palabra mas distintiva (primera del nombre)

    # --- Carpetas ---
    $bases = @($env:ProgramFiles, ${env:ProgramFiles(x86)}, $env:ProgramData, $env:APPDATA,
               $env:LOCALAPPDATA, "$env:LOCALAPPDATA\Programs", "$env:USERPROFILE\AppData\LocalLow",
               "$env:ProgramFiles\Common Files", "${env:ProgramFiles(x86)}\Common Files") | Where-Object { $_ -and (Test-Path $_) } | Select-Object -Unique
    if ($prog.InstallLocation -and (Test-Path $prog.InstallLocation) -and (Es-Segura $prog.InstallLocation)) {
        [void]$restos.Add([pscustomobject]@{Tipo='Carpeta'; Ruta=$prog.InstallLocation.TrimEnd('\')})
    }
    foreach ($b in $bases) {
        Get-ChildItem $b -Directory -Force | Where-Object {
            $_.Name -like "*$principal*" -or $_.Name -eq $nombre
        } | ForEach-Object { if (Es-Segura $_.FullName) { [void]$restos.Add([pscustomobject]@{Tipo='Carpeta'; Ruta=$_.FullName}) } }
    }

    # --- Accesos directos (Menu Inicio y Escritorios) ---
    $menus = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs", "$env:ProgramData\Microsoft\Windows\Start Menu\Programs",
             [Environment]::GetFolderPath('Desktop'), "$env:PUBLIC\Desktop"
    foreach ($m in $menus) {
        Get-ChildItem $m -Recurse -Force | Where-Object { $_.Name -like "*$principal*" } |
            ForEach-Object { [void]$restos.Add([pscustomobject]@{Tipo=$(if ($_.PSIsContainer) {'Carpeta'} else {'Acceso directo'}); Ruta=$_.FullName}) }
    }

    # --- Registro: claves de software ---
    $regBases = 'HKCU:\Software', 'HKLM:\SOFTWARE', 'HKLM:\SOFTWARE\WOW6432Node'
    foreach ($rb in $regBases) {
        Get-ChildItem $rb | ForEach-Object {
            $editor = $_
            if ($editor.PSChildName -like "*$principal*") {
                [void]$restos.Add([pscustomobject]@{Tipo='Registro'; Ruta=$editor.PSPath})
            } else {
                Get-ChildItem $editor.PSPath | Where-Object { $_.PSChildName -like "*$principal*" } |
                    ForEach-Object { [void]$restos.Add([pscustomobject]@{Tipo='Registro'; Ruta=$_.PSPath}) }
            }
        }
    }
    # Entrada de desinstalacion que haya quedado huerfana
    if ($prog.PSPath -and (Test-Path $prog.PSPath)) { [void]$restos.Add([pscustomobject]@{Tipo='Registro'; Ruta=$prog.PSPath}) }

    # --- Servicios ---
    Get-WmiObject Win32_Service | Where-Object {
        ($_.Name -like "*$principal*" -or $_.DisplayName -like "*$principal*") -and $_.PathName -notmatch '\\Windows\\'
    } | ForEach-Object { [void]$restos.Add([pscustomobject]@{Tipo='Servicio'; Ruta=$_.Name}) }

    # --- Tareas programadas ---
    schtasks /query /fo csv /nh 2>$null | ConvertFrom-Csv -Header Tarea,Proxima,Estado |
        Where-Object { $_.Tarea -like "*$principal*" -and $_.Tarea -notlike '\Microsoft\*' } |
        Select-Object -ExpandProperty Tarea -Unique |
        ForEach-Object { [void]$restos.Add([pscustomobject]@{Tipo='Tarea'; Ruta=$_}) }

    # Quitar duplicados y elementos contenidos dentro de otra carpeta/clave ya listada
    $unicos = $restos | Sort-Object Tipo, Ruta -Unique
    $unicos | Where-Object {
        $actual = $_
        -not ($unicos | Where-Object { $_.Tipo -eq $actual.Tipo -and $_.Ruta -ne $actual.Ruta -and $actual.Ruta.StartsWith($_.Ruta + '\') })
    }
}

function Borrar-Resto($r) {
    switch ($r.Tipo) {
        'Servicio' { Stop-Service $r.Ruta -Force; sc.exe delete $r.Ruta | Out-Null }
        'Tarea'    { schtasks /delete /tn $r.Ruta /f | Out-Null }
        'Registro' { Remove-Item $r.Ruta -Recurse -Force }
        default    {
            # Cerrar procesos que se ejecuten desde la carpeta
            if ($r.Tipo -eq 'Carpeta') {
                Get-Process | Where-Object { $_.Path -and $_.Path.StartsWith($r.Ruta + '\') } | Stop-Process -Force
            }
            Remove-Item -LiteralPath $r.Ruta -Recurse -Force
            if (Test-Path -LiteralPath $r.Ruta) {
                # Si esta en uso, se borra al reiniciar
                cmd /c "takeown /f `"$($r.Ruta)`" /r /d s >nul 2>&1 & icacls `"$($r.Ruta)`" /grant administradores:F /t >nul 2>&1"
                Remove-Item -LiteralPath $r.Ruta -Recurse -Force
            }
        }
    }
    switch ($r.Tipo) {
        'Servicio' { -not (Get-Service $r.Ruta) }
        'Tarea'    { $true }
        default    { -not (Test-Path -LiteralPath $r.Ruta) }
    }
}

# ======================= PROGRAMA PRINCIPAL =======================
while ($true) {
    Clear-Host
    Write-Host '============================================================' -ForegroundColor Cyan
    Write-Host '                 DESINSTALADOR  TOTAL' -ForegroundColor Cyan
    Write-Host '   Desinstala y elimina TODOS los restos de un programa' -ForegroundColor Cyan
    Write-Host '============================================================' -ForegroundColor Cyan
    $filtro = Read-Host "`nEscriba parte del nombre del programa (ENTER = ver todos, 0 = salir)"
    if ($filtro -eq '0') { break }

    $lista = @(Obtener-Programas | Where-Object { $_.DisplayName -like "*$filtro*" })
    if ($lista.Count -eq 0) {
        Write-Host "`nNo aparece en la lista de instalados (quiza ya se desinstalo)." -ForegroundColor Yellow
        if (-not $filtro -or $filtro.Length -lt 4) { Write-Host 'Escriba al menos 4 letras del nombre para buscar restos.'; pause; continue }
        $sel = [pscustomobject]@{DisplayName=$filtro; Publisher=$null; InstallLocation=$null; UninstallString=$null; PSPath=$null}
        $r = Read-Host "Desea buscar RESTOS de '$filtro' de todos modos? (S/N)"
        if ($r -notmatch '^[sS]') { continue }
    } else {
        for ($i = 0; $i -lt $lista.Count; $i++) { Write-Host ("{0,4}. {1}" -f ($i + 1), $lista[$i].DisplayName) }
        $n = Read-Host "`nNumero del programa a eliminar (0 = volver)"
        if (-not ($n -as [int]) -or [int]$n -lt 1 -or [int]$n -gt $lista.Count) { continue }
        $sel = $lista[[int]$n - 1]
    }

    $claves = @(Palabras-Clave $sel.DisplayName $null)
    if ($claves.Count -eq 0) { $claves = @($sel.DisplayName) }
    Write-Host "`nPrograma: $($sel.DisplayName)" -ForegroundColor Green
    $c = Read-Host "Palabra clave para buscar restos [$($claves[0])] (ENTER para aceptar)"
    if ($c) {
        if ($c.Length -lt 4) { Write-Host 'La palabra debe tener al menos 4 letras.' -ForegroundColor Red; pause; continue }
        $claves = @($c)
    }

    # --- Paso 1: desinstalador oficial ---
    $cmd = if ($sel.QuietUninstallString) { $sel.QuietUninstallString } else { $sel.UninstallString }
    if ($cmd) {
        Write-Host "`nPASO 1: Ejecutando el desinstalador oficial... (siga sus ventanas si aparecen)" -ForegroundColor Cyan
        if ($cmd -match 'msiexec') { $cmd = $cmd -replace '/I', '/X' }
        Start-Process cmd -ArgumentList "/c `"$cmd`"" -Wait
        Start-Sleep 3
    } else {
        Write-Host "`nPASO 1: No hay desinstalador oficial; se pasa a limpiar restos." -ForegroundColor Yellow
    }

    # --- Paso 2: buscar restos ---
    Write-Host "`nPASO 2: Buscando restos de '$($claves[0])' (puede tardar un minuto)..." -ForegroundColor Cyan
    $restos = @(Buscar-Restos $sel $claves)
    if ($restos.Count -eq 0) { Write-Host "`nNo se encontraron restos. El programa quedo eliminado por completo." -ForegroundColor Green; pause; continue }

    Write-Host "`nSe encontraron $($restos.Count) restos:`n" -ForegroundColor Yellow
    for ($i = 0; $i -lt $restos.Count; $i++) {
        Write-Host ("{0,4}. [{1}] {2}" -f ($i + 1), $restos[$i].Tipo, ($restos[$i].Ruta -replace '^Microsoft\.PowerShell\.Core\\Registry::', ''))
    }
    Write-Host "`nREVISE LA LISTA. Si algo NO pertenece al programa, escriba sus numeros para excluirlo." -ForegroundColor Yellow
    $ex = Read-Host 'Numeros a EXCLUIR separados por coma (ENTER = ninguno)'
    $excluir = @($ex -split '[,\s]+' | Where-Object { $_ -as [int] } | ForEach-Object { [int]$_ - 1 })
    $aBorrar = @(for ($i = 0; $i -lt $restos.Count; $i++) { if ($excluir -notcontains $i) { $restos[$i] } })

    $ok = Read-Host "`nBorrar DEFINITIVAMENTE $($aBorrar.Count) elementos? (escriba SI)"
    if ($ok -ne 'SI') { Write-Host 'Cancelado. No se borro nada.'; pause; continue }

    # --- Copia de seguridad del registro ---
    $respaldo = Join-Path ([Environment]::GetFolderPath('Desktop')) ("Respaldo_Registro_{0:yyyyMMdd_HHmmss}" -f (Get-Date))
    New-Item $respaldo -ItemType Directory | Out-Null
    $k = 0
    foreach ($r in $aBorrar | Where-Object Tipo -eq 'Registro') {
        $k++; $ruta = $r.Ruta -replace '^Microsoft\.PowerShell\.Core\\Registry::', '' -replace '^HKEY_LOCAL_MACHINE', 'HKLM' -replace '^HKEY_CURRENT_USER', 'HKCU'
        reg export $ruta "$respaldo\clave_$k.reg" /y | Out-Null
    }
    if ($k -gt 0) { Write-Host "Respaldo del registro guardado en: $respaldo" -ForegroundColor Gray } else { Remove-Item $respaldo }

    # --- Paso 3: borrar ---
    Write-Host "`nPASO 3: Eliminando..." -ForegroundColor Cyan
    $pendientes = 0
    foreach ($r in $aBorrar) {
        if (Borrar-Resto $r) { Write-Host "  [OK]   $($r.Ruta)" -ForegroundColor Green }
        else { Write-Host "  [EN USO - reinicie y vuelva a ejecutar] $($r.Ruta)" -ForegroundColor Red; $pendientes++ }
    }
    Write-Host "`nTerminado." -ForegroundColor Green
    if ($pendientes) { Write-Host "$pendientes elementos estaban en uso. Reinicie la PC y repita para terminar." -ForegroundColor Yellow }
    pause
}
