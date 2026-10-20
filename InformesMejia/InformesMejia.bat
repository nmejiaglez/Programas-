<# :
@echo off
REM ============================================================
REM  INFORMES DR. MEJIA - un solo archivo. Doble clic para abrir.
REM  (La parte de abajo es el programa en PowerShell.)
REM ============================================================
title Informes Dr. Mejia
set "INF_BAT=%~f0"
powershell -NoProfile -ExecutionPolicy Bypass -STA -Command "Invoke-Expression ([IO.File]::ReadAllText($env:INF_BAT))"
if errorlevel 1 (
  echo.
  echo  Ocurrio un problema. Tome una foto de esta pantalla.
  pause
)
exit /b
#>
# ============================================================
#  INFORMES DR. MEJIA - Windows 7 / 8 / 10 / 11
#  Busca en la computadora los informes del Dr. Nestor Jose
#  Mejia Gonzalez (Word, PDF, texto) mirando el NOMBRE del
#  archivo y lo que esta ESCRITO adentro, y los MUEVE a
#  Documentos\DOCTOR MEJIA ordenados por ANO y MES.
#  Los duplicados (mismo contenido) van a DOCTOR MEJIA\_Duplicados.
#  Todo se puede DESHACER. Nunca borra informes.
# ============================================================
$ErrorActionPreference = 'SilentlyContinue'
$Host.UI.RawUI.WindowTitle = 'Informes Dr. Mejia'

$Destino    = Join-Path ([Environment]::GetFolderPath('MyDocuments')) 'DOCTOR MEJIA'
$Duplicados = Join-Path $Destino '_Duplicados'
$Anterior   = Join-Path ([Environment]::GetFolderPath('MyDocuments')) 'INFORMES DR MEJIA'
$Registros = Join-Path $Destino '_Registros (no borrar)'
$Escritorio = [Environment]::GetFolderPath('Desktop')
$Documentos = [Environment]::GetFolderPath('MyDocuments')
$Descargas  = Join-Path $env:USERPROFILE 'Downloads'

$Meses = @('01 - Enero','02 - Febrero','03 - Marzo','04 - Abril','05 - Mayo','06 - Junio',
           '07 - Julio','08 - Agosto','09 - Septiembre','10 - Octubre','11 - Noviembre','12 - Diciembre')

$Extensiones = @('.docx','.docm','.doc','.rtf','.odt','.pdf','.txt')

# Senales de que el archivo es del Dr. Mejia (se comparan sin tildes y en minusculas).
# Basta con UNA "segura", o con "mejia" junto a una de apoyo.
$Seguras = @('nestor jose mejia','nestor mejia','dr. mejia','dr mejia','37294','nm radiologia')
$Apoyo   = @('nestor','radiologia','radiologo','minsa','camilo ortega')

function Titulo($t) { Write-Host "`n>> $t" -ForegroundColor Cyan }
function Ok($t)     { Write-Host "   [OK] $t" -ForegroundColor Green }
function Aviso($t)  { Write-Host "   [!] $t" -ForegroundColor Yellow }

function Normalizar($t) {
    if (-not $t) { return '' }
    $d = $t.Normalize([Text.NormalizationForm]::FormD)
    $sb = New-Object Text.StringBuilder
    foreach ($ch in $d.ToCharArray()) {
        if ([Globalization.CharUnicodeInfo]::GetUnicodeCategory($ch) -ne [Globalization.UnicodeCategory]::NonSpacingMark) { [void]$sb.Append($ch) }
    }
    return (($sb.ToString().ToLower()) -replace '[_\-]+', ' ' -replace '\s+', ' ')
}

$HayZip = $false
try { Add-Type -AssemblyName System.IO.Compression.FileSystem -ErrorAction Stop; $HayZip = $true } catch {}

