@echo off
title DecisionGraph
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo  Node.js is required to run DecisionGraph.
  echo  Download the LTS version from https://nodejs.org, install it,
  echo  then double-click this file again.
  echo.
  pause
  exit /b 1
)

if not exist node_modules (
  echo Installing dependencies — first run only, takes a minute or two...
  call npm install
)

echo.
echo  Starting DecisionGraph at http://localhost:3000
echo  ^(If the browser opens to an error page, wait a few seconds and refresh.^)
echo.
start "" http://localhost:3000
call npm run dev
pause
