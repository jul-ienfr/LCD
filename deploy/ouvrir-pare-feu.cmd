@echo off
REM ouvrir-pare-feu.cmd - UN double-clic qui ouvre le SAS au reseau local.
REM
REM Pourquoi ce fichier : Windows bloque les connexions entrantes par defaut, et
REM seules les regles de pare-feu s'ajoutent en administrateur. Ce .cmd demande
REM l'elevation (une fenetre Windows, un clic sur Oui), puis pose DEUX regles :
REM   - TCP 443 : l'application et le portail (Caddy, meme port) ;
REM   - TCP 80  : redirection HTTP -> HTTPS.
REM Portee : reseau local uniquement. Rien n'est ouvert vers Internet.
REM Les anciens ports d'atelier (4001, 4002, 4003) restent fermes.
REM
REM Detail de chaque etape : deploy\pare-feu.log
setlocal
cd /d "%~dp0"
echo.
echo   Ouverture du pare-feu pour le reseau local (port 443 et 80).
echo   Windows va demander l'autorisation administrateur : cliquez sur Oui.
echo.
powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process powershell -Verb RunAs -ArgumentList '-NoProfile','-ExecutionPolicy','Bypass','-NoExit','-File','\"%~dp0ouvrir-pare-feu.ps1\"'"
if errorlevel 1 (
  echo.
  echo   Lancement refuse ou annule. Clic droit - Executer en tant qu'administrateur.
  pause
)
endlocal