# Texto de un Word moderno (.docx/.odt): cuerpo, encabezados, pies y autor
function Texto-Zip($ruta) {
    if (-not $HayZip) { return '' }
    $txt = New-Object Text.StringBuilder
    $zip = $null
    try {
        $zip = [IO.Compression.ZipFile]::OpenRead($ruta)
        foreach ($e in $zip.Entries) {
            if ($e.FullName -match '^(word/(document|header\d*|footer\d*)\.xml|docProps/core\.xml|content\.xml|meta\.xml)$') {
                $r = New-Object IO.StreamReader($e.Open(), [Text.Encoding]::UTF8)
                $xml = $r.ReadToEnd(); $r.Close()
                # Une los trozos de texto de Word (a veces parte las palabras en varios pedazos)
                $xml = $xml -replace '</w:p>', ' ' -replace '<w:tab/>', ' ' -replace '<[^>]+>', ''
                [void]$txt.Append($xml).Append(' ')
            }
        }
    } catch {} finally { if ($zip) { $zip.Dispose() } }
    return $txt.ToString()
}

# Texto de un PDF: datos del documento y el texto de sus paginas (si no es una foto escaneada)
function Texto-Pdf($ruta) {
    $bytes = [IO.File]::ReadAllBytes($ruta)
    $latin = [Text.Encoding]::GetEncoding(28591)
    $crudo = $latin.GetString($bytes)
    $txt = New-Object Text.StringBuilder
    [void]$txt.Append($crudo)
    $pos = 0; $n = 0
    while ($n -lt 400) {
        $i = $crudo.IndexOf('stream', $pos)
        if ($i -lt 0) { break }
        $ini = $i + 6
        if ($ini -lt $crudo.Length -and $crudo[$ini] -eq "`r") { $ini++ }
        if ($ini -lt $crudo.Length -and $crudo[$ini] -eq "`n") { $ini++ }
        $fin = $crudo.IndexOf('endstream', $ini)
        if ($fin -lt 0) { break }
        $pos = $fin + 9; $n++
        if (($fin - $ini) -lt 3 -or ($fin - $ini) -gt 5MB) { continue }
        try {
            # Se salta la cabecera zlib (2 bytes) y se descomprime
            $ms = New-Object IO.MemoryStream($bytes, ($ini + 2), ($fin - $ini - 2))
            $ds = New-Object IO.Compression.DeflateStream($ms, [IO.Compression.CompressionMode]::Decompress)
            $sr = New-Object IO.StreamReader($ds, $latin)
            $s = $sr.ReadToEnd(); $sr.Close()
            # Texto entre parentesis dentro de las instrucciones de la pagina
            foreach ($m in [regex]::Matches($s, '\(((?:\\.|[^\\)])*)\)')) { [void]$txt.Append($m.Groups[1].Value) }
            [void]$txt.Append(' ').Append($s)
        } catch {}
    }
    # En los PDF el texto puede venir en UTF-16 (autor, titulo)
    [void]$txt.Append(' ').Append(([Text.Encoding]::BigEndianUnicode.GetString($bytes)))
    return $txt.ToString()
}

function Texto-De($a) {
    switch ($a.Extension.ToLower()) {
        { @('.docx','.docm','.odt') -contains $_ } { return (Texto-Zip $a.FullName) }
        '.pdf' { if ($a.Length -le 60MB) { return (Texto-Pdf $a.FullName) } }
        default {
            if ($a.Length -gt 30MB) { return '' }
            $b = [IO.File]::ReadAllBytes($a.FullName)
            # .doc antiguo guarda el texto en UTF-16 o en ANSI; .txt/.rtf en UTF-8 o ANSI
            $t = [Text.Encoding]::Unicode.GetString($b) + ' ' + [Text.Encoding]::Default.GetString($b) + ' ' + [Text.Encoding]::UTF8.GetString($b)
            # RTF escribe las tildes como \'ed: se quitan esos codigos
            return ($t -replace "\\'[0-9a-fA-F]{2}", '')
        }
    }
    return ''
}

