@echo off
REM ============================================================
REM  LIMPIEZA PC - Limpiador seguro para Windows XP / Vista / 7 / 8 / 10 / 11
REM  No requiere instalacion. Ejecutar con clic derecho >
REM  "Ejecutar como administrador" para una limpieza completa.
REM ============================================================
setlocal EnableExtensions
title Limpieza PC
color 1F

REM --- Comprobar privilegios de administrador ---
set "ADMIN=0"
net session >nul 2>&1 && set "ADMIN=1"

:MENU
cls
echo ============================================================
echo                    LIMPIEZA  PC
echo        Compatible con computadoras viejas y nuevas
echo ============================================================
if "%ADMIN%"=="1" (echo  Modo: ADMINISTRADOR - limpieza completa) else (echo  Modo: USUARIO - ejecute como administrador para limpiar todo)
echo.
echo  Espacio libre en C: antes de limpiar:
call :ESPACIO
echo.
echo   1. Limpieza rapida   (temporales + papelera)
echo   2. Limpieza completa (rapida + navegadores + Windows Update + registros)
echo   3. Limpiador de Windows (cleanmgr)
echo   4. Revisar disco en busca de errores (chkdsk, solo lectura)
echo   5. Reparar archivos de Windows (sfc /scannow)
echo   6. Desfragmentar / optimizar disco C:
echo   7. Ver programas que inician con Windows
echo   0. Salir
echo.
set "OP="
set /p "OP=Elija una opcion y presione ENTER: "
if "%OP%"=="1" goto RAPIDA
if "%OP%"=="2" goto COMPLETA
if "%OP%"=="3" goto CLEANMGR
if "%OP%"=="4" goto CHKDSK
if "%OP%"=="5" goto SFC
if "%OP%"=="6" goto DEFRAG
if "%OP%"=="7" goto INICIO
if "%OP%"=="0" goto FIN
goto MENU

REM ------------------------------------------------------------
:RAPIDA
cls
echo === LIMPIEZA RAPIDA ===
call :TEMPORALES
call :PAPELERA
goto TERMINADO

:COMPLETA
cls
echo === LIMPIEZA COMPLETA ===
echo Se recomienda CERRAR los navegadores antes de continuar.
pause
call :TEMPORALES
call :PAPELERA
call :NAVEGADORES
call :SISTEMA
goto TERMINADO

REM ------------------------------------------------------------
:TEMPORALES
echo [*] Borrando archivos temporales del usuario...
call :VACIAR "%TEMP%"
REM Windows XP usa "Configuracion local", Vista+ usa AppData\Local
if exist "%USERPROFILE%\Configuracion local\Temp" call :VACIAR "%USERPROFILE%\Configuracion local\Temp"
if exist "%USERPROFILE%\Local Settings\Temp" call :VACIAR "%USERPROFILE%\Local Settings\Temp"
if exist "%LOCALAPPDATA%\Microsoft\Windows\INetCache" call :VACIAR "%LOCALAPPDATA%\Microsoft\Windows\INetCache"
if exist "%USERPROFILE%\Local Settings\Temporary Internet Files" call :VACIAR "%USERPROFILE%\Local Settings\Temporary Internet Files"
if exist "%LOCALAPPDATA%\CrashDumps" call :VACIAR "%LOCALAPPDATA%\CrashDumps"
if exist "%LOCALAPPDATA%\Microsoft\Windows\Explorer" del /f /q "%LOCALAPPDATA%\Microsoft\Windows\Explorer\thumbcache_*.db" >nul 2>&1
if "%ADMIN%"=="1" (
  echo [*] Borrando temporales de Windows...
  call :VACIAR "%SystemRoot%\Temp"
)
goto :EOF

:PAPELERA
echo [*] Vaciando la papelera de reciclaje...
if exist "%SystemDrive%\$Recycle.Bin" rd /s /q "%SystemDrive%\$Recycle.Bin" >nul 2>&1
if exist "%SystemDrive%\RECYCLER" rd /s /q "%SystemDrive%\RECYCLER" >nul 2>&1
goto :EOF

