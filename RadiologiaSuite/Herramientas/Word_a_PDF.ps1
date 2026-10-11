# Convierte a PDF todos los .docx de una carpeta (requiere Microsoft Word instalado).
Add-Type -AssemblyName System.Windows.Forms
$dlg = New-Object System.Windows.Forms.FolderBrowserDialog
$dlg.Description = "Seleccione la carpeta con los informes Word"
if ($dlg.ShowDialog() -ne "OK") { exit }
$carpeta = $dlg.SelectedPath
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$n = 0
Get-ChildItem -Path $carpeta -Filter *.docx | Where-Object { $_.Name -notlike '~$*' } | ForEach-Object {
    $pdf = [IO.Path]::ChangeExtension($_.FullName, ".pdf")
    if (-not (Test-Path $pdf)) {
        $d = $word.Documents.Open($_.FullName, $false, $true)
        $d.SaveAs([ref]$pdf, [ref]17)
        $d.Close($false)
        Write-Host "PDF: $($_.Name)"; $n++
    }
}
$word.Quit()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
Write-Host "`nListo: $n archivo(s) convertido(s)."
Read-Host "Presione Enter para salir"