function Es-Del-Doctor($texto) {
    $t = Normalizar $texto
    if (-not $t) { return $null }
    foreach ($s in $Seguras) { if ($t.Contains($s)) { return $s } }
    if ($t.Contains('mejia')) { foreach ($s in $Apoyo) { if ($t.Contains($s)) { return "mejia + $s" } } }
    return $null
}

function Fecha-De($a) {
    if ($a.LastWriteTime -lt $a.CreationTime) { return $a.LastWriteTime }
    return $a.CreationTime
}

function Nombre-Libre($carpeta, $nombre) {
    $ruta = Join-Path $carpeta $nombre
    if (-not (Test-Path -LiteralPath $ruta)) { return $ruta }
    $base = [IO.Path]::GetFileNameWithoutExtension($nombre)
    $ext  = [IO.Path]::GetExtension($nombre)
    $i = 2
    while (Test-Path -LiteralPath (Join-Path $carpeta "$base ($i)$ext")) { $i++ }
    return (Join-Path $carpeta "$base ($i)$ext")
}

# Huella del contenido: dos archivos con la misma huella son el MISMO informe (duplicado)
function Huella($ruta) {
    try {
        $sha = [Security.Cryptography.SHA256]::Create()
        $fs = [IO.File]::OpenRead($ruta)
        try { return [BitConverter]::ToString($sha.ComputeHash($fs)) } finally { $fs.Close() }
    } catch { return $null }
}

# Huellas de lo que ya esta en la carpeta DOCTOR MEJIA (para no repetir)
function Huellas-Destino {
    $h = @{}
    if (Test-Path -LiteralPath $Destino) {
        Get-ChildItem -LiteralPath $Destino -Recurse -Force | Where-Object { -not $_.PSIsContainer -and $_.FullName -notlike "$Duplicados*" -and $_.FullName -notlike "$Registros*" } |
            ForEach-Object { $x = Huella $_.FullName; if ($x) { $h[$x] = $_.FullName } }
    }
    return $h
}

