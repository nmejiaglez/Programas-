@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Preparador V2 - Varios videos y JPG
python --version >nul 2>&1
if errorlevel 1 (
  echo Instale Python marcando Add Python to PATH y vuelva a ejecutar este archivo.
  start https://www.python.org/downloads/
  pause
  exit /b 1
)
python -m pip install --upgrade opencv-python pillow numpy pydicom
if errorlevel 1 (
  echo No se pudieron instalar las dependencias. Revise la conexion y repita.
  pause
  exit /b 1
)
set "PREPARADOR_DIR=%~dp0"
powershell -NoProfile -Command "$w=New-Object -ComObject WScript.Shell; $s=$w.CreateShortcut([Environment]::GetFolderPath('Desktop')+'\Preparador V2 - Videos y JPG.lnk'); $s.TargetPath=Join-Path $env:PREPARADOR_DIR 'ABRIR.bat'; $s.WorkingDirectory=$env:PREPARADOR_DIR; $s.IconLocation='shell32.dll,22'; $s.Save()"
if errorlevel 1 (
  echo No se pudo crear el acceso directo. Abra ABRIR.bat en esta carpeta.
  pause
  exit /b 1
)
echo LISTO. Use el NUEVO icono: Preparador V2 - Videos y JPG.
echo La ventana debe decir PREPARADOR V2 arriba.
pause
