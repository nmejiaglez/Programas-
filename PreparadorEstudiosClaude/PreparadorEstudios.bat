@echo off
chcp 65001 >nul
title Preparador de Estudios para Claude
echo ==========================================================
echo   PREPARADOR DE ESTUDIOS TC / RM / US PARA CLAUDE
echo ==========================================================
python --version >nul 2>&1 || (echo Instale Python desde https://www.python.org ^(marque "Add to PATH"^) & pause & exit /b)
python -c "import cv2, PIL, pydicom" 2>nul || python -m pip install --quiet opencv-python pillow numpy pydicom
set "ENTRADA=%~1"
if "%ENTRADA%"=="" set /p ENTRADA=Arrastre aqui la carpeta o el video del paciente y pulse ENTER: 
set /p PACIENTE=Nombre del paciente (ENTER para omitir): 
python "%~dp0preparar_estudio.py" "%ENTRADA:"=%" --paciente "%PACIENTE%"
pause