function Buscar($carpetas) {
    $plan = @()
    Titulo 'Buscando informes del Dr. Mejia (puede tardar unos minutos)...'
    foreach ($c in $carpetas) {
        if (-not (Test-Path -LiteralPath $c)) { continue }
        Write-Host "   $c" -ForegroundColor White
        $lista = @(Get-ChildItem -LiteralPath $c -Recurse -Force | Where-Object {
            -not $_.PSIsContainer -and $Extensiones -contains $_.Extension.ToLower() -and
            $_.FullName -notlike "$Destino*" -and $_.Name -notlike '~$*' -and
            -not ($_.Attributes -band [IO.FileAttributes]::Hidden) -and -not ($_.Attributes -band [IO.FileAttributes]::System) })
        $antes = $plan.Count; $k = 0
        foreach ($a in $lista) {
            $k++
            Write-Progress -Activity 'Revisando archivos' -Status $a.Name -PercentComplete ($k * 100 / $lista.Count)
            # Primero el nombre del archivo y la carpeta; si no basta, lo escrito adentro
            $motivo = Es-Del-Doctor $a.FullName
            if (-not $motivo) { $motivo = Es-Del-Doctor (Texto-De $a) }
            if (-not $motivo) { continue }
            $f = Fecha-De $a
            $plan += New-Object PSObject -Property @{ Archivo = $a; Huella = (Huella $a.FullName); Fecha = $f
                Carpeta = Join-Path (Join-Path $Destino $f.Year) $Meses[$f.Month - 1] }
        }
        Write-Progress -Activity 'Revisando archivos' -Completed
        Write-Host ("      {0} archivos revisados, {1} son del Dr. Mejia" -f $lista.Count, ($plan.Count - $antes)) -ForegroundColor Gray
    }
    if ($plan.Count -eq 0) { Aviso 'No se encontraron informes del Dr. Mejia fuera de la carpeta DOCTOR MEJIA.'; return }

    # Separa los duplicados: se queda el mas antiguo de cada informe repetido
    $vistos = Huellas-Destino
    $unicos = @(); $dobles = @()
    foreach ($p in ($plan | Sort-Object Fecha)) {
        if ($p.Huella -and $vistos.ContainsKey($p.Huella)) {
            $p.Carpeta = $Duplicados; $dobles += $p
        } else {
            if ($p.Huella) { $vistos[$p.Huella] = $p.Archivo.FullName }
            $unicos += $p
        }
    }

    Titulo "Se encontraron $($plan.Count) informes del Dr. Mejia:"
    Write-Host ("   {0} informes distintos  -> DOCTOR MEJIA\Ano\Mes" -f $unicos.Count) -ForegroundColor White
    Write-Host ("   {0} copias repetidas     -> DOCTOR MEJIA\_Duplicados (para revisar o borrar usted)" -f $dobles.Count) -ForegroundColor White
    $unicos | Group-Object { $_.Fecha.Year } | Sort-Object Name | ForEach-Object { Write-Host ("      Ano {0}: {1} informes" -f $_.Name, $_.Count) -ForegroundColor Gray }
    $r = Read-Host "`n   MOVER todo a la carpeta DOCTOR MEJIA? Escriba S y pulse Enter (N = no)"
    if ($r -notmatch '^\s*[sS]') { Aviso 'Cancelado. No se movio nada.'; return }

    New-Item -ItemType Directory -Path $Registros -Force | Out-Null
    $log = Join-Path $Registros ('movimientos_' + (Get-Date -Format 'yyyy-MM-dd_HH-mm-ss') + '.csv')
    $hechos = @(); $fallos = 0; $n = 0; $todo = $unicos + $dobles
    foreach ($p in $todo) {
        $n++
        Write-Progress -Activity 'Moviendo informes' -Status $p.Archivo.Name -PercentComplete ($n * 100 / $todo.Count)
        New-Item -ItemType Directory -Path $p.Carpeta -Force | Out-Null
        $nuevo = Nombre-Libre $p.Carpeta $p.Archivo.Name
        try {
            Move-Item -LiteralPath $p.Archivo.FullName -Destination $nuevo -ErrorAction Stop
            $hechos += New-Object PSObject -Property @{ Origen = $p.Archivo.FullName; Destino = $nuevo }
        } catch { $fallos++ }
    }
    Write-Progress -Activity 'Moviendo informes' -Completed
    if ($hechos.Count) { $hechos | Select-Object Origen, Destino | Export-Csv -LiteralPath $log -NoTypeInformation -Encoding UTF8 }
    Ok "$($hechos.Count) informes movidos a: $Destino"
    if ($dobles.Count) { Ok "Las copias repetidas quedaron aparte en: $Duplicados" }
    if ($fallos) { Aviso "$fallos no se pudieron mover (estaban abiertos). Cierre Word y repita." }
    Write-Host '   Si algo no le gusta, use la opcion 5 para DESHACER.' -ForegroundColor Gray
    Crear-Acceso
    if ($hechos.Count) { Invoke-Item $Destino }
}

function Crear-Acceso {
    $lnk = Join-Path $Escritorio 'DOCTOR MEJIA.lnk'
    if (Test-Path -LiteralPath $lnk) { return }
    try {
        $s = (New-Object -ComObject WScript.Shell).CreateShortcut($lnk)
        $s.TargetPath = $Destino; $s.Save()
        Ok 'Acceso directo "DOCTOR MEJIA" creado en el Escritorio.'
    } catch {}
}

function Regresar($csv) {
    $vuelta = 0; $fallos = 0
    foreach ($m in (Import-Csv -LiteralPath $csv)) {
        if ((Test-Path -LiteralPath $m.Destino) -and -not (Test-Path -LiteralPath $m.Origen)) {
            New-Item -ItemType Directory -Path (Split-Path $m.Origen) -Force | Out-Null
            try { Move-Item -LiteralPath $m.Destino -Destination $m.Origen -ErrorAction Stop; $vuelta++ } catch { $fallos++ }
        } else { $fallos++ }
    }
    return @($vuelta, $fallos)
}

