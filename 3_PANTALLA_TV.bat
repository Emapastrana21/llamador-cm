@echo off
echo Abriendo Llamador en Modo TV...
:: Intenta abrir con Chrome en modo Kiosco (Pantalla completa sin bordes)
start chrome --kiosk "http://localhost:3001/notifier.html"
exit