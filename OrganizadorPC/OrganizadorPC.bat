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
#  Ordena Escritorio, Descargas y Documentos por TIPO de archivo
#  (Word, PDF, Excel, Imagenes...) y luego por ANO y MES.
#  Solo MUEVE archivos (nunca borra) y guarda un registro para
#  poder DESHACER todo con la opcion 6.
# ============================================================
$ErrorActionPreference = 'SilentlyContinue'
$Host.UI.RawUI.WindowTitle = 'Organizador PC'

$Destino   = Join-Path ([Environment]::GetFolderPath('MyDocuments')) 'ORGANIZADO'
$Registros = Join-Path $Destino '_Registros (no borrar)'
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
        $todos = Get-ChildItem -LiteralPath $carpeta -Recurse -Force | Where-Object { -not $_.PSIsContainer -and $_.FullName -notlike "$Destino*" }
    } else {
        $todos = Get-ChildItem -LiteralPath $carpeta -Force | Where-Object { -not $_.PSIsContainer }
    }
    return @($todos)
}

# Carpetas que NO se mueven: de programas (Outlook, Zoom...), ocultas o del sistema,
# o que contienen programas (.exe), correo de Outlook (.pst) o este organizador.
$CarpetasProtegidas = @('ORGANIZADO','Outlook Files','Archivos de Outlook','Custom Office Templates',
  'Plantillas personalizadas de Office','Zoom','My Games','Mis juegos','Visual Studio*','SQL Server*',
  'IISExpress','My Web Sites','WindowsPowerShell','PowerShell','OneNote*','Blocs de notas de OneNote',
  'Fax','Scanned Documents','Documentos escaneados','Adobe','Sound recordings','Grabaciones de sonido',
  'My Shapes','Mis formas','Mis archivos recibidos','Bluetooth*','Rainmeter','Snagit','Camtasia*')
function Carpeta-Protegida($d) {
    if ($d.Attributes -band [IO.FileAttributes]::Hidden) { return $true }
    if ($d.Attributes -band [IO.FileAttributes]::System) { return $true }
    if ($d.Attributes -band [IO.FileAttributes]::ReparsePoint) { return $true }
    if ($d.FullName -like "$Destino*") { return $true }
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
                if (Carpeta-Protegida $d) { if (-not ($d.Attributes -band [IO.FileAttributes]::Hidden)) { $carpQuedan++ }; continue }
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
    Write-Host "   Si algo no le gusta, use la opcion 6 para DESHACER." -ForegroundColor Gray
    Crear-Acceso
    if ($movidos.Count) { Ok 'Abriendo la carpeta ORGANIZADO...'; Invoke-Item $Destino }
}

function Crear-Acceso {
    $lnk = Join-Path $Escritorio 'ORGANIZADO.lnk'
    if (Test-Path -LiteralPath $lnk) { return }
    try {
        $s = (New-Object -ComObject WScript.Shell).CreateShortcut($lnk)
        $s.TargetPath = $Destino; $s.Save()
        Ok 'Acceso directo "ORGANIZADO" creado en el Escritorio.'
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
    foreach ($cat in @(Get-ChildItem -LiteralPath $Destino -Force | Where-Object { $_.PSIsContainer -and $_.FullName -ne $Registros })) {
        foreach ($an in @(Get-ChildItem -LiteralPath $cat.FullName -Force | Where-Object { $_.PSIsContainer -and $_.Name -match '^\d{4}$' })) {
            foreach ($me in @(Get-ChildItem -LiteralPath $an.FullName -Force | Where-Object { $_.PSIsContainer -and $_.Name -match '^\d\d - ' })) {
                if (@(Get-ChildItem -LiteralPath $me.FullName -Force).Count -eq 0) { Remove-Item -LiteralPath $me.FullName -Force }
            }
            if (@(Get-ChildItem -LiteralPath $an.FullName -Force).Count -eq 0) { Remove-Item -LiteralPath $an.FullName -Force }
        }
        if (@(Get-ChildItem -LiteralPath $cat.FullName -Force).Count -eq 0) { Remove-Item -LiteralPath $cat.FullName -Force }
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
    if (Test-Path -LiteralPath $Destino) {
        Titulo 'Ya organizado en ORGANIZADO:'
        Get-ChildItem -LiteralPath $Destino | Where-Object { $_.PSIsContainer -and $_.FullName -ne $Registros } | ForEach-Object {
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
    Write-Host '   Archivos por tipo (Word, PDF, Fotos...) > Ano > Mes' -ForegroundColor Gray
    Write-Host '   Carpetas por Ano > Mes' -ForegroundColor Gray
    Write-Host '============================================================' -ForegroundColor Cyan
    Write-Host "  Todo queda en: $Destino`n" -ForegroundColor Gray
    Write-Host '  1. Organizar TODO (Escritorio, Descargas y Documentos)'
    Write-Host '  2. Organizar solo DESCARGAS'
    Write-Host '  3. Organizar solo ESCRITORIO'
    Write-Host '  4. Organizar Imagenes, Videos y Musica'
    Write-Host '  5. Organizar otra carpeta que yo elija (USB, disco, carpeta llena)'
    Write-Host '  6. DESHACER una organizacion'
    Write-Host '  7. Ver cuantos archivos hay en cada carpeta'
    Write-Host '  8. Abrir la carpeta ORGANIZADO'
    Write-Host '  0. Salir'
    Write-Host "`n  (Antes de mover, siempre le muestra que hara y le pregunta.)" -ForegroundColor Gray
    $op = Read-Host "`n  Elija una opcion"
    switch ($op) {
        '1' { Organizar $Principales $false }
        '2' { Organizar @($Descargas) $false }
        '3' { Organizar @($Escritorio) $false }
        '4' { Organizar @($Imagenes, $Videos, $Musica) $false }
        '5' {
            $c = Elegir-Carpeta
            if ($c -and (Test-Path -LiteralPath $c)) {
                $sub = (Read-Host '   Ordenar tambien lo que esta dentro de sus subcarpetas? (S/N)') -match '^\s*[sS]'
                Organizar @($c) $sub
            }
        }
        '6' { Deshacer }
        '7' { Diagnostico }
        '8' { New-Item -ItemType Directory -Path $Destino -Force | Out-Null; Invoke-Item $Destino }
    }
    if ($op -ne '0') { Read-Host "`n  Pulse Enter para volver al menu" | Out-Null }
} while ($op -ne '0')
