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
#  Deja TODO en UNA sola carpeta del Escritorio: ORGANIZADO
#    ESTUDIOS   : tomografia, resonancia, mamografia, US, Rx > ANO > MES
#    DOCUMENTOS : Word, PDF, Excel... > ANO > MES
#    FOTOS, VIDEOS Y MUSICA > ANO > MES
#    PROGRAMAS  : carpetas de programas, accesos directos, instaladores
#    CARPETAS   : sus otras carpetas completas > ANO > MES
#    OTROS
#  Solo MUEVE (nunca borra archivos) y guarda un registro para DESHACER.
# ============================================================
$ErrorActionPreference = 'SilentlyContinue'
$Host.UI.RawUI.WindowTitle = 'Organizador PC'

$Escritorio = [Environment]::GetFolderPath('Desktop')
$Documentos = [Environment]::GetFolderPath('MyDocuments')
$Descargas  = Join-Path $env:USERPROFILE 'Downloads'
$Imagenes   = [Environment]::GetFolderPath('MyPictures')
$Videos     = Join-Path $env:USERPROFILE 'Videos'
$Musica     = [Environment]::GetFolderPath('MyMusic')
$Raiz       = Join-Path $Escritorio 'ORGANIZADO'
$Estudios   = Join-Path $Raiz 'ESTUDIOS'
$Programas  = Join-Path $Raiz 'PROGRAMAS'
$Registros  = Join-Path $Raiz '_Registros (no borrar)'
$Antiguos   = @((Join-Path $Documentos 'ORGANIZADO'), (Join-Path $Documentos 'ESTUDIOS'))
$EsteArchivo = $env:ORG_BAT
$Fuentes = @($Escritorio, $Descargas, $Documentos, $Imagenes, $Videos, $Musica) | Where-Object { $_ -and (Test-Path -LiteralPath $_) } | Sort-Object -Unique

$Meses = @('01 - Enero','02 - Febrero','03 - Marzo','04 - Abril','05 - Mayo','06 - Junio',
           '07 - Julio','08 - Agosto','09 - Septiembre','10 - Octubre','11 - Noviembre','12 - Diciembre')

# Tipo de archivo -> carpeta, y cada tipo dentro de su grupo
$Categorias = @{
  'Word'             = @('.doc','.docx','.docm','.dot','.dotx','.odt','.rtf','.wps')
  'PDF'              = @('.pdf')
  'Excel'            = @('.xls','.xlsx','.xlsm','.xlsb','.csv','.ods')
  'PowerPoint'       = @('.ppt','.pptx','.pps','.ppsx','.odp')
  'Textos'           = @('.txt')
  'Libros'           = @('.epub','.mobi')
  'Imagenes y Fotos' = @('.jpg','.jpeg','.png','.gif','.bmp','.heic','.heif','.webp','.tif','.tiff','.jfif')
  'Videos'           = @('.mp4','.avi','.mkv','.mov','.wmv','.3gp','.flv','.m4v','.mpg','.mpeg','.webm')
  'Musica y Audios'  = @('.mp3','.wav','.m4a','.ogg','.opus','.aac','.wma','.flac','.amr')
  'Comprimidos'      = @('.zip','.rar','.7z','.tar','.gz')
  'Paginas Web'      = @('.html','.htm','.mht','.mhtml')
}
$Grupo = @{ 'Word'='DOCUMENTOS'; 'PDF'='DOCUMENTOS'; 'Excel'='DOCUMENTOS'; 'PowerPoint'='DOCUMENTOS'; 'Textos'='DOCUMENTOS'; 'Libros'='DOCUMENTOS';
            'Imagenes y Fotos'='FOTOS, VIDEOS Y MUSICA'; 'Videos'='FOTOS, VIDEOS Y MUSICA'; 'Musica y Audios'='FOTOS, VIDEOS Y MUSICA';
            'Comprimidos'='OTROS'; 'Paginas Web'='OTROS'; 'Otros'='OTROS' }

