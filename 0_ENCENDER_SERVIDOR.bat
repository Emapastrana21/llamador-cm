@echo off
title SERVIDOR - NO CERRAR
color 0A
cls
echo ==========================================
echo      ENCENDIENDO SISTEMA CENTRAL
echo ==========================================
echo.
echo Conectando a Base de Datos y WebSockets...
echo.
node index.js
pause