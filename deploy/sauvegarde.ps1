# sauvegarde.ps1 — sauvegarde CHIFFREE de l'etat reel du SAS LCD (doctrine
# docs/71, V4 : "sauvegardes locales + restauration chronometree").
#
#   powershell -ExecutionPolicy Bypass -File ./sauvegarde.ps1
#   powershell -ExecutionPolicy Bypass -File ./sauvegarde.ps1 -Prune
#   powershell -ExecutionPolicy Bypass -File ./sauvegarde.ps1 -Depot D:\lcd-backups
#
# Ce qui est sauvegarde (etat REEL, pas une maquette) :
#   - chaque volume docker `lcd-*` (base IdP, etats des moteurs, donnees box,
#     registres de la passerelle) — un snapshot par volume, tague `volume=<nom>` ;
#   - les fichiers d'etat qui vivent sur l'hote : `lab/` (registres, data) et
#     `deploy/.env` + `deploy/authelia/users.yml` (necessaires a une reprise),
#     snapshot tague `hote=lcd`.
#
# Chiffrement : restic (AES-256 + MAC, dedup, verifiable par `restic check`).
# Le mot de passe du depot vit dans deploy/backups/.restic-pass (gitignore,
# genere au premier lancement) : SANS lui, le depot est illisible — c'est le
# but. Il doit etre conserve hors de cette machine (coffre / papier scelle).
#
# Restauration : voir restauration.ps1 (compare les empreintes apres reprise).

param(
    [string]$Depot,
    [switch]$Prune
)

$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $false
$RESTIC = "restic/restic:0.17.3"
# Chemin ABSOLU obligatoire : un chemin relatif passe a `docker -v` est resolu
# par le demon, pas par le shell (mesure du 2026-10-19 : depot ecrit ailleurs
# que la ou on le relit).
$ici = Split-Path -Parent (Resolve-Path $MyInvocation.MyCommand.Path)
$racine = Split-Path -Parent $ici
if (-not $Depot) { $Depot = Join-Path $ici "backups/restic" }
$passFile = Join-Path $ici "backups/.restic-pass"
$hote = $env:COMPUTERNAME

New-Item -ItemType Directory -Force -Path (Split-Path -Parent $passFile) | Out-Null
New-Item -ItemType Directory -Force -Path $Depot | Out-Null
if (-not (Test-Path $passFile)) {
    $octets = New-Object byte[] 32
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($octets)
    [System.IO.File]::WriteAllText($passFile, [Convert]::ToBase64String($octets))
    # NE PAS durcir les ACL de ce fichier (icacls /inheritance:r) : mesure du
    # 2026-10-19 -- Docker Desktop refuse alors le montage ("Acces refuse" au
    # niveau du demon, et "Permission denied" via un montage de dossier), donc
    # restic ne peut plus lire le mot de passe. Il reste protege par .gitignore
    # et doit etre conserve HORS de cette machine (coffre / papier scelle).
    Write-Output "mot de passe du depot genere : deploy/backups/.restic-pass (a conserver hors machine !)"
}

$depotC = "/repo"
$vol = @("-v", "${Depot}:${depotC}", "-v", "${passFile}:/pw:ro")
$envr = @("-e", "RESTIC_PASSWORD_FILE=/pw", "-e", "RESTIC_REPOSITORY=${depotC}")
$debut = Get-Date

function Restic {
    param([string[]]$SousCommande, [string[]]$Montages = @())
    $tout = @("run", "--rm") + $envr + $vol + @($Montages) + @($RESTIC) + $SousCommande
    # Les outils natifs ecrivent sur stderr ; avec $ErrorActionPreference=Stop
    # PowerShell 5.1 en fait une exception AVANT qu'on lise le code de sortie.
    # On neutralise le temps de l'appel et on decide sur $LASTEXITCODE.
    $prev = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    $sortie = & docker @tout 2>&1
    $code = $LASTEXITCODE
    $ErrorActionPreference = $prev
    if ($code -ne 0) {
        Write-Output ($sortie | Select-Object -Last 6 | Out-String)
        Write-Output ("commande : " + ($tout -join " "))
        throw "restic $($SousCommande -join ' ') a echoue (code $code)"
    }
    return $sortie
}

function NbSnapshots { @(Get-ChildItem (Join-Path $Depot "snapshots") -File -ErrorAction SilentlyContinue).Count }

# Init seulement si le depot n'existe pas encore (restic renvoie "Fatal: config
# file already exists" sur un depot existant, ce qui n'est pas une erreur ici).
if (-not (Test-Path (Join-Path $Depot "config"))) {
    Write-Output "depot vide : initialisation (chiffrement restic)"
    Restic -SousCommande @("init") | Out-Null
} else {
    Write-Output "depot existant : $(NbSnapshots) snapshot(s)"
}

# --- 1. Volumes docker lcd-* -------------------------------------------------
# Chaque sauvegarde est VERIFIEE : le nombre de snapshots du depot doit
# augmenter. Une sauvegarde qui "rend 0" sans rien ecrire est un echec (bug
# attrape le 2026-10-19 : 25 volumes annonces, 0 snapshot au sol).
$volumes = @(& docker volume ls --format "{{.Name}}" | Where-Object { $_ -match "^lcd-" })
$n = 0
foreach ($v in $volumes) {
    $n++
    $avant = NbSnapshots
    Restic -SousCommande @("backup", "/data", "--tag", "volume=$v", "--host", $hote, "--quiet") `
        -Montages @("-v", "${v}:/data:ro") | Out-Null
    $apres = NbSnapshots
    if ($apres -le $avant) { throw "sauvegarde NON ecrite pour le volume $v ($avant -> $apres snapshots)" }
    Write-Output ("[$n/$($volumes.Count)] volume $v -> snapshot #$apres")
}

# --- 2. Etat vivant sur l'hote ----------------------------------------------
Write-Output "fichiers d'etat hote (lab/ + deploy/.env + users.yml)"
$avantHote = NbSnapshots
Restic -SousCommande @("backup", "/src/lab", "/src/env", "/src/users.yml",
    "--tag", "hote=lcd", "--host", $hote, "--quiet") `
    -Montages @("-v", "${racine}/lab:/src/lab:ro",
    "-v", "$(Join-Path $ici '.env'):/src/env:ro",
    "-v", "$(Join-Path $ici 'authelia/users.yml'):/src/users.yml:ro") | Out-Null
if ((NbSnapshots) -le $avantHote) { throw "sauvegarde de l'etat hote NON ecrite" }

# --- 3. Retention ------------------------------------------------------------
$resume = Restic -SousCommande @("stats", "--mode", "raw-data")
$taille = ($resume | Select-String "Total Size|Total File Count") | ForEach-Object { $_.Line.Trim() }
if ($Prune) {
    Write-Output "retention : 7 quotidiennes / 4 hebdomadaires / 6 mensuelles"
    Restic -SousCommande @("forget", "--keep-daily", "7", "--keep-weekly", "4", "--keep-monthly", "6", "--prune") | Out-Null
}

$snaps = @(Restic -SousCommande @("snapshots", "--compact"))
$duree = [int]((Get-Date) - $debut).TotalSeconds
Write-Output ""
Write-Output "depot     : $Depot"
Write-Output "snapshots : $($snaps.Count) ligne(s) au format court"
Write-Output (($taille | Select-Object -First 2) -join " | ")
Write-Output "duree     : ${duree}s"
Write-Output "RESULTAT : sauvegarde terminee ($($volumes.Count) volumes + etat hote)"