# Nunca se mueven: archivos de sistema, descargas a medias, piezas de programas sueltas
$NoMover = @('.ini','.db','.tmp','.crdownload','.part','.partial','.download','.sys','.dll')
$ExtPrograma = @('.exe','.msi','.bat','.cmd','.ps1','.vbs','.dll')

# Carpetas que Windows u otros programas necesitan en su lugar
$CarpetasProtegidas = @('ORGANIZADO','ESTUDIOS','Outlook Files','Archivos de Outlook','Custom Office Templates',
  'Plantillas personalizadas de Office','My Games','Mis juegos','Visual Studio*','SQL Server*','IISExpress','My Web Sites',
  'WindowsPowerShell','PowerShell','OneNote*','Blocs de notas de OneNote','Fax','Scanned Documents','Documentos escaneados',
  'Sound recordings','Grabaciones de sonido','My Shapes','Mis formas','Saved Pictures','Camera Roll','Im*genes guardadas',
  '*lbum de c*mara','Screenshots','Capturas de pantalla','Captures','Capturas','Zoom','Rainmeter')

function Titulo($t) { Write-Host "`n>> $t" -ForegroundColor Cyan }
function Ok($t)     { Write-Host "   [OK] $t" -ForegroundColor Green }
function Aviso($t)  { Write-Host "   [!] $t" -ForegroundColor Yellow }

# ================= FECHAS Y NOMBRES =================
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
function AnioMes($base, $fecha) { return Join-Path (Join-Path $base $fecha.Year) $Meses[$fecha.Month - 1] }

function Nombre-Libre($carpeta, $nombre) {
    $ruta = Join-Path $carpeta $nombre
    if (-not (Test-Path -LiteralPath $ruta)) { return $ruta }
    $base = [IO.Path]::GetFileNameWithoutExtension($nombre)
    $ext  = [IO.Path]::GetExtension($nombre)
    $i = 2
    while (Test-Path -LiteralPath (Join-Path $carpeta "$base ($i)$ext")) { $i++ }
    return (Join-Path $carpeta "$base ($i)$ext")
}

# ================= ESTUDIOS DE IMAGEN =================
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

function Item($obj, $cat, $carpeta, $grupo) {
    return New-Object PSObject -Property @{ Archivo = $obj; Categoria = $cat; Carpeta = $carpeta; Grupo = $grupo }
}

# Si un archivo es un estudio, devuelve el plan para moverlo a ESTUDIOS
function Estudio-De($a) {
    $ext = $a.Extension.ToLower(); $mod = $null; $fecha = Fecha-De $a
    if ($ext -eq '.dcm' -or $ext -eq '.dicom') {
        $info = Info-Dicom $a.FullName; $mod = 'Otros DICOM'
        if ($info) { $mod = $info.Modalidad; if ($info.Fecha) { $fecha = $info.Fecha } }
    } elseif ($ExtDocumento -contains $ext) {
        $mod = Modalidad-Nombre $a.BaseName
        if (-not $mod) { $mod = Modalidad-Texto (Texto-De $a) }
    } elseif ($ExtImagen -contains $ext) {
        $mod = Modalidad-Nombre $a.BaseName
    }
    if (-not $mod) { return $null }
    return Item $a $mod (AnioMes (Join-Path $Estudios $mod) $fecha) 'ESTUDIOS'
}
function Estudio-Cd($dir) {
    $muestra = Get-ChildItem -LiteralPath $dir.FullName -Recurse -Force | Where-Object { -not $_.PSIsContainer -and $_.Name -ne 'DICOMDIR' -and $_.Length -gt 2048 } | Select-Object -First 1
    $info = $null; if ($muestra) { $info = Info-Dicom $muestra.FullName }
    $mod = 'Otros DICOM'; $fecha = $dir.LastWriteTime
    if ($info) { $mod = $info.Modalidad; if ($info.Fecha) { $fecha = $info.Fecha } }
    return Item $dir $mod (AnioMes (Join-Path $Estudios $mod) $fecha) 'ESTUDIOS'
}

