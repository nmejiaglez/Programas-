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
#  archivo y lo que esta ESCRITO adentro, y los reune en una
#  sola carpeta ordenada por ANO y MES.
#  Puede COPIAR (deja el original) o MOVER (con DESHACER).
#  Nunca borra nada.
# ============================================================
$ErrorActionPreference = 'SilentlyContinue'
$Host.UI.RawUI.WindowTitle = 'Informes Dr. Mejia'

$Destino   = Join-Path ([Environment]::GetFolderPath('MyDocuments')) 'INFORMES DR MEJIA'
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

# Mismo archivo ya reunido antes (mismo nombre y mismo tamano) -> no se repite
function Ya-Reunido($a) {
    if (-not (Test-Path -LiteralPath $Destino)) { return $false }
    if (-not $script:Indice) {
        $script:Indice = @{}
        Get-ChildItem -LiteralPath $Destino -Recurse -Force | Where-Object { -not $_.PSIsContainer } |
            ForEach-Object { $script:Indice["$($_.Name.ToLower())|$($_.Length)"] = 1 }
    }
    return $script:Indice.ContainsKey("$($a.Name.ToLower())|$($a.Length)")
}

function Buscar($carpetas) {
    $script:Indice = $null
    $plan = @(); $repetidos = 0
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
            if ($motivo) { $motivo = "nombre: $motivo" } else {
                $m = Es-Del-Doctor (Texto-De $a)
                if ($m) { $motivo = "contenido: $m" }
            }
            if (-not $motivo) { continue }
            if (Ya-Reunido $a) { $repetidos++; continue }
            $f = Fecha-De $a
            $plan += New-Object PSObject -Property @{ Archivo = $a; Motivo = $motivo; Anio = $f.Year
                Carpeta = Join-Path (Join-Path $Destino $f.Year) $Meses[$f.Month - 1] }
        }
        Write-Progress -Activity 'Revisando archivos' -Completed
        Write-Host ("      {0} archivos revisados, {1} son del Dr. Mejia" -f $lista.Count, ($plan.Count - $antes)) -ForegroundColor Gray
    }
    if ($repetidos) { Aviso "$repetidos ya estaban en la carpeta INFORMES DR MEJIA (no se repiten)." }
    if ($plan.Count -eq 0) { Aviso 'No se encontraron informes nuevos del Dr. Mejia.'; return }

    Titulo "Se encontraron $($plan.Count) informes:"
    $plan | Select-Object -First 25 | ForEach-Object { Write-Host ("   {0,-45} ({1})" -f $_.Archivo.Name, $_.Motivo) }
    if ($plan.Count -gt 25) { Write-Host "   ... y $($plan.Count - 25) mas" }
    Write-Host ''
    $plan | Group-Object Anio | Sort-Object Name | ForEach-Object { Write-Host ("   Ano {0}: {1} informes" -f $_.Name, $_.Count) -ForegroundColor Gray }

    Write-Host "`n   C = COPIAR (el original se queda donde esta, recomendado)"
    Write-Host   '   M = MOVER  (se quita de donde esta; se puede DESHACER)'
    Write-Host   '   N = no hacer nada'
    $r = Read-Host '   Escriba C, M o N y pulse Enter'
    if ($r -match '^\s*[cC]') { $mover = $false }
    elseif ($r -match '^\s*[mM]') { $mover = $true }
    else { Aviso 'Cancelado. No se toco nada.'; return }

    New-Item -ItemType Directory -Path $Registros -Force | Out-Null
    $log = Join-Path $Registros ((@('copiados_','movimientos_')[[int]$mover]) + (Get-Date -Format 'yyyy-MM-dd_HH-mm-ss') + '.csv')
    $hechos = @(); $fallos = 0; $n = 0
    foreach ($p in $plan) {
        $n++
        Write-Progress -Activity 'Reuniendo informes' -Status $p.Archivo.Name -PercentComplete ($n * 100 / $plan.Count)
        New-Item -ItemType Directory -Path $p.Carpeta -Force | Out-Null
        $nuevo = Nombre-Libre $p.Carpeta $p.Archivo.Name
        try {
            if ($mover) { Move-Item -LiteralPath $p.Archivo.FullName -Destination $nuevo -ErrorAction Stop }
            else { Copy-Item -LiteralPath $p.Archivo.FullName -Destination $nuevo -ErrorAction Stop }
            $hechos += New-Object PSObject -Property @{ Origen = $p.Archivo.FullName; Destino = $nuevo }
        } catch { $fallos++ }
    }
    Write-Progress -Activity 'Reuniendo informes' -Completed
    if ($hechos.Count) { $hechos | Select-Object Origen, Destino | Export-Csv -LiteralPath $log -NoTypeInformation -Encoding UTF8 }
    Ok "$($hechos.Count) informes reunidos en: $Destino"
    if ($fallos) { Aviso "$fallos no se pudieron copiar/mover (estaban abiertos). Cierre Word y repita." }
    if ($mover) { Write-Host '   Si algo no le gusta, use la opcion 5 para DESHACER.' -ForegroundColor Gray }
    Crear-Acceso
    if ($hechos.Count) { Invoke-Item $Destino }
}

