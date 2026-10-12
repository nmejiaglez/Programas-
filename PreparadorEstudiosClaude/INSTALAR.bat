@echo off
chcp 65001 >nul
title Instalando Preparador de Estudios
echo.
echo   Instalando... (solo se hace una vez, espere 1-2 minutos)
echo.
python --version >nul 2>&1 || (
  echo   FALTA PYTHON. Se abrira la pagina para descargarlo.
  echo   Al instalarlo MARQUE la casilla "Add Python to PATH" y luego vuelva a abrir este archivo.
  start https://www.python.org/downloads/
  pause & exit /b
)
python -m pip install --quiet --upgrade opencv-python pillow numpy pydicom
for /f "delims=" %%i in ('python -c "import sys,os;print(os.path.join(os.path.dirname(sys.executable),'pythonw.exe'))"') do set "PYW=%%i"
powershell -NoProfile -Command "$s=(New-Object -ComObject WScript.Shell).CreateShortcut([Environment]::GetFolderPath('Desktop')+'\Preparador Estudios Claude.lnk');$s.TargetPath='%PYW%';$s.Arguments='\"%~dp0Preparador.pyw\"';$s.WorkingDirectory='%~dp0';$s.IconLocation='shell32.dll,22';$s.Save()"
echo.
echo   LISTO. En su ESCRITORIO aparecio el icono "Preparador Estudios Claude".
echo   De doble clic en ese icono cada vez que lo necesite.
echo.
pause
