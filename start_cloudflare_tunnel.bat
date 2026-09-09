@echo off
title KisanSetu - Cloudflare Public Tunnel (Keep Alive)
cd /d "%~dp0"

echo =================================================================
echo   KisanSetu High-Performance Cloudflare Tunnel
echo =================================================================
echo   * Zero Configuration & No Password Required
echo   * Direct Mobile & Remote Web Access
echo   * Auto-Reconnect Keep-Alive Watchdog
echo =================================================================
echo.

:tunnel_loop
echo [%time%] Starting Cloudflare Tunnel connected to http://127.0.0.1:8000...
cloudflared.exe tunnel --url http://127.0.0.1:8000 --no-autoupdate

echo.
echo [%time%] WARNING: Tunnel disconnected or interrupted.
echo Reconnecting in 3 seconds... (Press Ctrl+C to stop)
timeout /t 3 /nobreak >nul
goto tunnel_loop