function Borrar-Vacias($raiz) {
    if (-not (Test-Path -LiteralPath $raiz)) { return }
    foreach ($d in @(Get-ChildItem -LiteralPath $raiz -Recurse -Force | Where-Object { $_.PSIsContainer } | Sort-Object { $_.FullName.Length } -Descending)) {
        if (@(Get-ChildItem -LiteralPath $d.FullName -Force).Count -eq 0) { Remove-Item -LiteralPath $d.FullName -Force }
    }
}

function Deshacer {
    $logs = @(Get-ChildItem -LiteralPath $Registros -Filter 'movimientos_*.csv' | Sort-Object Name -Descending)
    if ($logs.Count -eq 0) { Aviso 'No hay movimientos que deshacer.'; return }
    Titulo 'Movimientos realizados (el 1 es el mas reciente):'
    for ($i = 0; $i -lt $logs.Count -and $i -lt 10; $i++) {
        $cant = @(Import-Csv -LiteralPath $logs[$i].FullName).Count
        Write-Host ("   {0}. {1}  ({2} informes)" -f ($i + 1), ($logs[$i].BaseName -replace 'movimientos_',''), $cant)
    }
    $op = Read-Host "`n   Numero a deshacer (Enter = cancelar)"
    $k = 0
    if (-not [int]::TryParse($op, [ref]$k) -or $k -lt 1 -or $k -gt $logs.Count) { Aviso 'Cancelado.'; return }
    $r = Regresar $logs[$k - 1].FullName
    Rename-Item -LiteralPath $logs[$k - 1].FullName -NewName ('deshecho_' + $logs[$k - 1].Name)
    Borrar-Vacias $Destino
    Ok "$($r[0]) informes regresaron a su lugar original."
    if ($r[1]) { Aviso "$($r[1]) no se pudieron regresar (ya se habian movido, borrado o estaban abiertos)." }
}

# Deshace lo que hizo la version anterior (carpeta Documentos\INFORMES DR MEJIA):
# - las COPIAS se quitan solo si el original sigue en su lugar y es identico;
# - lo que se MOVIO regresa a donde estaba.
function Deshacer-Anterior {
    $regAnt = Join-Path $Anterior '_Registros (no borrar)'
    if (-not (Test-Path -LiteralPath $Anterior)) { Aviso 'No existe la carpeta INFORMES DR MEJIA: no hay nada que deshacer.'; return }
    $copias = @(Get-ChildItem -LiteralPath $regAnt -Filter 'copiados_*.csv')
    $movs   = @(Get-ChildItem -LiteralPath $regAnt -Filter 'movimientos_*.csv')
    $lista = @(); foreach ($l in $copias) { $lista += @(Import-Csv -LiteralPath $l.FullName) }
    $nMov = 0; foreach ($l in $movs) { $nMov += @(Import-Csv -LiteralPath $l.FullName).Count }
    Titulo 'Lo que hizo el programa anterior:'
    Write-Host "   $($lista.Count) informes COPIADOS  (se quitan las copias; los originales no se tocan)"
    Write-Host "   $nMov informes MOVIDOS   (regresan a donde estaban)"
    $r = Read-Host "`n   Deshacer todo eso? Escriba S y pulse Enter (N = no)"
    if ($r -notmatch '^\s*[sS]') { Aviso 'Cancelado.'; return }
    $quitadas = 0; $guardadas = 0
    foreach ($m in $lista) {
        if (-not (Test-Path -LiteralPath $m.Destino)) { continue }
        $hO = $null; if (Test-Path -LiteralPath $m.Origen) { $hO = Huella $m.Origen }
        if ($hO -and $hO -eq (Huella $m.Destino)) { Remove-Item -LiteralPath $m.Destino -Force; $quitadas++ }
        else {
            # El original ya no esta o cambio: la copia se regresa a su lugar en vez de quitarla
            if (-not (Test-Path -LiteralPath $m.Origen)) {
                New-Item -ItemType Directory -Path (Split-Path $m.Origen) -Force | Out-Null
                Move-Item -LiteralPath $m.Destino -Destination $m.Origen
            }
            $guardadas++
        }
    }
    $vuelta = 0; foreach ($l in $movs) { $vuelta += (Regresar $l.FullName)[0]; Rename-Item -LiteralPath $l.FullName -NewName ('deshecho_' + $l.Name) }
    foreach ($l in $copias) { Rename-Item -LiteralPath $l.FullName -NewName ('deshecho_' + $l.Name) }
    Borrar-Vacias $Anterior
    $resto = @(Get-ChildItem -LiteralPath $Anterior -Recurse -Force | Where-Object { -not $_.PSIsContainer -and $_.FullName -notlike "$regAnt*" })
    if ($resto.Count -eq 0) { Remove-Item -LiteralPath $Anterior -Recurse -Force }
    Remove-Item -LiteralPath (Join-Path $Escritorio 'INFORMES DR MEJIA.lnk') -Force
    Ok "$quitadas copias quitadas y $vuelta informes regresados a su lugar."
    if ($guardadas) { Aviso "$guardadas copias se conservaron porque su original ya no estaba igual." }
    if ($resto.Count) { Aviso "Quedaron $($resto.Count) archivos en $Anterior (no los creo el programa)." }
}

