<# :
@echo off
REM ============================================================
REM  ORGANIZADOR PC - un solo archivo. Doble clic para abrir.
REM  (La parte de abajo es el programa en PowerShell.)
REM ============================================================
title Organizador PC
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
#  ORGANIZADOR PC - Windows 7 / 8 / 10 / 11
#  1) Junta en Documentos\ESTUDIOS los informes y archivos de
#     tomografia, resonancia, mamografia, ultrasonido y radiografia,
#     por MODALIDAD > ANO > MES (los saca de donde estaban).
#  2) Ordena lo demas en Documentos\ORGANIZADO por TIPO > ANO > MES.
#  Solo MUEVE (nunca borra) y guarda un registro para DESHACER todo.
# ============================================================
$ErrorActionPreference = 'SilentlyContinue'
$Host.UI.RawUI.WindowTitle = 'Organizador PC'

$Destino   = Join-Path ([Environment]::GetFolderPath('MyDocuments')) 'ORGANIZADO'
$Registros = Join-Path $Destino '_Registros (no borrar)'
$Estudios  = Join-Path ([Environment]::GetFolderPath('MyDocuments')) 'ESTUDIOS'
$Escritorio = [Environment]::GetFolderPath('Desktop')
$Documentos = [Environment]::GetFolderPath('MyDocuments')
$Descargas  = Join-Path $env:USERPROFILE 'Downloads'
$Imagenes   = [Environment]::GetFolderPath('MyPictures')
$Videos     = Join-Path $env:USERPROFILE 'Videos'
$Musica     = [Environment]::GetFolderPath('MyMusic')

$Meses = @('01 - Enero','02 - Febrero','03 - Marzo','04 - Abril','05 - Mayo','06 - Junio',
           '07 - Julio','08 - Agosto','09 - Septiembre','10 - Octubre','11 - Noviembre','12 - Diciembre')

# Tipo de archivo -> carpeta
$Categorias = @{
  'Word'                 = @('.doc','.docx','.docm','.dot','.dotx','.odt','.rtf','.wps')
  'PDF'                  = @('.pdf')
  'Excel'                = @('.xls','.xlsx','.xlsm','.xlsb','.csv','.ods')
  'PowerPoint'           = @('.ppt','.pptx','.pps','.ppsx','.odp')
  'Textos'               = @('.txt')
  'Imagenes y Fotos'     = @('.jpg','.jpeg','.png','.gif','.bmp','.heic','.heif','.webp','.tif','.tiff','.jfif')
  'Videos'               = @('.mp4','.avi','.mkv','.mov','.wmv','.3gp','.flv','.m4v','.mpg','.mpeg','.webm')
  'Musica y Audios'      = @('.mp3','.wav','.m4a','.ogg','.opus','.aac','.wma','.flac','.amr')
  'Comprimidos'          = @('.zip','.rar','.7z','.tar','.gz')
  'Instaladores'         = @('.exe','.msi')
  'Imagenes Medicas DICOM' = @('.dcm','.dicom')
  'Paginas Web'          = @('.html','.htm','.mht','.mhtml')
  'Libros'               = @('.epub','.mobi')
}

# Nunca se mueven: accesos directos, archivos del sistema, descargas a medias,
# scripts y programas (pueden dejar de funcionar si se mueven).
$NoMover = @('.lnk','.url','.ini','.db','.tmp','.crdownload','.part','.partial','.download',
             '.bat','.cmd','.ps1','.vbs','.sys','.dll','.log')
$NombresProtegidos = @('ExpedienteClinico*','OrganizadorPC*','desktop.ini','Thumbs.db','~$*')

function Titulo($t) { Write-Host "`n>> $t" -ForegroundColor Cyan }
function Ok($t)     { Write-Host "   [OK] $t" -ForegroundColor Green }
function Aviso($t)  { Write-Host "   [!] $t" -ForegroundColor Yellow }

