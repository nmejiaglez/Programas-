@echo off
REM Windows: clic derecho > Ejecutar como administrador
python "%~dp0diagnostico_pc.py" || py "%~dp0diagnostico_pc.py"
pause