function Crear-Acceso {
    $lnk = Join-Path $Escritorio 'INFORMES DR MEJIA.lnk'
    if (Test-Path -LiteralPath $lnk) { return }
    try {
        $s = (New-Object -ComObject WScript.Shell).CreateShortcut($lnk)
        $s.TargetPath = $Destino; $s.Save()
        Ok 'Acceso directo "INFORMES DR MEJIA" creado en el Escritorio.'
    } catch {}
}

function Deshacer {
    $logs = @(Get-ChildItem -LiteralPath $Registros -Filter 'movimientos_*.csv' | Sort-Object Name -Descending)
    if ($logs.Count -eq 0) { Aviso 'No hay movimientos que deshacer (las copias no hace falta deshacerlas).'; return }
    Titulo 'Movimientos realizados (el 1 es el mas reciente):'
    for ($i = 0; $i -lt $logs.Count -and $i -lt 10; $i++) {
        $cant = @(Import-Csv -LiteralPath $logs[$i].FullName).Count
        Write-Host ("   {0}. {1}  ({2} informes)" -f ($i + 1), ($logs[$i].BaseName -replace 'movimientos_',''), $cant)
    }
    $op = Read-Host "`n   Numero a deshacer (Enter = cancelar)"
    $k = 0
    if (-not [int]::TryParse($op, [ref]$k) -or $k -lt 1 -or $k -gt $logs.Count) { Aviso 'Cancelado.'; return }
    $vuelta = 0; $fallos = 0
    foreach ($m in (Import-Csv -LiteralPath $logs[$k - 1].FullName)) {
        if ((Test-Path -LiteralPath $m.Destino) -and -not (Test-Path -LiteralPath $m.Origen)) {
            New-Item -ItemType Directory -Path (Split-Path $m.Origen) -Force | Out-Null
            try { Move-Item -LiteralPath $m.Destino -Destination $m.Origen -ErrorAction Stop; $vuelta++ } catch { $fallos++ }
        } else { $fallos++ }
    }
    Rename-Item -LiteralPath $logs[$k - 1].FullName -NewName ('deshecho_' + $logs[$k - 1].Name)
    # Quita las carpetas Ano\Mes que quedaron vacias
    foreach ($an in @(Get-ChildItem -LiteralPath $Destino -Force | Where-Object { $_.PSIsContainer -and $_.Name -match '^\d{4}$' })) {
        foreach ($me in @(Get-ChildItem -LiteralPath $an.FullName -Force | Where-Object { $_.PSIsContainer })) {
            if (@(Get-ChildItem -LiteralPath $me.FullName -Force).Count -eq 0) { Remove-Item -LiteralPath $me.FullName -Force }
        }
        if (@(Get-ChildItem -LiteralPath $an.FullName -Force).Count -eq 0) { Remove-Item -LiteralPath $an.FullName -Force }
    }
    Ok "$vuelta informes regresaron a su lugar original."
    if ($fallos) { Aviso "$fallos no se pudieron regresar (ya se habian movido, borrado o estaban abiertos)." }
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
    Write-Host '   (Word, PDF, texto) y los reune en una sola carpeta' -ForegroundColor Gray
    Write-Host '============================================================' -ForegroundColor Cyan
    Write-Host "  Todo queda en: $Destino`n" -ForegroundColor Gray
    Write-Host '  1. Buscar en Escritorio, Descargas y Documentos'
    Write-Host '  2. Buscar en TODA la computadora (y USB conectadas)'
    Write-Host '  3. Buscar en una carpeta que yo elija (USB, disco, carpeta)'
    Write-Host '  4. Abrir la carpeta INFORMES DR MEJIA'
    Write-Host '  5. DESHACER un movimiento'
    Write-Host '  0. Salir'
    Write-Host "`n  (Antes de copiar o mover, siempre le muestra lo que encontro y le pregunta.)" -ForegroundColor Gray
    $op = Read-Host "`n  Elija una opcion"
    switch ($op) {
        '1' { Buscar @($Escritorio, $Descargas, $Documentos) }
        '2' { Buscar (Discos) }
        '3' { $c = Elegir-Carpeta; if ($c -and (Test-Path -LiteralPath $c)) { Buscar @($c) } }
        '4' { New-Item -ItemType Directory -Path $Destino -Force | Out-Null; Invoke-Item $Destino }
        '5' { Deshacer }
    }
    if ($op -ne '0') { Read-Host "`n  Pulse Enter para volver al menu" | Out-Null }
} while ($op -ne '0')
