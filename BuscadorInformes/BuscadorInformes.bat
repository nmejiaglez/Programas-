<# :
@echo off
REM ============================================================
REM  BUSCADOR DE INFORMES - un solo archivo. Doble clic para abrir.
REM  (La parte de abajo es el programa en PowerShell.)
REM ============================================================
title Buscador de Informes
set "ORG_BAT=%~f0"
powershell -NoProfile -ExecutionPolicy Bypass -STA -Command "Invoke-Expression ([IO.File]::ReadAllText($env:ORG_BAT))"
if errorlevel 1 (
  echo.
  echo  Ocurrio un problema. Tome una foto de esta pantalla.
  pause
)
exit /b
#>
# ============================================================
#  BUSCADOR DE INFORMES - Windows 7 / 8 / 10 / 11
#  Busca en la computadora los informes de un MEDICO (por defecto
#  ultrasonidos del Dr. Bismark Campos) leyendo DENTRO de cada
#  documento: texto, encabezado, pie de pagina (firma) y autor.
#  Los junta en una carpeta del Escritorio por ANO > MES.
#  Guarda un registro para DESHACER.
# ============================================================
$ErrorActionPreference = 'SilentlyContinue'
$Host.UI.RawUI.WindowTitle = 'Buscador de Informes'

$Escritorio = [Environment]::GetFolderPath('Desktop')
$Documentos = [Environment]::GetFolderPath('MyDocuments')
$Descargas  = Join-Path $env:USERPROFILE 'Downloads'
$Imagenes   = [Environment]::GetFolderPath('MyPictures')
$Fuentes = @($Escritorio, $Descargas, $Documentos, $Imagenes) | Where-Object { $_ -and (Test-Path -LiteralPath $_) } | Sort-Object -Unique

$Meses = @('01 - Enero','02 - Febrero','03 - Marzo','04 - Abril','05 - Mayo','06 - Junio',
           '07 - Julio','08 - Agosto','09 - Septiembre','10 - Octubre','11 - Noviembre','12 - Diciembre')

# ----- Lo que se busca (se puede cambiar al iniciar) -----
$Medico = 'Bismark Campos'
$Tipos = @(
  @('Ultrasonido', 'US',          'ultrason|ecograf|sonograf|doppler', @('us','usg','eco')),
  @('Tomografia',  'TAC',         'tomograf|angiotac',                 @('tc','tac','ct')),
  @('Resonancia',  'RM',          'resonancia',                        @('rm','rmn','mri')),
  @('Mamografia',  'MAMOGRAFIA',  'mamograf|mastograf',                @('mamo','mmg')),
  @('Radiografia', 'RX',          'radiograf|rayos x',                 @('rx')),
  @('Todos',       'INFORMES',    '',                                  @())
)
$Tipo = $Tipos[0]
$ExtBuscar = @('.doc','.docx','.rtf','.odt','.txt','.pdf')

function Titulo($t) { Write-Host "`n>> $t" -ForegroundColor Cyan }
function Ok($t)     { Write-Host "   [OK] $t" -ForegroundColor Green }
function Aviso($t)  { Write-Host "   [!] $t" -ForegroundColor Yellow }
function Pregunta-Si($p)     { return ((Read-Host $p) -match '^\s*[sS]') }

function Carpeta-Destino { return Join-Path $Escritorio ("{0} - DR {1}" -f $Tipo[1], $Medico.ToUpper()) }
function Registros { return Join-Path (Carpeta-Destino) '_Registros (no borrar)' }

