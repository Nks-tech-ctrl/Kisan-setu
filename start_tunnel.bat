@echo off
title KisanSetu - Localtunnel Public Tunnel (Keep Alive)
set "PATH=C:\Program Files\nodejs;%PATH%"
cd /d "%~dp0"

echo =================================================================
echo   Starting KisanSetu Branded Public Tunnel (kisansetu.loca.lt)
echo =================================================================
echo   Public URL:  https://kisansetu.loca.lt

REM Fetch live public IP dynamically for tunnel password verification
for /f "tokens=*" %%i in ('powershell -Command "(Invoke-WebRequest -Uri 'https://api.ipify.org' -UseBasicParsing -TimeoutSec 3).Content" 2^>nul') do set "PUBLIC_IP=%%i"
if "%PUBLIC_IP%"=="" set "PUBLIC_IP=157.49.174.197"

echo   Tunnel Password (Your Current Public IP): %PUBLIC_IP%
echo   Password Lookup URL: https://loca.lt/mytunnelpassword
echo =================================================================
echo.

:tunnel_loop
echo [%time%] Starting Localtunnel on port 8000 with subdomain 'kisansetu'...
call "C:\Users\Sahil Jangra\AppData\Roaming\npm\lt.cmd" --port 8000 --subdomain kisansetu

echo.
echo [%time%] Tunnel disconnected. Auto-reconnecting in 3 seconds...
timeout /t 3 /nobreak >nul
goto tunnel_loop