# ================= CLASIFICACION =================
function Esta-Protegido($a) {
    if ($NoMover -contains $a.Extension.ToLower()) { return $true }
    foreach ($n in @('desktop.ini','Thumbs.db','~$*')) { if ($a.Name -like $n) { return $true } }
    if ($EsteArchivo -and $a.FullName -eq $EsteArchivo) { return $true }
    if ($a.Attributes -band [IO.FileAttributes]::Hidden) { return $true }
    if ($a.Attributes -band [IO.FileAttributes]::System) { return $true }
    return $false
}

# Archivo suelto (que no es estudio) -> a donde va
function Destino-Archivo($a) {
    if (Esta-Protegido $a) { return $null }
    $ext = $a.Extension.ToLower()
    if ($ext -eq '.lnk' -or $ext -eq '.url') { return Item $a 'Accesos directos' (Join-Path $Programas 'Accesos directos') 'PROGRAMAS' }
    if ($ext -eq '.exe' -or $ext -eq '.msi') { return Item $a 'Instaladores' (Join-Path $Programas 'Instaladores') 'PROGRAMAS' }
    if (@('.bat','.cmd','.ps1','.vbs') -contains $ext) { return Item $a 'Scripts' (Join-Path $Programas 'Scripts') 'PROGRAMAS' }
    if ($a.Name -like 'ExpedienteClinico*') { return Item $a 'Expediente Clinico' (Join-Path $Programas 'Expediente Clinico') 'PROGRAMAS' }
    $cat = 'Otros'
    foreach ($k in $Categorias.Keys) { if ($Categorias[$k] -contains $ext) { $cat = $k } }
    $g = $Grupo[$cat]
    $base = Join-Path $Raiz $g
    if ($cat -ne 'Otros') { $base = Join-Path $base $cat }
    return Item $a $cat (AnioMes $base (Fecha-De $a)) $g
}

# Carpeta de primer nivel -> 'proteger', 'cd' (estudio DICOM), 'programa' o 'normal'
function Tipo-Carpeta($d) {
    if ($d.Attributes -band [IO.FileAttributes]::Hidden) { return 'proteger' }
    if ($d.Attributes -band [IO.FileAttributes]::System) { return 'proteger' }
    if ($d.Attributes -band [IO.FileAttributes]::ReparsePoint) { return 'proteger' }
    if ($d.FullName -eq $Raiz -or $Antiguos -contains $d.FullName) { return 'proteger' }
    foreach ($e in $Fuentes) { if ($d.FullName -eq $e) { return 'proteger' } }
    foreach ($n in $CarpetasProtegidas) { if ($d.Name -like $n) { return 'proteger' } }
    if ($EsteArchivo -and $EsteArchivo.StartsWith($d.FullName + [IO.Path]::DirectorySeparatorChar)) { return 'proteger' }
    $todo = @(Get-ChildItem -LiteralPath $d.FullName -Recurse -Force | Where-Object { -not $_.PSIsContainer })
    if ($todo | Where-Object { $_.Extension -eq '.pst' -or $_.Extension -eq '.ost' } | Select-Object -First 1) { return 'proteger' }
    if (Test-Path -LiteralPath (Join-Path $d.FullName 'DICOMDIR')) { return 'cd' }
    if ($todo | Where-Object { $ExtPrograma -contains $_.Extension.ToLower() -or $_.Name -like 'ExpedienteClinico*' } | Select-Object -First 1) { return 'programa' }
    return 'normal'
}