# Quita tildes para comparar Bismark, BISMARK, Bismark con tilde...
function Sin-Tildes($t) {
    if (-not $t) { return '' }
    $d = $t.Normalize([Text.NormalizationForm]::FormD)
    return ([regex]::Replace($d, '\p{Mn}', '')).ToLower()
}
# "Bismark Campos" -> busca Bismark/Bismarck/Bismar y Campos (con o sin segundo nombre en medio)
function Patron-Medico($nombre) {
    $partes = @((Sin-Tildes $nombre) -split '\s+' | Where-Object { $_ })
    $ps = @()
    foreach ($p in $partes) {
        $x = [regex]::Escape($p)
        if ($p -match '^bism') { $x = 'bis+mar(c?k)?' }
        $ps += $x
    }
    return ($ps -join '[\s\.,_\-]*(?:[a-z]+[\s\.,_\-]+)?')
}

# ----- Leer el texto de los documentos (sin abrir Word) -----
function Leer-Zip($ruta, $filtro) {
    $t = ''
    try {
        Add-Type -AssemblyName System.IO.Compression.FileSystem
        $z = [IO.Compression.ZipFile]::OpenRead($ruta)
        try {
            foreach ($e in $z.Entries) {
                if ($e.FullName -match $filtro) {
                    $sr = New-Object IO.StreamReader($e.Open()); $t += ' ' + $sr.ReadToEnd(); $sr.Close()
                }
            }
        } finally { $z.Dispose() }
    } catch {}
    # Fin de parrafo, salto o tabulacion = espacio; las demas etiquetas se quitan sin separar palabras
    return (($t -replace '</w:p>|<w:br[^>]*>|<w:tab[^>]*>|</text:p>|</text:h>|</dc:creator>', ' ') -replace '<[^>]+>', '')
}
function Leer-Binario($ruta, $max) {
    try {
        $fs = [IO.File]::OpenRead($ruta); $n = [int][Math]::Min($fs.Length, $max)
        $b = New-Object byte[] $n; [void]$fs.Read($b, 0, $n); $fs.Close()
        return ,$b
    } catch { return $null }
}
# PDF: descomprime el contenido y junta el texto que esta entre parentesis
function Leer-Pdf($ruta) {
    try { Add-Type -AssemblyName System.IO.Compression } catch {}
    $b = Leer-Binario $ruta 8000000; if (-not $b) { return '' }
    $raw = [Text.Encoding]::GetEncoding(28591).GetString($b)
    $texto = New-Object Text.StringBuilder
    [void]$texto.Append($raw)
    $i = 0
    while ($true) {
        $i = $raw.IndexOf('stream', $i); if ($i -lt 0) { break }
        $ini = $i + 6
        if ($raw[$ini] -eq "`r") { $ini++ }; if ($raw[$ini] -eq "`n") { $ini++ }
        $fin = $raw.IndexOf('endstream', $ini); if ($fin -lt 0) { break }
        try {
            $ms = New-Object IO.MemoryStream($b, ($ini + 2), ([Math]::Max(0, $fin - $ini - 2)))
            # Se elige a mano el constructor de DESCOMPRIMIR (si no, PowerShell puede tomar el de comprimir)
            $ds = [IO.Compression.DeflateStream].GetConstructor([type[]]@([IO.Stream], [IO.Compression.CompressionMode])).Invoke([object[]]@(([IO.Stream]$ms), [IO.Compression.CompressionMode]::Decompress))
            $out = New-Object IO.MemoryStream; $buf = New-Object byte[] 65536
            while (($k = $ds.Read($buf, 0, $buf.Length)) -gt 0) { $out.Write($buf, 0, $k) }
            $ds.Close()
            $c = [Text.Encoding]::GetEncoding(28591).GetString($out.ToArray())
            foreach ($m in [regex]::Matches($c, '\(((?:\\.|[^\\)])*)\)')) { [void]$texto.Append($m.Groups[1].Value) }
            [void]$texto.Append(' ')
        } catch {}
        $i = $fin + 9
    }
    return $texto.ToString()
}
function Texto-De($a) {
    $ext = $a.Extension.ToLower()
    if ($ext -eq '.docx') { return Leer-Zip $a.FullName '^(word/(document|header\d*|footer\d*)\.xml|docProps/core\.xml)$' }
    if ($ext -eq '.odt')  { return Leer-Zip $a.FullName '^(content|styles|meta)\.xml$' }
    if ($ext -eq '.pdf')  { return Leer-Pdf $a.FullName }
    $b = Leer-Binario $a.FullName 3000000; if (-not $b) { return '' }
    return ([Text.Encoding]::GetEncoding(1252).GetString($b) + ' ' + [Text.Encoding]::Unicode.GetString($b))
}

