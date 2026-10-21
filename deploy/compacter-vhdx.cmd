@echo off
REM compacter-vhdx.cmd - UN double-clic qui demande l'elevation, puis compacte.
REM
REM Pourquoi un .cmd : la compaction d'un disque virtuel exige les droits
REM administrateur (Hyper-V et diskpart refusent sans elevation). Windows ne
REM demande cette elevation qu'au lancement d'un programme, pas depuis un
REM script deja en cours : d'ou ce point d'entree.
REM
REM Ce que ca fait, en clair :
REM   1. arrete les conteneurs LCD (les donnees sont conservees) ;
REM   2. arrete Docker Desktop et WSL ;
REM   3. compacte docker_data.vhdx (le fichier qui bloque ~40 Go) ;
REM   4. relance Docker et les piles, puis affiche l'espace recupere.
REM
REM Le detail de chaque etape est ecrit dans deploy\compaction.log
setlocal
cd /d "%~dp0"
echo.
echo   Compaction du disque Docker - demande des droits administrateur.
echo   Les conteneurs vont s'arreter puis redemarrer. Aucune donnee n'est effacee.
echo.
powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process powershell -Verb RunAs -ArgumentList '-NoProfile','-ExecutionPolicy','Bypass','-NoExit','-File','\"%~dp0compacter-vhdx.ps1\"'"
if errorlevel 1 (
  echo.
  echo   Echec du lancement en administrateur.
  echo   Clic droit sur ce fichier - Executer en tant qu'administrateur.
  pause
)
endlocal