# Estudios guardados dentro de una carpeta normal (y sus subcarpetas)
function Estudios-Dentro($d) {
    $res = @()
    $todos = @(Get-ChildItem -LiteralPath $d.FullName -Recurse -Force)
    $cds = @($todos | Where-Object { -not $_.PSIsContainer -and $_.Name -eq 'DICOMDIR' } | ForEach-Object { $_.DirectoryName } | Sort-Object -Unique)
    foreach ($cd in $cds) { $res += Estudio-Cd (Get-Item -LiteralPath $cd) }
    foreach ($a in $todos) {
        if ($a.PSIsContainer -or (Esta-Protegido $a)) { continue }
        $dentro = $false; foreach ($cd in $cds) { if ($a.FullName.StartsWith($cd + [IO.Path]::DirectorySeparatorChar)) { $dentro = $true } }
        if ($dentro) { continue }
        $e = Estudio-De $a
        if ($e) { $res += $e }
    }
    return $res
}

# Revisa las carpetas y arma el plan completo (no mueve nada)
function Planear($fuentes, $soloEstudios) {
    $plan = @(); $quedan = 0; $n = 0
    foreach ($c in $fuentes) {
        if (-not (Test-Path -LiteralPath $c)) { continue }
        Write-Host "   Revisando $c ..." -ForegroundColor Gray
        foreach ($h in @(Get-ChildItem -LiteralPath $c -Force)) {
            $n++; Write-Progress -Activity 'Revisando' -Status $h.Name
            if ($h.PSIsContainer) {
                $t = Tipo-Carpeta $h
                if ($t -eq 'proteger') { if (-not ($h.Attributes -band [IO.FileAttributes]::Hidden) -and $h.FullName -ne $Raiz -and $Antiguos -notcontains $h.FullName) { $quedan++ }; continue }
                if ($t -eq 'cd') { $plan += Estudio-Cd $h; continue }
                if ($t -eq 'programa') { if (-not $soloEstudios) { $plan += Item $h 'Carpetas de programas' $Programas 'PROGRAMAS' }; continue }
                $plan += @(Estudios-Dentro $h)
                if (-not $soloEstudios) { $plan += Item $h 'Carpetas' (AnioMes (Join-Path $Raiz 'CARPETAS') $h.LastWriteTime) 'CARPETAS' }
            } else {
                $e = $null; if (-not (Esta-Protegido $h)) { $e = Estudio-De $h }
                if ($e) { $plan += $e; continue }
                if ($soloEstudios) { continue }
                $x = Destino-Archivo $h
                if ($x) { $plan += $x } elseif (-not ($h.Attributes -band [IO.FileAttributes]::Hidden) -and $h.FullName -ne $EsteArchivo) { $quedan++ }
            }
        }
    }
    Write-Progress -Activity 'Revisando' -Completed
    return New-Object PSObject -Property @{ Plan = $plan; Quedan = $quedan }
}

# ================= MOVER, REGISTRAR, ACCESOS DIRECTOS =================
$script:Movidos = @()
function Mover($origen, $carpeta, $nombre) {
    if (-not (Test-Path -LiteralPath $origen)) { return $false }
    New-Item -ItemType Directory -Path $carpeta -Force | Out-Null
    if (-not $nombre) { $nombre = Split-Path $origen -Leaf }
    $nuevo = Nombre-Libre $carpeta $nombre
    try {
        Move-Item -LiteralPath $origen -Destination $nuevo -ErrorAction Stop
        $script:Movidos += New-Object PSObject -Property @{ Origen = $origen; Destino = $nuevo }
        return $true
    } catch { return $false }
}

# Junta una carpeta dentro de otra (si ya existe, mezcla su contenido)
function Fusionar($src, $dst) {
    if (-not (Test-Path -LiteralPath $src)) { return }
    if (-not (Test-Path -LiteralPath $dst)) { [void](Mover $src (Split-Path $dst) (Split-Path $dst -Leaf)); return }
    foreach ($h in @(Get-ChildItem -LiteralPath $src -Force)) {
        if ($h.PSIsContainer) { Fusionar $h.FullName (Join-Path $dst $h.Name) } else { [void](Mover $h.FullName $dst) }
    }
    if (@(Get-ChildItem -LiteralPath $src -Force).Count -eq 0) { Remove-Item -LiteralPath $src -Force }
}