function Es-Del-Tipo($a, $texto) {
    if (-not $Tipo[2]) { return $true }
    $n = (Sin-Tildes $a.BaseName)
    if ($n -match $Tipo[2]) { return $true }
    foreach ($t in $Tipo[3]) { if (($n -split '[^a-z0-9]+') -contains $t) { return $true } }
    $inicio = $texto; if ($inicio.Length -gt 8000) { $inicio = $inicio.Substring(0, 8000) }
    return ($inicio -match $Tipo[2])
}

function Nombre-Libre($carpeta, $nombre) {
    $ruta = Join-Path $carpeta $nombre
    if (-not (Test-Path -LiteralPath $ruta)) { return $ruta }
    $base = [IO.Path]::GetFileNameWithoutExtension($nombre); $ext = [IO.Path]::GetExtension($nombre); $i = 2
    while (Test-Path -LiteralPath (Join-Path $carpeta "$base ($i)$ext")) { $i++ }
    return (Join-Path $carpeta "$base ($i)$ext")
}
function Mismo-Contenido($a, $b) {
    if ((Get-Item -LiteralPath $a).Length -ne (Get-Item -LiteralPath $b).Length) { return $false }
    $md5 = [Security.Cryptography.MD5]::Create()
    $h = { param($r) $fs = [IO.File]::OpenRead($r); try { [BitConverter]::ToString($md5.ComputeHash($fs)) } finally { $fs.Close() } }
    return ((& $h $a) -eq (& $h $b))
}

