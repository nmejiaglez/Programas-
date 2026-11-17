@echo off
cd /d "%~dp0"
pythonw "%~dp0Preparador.pyw"
if errorlevel 1 (
  echo No se pudo abrir el programa. Ejecute INSTALAR.bat.
  pause
)