function Elegir-Carpeta {
    try {
        Add-Type -AssemblyName System.Windows.Forms
        $d = New-Object System.Windows.Forms.FolderBrowserDialog
        $d.Description = 'Elija la carpeta, USB o disco donde buscar'
        if ($d.ShowDialog() -eq 'OK') { return $d.SelectedPath }
    } catch {
        return (Read-Host '   Escriba la ruta de la carpeta')
    }
    return $null
}

function Discos {
    return @([IO.DriveInfo]::GetDrives() | Where-Object { $_.IsReady -and ($_.DriveType -eq 'Fixed' -or $_.DriveType -eq 'Removable') } |
        ForEach-Object {
            if ($_.Name -eq "$env:SystemDrive\") { $env:USERPROFILE } else { $_.RootDirectory.FullName }
        })
}

# ---------------- MENU ----------------
do {
    Clear-Host
    Write-Host '============================================================' -ForegroundColor Cyan
    Write-Host '                 INFORMES  DR.  MEJIA' -ForegroundColor White
    Write-Host '   Busca los informes del Dr. Nestor Jose Mejia Gonzalez' -ForegroundColor Gray
    Write-Host '   y los MUEVE a Documentos\DOCTOR MEJIA (duplicados aparte)' -ForegroundColor Gray
    Write-Host '============================================================' -ForegroundColor Cyan
    Write-Host "  Todo queda en: $Destino`n" -ForegroundColor Gray
    Write-Host '  1. Buscar en Escritorio, Descargas y Documentos'
    Write-Host '  2. Buscar en TODA la computadora (y USB conectadas)'
    Write-Host '  3. Buscar en una carpeta que yo elija (USB, disco, carpeta)'
    Write-Host '  4. Abrir la carpeta DOCTOR MEJIA'
    Write-Host '  5. DESHACER un movimiento'
    Write-Host '  6. DESHACER lo que hizo la version anterior (INFORMES DR MEJIA)'
    Write-Host '  0. Salir'
    Write-Host "`n  (Antes de mover, siempre le muestra lo que encontro y le pregunta.)" -ForegroundColor Gray
    $op = Read-Host "`n  Elija una opcion"
    switch ($op) {
        '1' { Buscar @($Escritorio, $Descargas, $Documentos) }
        '2' { Buscar (Discos) }
        '3' { $c = Elegir-Carpeta; if ($c -and (Test-Path -LiteralPath $c)) { Buscar @($c) } }
        '4' { New-Item -ItemType Directory -Path $Destino -Force | Out-Null; Invoke-Item $Destino }
        '5' { Deshacer }
        '6' { Deshacer-Anterior }
    }
    if ($op -ne '0') { Read-Host "`n  Pulse Enter para volver al menu" | Out-Null }
} while ($op -ne '0')