# ----- Buscar -----
function Buscar($carpetas) {
    $destino = Carpeta-Destino
    $patron = Patron-Medico $Medico
    Titulo ("Buscando informes de {0} del Dr. {1}..." -f $Tipo[0], $Medico)
    Write-Host '   Se lee el contenido de cada Word y PDF. Puede tardar unos minutos.' -ForegroundColor Gray
    $hallados = @(); $n = 0
    foreach ($c in $carpetas) {
        if (-not (Test-Path -LiteralPath $c)) { continue }
        Write-Host "   Revisando $c ..." -ForegroundColor Gray
        $archivos = Get-ChildItem -LiteralPath $c -Recurse -Force | Where-Object {
            -not $_.PSIsContainer -and $ExtBuscar -contains $_.Extension.ToLower() -and $_.FullName -notlike "$destino*" -and
            $_.Name -notlike '~$*' -and -not ($_.Attributes -band [IO.FileAttributes]::Hidden) -and ((([int64]$_.Attributes) -band 0x401000) -eq 0) }
        foreach ($a in $archivos) {
            $n++; if ($n % 20 -eq 0) { Write-Progress -Activity 'Leyendo documentos' -Status "$n revisados - $($a.Name)" }
            $t = Sin-Tildes (Texto-De $a)
            $nombre = Sin-Tildes $a.BaseName
            if (-not ($t -match $patron -or $nombre -match $patron)) { continue }
            if (-not (Es-Del-Tipo $a $t)) { continue }
            $hallados += $a
        }
    }
    Write-Progress -Activity 'Leyendo documentos' -Completed
    Ok "$n documentos revisados."
    if ($hallados.Count -eq 0) {
        Aviso ("No se encontraron informes de {0} del Dr. {1}." -f $Tipo[0], $Medico)
        Write-Host '   Si estan en otro disco (D:, USB), use la opcion 2.' -ForegroundColor Gray
        return
    }

    Titulo ("Se encontraron {0} informes:" -f $hallados.Count)
    $hallados | Group-Object { $_.LastWriteTime.Year } | Sort-Object Name | ForEach-Object { Write-Host ("   {0}: {1} informes" -f $_.Name, $_.Count) }
    $hallados | Select-Object -First 15 | ForEach-Object { Write-Host ("   - {0}   ({1})" -f $_.Name, $_.DirectoryName) -ForegroundColor Gray }
    if ($hallados.Count -gt 15) { Write-Host "   ... y $($hallados.Count - 15) mas" -ForegroundColor Gray }
    Write-Host "`n   Se juntaran en: $destino  (por ano y mes)" -ForegroundColor White
    Write-Host '   M = MOVERLOS ahi (se sacan de donde estan)'
    Write-Host '   C = COPIARLOS ahi (los originales se quedan donde estan)'
    $r = (Read-Host '   Escriba M o C y pulse Enter (N = cancelar)').Trim().ToUpper()
    if ($r -ne 'M' -and $r -ne 'C') { Aviso 'Cancelado. No se movio nada.'; return }

    $log = @(); $iguales = 0; $fallos = 0
    foreach ($a in $hallados) {
        $f = $a.LastWriteTime
        $carp = Join-Path (Join-Path $destino $f.Year) $Meses[$f.Month - 1]
        New-Item -ItemType Directory -Path $carp -Force | Out-Null
        $ya = Join-Path $carp $a.Name
        if ((Test-Path -LiteralPath $ya) -and (Mismo-Contenido $a.FullName $ya)) {
            $iguales++
            if ($r -eq 'M') { $log += New-Object PSObject -Property @{ Accion = 'repetido'; Origen = $a.FullName; Destino = $ya } }
            continue
        }
        $nuevo = Nombre-Libre $carp $a.Name
        try {
            if ($r -eq 'M') { Move-Item -LiteralPath $a.FullName -Destination $nuevo -ErrorAction Stop; $acc = 'movido' }
            else { Copy-Item -LiteralPath $a.FullName -Destination $nuevo -ErrorAction Stop; $acc = 'copiado' }
            $log += New-Object PSObject -Property @{ Accion = $acc; Origen = $a.FullName; Destino = $nuevo }
        } catch { $fallos++ }
    }
    if ($log.Count) {
        New-Item -ItemType Directory -Path (Registros) -Force | Out-Null
        $log | Select-Object Accion, Origen, Destino | Export-Csv -LiteralPath (Join-Path (Registros) ('registro_' + (Get-Date -Format 'yyyy-MM-dd_HH-mm-ss') + '.csv')) -NoTypeInformation -Encoding UTF8
    }
    $hechos = @($log | Where-Object { $_.Accion -ne 'repetido' }).Count
    if ($r -eq 'M') { Ok "$hechos informes movidos." } else { Ok "$hechos informes copiados." }
    if ($iguales) { Ok "$iguales ya estaban en la carpeta (no se repitieron)." }
    if ($fallos) { Aviso "$fallos no se pudieron pasar (estaban abiertos). Cierre Word y repita." }
    Write-Host '   Si algo no le gusta, use la opcion 4 para DESHACER.' -ForegroundColor Gray
    Invoke-Item $destino
}