:NAVEGADORES
echo [*] Borrando cache de navegadores (no borra contrasenas ni favoritos)...
for %%B in ("Google\Chrome" "Microsoft\Edge" "BraveSoftware\Brave-Browser") do (
  if exist "%LOCALAPPDATA%\%%~B\User Data" (
    for /d %%P in ("%LOCALAPPDATA%\%%~B\User Data\*") do (
      if exist "%%P\Cache" call :VACIAR "%%P\Cache"
      if exist "%%P\Code Cache" call :VACIAR "%%P\Code Cache"
      if exist "%%P\GPUCache" call :VACIAR "%%P\GPUCache"
    )
  )
)
if exist "%LOCALAPPDATA%\Mozilla\Firefox\Profiles" (
  for /d %%P in ("%LOCALAPPDATA%\Mozilla\Firefox\Profiles\*") do (
    if exist "%%P\cache2" call :VACIAR "%%P\cache2"
  )
)
goto :EOF

:SISTEMA
if not "%ADMIN%"=="1" (
  echo [!] Omitido: limpieza de sistema requiere administrador.
  goto :EOF
)
echo [*] Limpiando cache de Windows Update...
net stop wuauserv >nul 2>&1
net stop bits >nul 2>&1
call :VACIAR "%SystemRoot%\SoftwareDistribution\Download"
net start bits >nul 2>&1
net start wuauserv >nul 2>&1
echo [*] Limpiando Prefetch y registros antiguos...
call :VACIAR "%SystemRoot%\Prefetch"
del /f /q "%SystemRoot%\*.log" >nul 2>&1
del /f /q "%SystemRoot%\Minidump\*.dmp" >nul 2>&1
del /f /q "%SystemRoot%\Logs\CBS\*.log" >nul 2>&1
if exist "%ProgramData%\Microsoft\Windows\WER" call :VACIAR "%ProgramData%\Microsoft\Windows\WER"
echo [*] Limpiando cache DNS...
ipconfig /flushdns >nul 2>&1
goto :EOF

REM ------------------------------------------------------------
:CLEANMGR
where cleanmgr >nul 2>&1 || (echo cleanmgr no esta disponible en este equipo. & pause & goto MENU)
echo Abriendo el Liberador de espacio de Windows...
cleanmgr /d %SystemDrive%
goto MENU

:CHKDSK
cls
echo Revisando disco C: (solo lectura, no modifica nada)...
chkdsk %SystemDrive%
pause
goto MENU

:SFC
if not "%ADMIN%"=="1" (echo Requiere ejecutar como administrador. & pause & goto MENU)
cls
echo Revisando archivos de Windows. Puede tardar 15-30 minutos...
sfc /scannow
pause
goto MENU

:DEFRAG
if not "%ADMIN%"=="1" (echo Requiere ejecutar como administrador. & pause & goto MENU)
cls
echo Analizando/optimizando disco C: ...
echo (En discos SSD Windows 8+ aplica TRIM en lugar de desfragmentar.)
defrag %SystemDrive% /O >nul 2>&1 || defrag %SystemDrive%
pause
goto MENU

:INICIO
cls
echo === Programas que inician con Windows ===
echo Desactivar los innecesarios acelera MUCHO las computadoras viejas.
echo.
reg query "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" 2>nul
reg query "HKLM\Software\Microsoft\Windows\CurrentVersion\Run" 2>nul
echo.
echo Para desactivarlos: Windows 8/10/11 -^> Administrador de tareas, pestana Inicio.
echo                     Windows XP/7    -^> Inicio, Ejecutar, escriba msconfig.
pause
goto MENU

REM ------------------------------------------------------------
:VACIAR
REM Borra el CONTENIDO de una carpeta sin borrar la carpeta. Omite archivos en uso.
if "%~1"=="" goto :EOF
if not exist "%~1\" goto :EOF
del /f /s /q "%~1\*" >nul 2>&1
for /d %%D in ("%~1\*") do rd /s /q "%%D" >nul 2>&1
goto :EOF

:ESPACIO
for /f "tokens=3" %%A in ('dir %SystemDrive%\ ^| find /i "bytes"') do set "LIBRE=%%A"
echo    %LIBRE% bytes libres
goto :EOF

:TERMINADO
echo.
echo ============================================================
echo  LIMPIEZA TERMINADA. Espacio libre ahora en C:
call :ESPACIO
echo  Algunos archivos en uso no se borran: es normal.
echo  Reinicie la computadora para completar la limpieza.
echo ============================================================
pause
goto MENU

:FIN
endlocal
exit /b 0