# Pasa lo ordenado por versiones anteriores (Documentos\ORGANIZADO y Documentos\ESTUDIOS)
function Migrar-Antiguo {
    $viejoEst = $Antiguos[1]; $viejoOrg = $Antiguos[0]
    if (Test-Path -LiteralPath $viejoEst) { Fusionar $viejoEst $Estudios }
    if (Test-Path -LiteralPath $viejoOrg) {
        foreach ($h in @(Get-ChildItem -LiteralPath $viejoOrg -Force)) {
            $n = $h.Name
            if ($n -eq '_Registros (no borrar)') { $dst = $Registros }
            elseif ($n -eq 'Carpetas') { $dst = Join-Path $Raiz 'CARPETAS' }
            elseif ($n -eq 'Instaladores') { $dst = Join-Path $Programas 'Instaladores' }
            elseif ($n -eq 'Imagenes Medicas DICOM') { $dst = Join-Path $Estudios 'Otros DICOM' }
            elseif ($Grupo.ContainsKey($n) -and $n -ne 'Otros') { $dst = Join-Path (Join-Path $Raiz $Grupo[$n]) $n }
            else { $dst = Join-Path (Join-Path $Raiz 'OTROS') $n }
            if ($h.PSIsContainer) { Fusionar $h.FullName $dst } else { [void](Mover $h.FullName $Raiz) }
        }
        if (@(Get-ChildItem -LiteralPath $viejoOrg -Force).Count -eq 0) { Remove-Item -LiteralPath $viejoOrg -Force }
    }
    # Accesos directos viejos que apuntaban a Documentos
    foreach ($n in @('ESTUDIOS.lnk','ORGANIZADO.lnk')) { Remove-Item -LiteralPath (Join-Path $Escritorio $n) -Force }
}

