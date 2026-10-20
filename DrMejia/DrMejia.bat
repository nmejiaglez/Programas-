<# :
@echo off
REM ============================================================
REM  INFORMES DR. MEJIA - un solo archivo. Doble clic para abrir.
REM  (La parte de abajo es el programa en PowerShell.)
REM ============================================================
title Dr. Mejia
set "DRM_BAT=%~f0"
powershell -NoProfile -ExecutionPolicy Bypass -STA -Command "Invoke-Expression ([IO.File]::ReadAllText($env:DRM_BAT))"
if errorlevel 1 (
  echo.
  echo  Ocurrio un problema. Tome una foto de esta pantalla.
  pause
)
exit /b
#>
# ============================================================
#  DR. MEJIA - Windows 7 / 8 / 10 / 11
#  Busca en toda la computadora los documentos del Dr. Nestor
#  Jose Mejia Gonzalez y los MUEVE a Documentos\DR MEJIA.
#  Cada documento queda UNA sola vez; las copias repetidas
#  tambien se quitan de donde estaban y van a DR MEJIA\_Repetidos.
#  Nunca borra nada.
# ============================================================
$ErrorActionPreference = 'SilentlyContinue'
$Host.UI.RawUI.WindowTitle = 'Dr. Mejia'

$Docs      = [Environment]::GetFolderPath('MyDocuments')
$Destino   = Join-Path $Docs 'DR MEJIA'
$Repetidos = Join-Path $Destino '_Repetidos'
$Escritorio = [Environment]::GetFolderPath('Desktop')
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


# Lugares donde buscar: la carpeta del usuario y los demas discos y USB
$Lugares = @([IO.DriveInfo]::GetDrives() | Where-Object { $_.IsReady -and ($_.DriveType -eq 'Fixed' -or $_.DriveType -eq 'Removable') } |
    ForEach-Object { if ($_.Name -eq "$env:SystemDrive\") { $env:USERPROFILE } else { $_.RootDirectory.FullName } })

Clear-Host
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host '                       DR.  MEJIA' -ForegroundColor White
Write-Host '   Reune todos los documentos del Dr. Mejia en una carpeta' -ForegroundColor Gray
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host "  Carpeta: $Destino"

# Lo que ya esta en DR MEJIA cuenta como "ya guardado"
$vistos = @{}
if (Test-Path -LiteralPath $Destino) {
    Get-ChildItem -LiteralPath $Destino -Force | Where-Object { -not $_.PSIsContainer } |
        ForEach-Object { $h = Huella $_.FullName; if ($h) { $vistos[$h] = 1 } }
}

Titulo 'Buscando (puede tardar varios minutos)...'
$plan = @()
foreach ($c in $Lugares) {
    Write-Host "   $c" -ForegroundColor White
    $lista = @(Get-ChildItem -LiteralPath $c -Recurse -Force | Where-Object {
        -not $_.PSIsContainer -and $Extensiones -contains $_.Extension.ToLower() -and
        $_.FullName -notlike "$Destino\*" -and $_.Name -notlike '~$*' -and
        $_.FullName -notlike "$env:USERPROFILE\AppData\*" -and
        -not ($_.Attributes -band [IO.FileAttributes]::Hidden) -and -not ($_.Attributes -band [IO.FileAttributes]::System) })
    $k = 0; $antes = $plan.Count
    foreach ($a in $lista) {
        $k++
        Write-Progress -Activity 'Revisando archivos' -Status $a.Name -PercentComplete ($k * 100 / $lista.Count)
        $ok = Es-Del-Doctor $a.FullName
        if (-not $ok) { $ok = Es-Del-Doctor (Texto-De $a) }
        if ($ok) { $plan += New-Object PSObject -Property @{ Archivo = $a; Huella = (Huella $a.FullName); Fecha = (Fecha-De $a) } }
    }
    Write-Progress -Activity 'Revisando archivos' -Completed
    Write-Host ("      {0} del Dr. Mejia" -f ($plan.Count - $antes)) -ForegroundColor Gray
}

if ($plan.Count -eq 0) {
    Aviso 'No se encontraron documentos del Dr. Mejia fuera de la carpeta DR MEJIA.'
    Read-Host "`n  Pulse Enter para salir" | Out-Null; return
}

# El mas antiguo de cada documento se queda; las copias exactas van a _Repetidos
$unicos = 0; $dobles = 0
foreach ($p in ($plan | Sort-Object Fecha)) {
    if ($p.Huella -and $vistos.ContainsKey($p.Huella)) { $p | Add-Member NoteProperty Carpeta $Repetidos; $dobles++ }
    else { if ($p.Huella) { $vistos[$p.Huella] = 1 }; $p | Add-Member NoteProperty Carpeta $Destino; $unicos++ }
}

Titulo "Encontrados: $($plan.Count) documentos del Dr. Mejia"
Write-Host "   $unicos distintos   -> DR MEJIA" -ForegroundColor White
Write-Host "   $dobles repetidos   -> DR MEJIA\_Repetidos (no se borran)" -ForegroundColor White
$r = Read-Host "`n   MOVERLOS AHORA? Escriba S y pulse Enter (N = no)"
if ($r -notmatch '^\s*[sS]') { Aviso 'Cancelado. No se movio nada.'; Read-Host "`n  Pulse Enter para salir" | Out-Null; return }

$movidos = 0; $fallos = 0; $n = 0
foreach ($p in $plan) {
    $n++
    Write-Progress -Activity 'Moviendo' -Status $p.Archivo.Name -PercentComplete ($n * 100 / $plan.Count)
    New-Item -ItemType Directory -Path $p.Carpeta -Force | Out-Null
    try { Move-Item -LiteralPath $p.Archivo.FullName -Destination (Nombre-Libre $p.Carpeta $p.Archivo.Name) -ErrorAction Stop; $movidos++ } catch { $fallos++ }
}
Write-Progress -Activity 'Moviendo' -Completed
Ok "$movidos documentos movidos."
if ($fallos) { Aviso "$fallos no se movieron (estaban abiertos). Cierre Word y vuelva a abrir este programa." }

$lnk = Join-Path $Escritorio 'DR MEJIA.lnk'
if (-not (Test-Path -LiteralPath $lnk)) {
    try { $s = (New-Object -ComObject WScript.Shell).CreateShortcut($lnk); $s.TargetPath = $Destino; $s.Save(); Ok 'Acceso directo "DR MEJIA" en el Escritorio.' } catch {}
}
Invoke-Item $Destino
Read-Host "`n  Pulse Enter para salir" | Out-Null