# ----- Deshacer -----
function Deshacer {
    $reg = Registros
    $logs = @(Get-ChildItem -LiteralPath $reg -Filter 'registro_*.csv' | Sort-Object LastWriteTime -Descending)
    if ($logs.Count -eq 0) { Aviso 'No hay nada que deshacer para esta busqueda.'; return }
    $ult = $logs[0]
    $filas = @(Import-Csv -LiteralPath $ult.FullName)
    if (-not (Pregunta-Si ("   Deshacer la ultima busqueda ({0} informes)? (S/N)" -f $filas.Count))) { Aviso 'Cancelado.'; return }
    $ok = 0
    foreach ($m in $filas) {
        if ($m.Accion -eq 'copiado') { Remove-Item -LiteralPath $m.Destino -Force; if ($?) { $ok++ } }
        elseif ($m.Accion -eq 'movido' -and (Test-Path -LiteralPath $m.Destino) -and -not (Test-Path -LiteralPath $m.Origen)) {
            New-Item -ItemType Directory -Path (Split-Path $m.Origen) -Force | Out-Null
            Move-Item -LiteralPath $m.Destino -Destination $m.Origen; if ($?) { $ok++ }
        }
    }
    Rename-Item -LiteralPath $ult.FullName -NewName ('deshecho_' + $ult.Name)
    # Quita carpetas de ano/mes que quedaron vacias
    Get-ChildItem -LiteralPath (Carpeta-Destino) -Recurse -Force | Where-Object { $_.PSIsContainer -and $_.FullName -notlike "$reg*" } |
        Sort-Object { $_.FullName.Length } -Descending | ForEach-Object { if (@(Get-ChildItem -LiteralPath $_.FullName -Force).Count -eq 0) { Remove-Item -LiteralPath $_.FullName -Force } }
    Ok "$ok informes regresaron a como estaban."
}

function Elegir-Carpeta {
    try {
        Add-Type -AssemblyName System.Windows.Forms
        $d = New-Object System.Windows.Forms.FolderBrowserDialog
        $d.Description = 'Elija la carpeta o disco donde buscar'
        if ($d.ShowDialog() -eq 'OK') { return $d.SelectedPath }
    } catch { return (Read-Host '   Escriba la ruta de la carpeta') }
    return $null
}

function Cambiar-Busqueda {
    $m = Read-Host "   Nombre del medico a buscar (Enter = $Medico)"
    if ($m.Trim()) { $script:Medico = $m.Trim() }
    Write-Host '   Tipo de estudio:'
    for ($i = 0; $i -lt $Tipos.Count; $i++) { Write-Host ("     {0}. {1}" -f ($i + 1), $Tipos[$i][0]) }
    $t = Read-Host "   Numero (Enter = $($Tipo[0]))"
    $k = 0; if ([int]::TryParse($t, [ref]$k) -and $k -ge 1 -and $k -le $Tipos.Count) { $script:Tipo = $Tipos[$k - 1] }
    Ok ("Ahora se buscan: {0} del Dr. {1}" -f $Tipo[0], $Medico)
}

# ---------------- MENU ----------------
do {
    Clear-Host
    Write-Host '============================================================' -ForegroundColor Cyan
    Write-Host '                 BUSCADOR  DE  INFORMES' -ForegroundColor White
    Write-Host ("   Buscando: {0} del Dr. {1}" -f $Tipo[0], $Medico) -ForegroundColor Yellow
    Write-Host ("   Carpeta:  Escritorio\{0}" -f (Split-Path (Carpeta-Destino) -Leaf)) -ForegroundColor Gray
    Write-Host '============================================================' -ForegroundColor Cyan
    Write-Host '  1. BUSCAR en esta computadora (Escritorio, Documentos, Descargas, Imagenes)  << empiece aqui'
    Write-Host '  2. Buscar en otro disco o carpeta (D:, USB, disco externo)'
    Write-Host '  3. Cambiar el medico o el tipo de estudio'
    Write-Host '  4. DESHACER la ultima busqueda'
    Write-Host '  5. Abrir la carpeta de resultados'
    Write-Host '  0. Salir'
    $op = Read-Host "`n  Elija una opcion"
    switch ($op) {
        '1' { Buscar $Fuentes }
        '2' { $c = Elegir-Carpeta; if ($c -and (Test-Path -LiteralPath $c)) { Buscar @($c) } }
        '3' { Cambiar-Busqueda }
        '4' { Deshacer }
        '5' { $d = Carpeta-Destino; New-Item -ItemType Directory -Path $d -Force | Out-Null; Invoke-Item $d }
    }
    if ($op -ne '0') { Read-Host "`n  Pulse Enter para volver al menu" | Out-Null }
} while ($op -ne '0')