# Lista de accesos directos que pueden apuntar a programas movidos
function Accesos-Todos {
    $l = @()
    foreach ($c in @($Escritorio, (Join-Path $Programas 'Accesos directos'), [Environment]::GetFolderPath('Programs'),
                     [Environment]::GetFolderPath('CommonPrograms'), (Join-Path $env:APPDATA 'Microsoft\Internet Explorer\Quick Launch\User Pinned\TaskBar'))) {
        if ($c -and (Test-Path -LiteralPath $c)) { $l += @(Get-ChildItem -LiteralPath $c -Recurse -Force -Filter '*.lnk' | ForEach-Object { $_.FullName }) }
    }
    return $l
}
# Corrige los accesos directos para que sigan abriendo el programa en su nuevo lugar
function Reapuntar($lnks, $pares) {
    if (-not $pares -or @($pares).Count -eq 0) { return 0 }
    try { $sh = New-Object -ComObject WScript.Shell } catch { return 0 }
    $cambiados = 0
    foreach ($l in ($lnks | Sort-Object -Unique)) {
        if (-not $l -or -not (Test-Path -LiteralPath $l)) { continue }
        try { $s = $sh.CreateShortcut($l) } catch { continue }
        $cambio = $false
        foreach ($p in $pares) {
            foreach ($prop in @('TargetPath','WorkingDirectory','IconLocation')) {
                $v = [string]$s.$prop
                if ($v -and ($v -eq $p.De -or $v.StartsWith($p.De + '\', [StringComparison]::OrdinalIgnoreCase))) { $s.$prop = $p.A + $v.Substring($p.De.Length); $cambio = $true }
            }
        }
        if ($cambio) { try { $s.Save(); $cambiados++ } catch {} }
    }
    return $cambiados
}
# Solo carpetas y programas sirven como destino de accesos directos
function Pares($movs, $alReves) {
    $r = @()
    foreach ($m in $movs) {
        $de = $m.Origen; $a = $m.Destino; if ($alReves) { $de = $m.Destino; $a = $m.Origen }
        $ext = [IO.Path]::GetExtension($de).ToLower()
        if ((Test-Path -LiteralPath $a -PathType Container) -or ($ExtPrograma + @('.html','.htm','.lnk') -contains $ext)) { $r += New-Object PSObject -Property @{ De = $de; A = $a } }
    }
    return $r
}

function Guardar-Registro {
    if ($script:Movidos.Count -eq 0) { return }
    New-Item -ItemType Directory -Path $Registros -Force | Out-Null
    $log = Join-Path $Registros ('movimientos_' + (Get-Date -Format 'yyyy-MM-dd_HH-mm-ss') + '.csv')
    $script:Movidos | Select-Object Origen, Destino | Export-Csv -LiteralPath $log -NoTypeInformation -Encoding UTF8
}

# Quita carpetas vacias que el organizador creo (Ano, Mes y grupos), nunca las de usted
$Nuestras = @('ESTUDIOS','DOCUMENTOS','FOTOS, VIDEOS Y MUSICA','PROGRAMAS','CARPETAS','OTROS','Accesos directos','Instaladores',
              'Scripts','Expediente Clinico','Otros DICOM') + @($Categorias.Keys) + @($Modalidades | ForEach-Object { $_[0] })
function Limpiar-Vacias($dir) {
    foreach ($h in @(Get-ChildItem -LiteralPath $dir -Force | Where-Object { $_.PSIsContainer })) {
        if ($Nuestras -contains $h.Name -or $h.Name -match '^\d{4}$' -or $h.Name -match '^\d\d - ') {
            Limpiar-Vacias $h.FullName
            if (@(Get-ChildItem -LiteralPath $h.FullName -Force).Count -eq 0) { Remove-Item -LiteralPath $h.FullName -Force }
        }
    }
}
# Quita carpetas de origen que quedaron vacias al sacar los estudios (nunca la carpeta raiz)
function Limpiar-Origen($rutas, $raices) {
    foreach ($r in ($rutas | Sort-Object { $_.Length } -Descending -Unique)) {
        $d = $r
        while ($d) {
            $dentro = $false; foreach ($x in $raices) { if ($d -ne $x -and $d.StartsWith($x + [IO.Path]::DirectorySeparatorChar)) { $dentro = $true } }
            if (-not $dentro -or -not (Test-Path -LiteralPath $d)) { break }
            if (@(Get-ChildItem -LiteralPath $d -Force).Count -gt 0) { break }
            Remove-Item -LiteralPath $d -Force
            $d = Split-Path $d
        }
    }
}

# ================= ORDENAR =================
function Ordenar($fuentes, $soloEstudios, $migrar) {
    Titulo 'Revisando su computadora (puede tardar unos minutos)...'
    $r = Planear $fuentes $soloEstudios
    $plan = @($r.Plan)
    $hayAntiguo = $migrar -and (($Antiguos | Where-Object { Test-Path -LiteralPath $_ }) -ne $null)
    if ($plan.Count -eq 0 -and -not $hayAntiguo) { Aviso 'No hay nada para ordenar.'; return }

    Titulo "Esto se va a ordenar en: $Raiz"
    foreach ($g in @('ESTUDIOS','DOCUMENTOS','FOTOS, VIDEOS Y MUSICA','PROGRAMAS','CARPETAS','OTROS')) {
        $grp = @($plan | Where-Object { $_.Grupo -eq $g })
        if ($grp.Count -eq 0) { continue }
        Write-Host ("   {0}  ({1})" -f $g, $grp.Count) -ForegroundColor White
        $grp | Group-Object Categoria | Sort-Object Name | ForEach-Object { Write-Host ("      {0,-26} {1,5}" -f $_.Name, $_.Count) -ForegroundColor Gray }
    }
    if ($hayAntiguo) { Write-Host '   + Lo que ya estaba ordenado en Documentos\ESTUDIOS y Documentos\ORGANIZADO' -ForegroundColor White }
    if ($r.Quedan) { Write-Host "   Se quedan en su lugar $($r.Quedan) elementos que Windows u Office necesitan." -ForegroundColor Gray }
    Write-Host '   Todo se SACA de donde estaba (no quedan copias). No se borra ningun archivo.' -ForegroundColor Gray
    if ((Read-Host "`n   Ordenar AHORA? Escriba S y pulse Enter (N = no)") -notmatch '^\s*[sS]') { Aviso 'Cancelado. No se movio nada.'; return }

    $script:Movidos = @()
    New-Item -ItemType Directory -Path $Raiz -Force | Out-Null
    if ($hayAntiguo) { Titulo 'Pasando lo ordenado antes...'; Migrar-Antiguo }

    Titulo 'Moviendo...'
    $fallos = 0; $i = 0
    # Primero los estudios (salen de dentro de las carpetas), luego lo demas
    $orden = @($plan | Where-Object { $_.Grupo -eq 'ESTUDIOS' }) + @($plan | Where-Object { $_.Grupo -ne 'ESTUDIOS' })
    foreach ($p in $orden) {
        $i++; Write-Progress -Activity 'Ordenando' -Status $p.Archivo.Name -PercentComplete ($i * 100 / $orden.Count)
        if ($p.Grupo -ne 'ESTUDIOS' -and $i -gt 1 -and $orden[$i - 2].Grupo -eq 'ESTUDIOS') {
            Limpiar-Origen @($script:Movidos | ForEach-Object { Split-Path $_.Origen }) $fuentes
        }
        if (-not (Test-Path -LiteralPath $p.Archivo.FullName)) { continue }
        if (-not (Mover $p.Archivo.FullName $p.Carpeta)) { $fallos++ }
    }
    Write-Progress -Activity 'Ordenando' -Completed
    Limpiar-Origen @($script:Movidos | ForEach-Object { Split-Path $_.Origen }) $fuentes
    $acc = Reapuntar (Accesos-Todos) (Pares $script:Movidos $false)
    Guardar-Registro
    Limpiar-Vacias $Raiz

    Ok "$($script:Movidos.Count) archivos y carpetas ordenados en ORGANIZADO."
    if ($acc) { Ok "$acc accesos directos corregidos para que sigan abriendo sus programas." }
    if ($fallos) { Aviso "$fallos no se movieron (estaban abiertos o en uso). Cierre los programas y repita." }
    Write-Host '   Si algo no le gusta, use la opcion 4 para DESHACER.' -ForegroundColor Gray
    Invoke-Item $Raiz
}

# ================= DESHACER =================
function Deshacer {
    $logs = @(Get-ChildItem -LiteralPath $Registros -Filter 'movimientos_*.csv' | Sort-Object LastWriteTime -Descending)
    if ($logs.Count -eq 0) { Aviso 'No hay nada que deshacer.'; return }
    Titulo 'Organizaciones realizadas (la 1 es la mas reciente):'
    for ($i = 0; $i -lt $logs.Count -and $i -lt 10; $i++) {
        $cant = @(Import-Csv -LiteralPath $logs[$i].FullName).Count
        Write-Host ("   {0}. {1}  ({2} elementos)" -f ($i + 1), ($logs[$i].BaseName -replace 'movimientos_',''), $cant)
    }
    $op = Read-Host "`n   Numero a deshacer (Enter = cancelar)"
    $k = 0
    if (-not [int]::TryParse($op, [ref]$k) -or $k -lt 1 -or $k -gt $logs.Count) { Aviso 'Cancelado.'; return }
    $filas = @(Import-Csv -LiteralPath $logs[$k - 1].FullName)
    [array]::Reverse($filas)
    $vuelta = @(); $fallos = 0
    foreach ($m in $filas) {
        if ((Test-Path -LiteralPath $m.Destino) -and -not (Test-Path -LiteralPath $m.Origen)) {
            New-Item -ItemType Directory -Path (Split-Path $m.Origen) -Force | Out-Null
            try { Move-Item -LiteralPath $m.Destino -Destination $m.Origen -ErrorAction Stop; $vuelta += $m } catch { $fallos++ }
        } else { $fallos++ }
    }
    [void](Reapuntar ((Accesos-Todos) + @($vuelta | ForEach-Object { $_.Origen } | Where-Object { $_ -like '*.lnk' })) (Pares $vuelta $true))
    Rename-Item -LiteralPath $logs[$k - 1].FullName -NewName ('deshecho_' + $logs[$k - 1].Name)
    Limpiar-Vacias $Raiz
    Ok "$($vuelta.Count) archivos y carpetas regresaron a su lugar original."
    if ($fallos) { Aviso "$fallos no se pudieron regresar (ya se habian movido, borrado o estaban abiertos)." }
}

function Elegir-Carpeta {
    try {
        Add-Type -AssemblyName System.Windows.Forms
        $d = New-Object System.Windows.Forms.FolderBrowserDialog
        $d.Description = 'Elija la carpeta o disco'
        if ($d.ShowDialog() -eq 'OK') { return $d.SelectedPath }
    } catch {
        return (Read-Host '   Escriba la ruta de la carpeta')
    }
    return $null
}

function Diagnostico {
    Titulo 'Lo que hay fuera de ORGANIZADO:'
    foreach ($c in $Fuentes) {
        $n = @(Get-ChildItem -LiteralPath $c -Force | Where-Object { -not ($_.Attributes -band [IO.FileAttributes]::Hidden) -and $_.FullName -ne $Raiz }).Count
        Write-Host ("   {0,-50} {1,5} elementos" -f $c, $n)
    }
    if (Test-Path -LiteralPath $Raiz) {
        Titulo 'Dentro de ORGANIZADO:'
        Get-ChildItem -LiteralPath $Raiz | Where-Object { $_.PSIsContainer -and $_.FullName -ne $Registros } | ForEach-Object {
            $c = @(Get-ChildItem -LiteralPath $_.FullName -Recurse | Where-Object { -not $_.PSIsContainer }).Count
            Write-Host ("   {0,-26} {1,6} archivos" -f $_.Name, $c)
        }
    }
}

# ---------------- MENU ----------------
do {
    Clear-Host
    Write-Host '============================================================' -ForegroundColor Cyan
    Write-Host '                    ORGANIZADOR  PC' -ForegroundColor White
    Write-Host '   Todo en UNA carpeta del Escritorio: ORGANIZADO' -ForegroundColor Gray
    Write-Host '   ESTUDIOS | DOCUMENTOS | FOTOS, VIDEOS Y MUSICA | PROGRAMAS' -ForegroundColor Gray
    Write-Host '   CARPETAS | OTROS   (por Ano > Mes)' -ForegroundColor Gray
    Write-Host '============================================================' -ForegroundColor Cyan
    Write-Host '  1. ORDENAR TODO y dejar el Escritorio limpio  << recomendado'
    Write-Host '  2. Buscar ESTUDIOS en otro disco o USB (D:, disco externo)'
    Write-Host '  3. Ordenar otra carpeta o disco que yo elija'
    Write-Host '  4. DESHACER una organizacion'
    Write-Host '  5. Ver que queda fuera de ORGANIZADO'
    Write-Host '  6. Abrir la carpeta ORGANIZADO'
    Write-Host '  0. Salir'
    Write-Host "`n  (Antes de mover, siempre le muestra que hara y le pregunta.)" -ForegroundColor Gray
    $op = Read-Host "`n  Elija una opcion"
    switch ($op) {
        '1' { Ordenar $Fuentes $false $true }
        '2' { $c = Elegir-Carpeta; if ($c -and (Test-Path -LiteralPath $c)) { Ordenar @($c) $true $false } }
        '3' { $c = Elegir-Carpeta; if ($c -and (Test-Path -LiteralPath $c)) { Ordenar @($c) $false $false } }
        '4' { Deshacer }
        '5' { Diagnostico }
        '6' { New-Item -ItemType Directory -Path $Raiz -Force | Out-Null; Invoke-Item $Raiz }
    }
    if ($op -ne '0') { Read-Host "`n  Pulse Enter para volver al menu" | Out-Null }
} while ($op -ne '0')