function Categoria-De($archivo, $carpetaOrigen) {
    $ext = $archivo.Extension.ToLower()
    foreach ($k in $Categorias.Keys) {
        if ($Categorias[$k] -contains $ext) {
            # Los .exe/.msi solo se ordenan si estan en Descargas (en otros lugares pueden ser programas)
            if ($k -eq 'Instaladores' -and $carpetaOrigen -ne $Descargas) { return $null }
            return $k
        }
    }
    if ($ext -eq '') { return $null }
    return 'Otros'
}

function Esta-Protegido($archivo) {
    if ($NoMover -contains $archivo.Extension.ToLower()) { return $true }
    foreach ($n in $NombresProtegidos) { if ($archivo.Name -like $n) { return $true } }
    if ($archivo.Attributes -band [IO.FileAttributes]::Hidden) { return $true }
    if ($archivo.Attributes -band [IO.FileAttributes]::System) { return $true }
    return $false
}

# Fecha del archivo: en fotos usa la "fecha en que se tomo" si existe
Add-Type -AssemblyName System.Drawing
function Fecha-De($archivo) {
    $ext = $archivo.Extension.ToLower()
    if ($ext -eq '.jpg' -or $ext -eq '.jpeg') {
        try {
            $img = [System.Drawing.Image]::FromFile($archivo.FullName)
            try {
                $p = $img.GetPropertyItem(36867)
                $txt = [Text.Encoding]::ASCII.GetString($p.Value).Trim([char]0)
                $f = [datetime]::ParseExact($txt, 'yyyy:MM:dd HH:mm:ss', $null)
                if ($f.Year -gt 1990) { return $f }
            } finally { $img.Dispose() }
        } catch {}
    }
    # La fecha de modificacion es la mas fiable (la de creacion cambia al copiar)
    if ($archivo.LastWriteTime -lt $archivo.CreationTime) { return $archivo.LastWriteTime }
    return $archivo.CreationTime
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

function Archivos-De($carpeta, $subcarpetas) {
    if (-not (Test-Path -LiteralPath $carpeta)) { return @() }
    if ($subcarpetas) {
        $todos = Get-ChildItem -LiteralPath $carpeta -Recurse -Force | Where-Object { -not $_.PSIsContainer -and $_.FullName -notlike "$Destino*" -and $_.FullName -notlike "$Estudios*" }
    } else {
        $todos = Get-ChildItem -LiteralPath $carpeta -Force | Where-Object { -not $_.PSIsContainer }
    }
    return @($todos)
}

# Carpetas que NO se mueven: de programas (Outlook, Zoom...), ocultas o del sistema,
# o que contienen programas (.exe), correo de Outlook (.pst) o este organizador.
$CarpetasProtegidas = @('ORGANIZADO','ESTUDIOS','Outlook Files','Archivos de Outlook','Custom Office Templates',
  'Plantillas personalizadas de Office','Zoom','My Games','Mis juegos','Visual Studio*','SQL Server*',
  'IISExpress','My Web Sites','WindowsPowerShell','PowerShell','OneNote*','Blocs de notas de OneNote',
  'Fax','Scanned Documents','Documentos escaneados','Adobe','Sound recordings','Grabaciones de sonido',
  'My Shapes','Mis formas','Mis archivos recibidos','Bluetooth*','Rainmeter','Snagit','Camtasia*')
function Carpeta-Protegida($d) {
    if ($d.Attributes -band [IO.FileAttributes]::Hidden) { return $true }
    if ($d.Attributes -band [IO.FileAttributes]::System) { return $true }
    if ($d.Attributes -band [IO.FileAttributes]::ReparsePoint) { return $true }
    if ($d.FullName -like "$Destino*" -or $d.FullName -like "$Estudios*") { return $true }
    foreach ($e in @($Escritorio, $Documentos, $Descargas, $Imagenes, $Videos, $Musica)) { if ($d.FullName -eq $e) { return $true } }
    foreach ($n in $CarpetasProtegidas) { if ($d.Name -like $n) { return $true } }
    $peligro = Get-ChildItem -LiteralPath $d.FullName -Recurse -Force |
        Where-Object { -not $_.PSIsContainer -and (@('.exe','.dll','.pst','.ost','.bat','.cmd') -contains $_.Extension.ToLower() -or $_.Name -like 'ExpedienteClinico*' -or $_.Name -like 'OrganizadorPC*') } |
        Select-Object -First 1
    if ($peligro) { return $true }
    return $false
}

function Resumen($lista) {
    $lista | Group-Object Categoria | Sort-Object Name | ForEach-Object {
        $anios = ($_.Group | Group-Object Anio | Sort-Object Name | ForEach-Object { "$($_.Name): $($_.Count)" }) -join ', '
        Write-Host ("   {0,-24} {1,5}   ({2})" -f $_.Name, $_.Count, $anios)
    }
}

# ================= ESTUDIOS DE IMAGEN =================
# Modalidad -> palabras en el NOMBRE del archivo (o dentro del documento)
$Modalidades = @(
  @('Mamografia',            'mamograf|mastograf',               @('mamo','mmg','mx')),
  @('Resonancia Magnetica',  'resonancia',                       @('rm','rmn','irm','mri')),
  @('Tomografia',            'tomograf|angiotac|urotac',         @('tc','tac','ct')),
  @('Ultrasonido y Doppler', 'ultrason|ecograf|sonograf|doppler',@('us','usg','eco')),
  @('Radiografia',           'radiograf|rayos x',                @('rx'))
)
$DicomModalidad = @{ 'MG'='Mamografia'; 'MR'='Resonancia Magnetica'; 'CT'='Tomografia'; 'US'='Ultrasonido y Doppler';
                     'CR'='Radiografia'; 'DX'='Radiografia'; 'RF'='Radiografia'; 'XA'='Radiografia' }
$ExtDocumento = @('.doc','.docx','.rtf','.odt','.txt','.pdf')
$ExtImagen    = @('.jpg','.jpeg','.png','.bmp','.tif','.tiff')

function Modalidad-Nombre($nombre) {
    $n = $nombre.ToLower()
    $tokens = $n -split '[^a-z0-9]+'
    foreach ($m in $Modalidades) {
        if ($n -match $m[1]) { return $m[0] }
        foreach ($t in $m[2]) { if ($tokens -contains $t) { return $m[0] } }
    }
    return $null
}

# Texto del inicio de un documento Word/LibreOffice/RTF/TXT (sin abrir Word)
function Texto-De($a) {
    $ext = $a.Extension.ToLower()
    if ($ext -eq '.docx' -or $ext -eq '.odt') {
        $entrada = 'word/document.xml'; if ($ext -eq '.odt') { $entrada = 'content.xml' }
        try {
            Add-Type -AssemblyName System.IO.Compression.FileSystem
            $z = [IO.Compression.ZipFile]::OpenRead($a.FullName)
            try {
                $e = $z.GetEntry($entrada); if (-not $e) { return '' }
                $sr = New-Object IO.StreamReader($e.Open()); $t = $sr.ReadToEnd(); $sr.Close()
                $t = $t -replace '<[^>]+>', ' '
                if ($t.Length -gt 6000) { $t = $t.Substring(0, 6000) }
                return $t
            } finally { $z.Dispose() }
        } catch { return '' }
    }
    if ($ext -eq '.doc' -or $ext -eq '.rtf' -or $ext -eq '.txt') {
        try {
            $fs = [IO.File]::OpenRead($a.FullName); $n = [int][Math]::Min($fs.Length, 400000)
            $b = New-Object byte[] $n; [void]$fs.Read($b, 0, $n); $fs.Close()
            return ([Text.Encoding]::GetEncoding(1252).GetString($b) + ' ' + [Text.Encoding]::Unicode.GetString($b))
        } catch { return '' }
    }
    return ''
}

# La modalidad que aparece PRIMERO en el texto (el titulo del informe manda)
function Modalidad-Texto($t) {
    if (-not $t) { return $null }
    $mejor = $null; $pos = [int]::MaxValue
    foreach ($m in $Modalidades) {
        $x = [regex]::Match($t, $m[1], 'IgnoreCase')
        if ($x.Success -and $x.Index -lt $pos) { $pos = $x.Index; $mejor = $m[0] }
    }
    return $mejor
}

# Lee una etiqueta DICOM del grupo 0008: 0x60 = Modalidad, 0x20 = Fecha del estudio
function Etiqueta-Dicom($b, $elem) {
    $i = 0
    while ($true) {
        $i = [Array]::IndexOf($b, [byte]$elem, $i + 1)
        if ($i -lt 2 -or $i + 8 -ge $b.Length) { return $null }
        if ($b[$i - 2] -eq 8 -and $b[$i - 1] -eq 0 -and $b[$i + 1] -eq 0) {
            if ($b[$i + 2] -ge 65 -and $b[$i + 2] -le 90 -and $b[$i + 3] -ge 65 -and $b[$i + 3] -le 90) { $len = $b[$i + 4] + 256 * $b[$i + 5]; $ini = $i + 6 }
            else { $len = $b[$i + 2] + 256 * $b[$i + 3]; $ini = $i + 6 }
            if ($len -gt 0 -and $len -le 16 -and $ini + $len -le $b.Length) { return ([Text.Encoding]::ASCII.GetString($b, $ini, $len)).Trim([char]0, ' ') }
        }
    }
}
function Info-Dicom($ruta) {
    try {
        $fs = [IO.File]::OpenRead($ruta); $n = [int][Math]::Min($fs.Length, 131072)
        $b = New-Object byte[] $n; [void]$fs.Read($b, 0, $n); $fs.Close()
    } catch { return $null }
    $mod = Etiqueta-Dicom $b 0x60
    $fecha = $null; $f = Etiqueta-Dicom $b 0x20
    if ($f -match '^(\d{4})(\d\d)(\d\d)$') { try { $fecha = Get-Date -Year $matches[1] -Month $matches[2] -Day $matches[3] } catch {} }
    $nombre = 'Otros DICOM'; if ($mod -and $DicomModalidad.ContainsKey($mod)) { $nombre = $DicomModalidad[$mod] }
    return New-Object PSObject -Property @{ Modalidad = $nombre; Fecha = $fecha }
}

function Destino-Estudio($modalidad, $fecha) {
    return Join-Path (Join-Path (Join-Path $Estudios $modalidad) $fecha.Year) $Meses[$fecha.Month - 1]
}

# Quita las carpetas que quedaron vacias al sacar los estudios (nunca la carpeta raiz)
function Limpiar-Origen($rutas, $raices) {
    foreach ($r in ($rutas | Sort-Object { $_.Length } -Descending -Unique)) {
        $d = $r
        while ($d) {
            $dentro = $false; foreach ($x in $raices) { if ($d -ne $x -and $d.StartsWith($x)) { $dentro = $true } }
            if (-not $dentro -or -not (Test-Path -LiteralPath $d)) { break }
            if (@(Get-ChildItem -LiteralPath $d -Force).Count -gt 0) { break }
            Remove-Item -LiteralPath $d -Force
            $d = Split-Path $d
        }
    }
}

function Organizar-Estudios($carpetas) {
    Titulo 'Buscando estudios (tomografia, resonancia, mamografia, ultrasonido, radiografia)...'
    Write-Host '   Se revisan tambien las subcarpetas. Puede tardar unos minutos.' -ForegroundColor Gray
    $plan = @(); $revisados = 0
    foreach ($c in $carpetas) {
        if (-not (Test-Path -LiteralPath $c)) { continue }
        $todos = @(Get-ChildItem -LiteralPath $c -Recurse -Force | Where-Object { $_.FullName -notlike "$Destino*" -and $_.FullName -notlike "$Estudios*" })
        # Estudios DICOM completos (carpeta con DICOMDIR): se mueven enteros
        $dirsDicom = @($todos | Where-Object { -not $_.PSIsContainer -and $_.Name -eq 'DICOMDIR' } | ForEach-Object { $_.DirectoryName } | Where-Object { $_ -ne $c } | Sort-Object -Unique)
        foreach ($dd in $dirsDicom) {
            $muestra = Get-ChildItem -LiteralPath $dd -Recurse -Force | Where-Object { -not $_.PSIsContainer -and $_.Name -ne 'DICOMDIR' -and $_.Length -gt 2048 } | Select-Object -First 1
            $info = $null; if ($muestra) { $info = Info-Dicom $muestra.FullName }
            $item = Get-Item -LiteralPath $dd
            $mod = 'Otros DICOM'; $fecha = $item.LastWriteTime
            if ($info) { $mod = $info.Modalidad; if ($info.Fecha) { $fecha = $info.Fecha } }
            $plan += New-Object PSObject -Property @{ Archivo = $item; Categoria = $mod; Anio = $fecha.Year; Carpeta = (Destino-Estudio $mod $fecha) }
        }
        foreach ($a in $todos) {
            if ($a.PSIsContainer) { continue }
            if ($a.Attributes -band [IO.FileAttributes]::Hidden) { continue }
            $dentro = $false; foreach ($dd in $dirsDicom) { if ($a.FullName.StartsWith($dd + [IO.Path]::DirectorySeparatorChar)) { $dentro = $true } }
            if ($dentro -or (Esta-Protegido $a)) { continue }
            $ext = $a.Extension.ToLower(); $mod = $null; $fecha = Fecha-De $a
            $revisados++
            if ($revisados % 50 -eq 0) { Write-Progress -Activity 'Buscando estudios' -Status $a.Name }
            if ($ext -eq '.dcm' -or $ext -eq '.dicom') {
                $info = Info-Dicom $a.FullName; $mod = 'Otros DICOM'
                if ($info) { $mod = $info.Modalidad; if ($info.Fecha) { $fecha = $info.Fecha } }
            } elseif ($ExtDocumento -contains $ext) {
                $mod = Modalidad-Nombre $a.BaseName
                if (-not $mod) { $mod = Modalidad-Texto (Texto-De $a) }
            } elseif ($ExtImagen -contains $ext) {
                $mod = Modalidad-Nombre $a.BaseName
            }
            if (-not $mod) { continue }
            $plan += New-Object PSObject -Property @{ Archivo = $a; Categoria = $mod; Anio = $fecha.Year; Carpeta = (Destino-Estudio $mod $fecha) }
        }
    }
    Write-Progress -Activity 'Buscando estudios' -Completed
    if ($plan.Count -eq 0) { Aviso 'No se encontraron estudios de imagen.'; return }

    Titulo "Se encontraron $($plan.Count) estudios. Iran a ESTUDIOS > modalidad > ano > mes:"
    Resumen $plan
    $plan | Select-Object -First 15 | ForEach-Object { Write-Host ("   {0,-45} -> {1}" -f $_.Archivo.Name, $_.Categoria) -ForegroundColor Gray }
    if ($plan.Count -gt 15) { Write-Host "   ... y $($plan.Count - 15) mas" -ForegroundColor Gray }
    Write-Host "`n   Quedaran en: $Estudios" -ForegroundColor Gray
    Write-Host '   Se SACAN de donde estaban (no quedan copias repetidas).' -ForegroundColor Gray
    if ((Read-Host "`n   Juntar los ESTUDIOS ahora? Escriba S y pulse Enter (N = no)") -notmatch '^\s*[sS]') { Aviso 'Cancelado. No se movio nada.'; return }

    $movidos = Mover-Plan $plan
    Limpiar-Origen @($movidos | ForEach-Object { Split-Path $_.Origen }) $carpetas
    Crear-Acceso 'ESTUDIOS' $Estudios
    if ($movidos.Count) { Ok 'Abriendo la carpeta ESTUDIOS...'; Invoke-Item $Estudios }
}

# Mueve lo planeado, guarda el registro para Deshacer y devuelve lo movido
function Mover-Plan($plan) {
    New-Item -ItemType Directory -Path $Registros -Force | Out-Null
    $log = Join-Path $Registros ('movimientos_' + (Get-Date -Format 'yyyy-MM-dd_HH-mm-ss') + '.csv')
    $movidos = @(); $fallos = 0; $n = 0
    foreach ($p in $plan) {
        $n++
        Write-Progress -Activity 'Organizando' -Status $p.Archivo.Name -PercentComplete ($n * 100 / $plan.Count)
        New-Item -ItemType Directory -Path $p.Carpeta -Force | Out-Null
        $nuevo = Nombre-Libre $p.Carpeta $p.Archivo.Name
        try {
            Move-Item -LiteralPath $p.Archivo.FullName -Destination $nuevo -ErrorAction Stop
            $movidos += New-Object PSObject -Property @{ Origen = $p.Archivo.FullName; Destino = $nuevo }
        } catch { $fallos++ }
    }
    Write-Progress -Activity 'Organizando' -Completed
    if ($movidos.Count) { $movidos | Select-Object Origen, Destino | Export-Csv -LiteralPath $log -NoTypeInformation -Encoding UTF8 }
    Ok "$($movidos.Count) archivos y carpetas organizados."
    if ($fallos) { Aviso "$fallos no se movieron (estaban abiertos o en uso). Cierre los programas y repita." }
    Write-Host "   Si algo no le gusta, use la opcion 8 para DESHACER." -ForegroundColor Gray
    return ,$movidos
}

# Muestra lo que se va a ordenar en cada carpeta y PREGUNTA antes de mover.
function Organizar($carpetas, $subcarpetas) {
    $plan = @(); $planCarp = @()
    Titulo 'Revisando (puede tardar un poco)...'
    foreach ($c in $carpetas) {
        if (-not (Test-Path -LiteralPath $c)) { continue }
        $antes = $plan.Count; $quedan = 0
        foreach ($a in @(Archivos-De $c $subcarpetas)) {
            if (Esta-Protegido $a) { $quedan++; continue }
            $cat = Categoria-De $a $c
            if (-not $cat) { $quedan++; continue }
            $f = Fecha-De $a
            $carpetaDestino = Join-Path (Join-Path (Join-Path $Destino $cat) $f.Year) $Meses[$f.Month - 1]
            $plan += New-Object PSObject -Property @{ Archivo = $a; Categoria = $cat; Anio = $f.Year; Carpeta = $carpetaDestino }
        }
        $antesC = $planCarp.Count; $carpQuedan = 0
        if (-not $subcarpetas) {
            foreach ($d in @(Get-ChildItem -LiteralPath $c -Force | Where-Object { $_.PSIsContainer })) {
                if (Carpeta-Protegida $d) { if (-not ($d.Attributes -band [IO.FileAttributes]::Hidden) -and $d.FullName -ne $Destino -and $d.FullName -ne $Estudios) { $carpQuedan++ }; continue }
                $f = $d.LastWriteTime
                $carpetaDestino = Join-Path (Join-Path (Join-Path $Destino 'Carpetas') $f.Year) $Meses[$f.Month - 1]
                $planCarp += New-Object PSObject -Property @{ Archivo = $d; Categoria = 'Carpetas'; Anio = $f.Year; Carpeta = $carpetaDestino }
            }
        }
        Write-Host ("   {0}" -f $c) -ForegroundColor White
        Write-Host ("      {0} archivos y {1} carpetas para ordenar  |  se quedan: {2} archivos y {3} carpetas de programas" -f ($plan.Count - $antes), ($planCarp.Count - $antesC), $quedan, $carpQuedan) -ForegroundColor Gray
    }

    if ($plan.Count -eq 0 -and $planCarp.Count -eq 0) { Aviso 'No hay nada para ordenar en esas carpetas.'; return }

    $todo = @()
    if ($plan.Count) {
        Titulo "ARCHIVOS: se ordenaran $($plan.Count) por tipo > ano > mes:"
        Resumen $plan
        $r = Read-Host "`n   Ordenar los ARCHIVOS? Escriba S y pulse Enter (N = no)"
        if ($r -match '^\s*[sS]') { $todo += $plan }
    }
    if ($planCarp.Count) {
        Titulo "CARPETAS: se ordenaran $($planCarp.Count) por ano > mes (su contenido queda igual):"
        $planCarp | Select-Object -First 20 | ForEach-Object { Write-Host ("   {0,-40} -> Carpetas\{1}\{2}" -f $_.Archivo.Name, $_.Anio, (Split-Path $_.Carpeta -Leaf)) }
        if ($planCarp.Count -gt 20) { Write-Host "   ... y $($planCarp.Count - 20) carpetas mas" }
        $r = Read-Host "`n   Ordenar tambien las CARPETAS? Escriba S y pulse Enter (N = no)"
        if ($r -match '^\s*[sS]') { $todo += $planCarp }
    }
    if ($todo.Count -eq 0) { Aviso 'Cancelado. No se movio nada.'; return }
    $plan = $todo
    Write-Host "`n   Quedara todo en: $Destino" -ForegroundColor Gray

    $movidos = Mover-Plan $plan
    Crear-Acceso 'ORGANIZADO' $Destino
    if ($movidos.Count) { Ok 'Abriendo la carpeta ORGANIZADO...'; Invoke-Item $Destino }
}

function Crear-Acceso($nombre, $ruta) {
    $lnk = Join-Path $Escritorio "$nombre.lnk"
    if (Test-Path -LiteralPath $lnk) { return }
    try {
        $s = (New-Object -ComObject WScript.Shell).CreateShortcut($lnk)
        $s.TargetPath = $ruta; $s.Save()
        Ok "Acceso directo `"$nombre`" creado en el Escritorio."
    } catch {}
}

function Deshacer {
    $logs = @(Get-ChildItem -LiteralPath $Registros -Filter 'movimientos_*.csv' | Sort-Object Name -Descending)
    if ($logs.Count -eq 0) { Aviso 'No hay nada que deshacer.'; return }
    Titulo 'Organizaciones realizadas (la 1 es la mas reciente):'
    for ($i = 0; $i -lt $logs.Count -and $i -lt 10; $i++) {
        $cant = @(Import-Csv -LiteralPath $logs[$i].FullName).Count
        Write-Host ("   {0}. {1}  ({2} archivos)" -f ($i + 1), ($logs[$i].BaseName -replace 'movimientos_',''), $cant)
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
    Borrar-Vacias
    Ok "$vuelta archivos y carpetas regresaron a su lugar original."
    if ($fallos) { Aviso "$fallos no se pudieron regresar (ya se habian movido, borrado o estaban abiertos)." }
}

# Quita solo las carpetas Tipo\Ano\Mes que el organizador creo y quedaron vacias
function Borrar-Vacias {
    foreach ($raiz in @($Destino, $Estudios)) {
        if (-not (Test-Path -LiteralPath $raiz)) { continue }
        foreach ($cat in @(Get-ChildItem -LiteralPath $raiz -Force | Where-Object { $_.PSIsContainer -and $_.FullName -ne $Registros })) {
            foreach ($an in @(Get-ChildItem -LiteralPath $cat.FullName -Force | Where-Object { $_.PSIsContainer -and $_.Name -match '^\d{4}$' })) {
                foreach ($me in @(Get-ChildItem -LiteralPath $an.FullName -Force | Where-Object { $_.PSIsContainer -and $_.Name -match '^\d\d - ' })) {
                    if (@(Get-ChildItem -LiteralPath $me.FullName -Force).Count -eq 0) { Remove-Item -LiteralPath $me.FullName -Force }
                }
                if (@(Get-ChildItem -LiteralPath $an.FullName -Force).Count -eq 0) { Remove-Item -LiteralPath $an.FullName -Force }
            }
            if (@(Get-ChildItem -LiteralPath $cat.FullName -Force).Count -eq 0) { Remove-Item -LiteralPath $cat.FullName -Force }
        }
    }
}

function Elegir-Carpeta {
    try {
        Add-Type -AssemblyName System.Windows.Forms
        $d = New-Object System.Windows.Forms.FolderBrowserDialog
        $d.Description = 'Elija la carpeta que desea organizar'
        if ($d.ShowDialog() -eq 'OK') { return $d.SelectedPath }
    } catch {
        return (Read-Host '   Escriba la ruta de la carpeta')
    }
    return $null
}

function Diagnostico {
    Titulo 'Cuantos archivos sueltos hay en cada carpeta:'
    foreach ($par in @(@('Escritorio',$Escritorio),@('Descargas',$Descargas),@('Documentos',$Documentos),@('Imagenes',$Imagenes),@('Videos',$Videos),@('Musica',$Musica))) {
        $a = @(Archivos-De $par[1] $false | Where-Object { -not (Esta-Protegido $_) })
        $mb = [math]::Round((($a | Measure-Object Length -Sum).Sum) / 1MB, 1)
        Write-Host ("   {0,-12} {1,6} archivos  {2,9} MB" -f $par[0], $a.Count, $mb)
    }
    foreach ($raiz in @($Estudios, $Destino)) {
        if (-not (Test-Path -LiteralPath $raiz)) { continue }
        Titulo "Ya organizado en $(Split-Path $raiz -Leaf):"
        Get-ChildItem -LiteralPath $raiz | Where-Object { $_.PSIsContainer -and $_.FullName -ne $Registros } | ForEach-Object {
            $c = @(Get-ChildItem -LiteralPath $_.FullName -Recurse | Where-Object { -not $_.PSIsContainer }).Count
            Write-Host ("   {0,-24} {1,6} archivos" -f $_.Name, $c)
        }
    }
}

# ---------------- MENU ----------------
$Principales = @($Escritorio, $Descargas, $Documentos)
do {
    Clear-Host
    Write-Host '============================================================' -ForegroundColor Cyan
    Write-Host '                    ORGANIZADOR  PC' -ForegroundColor White
    Write-Host '   ESTUDIOS: tomografia, resonancia, mamografia, US, Rx > Ano > Mes' -ForegroundColor Gray
    Write-Host '   ORGANIZADO: lo demas por tipo (Word, PDF, Fotos...) > Ano > Mes' -ForegroundColor Gray
    Write-Host '============================================================' -ForegroundColor Cyan
    Write-Host "  Estudios en:  $Estudios" -ForegroundColor Gray
    Write-Host "  Lo demas en:  $Destino`n" -ForegroundColor Gray
    Write-Host '  1. Organizar TODO: primero los ESTUDIOS y luego lo demas  << recomendado'
    Write-Host '  2. Solo juntar ESTUDIOS (Escritorio, Descargas y Documentos)'
    Write-Host '  3. Buscar ESTUDIOS en otro disco o carpeta (D:, USB, disco externo)'
    Write-Host '  4. Organizar solo DESCARGAS'
    Write-Host '  5. Organizar solo ESCRITORIO'
    Write-Host '  6. Organizar Imagenes, Videos y Musica'
    Write-Host '  7. Organizar otra carpeta que yo elija'
    Write-Host '  8. DESHACER una organizacion'
    Write-Host '  9. Ver cuantos archivos hay en cada carpeta'
    Write-Host ' 10. Abrir las carpetas ESTUDIOS y ORGANIZADO'
    Write-Host '  0. Salir'
    Write-Host "`n  (Antes de mover, siempre le muestra que hara y le pregunta.)" -ForegroundColor Gray
    $op = Read-Host "`n  Elija una opcion"
    switch ($op) {
        '1' { Organizar-Estudios $Principales; Titulo 'Ahora lo demas (programas, imagenes, documentos...)'; Organizar $Principales $false }
        '2' { Organizar-Estudios $Principales }
        '3' { $c = Elegir-Carpeta; if ($c -and (Test-Path -LiteralPath $c)) { Organizar-Estudios @($c) } }
        '4' { Organizar @($Descargas) $false }
        '5' { Organizar @($Escritorio) $false }
        '6' { Organizar @($Imagenes, $Videos, $Musica) $false }
        '7' {
            $c = Elegir-Carpeta
            if ($c -and (Test-Path -LiteralPath $c)) {
                $sub = (Read-Host '   Ordenar tambien lo que esta dentro de sus subcarpetas? (S/N)') -match '^\s*[sS]'
                Organizar @($c) $sub
            }
        }
        '8' { Deshacer }
        '9' { Diagnostico }
        '10' { foreach ($x in @($Estudios, $Destino)) { New-Item -ItemType Directory -Path $x -Force | Out-Null; Invoke-Item $x } }
    }
    if ($op -ne '0') { Read-Host "`n  Pulse Enter para volver al menu" | Out-Null }
} while ($op -ne '0')
