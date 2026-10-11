# Mueve los informes (.docx/.pdf) de Descargas a Documentos\Informes Radiologia\AAAA\MM - Mes\Modalidad
$origen  = Join-Path $env:USERPROFILE "Downloads"
$destino = Join-Path ([Environment]::GetFolderPath("MyDocuments")) "Informes Radiologia"
$meses = @("","01 - Enero","02 - Febrero","03 - Marzo","04 - Abril","05 - Mayo","06 - Junio","07 - Julio","08 - Agosto","09 - Septiembre","10 - Octubre","11 - Noviembre","12 - Diciembre")
$n = 0
Get-ChildItem -Path $origen -File | Where-Object { $_.Extension -in ".docx",".pdf" -and $_.Name -match "_(US|Doppler)_" } | ForEach-Object {
    $mod = if ($_.Name -match "Doppler") { "Doppler" } elseif ($_.Name -match "Obstetrico") { "Obstetricia" } else { "Ultrasonido" }
    $f = $_.LastWriteTime
    $dir = Join-Path $destino (Join-Path ([string]$f.Year) (Join-Path $meses[$f.Month] $mod))
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
    $dest = Join-Path $dir $_.Name
    if (Test-Path $dest) { $dest = Join-Path $dir ("{0}_{1}{2}" -f $_.BaseName, $f.ToString("HHmmss"), $_.Extension) }
    Move-Item $_.FullName $dest
    Write-Host "-> $dest"; $n++
}
Write-Host "`nListo: $n informe(s) organizado(s) en $destino"
Start-Process explorer.exe $destino
Read-Host "Presione Enter para salir"
