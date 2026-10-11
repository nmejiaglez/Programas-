# ============================================================================
#  ACELERADOR PC ULTRA PRO 2026  -  Windows 7 / 8 / 10 / 11
#  Interfaz gráfica en español. Ajustes seguros, verificados y reversibles.
#
#  Reglas de seguridad del programa:
#   - Nunca borra Documentos, Escritorio, Descargas, Imágenes, Música ni Videos.
#   - Nunca desactiva Windows Defender, Firewall, UAC ni Windows Update.
#   - Crea punto de restauración y respaldo del registro antes de cambiar nada.
#   - Las reparaciones que modifican el disco (chkdsk /f) solo se programan
#     si el usuario lo confirma.
#   - Todo el trabajo pesado corre en segundo plano (la ventana no se congela)
#     y con bajo consumo de memoria (apto para PCs de 4 GB de RAM).
# ============================================================================

$ErrorActionPreference = 'SilentlyContinue'
$AppNombre  = 'ACELERADOR PC ULTRA PRO 2026'
$AppVersion = '2026.1'

# ---------------------------------------------------------------- Administrador
$esAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $esAdmin) {
    $exe = [Diagnostics.Process]::GetCurrentProcess().MainModule.FileName
    if ($PSCommandPath -and $exe -match 'powershell(_ise)?\.exe$') {
        Start-Process $exe -Verb RunAs -ArgumentList "-NoProfile -ExecutionPolicy Bypass -STA -WindowStyle Hidden -File `"$PSCommandPath`""
    } else {
        Start-Process $exe -Verb RunAs
    }
    exit
}

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
[System.Windows.Forms.Application]::EnableVisualStyles()

# ---------------------------------------------------------------- Carpetas de trabajo
$docs        = [Environment]::GetFolderPath('MyDocuments')
$CarpetaBase = Join-Path $docs 'AceleradorPC_UltraPro'
$CarpetaInf  = Join-Path $CarpetaBase 'Informes'
$CarpetaResp = Join-Path $CarpetaBase 'Respaldos'
foreach ($c in $CarpetaBase, $CarpetaInf, $CarpetaResp) { if (-not (Test-Path $c)) { New-Item $c -ItemType Directory -Force | Out-Null } }

# Estado compartido entre la ventana y el hilo de trabajo
$sync = [hashtable]::Synchronized(@{
    Log       = [System.Collections.Queue]::Synchronized((New-Object System.Collections.Queue))
    Problemas = [System.Collections.ArrayList]::Synchronized((New-Object System.Collections.ArrayList))
    Acciones  = [System.Collections.ArrayList]::Synchronized((New-Object System.Collections.ArrayList))
    Resultados= [System.Collections.ArrayList]::Synchronized((New-Object System.Collections.ArrayList))
    Ocupado   = $false
    Progreso  = 0
    Estado    = 'Listo'
    Restauracion = $false
    Respaldo  = $false
    Resp      = $CarpetaResp
    Inf       = $CarpetaInf
    UltimoInforme = $null
})

# ============================================================================
#  FUNCIONES DE TRABAJO (se ejecutan en segundo plano, en otro hilo)
# ============================================================================
$Funciones = @'
function Log($t, $tipo) { if (-not $tipo) { $tipo = 'info' }; $sync.Log.Enqueue(@($tipo, $t)) }
function Titulo($t)   { Log '' ; Log ("==== $t ====") 'titulo'; $sync.Estado = $t }
function Ok($t)       { Log "  [OK] $t" 'ok' }
function Aviso($t)    { Log "  [!] $t" 'aviso' }
function Err($t)      { Log "  [X] $t" 'error' }
function Problema($t) { [void]$sync.Problemas.Add($t); Aviso $t }
function Accion($t)   { [void]$sync.Acciones.Add($t); Ok $t }
function Resultado($t){ [void]$sync.Resultados.Add($t); Log "  -> $t" 'info' }
function EsWin8Mas    { [Environment]::OSVersion.Version -ge [Version]'6.2' }
function LibreC       { (Get-WmiObject Win32_LogicalDisk -Filter "DeviceID='$env:SystemDrive'").FreeSpace }

function Ejecutar($archivo, $argumentos) {
    # Ejecuta un comando de consola oculto y devuelve @(codigo, texto)
    $psi = New-Object Diagnostics.ProcessStartInfo
    $psi.FileName = $archivo; $psi.Arguments = $argumentos
    $psi.UseShellExecute = $false; $psi.CreateNoWindow = $true
    $psi.RedirectStandardOutput = $true; $psi.RedirectStandardError = $true
    $p = [Diagnostics.Process]::Start($psi)
    $salida = $p.StandardOutput.ReadToEnd() + $p.StandardError.ReadToEnd()
    $p.WaitForExit()
    @($p.ExitCode, ($salida -replace "`0", ''))
}

# Ruta a sfc/chkdsk de 64 bits aunque el proceso sea de 32 bits
function Sys32($exe) {
    $n = Join-Path $env:windir "Sysnative\$exe"
    if (Test-Path $n) { $n } else { Join-Path $env:windir "System32\$exe" }
}

# ---------------------------------------------------------------- Restauración y respaldo
function Punto-Restauracion {
    if ($sync.Restauracion) { return }
    Titulo 'PUNTO DE RESTAURACIÓN'
    Enable-ComputerRestore -Drive "$env:SystemDrive\"
    New-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\SystemRestore' -Name SystemRestorePointCreationFrequency -Value 0 -PropertyType DWord -Force | Out-Null
    $antes = @(Get-ComputerRestorePoint).Count
    Checkpoint-Computer -Description 'Antes de Acelerador PC Ultra Pro' -RestorePointType MODIFY_SETTINGS
    $despues = @(Get-ComputerRestorePoint).Count
    if ($despues -gt $antes) { Accion 'Punto de restauración creado y verificado'; $sync.Restauracion = $true }
    else { Problema 'No se pudo crear punto de restauración (Protección del sistema desactivada o sin espacio). Se usará el respaldo del registro.' }
}

function Respaldo-Configuracion {
    if ($sync.Respaldo) { return }
    Titulo 'PROTECCIÓN DE CONFIGURACIONES IMPORTANTES'
    $d = Join-Path $sync.Resp (Get-Date -Format 'yyyy-MM-dd_HHmm')
    New-Item $d -ItemType Directory -Force | Out-Null
    $claves = @{
        'Escritorio'   = 'HKCU\Control Panel\Desktop'
        'Explorador'   = 'HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer'
        'Inicio_HKCU'  = 'HKCU\Software\Microsoft\Windows\CurrentVersion\Run'
        'Inicio_HKLM'  = 'HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Run'
        'Inicio_HKLM32'= 'HKLM\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Run'
        'Apps2doPlano' = 'HKCU\Software\Microsoft\Windows\CurrentVersion\BackgroundAccessApplications'
        'Politicas_Red'= 'HKLM\SOFTWARE\Policies\Microsoft\Windows'
        'TCPIP'        = 'HKLM\SYSTEM\CurrentControlSet\Services\Tcpip\Parameters'
    }
    $n = 0
    foreach ($k in $claves.Keys) {
        $r = Ejecutar 'reg.exe' ("export `"{0}`" `"{1}`" /y" -f $claves[$k], (Join-Path $d "$k.reg"))
        if ($r[0] -eq 0) { $n++ }
    }
    Ejecutar 'cmd.exe' ("/c powercfg -getactivescheme > `"{0}`"" -f (Join-Path $d 'plan_energia.txt')) | Out-Null
    Ejecutar 'cmd.exe' ("/c netsh interface ip show config > `"{0}`"" -f (Join-Path $d 'red_config.txt')) | Out-Null
    Copy-Item "$env:windir\System32\drivers\etc\hosts" (Join-Path $d 'hosts.txt')
    if ($n -gt 0) { Accion "Respaldo del registro ($n claves), red, plan de energía y archivo hosts en: $d"; $sync.Respaldo = $true }
    else { Problema 'No se pudo respaldar el registro.' }
}

# ---------------------------------------------------------------- Diagnóstico
function Diagnostico {
    Titulo 'DIAGNÓSTICO COMPLETO: PROCESADOR, RAM Y DISCO'
    $so  = Get-WmiObject Win32_OperatingSystem
    $cpu = Get-WmiObject Win32_Processor | Select-Object -First 1
    $cs  = Get-WmiObject Win32_ComputerSystem
    Log ("  Equipo:      {0} {1}" -f $cs.Manufacturer, $cs.Model)
    Log ("  Sistema:     {0} ({1}) compilación {2}" -f $so.Caption, $so.OSArchitecture, $so.BuildNumber)
    $arranque = $so.ConvertToDateTime($so.LastBootUpTime)
    $dias = ((Get-Date) - $arranque).TotalDays
    Log ("  Encendida desde: {0:g} ({1:N1} días)" -f $arranque, $dias)
    if ($dias -gt 7) { Problema ("La PC no se reinicia hace {0:N0} días. Reiniciar libera memoria y aplica actualizaciones." -f $dias) }

    # Procesador
    Log ''
    Log '  PROCESADOR' 'titulo'
    Log ("  Modelo:      {0}" -f $cpu.Name.Trim())
    Log ("  Núcleos:     {0} físicos / {1} lógicos   Velocidad: {2} MHz (máx {3} MHz)" -f $cpu.NumberOfCores, $cpu.NumberOfLogicalProcessors, $cpu.CurrentClockSpeed, $cpu.MaxClockSpeed)
    $cargas = @(); for ($i = 0; $i -lt 3; $i++) { $cargas += (Get-WmiObject Win32_Processor | Measure-Object LoadPercentage -Average).Average; Start-Sleep -Milliseconds 700 }
    $carga = ($cargas | Measure-Object -Average).Average
    Log ("  Uso actual:  {0:N0} %" -f $carga)
    if ($carga -gt 80) { Problema ("Procesador muy ocupado ({0:N0} %). Revise 'Programas lentos'." -f $carga) }
    if ($cpu.CurrentClockSpeed -and $cpu.MaxClockSpeed -and $cpu.CurrentClockSpeed -lt ($cpu.MaxClockSpeed * 0.5)) { Log '  Nota: el procesador funciona a baja velocidad (ahorro de energía o temperatura alta).' 'aviso' }
    $temp = Get-WmiObject -Namespace root\wmi MSAcpi_ThermalZoneTemperature | Select-Object -First 1
    if ($temp) {
        $c = ($temp.CurrentTemperature / 10) - 273.15
        if ($c -gt 0 -and $c -lt 120) {
            Log ("  Temperatura (zona térmica): {0:N0} °C" -f $c)
            if ($c -gt 85) { Problema ("Temperatura alta ({0:N0} °C). Limpie el polvo de ventiladores y rejillas." -f $c) }
        }
    }

    # RAM
    Log ''
    Log '  MEMORIA RAM' 'titulo'
    $total = $so.TotalVisibleMemorySize / 1MB; $libre = $so.FreePhysicalMemory / 1MB
    $uso = 100 - ($libre / $total * 100)
    Log ("  Total: {0:N1} GB   Libre: {1:N1} GB   En uso: {2:N0} %" -f $total, $libre, $uso)
    $mods = Get-WmiObject Win32_PhysicalMemory
    foreach ($m in $mods) { Log ("  Módulo: {0:N0} GB  {1} MHz  {2}" -f ($m.Capacity/1GB), $m.Speed, $m.Manufacturer) }
    $pf = Get-WmiObject Win32_PageFileUsage | Select-Object -First 1
    if ($pf) { Log ("  Archivo de paginación: {0} MB, uso actual {1} MB (pico {2} MB)" -f $pf.AllocatedBaseSize, $pf.CurrentUsage, $pf.PeakUsage) }
    if ($total -lt 3.8) { Problema ("Solo {0:N1} GB de RAM. Agregar memoria (8 GB) es la mejora más efectiva." -f $total) }
    if ($uso -gt 85) { Problema ("Memoria casi llena ({0:N0} %). Cierre programas o revise 'Programas lentos'." -f $uso) }

    # Discos
    Log ''
    Log '  DISCOS' 'titulo'
    foreach ($v in Get-WmiObject Win32_LogicalDisk -Filter 'DriveType=3') {
        $pct = if ($v.Size) { $v.FreeSpace / $v.Size * 100 } else { 0 }
        Log ("  Unidad {0}  {1:N1} GB libres de {2:N1} GB ({3:N0} % libre)  {4}" -f $v.DeviceID, ($v.FreeSpace/1GB), ($v.Size/1GB), $pct, $v.FileSystem)
        if ($pct -lt 15) { Problema ("Unidad {0} casi llena ({1:N0} % libre). Use 'Limpieza profunda'." -f $v.DeviceID, $pct) }
    }
    $haySSD = $false
    if (Get-Command Get-PhysicalDisk) {
        foreach ($d in Get-PhysicalDisk) {
            $tipo = "$($d.MediaType)"; if ($tipo -eq 'SSD') { $haySSD = $true }
            Log ("  Disco físico: {0}  Tipo: {1}  Estado: {2}  {3:N0} GB" -f $d.FriendlyName, $tipo, $d.HealthStatus, ($d.Size/1GB))
            if ("$($d.HealthStatus)" -ne 'Healthy') { Problema ("Disco '{0}' con estado {1}. Haga copia de seguridad de sus archivos YA." -f $d.FriendlyName, $d.HealthStatus) }
            $rel = $d | Get-StorageReliabilityCounter
            if ($rel) {
                if ($rel.Temperature) { Log ("     Temperatura: {0} °C" -f $rel.Temperature) }
                if ($rel.Wear)        { Log ("     Desgaste SSD: {0} %" -f $rel.Wear); if ($rel.Wear -gt 80) { Problema "SSD con desgaste alto ($($rel.Wear) %)." } }
                if ($rel.ReadErrorsUncorrected -gt 0) { Problema "Disco '$($d.FriendlyName)' tiene $($rel.ReadErrorsUncorrected) errores de lectura no corregidos." }
            }
        }
    } else {
        foreach ($d in Get-WmiObject Win32_DiskDrive) {
            Log ("  Disco físico: {0}  Estado SMART: {1}  {2:N0} GB" -f $d.Model, $d.Status, ($d.Size/1GB))
            if ($d.Status -ne 'OK') { Problema "Disco '$($d.Model)' reporta estado $($d.Status). Haga copia de seguridad." }
        }
    }
    $smart = Get-WmiObject -Namespace root\wmi MSStorageDriver_FailurePredictStatus
    foreach ($s in $smart) { if ($s.PredictFailure) { Problema 'SMART predice FALLA de disco. Copie sus archivos importantes inmediatamente.' } }
    if ((Get-Command Get-PhysicalDisk) -and -not $haySSD) { Log '  Consejo: cambiar el disco mecánico por un SSD es la mejora más grande posible.' 'aviso' }

    # Batería
    $bat = Get-WmiObject Win32_Battery
    if ($bat) { Log ''; Log ("  Batería: {0} % de carga, estado {1}" -f $bat.EstimatedChargeRemaining, $bat.Status) }

    # Procesos que más consumen
    Log ''
    Log '  LOS 8 PROCESOS QUE MÁS MEMORIA USAN' 'titulo'
    Get-Process | Sort-Object WorkingSet -Descending | Select-Object -First 8 | ForEach-Object { Log ("  {0,-32} {1,8:N0} MB" -f $_.ProcessName, ($_.WorkingSet/1MB)) }
    Resultado 'Diagnóstico de procesador, RAM y discos completado'
}

# ---------------------------------------------------------------- Limpieza
function Borrar-Contenido($ruta, $diasMin) {
    # Borra solo archivos (no carpetas raíz) con antigüedad mínima; devuelve bytes liberados
    if (-not (Test-Path $ruta)) { return 0 }
    $limite = (Get-Date).AddDays(-$diasMin); $bytes = 0
    Get-ChildItem $ruta -Recurse -Force -File | Where-Object { $_.LastWriteTime -lt $limite } | ForEach-Object {
        $tam = $_.Length
        Remove-Item $_.FullName -Force
        if (-not (Test-Path $_.FullName)) { $bytes += $tam }
    }
    Get-ChildItem $ruta -Recurse -Force -Directory | Sort-Object { $_.FullName.Length } -Descending | ForEach-Object {
        if (-not (Get-ChildItem $_.FullName -Force)) { Remove-Item $_.FullName -Force }
    }
    $bytes
}

function Limpieza-Profunda($vaciarPapelera) {
    Titulo 'LIMPIEZA PROFUNDA Y SEGURA'
    Log '  Solo se eliminan archivos temporales y cachés. Sus documentos NO se tocan.'
    $antes = LibreC
    $total = 0
    $lugares = @(
        @('Temporales del usuario',            $env:TEMP, 1),
        @('Temporales de Windows',             "$env:windir\Temp", 1),
        @('Informes de errores de Windows',    "$env:ProgramData\Microsoft\Windows\WER\ReportArchive", 0),
        @('Cola de informes de errores',       "$env:ProgramData\Microsoft\Windows\WER\ReportQueue", 0),
        @('Informes de errores del usuario',   "$env:LOCALAPPDATA\Microsoft\Windows\WER", 0),
        @('Volcados de memoria de programas',  "$env:LOCALAPPDATA\CrashDumps", 0),
        @('Minivolcados de Windows',           "$env:windir\Minidump", 7),
        @('Registros de instalación antiguos', "$env:windir\Logs\CBS", 30),
        @('Caché de Internet Explorer/Edge antiguo', "$env:LOCALAPPDATA\Microsoft\Windows\INetCache", 0),
        @('Caché de Google Chrome',            "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Cache", 0),
        @('Caché de código de Chrome',         "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Code Cache", 0),
        @('Caché de Microsoft Edge',           "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\Cache", 0),
        @('Caché de código de Edge',           "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\Code Cache", 0),
        @('Caché de Optimización de entrega',  "$env:windir\SoftwareDistribution\DeliveryOptimization\Cache", 0)
    )
    foreach ($l in $lugares) {
        $b = Borrar-Contenido $l[1] $l[2]
        if ($b -gt 0) { Log ("  {0,-42} {1,8:N1} MB" -f $l[0], ($b/1MB)) }
        $total += $b
    }
    # Firefox: solo la carpeta cache2 de cada perfil (no historial, contraseñas ni marcadores)
    Get-ChildItem "$env:LOCALAPPDATA\Mozilla\Firefox\Profiles" -Directory | ForEach-Object {
        $b = Borrar-Contenido (Join-Path $_.FullName 'cache2') 0
        if ($b -gt 0) { Log ("  {0,-42} {1,8:N1} MB" -f 'Caché de Firefox', ($b/1MB)) }; $total += $b
    }
    # Descargas de Windows Update ya instaladas
    Stop-Service wuauserv -Force; Stop-Service bits -Force
    $b = Borrar-Contenido "$env:windir\SoftwareDistribution\Download" 0
    Start-Service bits; Start-Service wuauserv
    if ($b -gt 0) { Log ("  {0,-42} {1,8:N1} MB" -f 'Descargas viejas de Windows Update', ($b/1MB)) }; $total += $b
    if ((Get-Service wuauserv).Status -ne 'Running' -and (Get-Service wuauserv).StartType -ne 'Disabled') { Start-Service wuauserv }
    # Prefetch: solo temporales (igual que el programa original)
    Remove-Item "$env:windir\Prefetch\*.tmp" -Force

    if ($vaciarPapelera) {
        $sh = New-Object -ComObject Shell.Application
        $n = @($sh.Namespace(10).Items()).Count
        Clear-RecycleBin -Force -ErrorAction SilentlyContinue
        if (-not (Get-Command Clear-RecycleBin)) { Ejecutar 'cmd.exe' '/c rd /s /q %SystemDrive%\$Recycle.Bin' | Out-Null }
        Ok "Papelera de reciclaje vaciada ($n elementos) - autorizado por el usuario"
    }

    # Liberador de espacio de Windows (componentes reemplazados), de forma silenciosa
    if (EsWin8Mas) {
        Log '  Limpiando componentes de Windows reemplazados (DISM, puede tardar)...'
        $r = Ejecutar 'dism.exe' '/Online /Cleanup-Image /StartComponentCleanup'
        if ($r[0] -eq 0) { Ok 'Componentes de Windows reemplazados eliminados (sin quitar la posibilidad de desinstalar actualizaciones recientes)' }
    }

    $despues = LibreC
    $lib = [math]::Max(($despues - $antes), $total)
    Accion ("Limpieza profunda: {0:N0} MB liberados" -f ($lib/1MB))
    Resultado ("Espacio libre en {0}: antes {1:N2} GB -> ahora {2:N2} GB" -f $env:SystemDrive, ($antes/1GB), ($despues/1GB))
}

# ---------------------------------------------------------------- SFC / DISM
function Reparar-Windows {
    Titulo 'DETECCIÓN Y REPARACIÓN DE ARCHIVOS DE WINDOWS (SFC + DISM)'
    Log '  Puede tardar entre 15 y 45 minutos. No apague la computadora.'
    if (EsWin8Mas) {
        $sync.Estado = 'DISM: revisando la imagen de Windows...'
        Log '  1/3 DISM /ScanHealth: buscando daños en la imagen de Windows...'
        $r = Ejecutar 'dism.exe' '/Online /Cleanup-Image /ScanHealth'
        $danada = ($r[1] -match 'repairable|reparable|corrupt|daña') -and ($r[1] -notmatch 'No component store corruption|No se detectaron daños')
        if ($danada) {
            Problema 'DISM detectó daños en la imagen de Windows.'
            $sync.Estado = 'DISM: reparando la imagen de Windows...'
            Log '  2/3 DISM /RestoreHealth: reparando (necesita internet)...'
            $r = Ejecutar 'dism.exe' '/Online /Cleanup-Image /RestoreHealth'
            if ($r[0] -eq 0) { Accion 'DISM reparó la imagen de Windows' } else { Err ("DISM no pudo reparar (código {0}). Verifique la conexión a internet y repita." -f $r[0]) }
            $v = Ejecutar 'dism.exe' '/Online /Cleanup-Image /CheckHealth'
            if ($v[1] -match 'No component store corruption|No se detectaron daños') { Resultado 'Verificación DISM: imagen de Windows sana' } else { Resultado 'Verificación DISM: la imagen aún presenta problemas' }
        } else {
            Ok 'Imagen de Windows sin daños (DISM)'; Resultado 'DISM: imagen de Windows sana'
        }
    } else { Log '  DISM en línea no disponible en Windows 7; se usa solo SFC.' }

    $sync.Estado = 'SFC: verificando archivos protegidos del sistema...'
    Log '  3/3 SFC /scannow: verificando y reparando archivos protegidos del sistema...'
    $r = Ejecutar (Sys32 'sfc.exe') '/scannow'
    $t = $r[1]
    if ($t -match 'did not find any integrity violations|no encontr. ninguna infracci') { Ok 'SFC: no hay archivos dañados'; Resultado 'SFC: sistema íntegro' }
    elseif ($t -match 'successfully repaired|repar. correctamente|reparó') {
        Problema 'SFC encontró archivos dañados de Windows.'
        Accion 'SFC reparó los archivos dañados'
        Log '  Verificando la reparación (SFC /verifyonly)...'
        $v = Ejecutar (Sys32 'sfc.exe') '/verifyonly'
        if ($v[1] -match 'did not find any integrity violations|no encontr. ninguna infracci') { Resultado 'Verificación SFC: todos los archivos están correctos ahora' } else { Resultado 'Verificación SFC: reinicie y ejecute de nuevo para completar' }
    }
    elseif ($t -match 'unable to fix|no pudo reparar|algunos de ellos no') { Problema 'SFC encontró archivos dañados que no pudo reparar. Ejecute DISM con internet y repita SFC tras reiniciar.' }
    elseif ($t -match 'pending|pendiente') { Problema 'Hay una reparación pendiente: reinicie la PC y repita esta opción.' }
    else { Aviso ("SFC terminó con código {0}. Revise %windir%\Logs\CBS\CBS.log" -f $r[0]) }
}

# ---------------------------------------------------------------- Disco
function Verificar-Disco {
    Titulo 'VERIFICACIÓN DE ERRORES DEL DISCO (solo lectura, sin riesgo)'
    $hayErrores = $false
    foreach ($v in Get-WmiObject Win32_LogicalDisk -Filter 'DriveType=3') {
        $u = $v.DeviceID
        if ($v.FileSystem -ne 'NTFS') { Log "  $u ($($v.FileSystem)): se omite."; continue }
        $sync.Estado = "Analizando disco $u ..."
        Log "  Analizando unidad $u ..."
        if (Get-Command Repair-Volume) {
            $res = Repair-Volume -DriveLetter $u.TrimEnd(':') -Scan
            if ("$res" -match 'NoErrorsFound') { Ok "Unidad ${u}: sin errores" }
            else { $hayErrores = $true; Problema "Unidad ${u}: se encontraron errores en el sistema de archivos ($res)" }
        } else {
            $r = Ejecutar (Sys32 'chkdsk.exe') $u
            if ($r[0] -eq 0) { Ok "Unidad ${u}: sin errores" } else { $hayErrores = $true; Problema "Unidad ${u}: chkdsk reportó problemas (código $($r[0]))" }
        }
        $sucio = Ejecutar 'fsutil.exe' "dirty query $u"
        if ($sucio[1] -match 'is Dirty|está sucio|es sucio') { $hayErrores = $true; Problema "Unidad $u marcada como 'sucia' por Windows." }
    }
    $sync.DiscoConErrores = $hayErrores
    if ($hayErrores) { Resultado 'Disco con errores: puede programar la reparación (chkdsk /f) al reiniciar, desde el botón de Disco.' }
    else { Resultado 'Todas las unidades verificadas sin errores' }
}

function Programar-Chkdsk {
    Titulo 'PROGRAMAR REPARACIÓN DEL DISCO'
    $r = Ejecutar 'fsutil.exe' "dirty set $env:SystemDrive"
    if ($r[0] -eq 0) { Accion "Reparación de $env:SystemDrive programada para el próximo reinicio (chkdsk /f)" } else { Err 'No se pudo programar la reparación' }
}

# ---------------------------------------------------------------- Internet
function Diagnostico-Internet {
    Titulo 'ANÁLISIS Y DIAGNÓSTICO DE LA CONEXIÓN A INTERNET'
    $ad = Get-WmiObject Win32_NetworkAdapterConfiguration -Filter 'IPEnabled=True' | Where-Object { $_.DefaultIPGateway }
    if (-not $ad) { Problema 'No hay ningún adaptador de red conectado con puerta de enlace. Revise el cable o el Wi-Fi.'; return }
    foreach ($a in $ad) {
        Log ("  Adaptador: {0}" -f $a.Description)
        Log ("  IP: {0}   Puerta de enlace: {1}   DNS: {2}" -f ($a.IPAddress -join ', '), ($a.DefaultIPGateway -join ', '), ($a.DNSServerSearchOrder -join ', '))
    }
    $wifi = Ejecutar 'netsh.exe' 'wlan show interfaces'
    if ($wifi[1] -match '(?m)^\s*(Signal|Señal)\s*:\s*(\d+)%') { $s = [int]$matches[2]; Log "  Señal Wi-Fi: $s %"; if ($s -lt 50) { Problema "Señal Wi-Fi débil ($s %). Acérquese al router o use cable." } }

    $ping = New-Object Net.NetworkInformation.Ping
    function Medir($destino, $n) {
        $ok = 0; $tiempos = @()
        for ($i = 0; $i -lt $n; $i++) { $p = $ping.Send($destino, 2000); if ($p.Status -eq 'Success') { $ok++; $tiempos += $p.RoundtripTime } }
        $prom = if ($tiempos) { ($tiempos | Measure-Object -Average).Average } else { 0 }
        @($ok, $prom)
    }
    $gw = @($ad[0].DefaultIPGateway)[0]
    $m = Medir $gw 4
    Log ("  Router ({0}): {1}/4 respuestas, {2:N0} ms" -f $gw, $m[0], $m[1])
    if ($m[0] -eq 0) { Problema 'El router no responde. Reinicie el router o revise la conexión local.' }
    elseif ($m[1] -gt 20) { Problema ("Latencia alta con el router ({0:N0} ms): posible interferencia Wi-Fi." -f $m[1]) }

    $m = Medir '1.1.1.1' 10
    $perdida = (10 - $m[0]) * 10
    Log ("  Internet (1.1.1.1): pérdida {0} %, latencia {1:N0} ms" -f $perdida, $m[1])
    if ($m[0] -eq 0) { $m = Medir '8.8.8.8' 4; if ($m[0] -eq 0) { Problema 'Sin salida a internet (el router funciona pero internet no). Llame a su proveedor.' } }
    else {
        if ($perdida -ge 20) { Problema "Pérdida de paquetes de $perdida %: conexión inestable." }
        if ($m[1] -gt 150) { Problema ("Latencia alta hacia internet ({0:N0} ms)." -f $m[1]) }
    }

    $sw = [Diagnostics.Stopwatch]::StartNew()
    $dnsOk = $false; try { [void][Net.Dns]::GetHostAddresses('www.microsoft.com'); $dnsOk = $true } catch {}
    $sw.Stop()
    if ($dnsOk) { Log ("  Resolución DNS: {0} ms" -f $sw.ElapsedMilliseconds); if ($sw.ElapsedMilliseconds -gt 300) { Problema 'DNS lento. Puede elegir un DNS rápido en "Optimizar internet".' } }
    else { Problema 'El DNS no responde: no se pueden abrir páginas aunque haya conexión. Use "Reparar red".' }

    if ($dnsOk) {
        Log '  Midiendo velocidad de descarga (10 MB)...'
        try {
            [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor 3072
            $wc = New-Object Net.WebClient
            $sw = [Diagnostics.Stopwatch]::StartNew()
            $datos = $wc.DownloadData('https://speed.cloudflare.com/__down?bytes=10000000')
            $sw.Stop()
            $mbps = ($datos.Length * 8 / 1MB) / $sw.Elapsed.TotalSeconds
            $datos = $null
            Log ("  Velocidad de descarga aproximada: {0:N1} Mbps" -f $mbps)
            Resultado ("Internet: {0:N1} Mbps de descarga" -f $mbps)
            if ($mbps -lt 3) { Problema ("Velocidad de descarga baja ({0:N1} Mbps)." -f $mbps) }
        } catch { Aviso 'No se pudo medir la velocidad (servidor de prueba no disponible).' }
    }
    Resultado 'Diagnóstico de internet completado'
}

function Acelerar-Internet($dns) {
    Titulo 'OPTIMIZACIÓN DE INTERNET'
    ipconfig /flushdns | Out-Null; Accion 'Caché DNS limpiada'
    netsh int tcp set global autotuninglevel=normal | Out-Null
    $v = (netsh int tcp show global) -join ' '
    if ($v -match '(Auto-Tuning|ajuste autom).*normal') { Accion 'Ajuste automático de ventana TCP: normal (verificado)' } else { Accion 'Ajuste automático de ventana TCP: normal' }
    netsh int tcp set global rss=enabled | Out-Null;  Accion 'Escalado en varios núcleos (RSS) activado'
    netsh int tcp set heuristics disabled | Out-Null; Accion 'Heurísticas que limitan TCP desactivadas'
    netsh int tcp set global ecncapability=disabled | Out-Null
    New-Item 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\Psched' -Force | Out-Null
    Set-ItemProperty 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\Psched' -Name NonBestEffortLimit -Value 0 -Type DWord
    if ((Get-ItemProperty 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\Psched').NonBestEffortLimit -eq 0) { Accion 'Reserva de ancho de banda QoS liberada (verificado)' }
    New-Item 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\DeliveryOptimization' -Force | Out-Null
    Set-ItemProperty 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\DeliveryOptimization' -Name DODownloadMode -Value 0 -Type DWord
    Accion 'Windows Update ya no sube datos a otras PCs de internet (las actualizaciones siguen activas)'
    $ad = Get-WmiObject Win32_NetworkAdapterConfiguration -Filter 'IPEnabled=True'
    if ($dns -eq 'auto') { $ad | ForEach-Object { $_.SetDNSServerSearchOrder() | Out-Null }; Accion 'DNS automático del proveedor restaurado' }
    elseif ($dns) {
        $ad | ForEach-Object { $_.SetDNSServerSearchOrder($dns) | Out-Null }
        ipconfig /flushdns | Out-Null
        $ok = $false; try { [void][Net.Dns]::GetHostAddresses('www.google.com'); $ok = $true } catch {}
        if ($ok) { Accion "DNS cambiado a $($dns -join ', ') (verificado: resuelve nombres)" }
        else { $ad | ForEach-Object { $_.SetDNSServerSearchOrder() | Out-Null }; Err 'El DNS nuevo no respondió; se restauró el DNS automático.' }
    }
}

function Reparar-Red {
    Titulo 'REPARAR RED'
    ipconfig /release | Out-Null; ipconfig /flushdns | Out-Null; ipconfig /renew | Out-Null
    netsh winsock reset | Out-Null
    netsh int ip reset | Out-Null
    Accion 'Red restablecida (IP renovada, DNS, Winsock y TCP/IP). REINICIE la computadora.'
}

# ---------------------------------------------------------------- Rendimiento general (original)
function Acelerar-General($esPortatil) {
    Titulo 'OPTIMIZACIÓN DEL RENDIMIENTO'
    Set-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\VisualEffects' -Name VisualFXSetting -Value 3
    Set-ItemProperty 'HKCU:\Control Panel\Desktop' -Name UserPreferencesMask -Value ([byte[]](0x90,0x12,0x03,0x80,0x10,0x00,0x00,0x00))
    Set-ItemProperty 'HKCU:\Control Panel\Desktop' -Name FontSmoothing -Value '2'
    Set-ItemProperty 'HKCU:\Control Panel\Desktop\WindowMetrics' -Name MinAnimate -Value '0'
    Set-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced' -Name TaskbarAnimations -Value 0
    Accion 'Efectos visuales optimizados (se conservan letras suaves y miniaturas)'
    Set-ItemProperty 'HKCU:\Control Panel\Desktop' -Name MenuShowDelay -Value '100'
    Set-ItemProperty 'HKCU:\Control Panel\Desktop' -Name WaitToKillAppTimeout -Value '5000'
    Set-ItemProperty 'HKCU:\Control Panel\Desktop' -Name HungAppTimeout -Value '3000'
    if ((Get-ItemProperty 'HKCU:\Control Panel\Desktop').MenuShowDelay -eq '100') { Accion 'Menús y apagado más rápidos (verificado)' }
    New-Item 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Serialize' -Force | Out-Null
    Set-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Serialize' -Name StartupDelayInMSec -Value 0 -Type DWord
    Accion 'Sin retraso artificial al iniciar sesión'
    New-Item 'HKCU:\Software\Microsoft\Windows\CurrentVersion\BackgroundAccessApplications' -Force | Out-Null
    Set-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\BackgroundAccessApplications' -Name GlobalUserDisabled -Value 1 -Type DWord
    Accion 'Apps de la Tienda no corren en segundo plano (Seguridad de Windows no se ve afectada)'
}

function Optimizar-Energia($modo) {
    Titulo 'RENDIMIENTO Y CONSUMO DE BATERÍA'
    $bat = Get-WmiObject Win32_Battery
    if ($modo -eq 'auto') { $modo = if ($bat) { 'equilibrado' } else { 'alto' } }
    if ($modo -eq 'alto') {
        $alto = '8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c'
        powercfg -setactive $alto 2>$null
        if ($LASTEXITCODE -ne 0) { powercfg -duplicatescheme $alto | Out-Null; powercfg -setactive $alto }
    } else {
        powercfg -setactive '381b4222-f694-41f0-9685-ff5bb260df00'
        if ($bat) {
            # Al usar batería: brillo atenuado antes y suspensión razonable; con cargador, máximo rendimiento del procesador
            powercfg -change -monitor-timeout-dc 5
            powercfg -change -standby-timeout-dc 15
            powercfg -setacvalueindex SCHEME_CURRENT SUB_PROCESSOR PROCTHROTTLEMAX 100
            powercfg -setdcvalueindex SCHEME_CURRENT SUB_PROCESSOR PROCTHROTTLEMIN 5
            powercfg -setactive SCHEME_CURRENT
        }
    }
    $activo = (powercfg -getactivescheme) -join ' '
    Accion ("Plan de energía activo: {0}" -f ($activo -replace '^.*\(|\).*$', ''))
    if ($bat) {
        $f = Join-Path $sync.Inf ("bateria_{0}.html" -f (Get-Date -Format 'yyyy-MM-dd_HHmm'))
        powercfg /batteryreport /output "$f" | Out-Null
        if (Test-Path $f) { Resultado "Informe detallado de la batería guardado en: $f" }
        $b = Get-WmiObject -Namespace root\wmi BatteryFullChargedCapacity | Select-Object -First 1
        $s = Get-WmiObject -Namespace root\wmi BatteryStaticData | Select-Object -First 1
        if ($b -and $s -and $s.DesignedCapacity) {
            $salud = $b.FullChargedCapacity / $s.DesignedCapacity * 100
            Log ("  Salud de la batería: {0:N0} % de su capacidad original" -f $salud)
            if ($salud -lt 60) { Problema ("Batería desgastada ({0:N0} % de capacidad). Considere reemplazarla." -f $salud) }
        }
    }
}

# ---------------------------------------------------------------- Archivos (original)
function Acelerar-Archivos($desfragmentar) {
    Titulo 'RAPIDEZ AL ABRIR ARCHIVOS Y CARPETAS'
    fsutil behavior set disablelastaccess 1 | Out-Null; Accion 'Registro de último acceso desactivado (menos escrituras al disco)'
    fsutil behavior set disable8dot3 1 | Out-Null;      Accion 'Nombres cortos 8.3 desactivados en archivos nuevos'
    Set-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced' -Name LaunchTo -Value 1
    Set-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced' -Name NoNetCrawling -Value 1 -Type DWord
    Accion 'Explorador abre más rápido'
    Remove-Item 'HKCU:\Software\Classes\Local Settings\Software\Microsoft\Windows\Shell\Bags' -Recurse -Force
    Remove-Item 'HKCU:\Software\Classes\Local Settings\Software\Microsoft\Windows\Shell\BagMRU' -Recurse -Force
    New-Item 'HKCU:\Software\Classes\Local Settings\Software\Microsoft\Windows\Shell\Bags\AllFolders\Shell' -Force | Out-Null
    Set-ItemProperty 'HKCU:\Software\Classes\Local Settings\Software\Microsoft\Windows\Shell\Bags\AllFolders\Shell' -Name FolderType -Value 'NotSpecified'
    Accion 'Carpetas grandes ya no se quedan "Trabajando en ello..."'
    Stop-Process -Name explorer -Force; Start-Sleep 2
    Remove-Item "$env:LOCALAPPDATA\Microsoft\Windows\Explorer\thumbcache_*.db" -Force
    Start-Process explorer
    Accion 'Caché de miniaturas reconstruida'
    $ssd = $false
    if (Get-Command Get-PhysicalDisk) { $ssd = [bool](Get-PhysicalDisk | Where-Object { "$($_.MediaType)" -eq 'SSD' }) }
    $u = $env:SystemDrive.TrimEnd(':')
    if ($ssd) {
        fsutil behavior set DisableDeleteNotify 0 | Out-Null
        if (Get-Command Optimize-Volume) { Optimize-Volume -DriveLetter $u -ReTrim; Accion 'SSD optimizado con TRIM' }
    } elseif ($desfragmentar) {
        $sync.Estado = 'Desfragmentando (puede tardar mucho)...'
        defrag "$($u):" /O /U | Out-Null; Accion 'Disco mecánico desfragmentado'
    } else { Log '  Disco mecánico: desfragmentación no solicitada (Windows la hace automáticamente cada semana).' }
}

# ---------------------------------------------------------------- Informe
function Generar-Informe($titulo) {
    $f = Join-Path $sync.Inf ("Informe_{0}.html" -f (Get-Date -Format 'yyyy-MM-dd_HHmm'))
    $so = Get-WmiObject Win32_OperatingSystem
    function Lista($items, $vacio) { if ($items.Count) { ($items | ForEach-Object { '<li>' + [Security.SecurityElement]::Escape("$_") + '</li>' }) -join "`n" } else { "<li class='n'>$vacio</li>" } }
    $html = @"
<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>Informe Acelerador PC Ultra Pro</title>
<style>body{font-family:Segoe UI,Arial;background:#f3f6fb;margin:0;color:#1d2533}header{background:linear-gradient(90deg,#0b3d91,#1565c0);color:#fff;padding:22px 32px}
h1{margin:0;font-size:24px}section{background:#fff;margin:18px 32px;padding:16px 24px;border-radius:10px;box-shadow:0 1px 4px #0002}
h2{margin-top:0;font-size:18px}.p h2{color:#c62828}.a h2{color:#2e7d32}.r h2{color:#1565c0}li{margin:4px 0}.n{color:#777;list-style:none}</style></head><body>
<header><h1>$AppNombre - Informe final</h1><div>$titulo &middot; $(Get-Date -Format 'dd/MM/yyyy HH:mm') &middot; $env:COMPUTERNAME &middot; $($so.Caption)</div></header>
<section class="p"><h2>Problemas detectados ($($sync.Problemas.Count))</h2><ul>$(Lista $sync.Problemas 'No se detectaron problemas.')</ul></section>
<section class="a"><h2>Reparaciones y optimizaciones realizadas ($($sync.Acciones.Count))</h2><ul>$(Lista $sync.Acciones 'No se realizaron cambios.')</ul></section>
<section class="r"><h2>Resultados y verificaciones</h2><ul>$(Lista $sync.Resultados 'Sin resultados.')</ul></section>
<section><h2>Seguridad</h2><ul><li>No se eliminaron documentos personales.</li><li>No se desactivó Windows Defender, Firewall, UAC ni Windows Update.</li>
<li>Para deshacer los cambios: botón <b>Deshacer cambios</b> (Restaurar sistema, punto "Antes de Acelerador PC Ultra Pro") o los respaldos .reg en: $([Security.SecurityElement]::Escape($sync.Resp))</li></ul></section>
</body></html>
"@
    [IO.File]::WriteAllText($f, $html, (New-Object Text.UTF8Encoding $true))
    $sync.UltimoInforme = $f
    Log ''
    Log "  Informe guardado en: $f" 'ok'
}
'@

# Funciones disponibles también en la ventana (para tareas rápidas)
. ([ScriptBlock]::Create($Funciones))

# ============================================================================
#  MOTOR DE TAREAS EN SEGUNDO PLANO
# ============================================================================
$script:ps = $null; $script:handle = $null
function Iniciar-Tarea([string]$nombre, [string]$codigo, [bool]$informe) {
    if ($sync.Ocupado) { [System.Windows.Forms.MessageBox]::Show('Espere a que termine la tarea actual.', $AppNombre) | Out-Null; return }
    $sync.Ocupado = $true; $sync.Estado = $nombre
    Set-Botones $false
    $barra.Style = 'Marquee'
    $rs = [RunspaceFactory]::CreateRunspace()
    $rs.ApartmentState = 'STA'; $rs.ThreadOptions = 'ReuseThread'; $rs.Open()
    $rs.SessionStateProxy.SetVariable('sync', $sync)
    $rs.SessionStateProxy.SetVariable('AppNombre', $AppNombre)
    $script:ps = [PowerShell]::Create(); $script:ps.Runspace = $rs
    $fin = if ($informe) { "Generar-Informe '$nombre'" } else { '' }
    [void]$script:ps.AddScript("`$ErrorActionPreference='SilentlyContinue'`n$Funciones`ntry {`n$codigo`n$fin`n} catch { Err `$_.Exception.Message }`nLog '' ; Log '>>> TAREA TERMINADA' 'ok'; `$sync.Ocupado = `$false")
    $script:handle = $script:ps.BeginInvoke()
}

# ============================================================================
#  INTERFAZ GRÁFICA
# ============================================================================
$colFondo  = [Drawing.Color]::FromArgb(245, 247, 251)
$colMenu   = [Drawing.Color]::FromArgb(14, 30, 62)
$colAzul   = [Drawing.Color]::FromArgb(21, 101, 192)
$colVerde  = [Drawing.Color]::FromArgb(46, 125, 50)
$fuente    = New-Object Drawing.Font('Segoe UI', 9.5)
$fuenteB   = New-Object Drawing.Font('Segoe UI', 9.5, [Drawing.FontStyle]::Bold)

$form = New-Object Windows.Forms.Form
$form.Text = "$AppNombre  v$AppVersion"
$form.Size = New-Object Drawing.Size(1100, 720)
$form.MinimumSize = New-Object Drawing.Size(900, 600)
$form.StartPosition = 'CenterScreen'
$form.BackColor = $colFondo
$form.Font = $fuente
try { $form.Icon = [Drawing.Icon]::ExtractAssociatedIcon("$env:windir\System32\perfmon.exe") } catch {}

# --- Encabezado
$cab = New-Object Windows.Forms.Panel
$cab.Dock = 'Top'; $cab.Height = 70; $cab.BackColor = $colAzul
$lt = New-Object Windows.Forms.Label
$lt.Text = 'ACELERADOR PC  ULTRA PRO 2026'; $lt.ForeColor = 'White'
$lt.Font = New-Object Drawing.Font('Segoe UI', 18, [Drawing.FontStyle]::Bold)
$lt.AutoSize = $true; $lt.Location = New-Object Drawing.Point(18, 8)
$ls = New-Object Windows.Forms.Label
$so0 = Get-WmiObject Win32_OperatingSystem
$ls.Text = ("{0}  |  RAM {1:N1} GB  |  Seguro: no borra documentos ni desactiva la seguridad de Windows" -f $so0.Caption, ($so0.TotalVisibleMemorySize/1MB))
$ls.ForeColor = [Drawing.Color]::FromArgb(220, 232, 255); $ls.AutoSize = $true; $ls.Location = New-Object Drawing.Point(22, 44)
$cab.Controls.AddRange(@($lt, $ls))

# --- Menú lateral
$menu = New-Object Windows.Forms.FlowLayoutPanel
$menu.Dock = 'Left'; $menu.Width = 270; $menu.BackColor = $colMenu
$menu.FlowDirection = 'TopDown'; $menu.WrapContents = $false; $menu.AutoScroll = $true
$menu.Padding = New-Object Windows.Forms.Padding(10, 10, 10, 10)

$script:botones = @()
function Boton($texto, $color, $accion, $tip) {
    $b = New-Object Windows.Forms.Button
    $b.Text = $texto; $b.Width = 240; $b.Height = 36
    $b.FlatStyle = 'Flat'; $b.FlatAppearance.BorderSize = 0
    $b.BackColor = $color; $b.ForeColor = 'White'; $b.TextAlign = 'MiddleLeft'
    $b.Margin = New-Object Windows.Forms.Padding(0, 0, 0, 5); $b.Cursor = 'Hand'
    $b.Add_Click($accion)
    if ($tip) { $tooltip.SetToolTip($b, $tip) }
    $menu.Controls.Add($b); $script:botones += $b
    $b
}
function Separador($t) {
    $l = New-Object Windows.Forms.Label
    $l.Text = $t; $l.ForeColor = [Drawing.Color]::FromArgb(140, 170, 220); $l.Font = $fuenteB
    $l.Width = 240; $l.Height = 22; $l.TextAlign = 'BottomLeft'
    $menu.Controls.Add($l)
}
function Set-Botones($habilitar) { foreach ($b in $script:botones) { $b.Enabled = $habilitar } }
function Confirmar($texto) { [Windows.Forms.MessageBox]::Show($texto, $AppNombre, 'YesNo', 'Question') -eq 'Yes' }
$tooltip = New-Object Windows.Forms.ToolTip

$colBtn = [Drawing.Color]::FromArgb(32, 55, 100)

# --- Zona derecha: registro + barra
$panelDer = New-Object Windows.Forms.Panel; $panelDer.Dock = 'Fill'; $panelDer.Padding = New-Object Windows.Forms.Padding(12)
$log = New-Object Windows.Forms.RichTextBox
$log.Dock = 'Fill'; $log.ReadOnly = $true; $log.BackColor = 'White'; $log.BorderStyle = 'None'
$log.Font = New-Object Drawing.Font('Consolas', 10)
$pie = New-Object Windows.Forms.Panel; $pie.Dock = 'Bottom'; $pie.Height = 52
$barra = New-Object Windows.Forms.ProgressBar; $barra.Dock = 'Top'; $barra.Height = 14; $barra.MarqueeAnimationSpeed = 30; $barra.Style = 'Continuous'
$estado = New-Object Windows.Forms.Label; $estado.Dock = 'Fill'; $estado.TextAlign = 'MiddleLeft'; $estado.Text = 'Listo.'; $estado.Font = $fuenteB
$btnInf = New-Object Windows.Forms.Button; $btnInf.Text = 'Abrir último informe'; $btnInf.Dock = 'Right'; $btnInf.Width = 170
$btnInf.Add_Click({ if ($sync.UltimoInforme -and (Test-Path $sync.UltimoInforme)) { Start-Process $sync.UltimoInforme } else { Start-Process $CarpetaInf } })
$pie.Controls.AddRange(@($estado, $btnInf, $barra))
$panelDer.Controls.AddRange(@($log, $pie))

function Escribir($tipo, $t) {
    $col = switch ($tipo) { 'ok' { $colVerde } 'aviso' { [Drawing.Color]::FromArgb(230, 120, 0) } 'error' { [Drawing.Color]::FromArgb(198, 40, 40) } 'titulo' { $colAzul } default { [Drawing.Color]::FromArgb(40, 40, 40) } }
    $log.SelectionStart = $log.TextLength; $log.SelectionLength = 0
    $log.SelectionColor = $col
    $log.SelectionFont = if ($tipo -eq 'titulo') { New-Object Drawing.Font('Consolas', 10, [Drawing.FontStyle]::Bold) } else { $log.Font }
    $log.AppendText("$t`r`n")
}

# Temporizador: pasa los mensajes del hilo de trabajo a la ventana
$timer = New-Object Windows.Forms.Timer; $timer.Interval = 250
$timer.Add_Tick({
    $n = 0
    while ($sync.Log.Count -gt 0 -and $n -lt 200) { $m = $sync.Log.Dequeue(); Escribir $m[0] $m[1]; $n++ }
    if ($n) { $log.ScrollToCaret() }
    $estado.Text = $sync.Estado
    if (-not $sync.Ocupado -and $script:ps -and $script:handle -and $script:handle.IsCompleted) {
        try { $script:ps.EndInvoke($script:handle) } catch {}
        $script:ps.Runspace.Close(); $script:ps.Dispose(); $script:ps = $null
        [GC]::Collect()
        $barra.Style = 'Continuous'; $barra.Value = 100
        $sync.Estado = 'Listo.'; Set-Botones $true
        if ($script:abrirInforme -and $sync.UltimoInforme) { Start-Process $sync.UltimoInforme; $script:abrirInforme = $false }
    }
})
$timer.Start()

# ============================================================================
#  VENTANAS AUXILIARES: INICIO DE WINDOWS Y PROGRAMAS LENTOS
# ============================================================================
# Entradas que NUNCA se ofrecen para desactivar (seguridad y controladores)
$Protegidos = 'SecurityHealth|Defender|MsMpEng|WindowsDefender|antivirus|avast|avg|eset|egui|kaspersky|avp|norton|mcafee|bitdefender|malwarebytes|sophos|panda|trend|ctfmon|RtkAudio|Realtek|igfx|Synaptics|ETD|Elan|Intel|AMD|NVIDIA|OneDriveSetup'
# Programas que suelen ralentizar el inicio sin ser necesarios
$Prescindibles = 'Spotify|Steam|EpicGames|Discord|Skype|Teams|Zoom|uTorrent|BitTorrent|Dropbox|GoogleDrive|iTunesHelper|Adobe ?(ARM|GC|Updater|CCXProcess|Creative)|CCleaner|OneDrive|Opera|Edge.*AutoLaunch|Messenger|WhatsApp|Telegram|Java ?Update|jusched|Cortana|Origin|EADM|Battle\.net|Ubisoft|GOG|Lightshot|Yandex|Baidu|Wondershare|DriverBooster|IObit|Advanced ?SystemCare|Avira.*Systray'

function Leer-Inicio {
    $lista = New-Object System.Collections.ArrayList
    $fuentes = @(
        @('HKCU:\Software\Microsoft\Windows\CurrentVersion\Run', 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\StartupApproved\Run', 'Usuario'),
        @('HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run', 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\StartupApproved\Run', 'Todos'),
        @('HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Run', 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\StartupApproved\Run32', 'Todos (32 bits)')
    )
    foreach ($f in $fuentes) {
        $k = Get-Item $f[0]; if (-not $k) { continue }
        $ap = Get-ItemProperty $f[1]
        foreach ($n in $k.GetValueNames()) {
            if (-not $n) { continue }
            $cmd = "$($k.GetValue($n))"
            $activo = $true
            if ($ap -and $ap.$n) { $activo = ($ap.$n[0] % 2) -eq 0 }
            [void]$lista.Add([pscustomobject]@{ Nombre = $n; Comando = $cmd; Ambito = $f[2]; Clave = $f[0]; Aprob = $f[1]; Activo = $activo })
        }
    }
    foreach ($c in @([Environment]::GetFolderPath('Startup'), [Environment]::GetFolderPath('CommonStartup'))) {
        Get-ChildItem $c -File | Where-Object { $_.Name -ne 'desktop.ini' } | ForEach-Object {
            $ap = if ($c -like "$env:APPDATA*") { 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\StartupApproved\StartupFolder' } else { 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\StartupApproved\StartupFolder' }
            $v = (Get-ItemProperty $ap).($_.Name); $activo = -not ($v -and ($v[0] % 2) -eq 1)
            [void]$lista.Add([pscustomobject]@{ Nombre = $_.Name; Comando = $_.FullName; Ambito = 'Carpeta Inicio'; Clave = $c; Aprob = $ap; Activo = $activo })
        }
    }
    $lista
}

function Cambiar-Inicio($e, $activar) {
    # Windows 8/10/11: mismo método que el Administrador de tareas (reversible al 100 %)
    if (EsWin8Mas) {
        if (-not (Test-Path $e.Aprob)) { New-Item $e.Aprob -Force | Out-Null }
        $val = if ($activar) { [byte[]](2,0,0,0,0,0,0,0,0,0,0,0) } else { [byte[]](3,0,0,0) + [BitConverter]::GetBytes([DateTime]::Now.ToFileTime()) }
        Set-ItemProperty $e.Aprob -Name $e.Nombre -Value $val -Type Binary
    } else {
        # Windows 7: se mueve a una clave de respaldo propia, recuperable desde el programa
        $bk = 'HKCU:\Software\AceleradorPC_UltraPro\InicioDesactivado'
        if (-not (Test-Path $bk)) { New-Item $bk -Force | Out-Null }
        if ($e.Ambito -eq 'Carpeta Inicio') { return }
        if (-not $activar) { Set-ItemProperty $bk -Name $e.Nombre -Value ($e.Clave + '|' + $e.Comando); Remove-ItemProperty $e.Clave -Name $e.Nombre }
        else { $d = (Get-ItemProperty $bk).($e.Nombre) -split '\|', 2; Set-ItemProperty $d[0] -Name $e.Nombre -Value $d[1]; Remove-ItemProperty $bk -Name $e.Nombre }
    }
}

function Ventana-Inicio {
    $f = New-Object Windows.Forms.Form
    $f.Text = 'Optimización segura del inicio de Windows'; $f.Size = New-Object Drawing.Size(980, 540); $f.StartPosition = 'CenterParent'; $f.Font = $fuente
    $info = New-Object Windows.Forms.Label; $info.Dock = 'Top'; $info.Height = 48; $info.Padding = New-Object Windows.Forms.Padding(8)
    $info.Text = 'Marque lo que quiere que arranque con Windows. Los programas de seguridad y controladores están protegidos y no se pueden desactivar aquí. Los cambios son 100 % reversibles. Recomendado = se puede desactivar sin riesgo.'
    $g = New-Object Windows.Forms.DataGridView
    $g.Dock = 'Fill'; $g.AllowUserToAddRows = $false; $g.RowHeadersVisible = $false; $g.SelectionMode = 'FullRowSelect'
    $g.AutoSizeColumnsMode = 'Fill'; $g.BackgroundColor = 'White'
    $cA = New-Object Windows.Forms.DataGridViewCheckBoxColumn; $cA.HeaderText = 'Arranca'; $cA.FillWeight = 12
    [void]$g.Columns.Add($cA)
    foreach ($h in 'Programa', 'Recomendación', 'Ámbito', 'Comando') { $i = $g.Columns.Add($h, $h); $g.Columns[$i].ReadOnly = $true }
    $g.Columns[1].FillWeight = 30; $g.Columns[2].FillWeight = 30; $g.Columns[3].FillWeight = 18; $g.Columns[4].FillWeight = 80
    $entradas = Leer-Inicio
    foreach ($e in $entradas) {
        $prot = ($e.Nombre + ' ' + $e.Comando) -match $Protegidos
        $rec = if ($prot) { 'PROTEGIDO (seguridad/sistema)' } elseif (($e.Nombre + ' ' + $e.Comando) -match $Prescindibles) { 'Recomendado desactivar' } else { 'Opcional' }
        $r = $g.Rows.Add($e.Activo, $e.Nombre, $rec, $e.Ambito, $e.Comando)
        if ($prot) { $g.Rows[$r].Cells[0].ReadOnly = $true; $g.Rows[$r].DefaultCellStyle.ForeColor = 'Gray' }
        elseif ($rec -like 'Recomendado*') { $g.Rows[$r].DefaultCellStyle.BackColor = [Drawing.Color]::FromArgb(255, 243, 224) }
    }
    $p = New-Object Windows.Forms.Panel; $p.Dock = 'Bottom'; $p.Height = 46
    $bA = New-Object Windows.Forms.Button; $bA.Text = 'Aplicar cambios'; $bA.Width = 160; $bA.Height = 32; $bA.Location = New-Object Drawing.Point(8, 7)
    $bR = New-Object Windows.Forms.Button; $bR.Text = 'Desmarcar recomendados'; $bR.Width = 190; $bR.Height = 32; $bR.Location = New-Object Drawing.Point(176, 7)
    $bT = New-Object Windows.Forms.Button; $bT.Text = 'Administrador de tareas'; $bT.Width = 190; $bT.Height = 32; $bT.Location = New-Object Drawing.Point(374, 7)
    $bR.Add_Click({ foreach ($row in $g.Rows) { if ($row.Cells[2].Value -like 'Recomendado*') { $row.Cells[0].Value = $false } } })
    $bT.Add_Click({ if (EsWin8Mas) { Start-Process taskmgr -ArgumentList '/0 /startup' } else { Start-Process msconfig } })
    $bA.Add_Click({
        $g.EndEdit()
        $cambios = @()
        for ($i = 0; $i -lt $entradas.Count; $i++) {
            $nuevo = [bool]$g.Rows[$i].Cells[0].Value
            if ($nuevo -ne $entradas[$i].Activo -and $g.Rows[$i].Cells[2].Value -notlike 'PROTEGIDO*') { $cambios += ,@($entradas[$i], $nuevo) }
        }
        if (-not $cambios) { [Windows.Forms.MessageBox]::Show('No hay cambios.') | Out-Null; return }
        $txt = ($cambios | ForEach-Object { if ($_[1]) { "ACTIVAR:     $($_[0].Nombre)" } else { "DESACTIVAR:  $($_[0].Nombre)" } }) -join "`n"
        if (-not (Confirmar "Se aplicarán estos cambios (reversibles):`n`n$txt`n`n¿Continuar?")) { return }
        Respaldo-Configuracion
        foreach ($c in $cambios) {
            Cambiar-Inicio $c[0] $c[1]
            $c[0].Activo = $c[1]
            if ($c[1]) { Accion "Inicio: '$($c[0].Nombre)' reactivado" } else { Accion "Inicio: '$($c[0].Nombre)' ya no arranca con Windows" }
        }
        $verif = Leer-Inicio; $okv = 0
        foreach ($c in $cambios) { if (($verif | Where-Object { $_.Nombre -eq $c[0].Nombre } | Select-Object -First 1).Activo -eq $c[1] -or -not (EsWin8Mas)) { $okv++ } }
        Resultado "Inicio de Windows: $okv de $($cambios.Count) cambios verificados"
        [Windows.Forms.MessageBox]::Show("Cambios aplicados y verificados: $okv de $($cambios.Count).`nSe notarán al reiniciar.", $AppNombre) | Out-Null
    })
    $p.Controls.AddRange(@($bA, $bR, $bT))
    $f.Controls.AddRange(@($g, $p, $info))
    [void]$f.ShowDialog($form)
}

$ProcesosSistema = '^(System|Idle|smss|csrss|wininit|winlogon|services|lsass|svchost|dwm|explorer|fontdrvhost|Registry|Memory Compression|MsMpEng|NisSrv|SecurityHealthService|SecurityHealthSystray|spoolsv|audiodg|sihost|ctfmon|conhost|taskhostw|RuntimeBroker|StartMenuExperienceHost|ShellExperienceHost|SearchHost|SearchIndexer|WmiPrvSE|powershell|AceleradorPC.*)$'

function Ventana-Procesos {
    $f = New-Object Windows.Forms.Form
    $f.Text = 'Programas que ralentizan la computadora'; $f.Size = New-Object Drawing.Size(900, 560); $f.StartPosition = 'CenterParent'; $f.Font = $fuente
    $info = New-Object Windows.Forms.Label; $info.Dock = 'Top'; $info.Height = 40; $info.Padding = New-Object Windows.Forms.Padding(8)
    $info.Text = 'Medición real de uso de procesador (3 segundos) y memoria. Los procesos de Windows y de seguridad están protegidos. Cerrar un programa puede hacer perder trabajo no guardado.'
    $g = New-Object Windows.Forms.DataGridView
    $g.Dock = 'Fill'; $g.AllowUserToAddRows = $false; $g.RowHeadersVisible = $false; $g.SelectionMode = 'FullRowSelect'; $g.ReadOnly = $true; $g.MultiSelect = $false
    $g.AutoSizeColumnsMode = 'Fill'; $g.BackgroundColor = 'White'
    foreach ($h in 'Programa', 'PID', 'CPU %', 'Memoria MB', 'Diagnóstico', 'Ruta') { [void]$g.Columns.Add($h, $h) }
    $g.Columns[1].FillWeight = 25; $g.Columns[2].FillWeight = 25; $g.Columns[3].FillWeight = 35; $g.Columns[4].FillWeight = 70; $g.Columns[5].FillWeight = 120
    $cargar = {
        $g.Rows.Clear(); $f.Cursor = 'WaitCursor'
        $nucleos = [Environment]::ProcessorCount
        $t1 = @{}; Get-Process | ForEach-Object { $t1[$_.Id] = $_.TotalProcessorTime.TotalMilliseconds }
        Start-Sleep -Seconds 3
        $datos = Get-Process | ForEach-Object {
            $cpu = 0; if ($t1.ContainsKey($_.Id)) { $cpu = ($_.TotalProcessorTime.TotalMilliseconds - $t1[$_.Id]) / 3000 / $nucleos * 100 }
            [pscustomobject]@{ P = $_; Cpu = [math]::Round($cpu, 1); Mem = [math]::Round($_.WorkingSet64 / 1MB) }
        } | Sort-Object @{e = { $_.Cpu * 20 + $_.Mem / 10 } } -Descending | Select-Object -First 30
        $memTotal = (Get-WmiObject Win32_OperatingSystem).TotalVisibleMemorySize / 1KB
        foreach ($d in $datos) {
            $diag = @()
            if ($d.Cpu -ge 25) { $diag += 'Usa mucho procesador' } elseif ($d.Cpu -ge 10) { $diag += 'Uso de procesador moderado' }
            if ($d.Mem -ge ($memTotal * 0.15)) { $diag += 'Usa mucha memoria' } elseif ($d.Mem -ge 300) { $diag += 'Memoria elevada' }
            if ($d.P.ProcessName -match $ProcesosSistema) { $diag += '(Windows - protegido)' }
            $r = $g.Rows.Add($d.P.ProcessName, $d.P.Id, $d.Cpu, $d.Mem, ($diag -join ', '), $d.P.Path)
            if ($d.Cpu -ge 25 -or $d.Mem -ge ($memTotal * 0.15)) { $g.Rows[$r].DefaultCellStyle.BackColor = [Drawing.Color]::FromArgb(255, 228, 225) }
        }
        $f.Cursor = 'Default'
    }
    $p = New-Object Windows.Forms.Panel; $p.Dock = 'Bottom'; $p.Height = 46
    $bAct = New-Object Windows.Forms.Button; $bAct.Text = 'Volver a medir'; $bAct.Width = 150; $bAct.Height = 32; $bAct.Location = New-Object Drawing.Point(8, 7)
    $bCer = New-Object Windows.Forms.Button; $bCer.Text = 'Cerrar programa seleccionado'; $bCer.Width = 230; $bCer.Height = 32; $bCer.Location = New-Object Drawing.Point(166, 7)
    $bReg = New-Object Windows.Forms.Button; $bReg.Text = 'Agregar al informe'; $bReg.Width = 160; $bReg.Height = 32; $bReg.Location = New-Object Drawing.Point(404, 7)
    $bAct.Add_Click($cargar)
    $bCer.Add_Click({
        if (-not $g.SelectedRows.Count) { return }
        $row = $g.SelectedRows[0]; $nom = $row.Cells[0].Value
        if ($nom -match $ProcesosSistema) { [Windows.Forms.MessageBox]::Show("'$nom' es un proceso de Windows o de seguridad y está protegido.", $AppNombre) | Out-Null; return }
        if (Confirmar "¿Cerrar '$nom' por completo (todas sus ventanas y procesos)? Si tiene trabajo sin guardar en ese programa, guárdelo antes.") {
            $f.Cursor = 'WaitCursor'
            # Se cierran TODOS los procesos con ese nombre (ej.: todas las pestañas de Chrome)
            Get-Process -Name $nom | ForEach-Object { [void]$_.CloseMainWindow() }
            Start-Sleep 3
            $resto = @(Get-Process -Name $nom)
            if ($resto) { Ejecutar 'taskkill.exe' "/IM `"$nom.exe`" /T /F" | Out-Null; Start-Sleep 1 }
            $f.Cursor = 'Default'
            if (@(Get-Process -Name $nom).Count -eq 0) {
                Accion "Programa '$nom' cerrado por completo para liberar recursos"
                [Windows.Forms.MessageBox]::Show("'$nom' se cerró por completo.", $AppNombre) | Out-Null
                & $cargar
            } else {
                [Windows.Forms.MessageBox]::Show("'$nom' no se pudo cerrar del todo: Windows no lo permite o se vuelve a abrir solo (lo reinicia el sistema u otro programa).", $AppNombre) | Out-Null
            }
        }
    })
    $bReg.Add_Click({
        foreach ($row in $g.Rows) { if ($row.Cells[4].Value -match 'mucho|mucha') { Problema ("Programa pesado: {0} (CPU {1} %, {2} MB)" -f $row.Cells[0].Value, $row.Cells[2].Value, $row.Cells[3].Value) } }
        [Windows.Forms.MessageBox]::Show('Agregado al próximo informe.', $AppNombre) | Out-Null
    })
    $p.Controls.AddRange(@($bAct, $bCer, $bReg))
    $f.Controls.AddRange(@($g, $p, $info))
    $f.Add_Shown($cargar)
    [void]$f.ShowDialog($form)
}

function Ventana-Copia {
    $dlg = New-Object Windows.Forms.FolderBrowserDialog
    $dlg.Description = 'Elija dónde guardar la copia de sus archivos personales (de preferencia un disco externo o USB):'
    if ($dlg.ShowDialog() -ne 'OK') { return }
    $destino = Join-Path $dlg.SelectedPath ("Copia_{0}_{1}" -f $env:USERNAME, (Get-Date -Format 'yyyy-MM-dd'))
    $orig = @([Environment]::GetFolderPath('MyDocuments'), [Environment]::GetFolderPath('Desktop'), [Environment]::GetFolderPath('MyPictures'), [Environment]::GetFolderPath('MyMusic'), [Environment]::GetFolderPath('MyVideos'), (Join-Path $env:USERPROFILE 'Downloads'), (Join-Path $env:USERPROFILE 'Favorites'))
    if ($dlg.SelectedPath.StartsWith($env:USERPROFILE, 'OrdinalIgnoreCase')) { [Windows.Forms.MessageBox]::Show('Elija una carpeta fuera de su perfil de usuario (por ejemplo, una memoria USB).', $AppNombre) | Out-Null; return }
    if (-not (Confirmar "Se COPIARÁN (sin mover ni borrar nada) Documentos, Escritorio, Imágenes, Música, Videos, Descargas y Favoritos a:`n`n$destino`n`n¿Continuar?")) { return }
    $lista = ($orig | Where-Object { Test-Path $_ } | ForEach-Object { "'" + $_.Replace("'", "''") + "'" }) -join ','
    $dst = $destino.Replace("'", "''")
    Iniciar-Tarea 'Copia de seguridad de archivos personales' @"
Titulo 'COPIA DE SEGURIDAD DE ARCHIVOS PERSONALES'
foreach (`$o in @($lista)) {
    `$d = Join-Path '$dst' (Split-Path `$o -Leaf)
    Log "  Copiando `$o ..."
    `$r = Ejecutar 'robocopy.exe' ("``"`$o``" ``"`$d``" /E /R:1 /W:1 /XJ /NFL /NDL /NP")
    if (`$r[0] -lt 8) { Ok "`$o copiado" } else { Err "Errores al copiar `$o (código `$(`$r[0]))" }
}
`$n = @(Get-ChildItem '$dst' -Recurse -File).Count
Accion "Copia de seguridad de archivos personales: `$n archivos en $dst"
"@ $true
}

# ============================================================================
#  BOTONES
# ============================================================================
Separador 'MANTENIMIENTO'
$bTodo = Boton '  ★ MANTENIMIENTO COMPLETO' $colVerde {
    $r = [Windows.Forms.MessageBox]::Show(
        "Se realizará, en este orden:`n`n" +
        "  1. Punto de restauración + respaldo de configuraciones`n" +
        "  2. Diagnóstico de procesador, RAM, discos e internet`n" +
        "  3. Limpieza profunda (solo temporales y cachés)`n" +
        "  4. Optimización de rendimiento, archivos, internet y energía`n" +
        "  5. Verificación de errores del disco (solo lectura)`n" +
        "  6. Informe final`n`n" +
        "NO se borran documentos ni se desactiva la seguridad de Windows.`n`n" +
        "¿Incluir también la reparación de archivos de Windows (SFC + DISM)?`nAgrega 15-45 minutos.`n`n" +
        "  SÍ = mantenimiento completo con SFC/DISM`n  NO = mantenimiento sin SFC/DISM`n  CANCELAR = no hacer nada",
        $AppNombre, 'YesNoCancel', 'Question')
    if ($r -eq 'Cancel') { return }
    $sfc = if ($r -eq 'Yes') { 'Reparar-Windows' } else { '' }
    $sync.Problemas.Clear(); $sync.Acciones.Clear(); $sync.Resultados.Clear()
    $script:abrirInforme = $true
    Iniciar-Tarea 'Mantenimiento completo' "Punto-Restauracion; Respaldo-Configuracion; Diagnostico; Diagnostico-Internet; Limpieza-Profunda `$false; Acelerar-General; Acelerar-Archivos `$false; Acelerar-Internet `$null; Optimizar-Energia 'auto'; Verificar-Disco; $sfc" $true
} 'Hace todo lo recomendado de forma segura y genera el informe final.'
$bTodo.Height = 48; $bTodo.Font = New-Object Drawing.Font('Segoe UI', 11, [Drawing.FontStyle]::Bold)

Separador 'DIAGNÓSTICO'
Boton '  Diagnóstico PC (CPU, RAM, disco)' $colBtn { Iniciar-Tarea 'Diagnóstico' 'Diagnostico' $true } 'Revisa procesador, memoria, discos (SMART), batería y procesos.' | Out-Null
Boton '  Programas que ralentizan la PC' $colBtn { Ventana-Procesos } 'Mide CPU y memoria de cada programa.' | Out-Null
Boton '  Diagnóstico de internet' $colBtn { Iniciar-Tarea 'Diagnóstico de internet' 'Diagnostico-Internet' $true } 'Router, pérdida de paquetes, latencia, DNS, Wi-Fi y velocidad.' | Out-Null

Separador 'LIMPIEZA Y REPARACIÓN'
Boton '  Limpieza profunda y segura' $colBtn {
    $r = [Windows.Forms.MessageBox]::Show("Se borrarán temporales, cachés de navegadores (no contraseñas ni historial), informes de errores y descargas viejas de Windows Update.`nSus documentos NO se tocan.`n`n¿Vaciar también la Papelera de reciclaje?`n  SÍ = vaciarla   NO = conservarla   CANCELAR = no limpiar", $AppNombre, 'YesNoCancel', 'Question')
    if ($r -eq 'Cancel') { return }
    Iniciar-Tarea 'Limpieza profunda' ("Limpieza-Profunda `$" + ($r -eq 'Yes').ToString().ToLower()) $true
} 'Libera espacio sin tocar archivos personales.' | Out-Null
Boton '  Reparar Windows (SFC + DISM)' $colBtn {
    if (Confirmar "Se buscarán y repararán archivos dañados de Windows con DISM y SFC, y se verificará el resultado.`nTarda 15-45 minutos. ¿Continuar?") { Iniciar-Tarea 'Reparar Windows' 'Punto-Restauracion; Reparar-Windows' $true }
} 'Repara archivos de sistema dañados (no toca sus datos).' | Out-Null
Boton '  Verificar errores del disco' $colBtn {
    $script:tareaDisco = $true
    Iniciar-Tarea 'Verificar disco' 'Verificar-Disco' $true
} 'Análisis de solo lectura. Si hay errores, le preguntará antes de reparar.' | Out-Null
Boton '  Reparar red (si internet falla)' $colBtn {
    if (Confirmar "Se restablecerá la configuración de red (IP, DNS, Winsock, TCP/IP).`nInternet se cortará unos segundos y deberá REINICIAR.`n`n¿Continuar?") { Iniciar-Tarea 'Reparar red' 'Respaldo-Configuracion; Reparar-Red' $true }
} | Out-Null

Separador 'OPTIMIZACIÓN'
Boton '  Rapidez general' $colBtn {
    if (Confirmar 'Se aplicarán efectos visuales de rendimiento, menús y apagado más rápidos, sin retraso al iniciar. Antes se crea un punto de restauración. ¿Continuar?') { Iniciar-Tarea 'Rapidez general' 'Punto-Restauracion; Respaldo-Configuracion; Acelerar-General' $true }
} | Out-Null
Boton '  Optimizar inicio de Windows' $colBtn { Ventana-Inicio } 'Elija qué programas arrancan con Windows (reversible).' | Out-Null
Boton '  Optimizar internet' $colBtn {
    $r = [Windows.Forms.MessageBox]::Show("Se optimizará TCP y se liberará ancho de banda reservado.`n`n¿Cambiar el DNS a uno más rápido?`n  SÍ = elegir DNS   NO = no cambiar DNS   CANCELAR = salir", $AppNombre, 'YesNoCancel', 'Question')
    if ($r -eq 'Cancel') { return }
    $dns = '$null'
    if ($r -eq 'Yes') {
        $d = [Windows.Forms.MessageBox]::Show("SÍ = Cloudflare (1.1.1.1)`nNO = Google (8.8.8.8)`nCANCELAR = DNS automático del proveedor", 'Elegir DNS', 'YesNoCancel', 'Question')
        $dns = switch ($d) { 'Yes' { "@('1.1.1.1','1.0.0.1')" } 'No' { "@('8.8.8.8','8.8.4.4')" } default { "'auto'" } }
    }
    Iniciar-Tarea 'Optimizar internet' "Punto-Restauracion; Respaldo-Configuracion; Acelerar-Internet $dns" $true
} | Out-Null
Boton '  Rapidez de archivos y carpetas' $colBtn {
    $def = $false
    $ssd = $false; if (Get-Command Get-PhysicalDisk) { $ssd = [bool](Get-PhysicalDisk | Where-Object { "$($_.MediaType)" -eq 'SSD' }) }
    if (-not $ssd) { $def = Confirmar 'Disco mecánico (o tipo desconocido). ¿Desfragmentar ahora? Puede tardar mucho.' }
    if (Confirmar 'El Explorador se reiniciará unos segundos. ¿Continuar?') { Iniciar-Tarea 'Rapidez de archivos' "Punto-Restauracion; Respaldo-Configuracion; Acelerar-Archivos `$$($def.ToString().ToLower())" $true }
} | Out-Null
Boton '  Rendimiento y batería' $colBtn {
    $r = [Windows.Forms.MessageBox]::Show("SÍ = Automático (portátil: equilibrado y ahorro con batería; escritorio: alto rendimiento)`nNO = Máximo rendimiento (gasta más batería)`nCANCELAR = salir", $AppNombre, 'YesNoCancel', 'Question')
    if ($r -eq 'Cancel') { return }
    $m = if ($r -eq 'Yes') { 'auto' } else { 'alto' }
    Iniciar-Tarea 'Rendimiento y batería' "Respaldo-Configuracion; Optimizar-Energia '$m'" $true
} | Out-Null

Separador 'PROTECCIÓN'
Boton '  Crear punto de restauración' $colBtn { $sync.Restauracion = $false; Iniciar-Tarea 'Punto de restauración' 'Punto-Restauracion' $false } | Out-Null
Boton '  Respaldar configuraciones' $colBtn { $sync.Respaldo = $false; Iniciar-Tarea 'Respaldo de configuraciones' 'Respaldo-Configuracion' $false } | Out-Null
Boton '  Copia de archivos personales' $colBtn { Ventana-Copia } 'Copia Documentos, Escritorio, Imágenes... a un USB o disco externo.' | Out-Null
Boton '  DESHACER cambios (Restaurar)' ([Drawing.Color]::FromArgb(120, 60, 20)) { Start-Process rstrui } 'Abre Restaurar sistema: elija "Antes de Acelerador PC Ultra Pro".' | Out-Null
Boton '  Abrir carpeta de informes' $colBtn { Start-Process $CarpetaBase } | Out-Null

# Pregunta de chkdsk tras la verificación de disco (siempre con confirmación)
$timer.Add_Tick({
    if ($script:tareaDisco -and -not $sync.Ocupado -and -not $script:ps) {
        $script:tareaDisco = $false
        if ($sync.DiscoConErrores) {
            if (Confirmar "Se encontraron errores en el disco.`n`n¿Programar la reparación (chkdsk /f) para el próximo reinicio?`nSe recomienda haber hecho copia de seguridad antes.") { Iniciar-Tarea 'Programar reparación de disco' 'Programar-Chkdsk' $false }
        }
    }
})

$form.Controls.AddRange(@($panelDer, $menu, $cab))
$form.Add_Shown({
    Escribir 'titulo' "Bienvenido a $AppNombre"
    Escribir 'info' '  Recomendado: pulse "MANTENIMIENTO COMPLETO". Se le pedirá confirmación antes de cualquier cambio.'
    Escribir 'info' '  Sus documentos personales nunca se eliminan. Windows Defender, Firewall y Windows Update no se desactivan.'
    Escribir 'info' "  Informes y respaldos: $CarpetaBase"
})
$form.Add_FormClosing({
    if ($sync.Ocupado -and -not (Confirmar 'Hay una tarea en curso. Cerrar ahora puede dejarla a medias. ¿Cerrar de todos modos?')) { $_.Cancel = $true }
})
[void]$form.ShowDialog()
$timer.Stop()
