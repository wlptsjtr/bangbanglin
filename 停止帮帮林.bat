@echo off
chcp 65001 >nul
title Stop BangBangLin Service
echo Stopping BangBangLin backend (ports 3210 / 3211)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3210 :3211"') do taskkill /F /PID %%a >nul 2>&1
echo Done. If no service was running, nothing was changed.
echo You can close this window.
pause
