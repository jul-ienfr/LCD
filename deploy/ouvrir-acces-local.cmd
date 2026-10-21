@echo off
REM ==========================================================================
REM  Ouvrir l'acces local au SAS : apprend a CET ordinateur le nom "lcd.test"
REM  puis ouvre la seule adresse a retenir.
REM
REM  A executer UNE SEULE FOIS, en double-cliquant, et en acceptant la demande
REM  d'elevation (Windows affiche "Voulez-vous autoriser les modifications ?").
REM
REM  Sans cette etape, le nom lcd.test n'existe pas pour ce PC : le navigateur
REM  affiche "site introuvable" - ce n'est pas une panne du SAS, c'est juste un
REM  nom local que l'ordinateur ne connait pas encore.
REM ==========================================================================
setlocal
set HOSTS=%SystemRoot%\System32\drivers\etc\hosts

net session >nul 2>&1
if errorlevel 1 (
    echo.
    echo   Ce fichier doit etre execute en tant qu'administrateur.
    echo   Clic droit sur ce fichier  ^>  "Executer en tant qu'administrateur".
    echo.
    pause
    exit /b 1
)

findstr /I /C:"lcd.test" "%HOSTS%" >nul 2>&1
if not errorlevel 1 (
    echo   Le nom lcd.test est deja connu de cet ordinateur. Rien a faire.
) else (
    echo.>> "%HOSTS%"
    echo 127.0.0.1    lcd.test>> "%HOSTS%"
    echo   Nom lcd.test ajoute.
)

REM  Vider le cache DNS pour que le nom soit pris en compte immediatement.
ipconfig /flushdns >nul 2>&1

echo.
echo   Adresse du SAS : https://lcd.test:4001
echo   (le navigateur affichera un avertissement de certificat : le SAS utilise
echo    sa propre autorite de certification locale. Cliquez sur "Avance ^> Continuer".)
echo.
start "" "https://lcd.test:4001"
endlocal
