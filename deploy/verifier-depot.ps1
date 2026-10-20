# verifier-depot.ps1 — controle d'INTEGRITE du depot de sauvegarde restic
# (doctrine docs/71, §8 septies ; runbook R-06).
#
#   powershell -ExecutionPolicy Bypass -File ./verifier-depot.ps1            # controle structure
#   powershell -ExecutionPolicy Bypass -File ./verifier-depot.ps1 -Donnees   # + relecture de 5% des donnees
#   powershell -ExecutionPolicy Bypass -File ./verifier-depot.ps1 -Etat      # etat + age du dernier controle (code 1 si perime)
#   powershell -ExecutionPolicy Bypass -File ./verifier-depot.ps1 -Depot <chemin>   # pour tester sur une copie
#
# POURQUOI CE SCRIPT EXISTE : la sauvegarde etait prouvee (10/10) mais rien ne
# verifiait que le DEPOT lui-meme est sain. Un disque qui pourrit, un pack
# tronque, et la sauvegarde est fausse sans que personne ne le sache — le pire
# etat possible pour une sauvegarde. `restic check` relit les index et les
# packs ; `--read-data-subset` relit une fraction des donnees reelles.
#
# Ce script ne restaure rien et ne supprime rien : il mesure et il dit.

param(
    [switch]$Donnees,
    [switch]$Etat,
    [string]$Depot,
    [int]$SeuilJours = 30,
    [int]$SousEnsemblePourcent = 5,
    [string]$MotDePasse,
    [switch]$SansEcriture
)

$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $false
$ici = Split-Path -Parent (Resolve-Path $MyInvocation.MyCommand.Path)
if (-not $Depot) { $Depot = Join-Path $ici "backups/restic" }
if (-not $MotDePasse) { $MotDePasse = Join-Path $ici "backups/.restic-pass" }
$etatFichier = Join-Path $ici "backups/.derniere-verification"

function Natif($bloc) {
    $prev = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try { return (& $bloc) } finally { $ErrorActionPreference = $prev }
}
function Restic([string[]]$sous) {
    $montages = @("-v", "$(Resolve-Path $Depot):/repo", "-v", "$(Resolve-Path $MotDePasse):/pw:ro")
    $a = @("run", "--rm", "-e", "RESTIC_PASSWORD_FILE=/pw", "-e", "RESTIC_REPOSITORY=/repo") + $montages + @("restic/restic:0.17.3") + $sous
    return (Natif { & docker @a 2>&1 } | Out-String)
}

function EtatDepot {
    $snap = Restic @("snapshots", "--json")
    $nb = 0
    try { $nb = @((($snap | ConvertFrom-Json))).Count } catch { $nb = ([regex]::Matches($snap, '"short_id"')).Count }
    $stats = Restic @("stats", "--json", "--mode", "raw-data")
    $octets = 0
    if ($stats -match '"total_size":\s*(\d+)') { $octets = [int64]$Matches[1] }
    $dernier = ""
    if (Test-Path $etatFichier) { $dernier = (Get-Content $etatFichier -Raw).Trim() }
    return [ordered]@{ snapshots = $nb; octets = $octets; dernier = $dernier; brut = $snap }
}

if ($Etat) {
    $e = EtatDepot
    $age = ""
    $perime = $false
    if ($e.dernier) {
        try {
            $quand = [datetime]::Parse($e.dernier, $null, [System.Globalization.DateTimeStyles]::RoundtripKind)
            $jours = [int]((Get-Date).ToUniversalTime() - $quand.ToUniversalTime()).TotalDays
            $age = "$jours jour(s)"
            $perime = ($jours -gt $SeuilJours)
        } catch { $age = "date illisible : $($e.dernier)" }
    } else {
        $perime = $true
        $age = "jamais"
    }
    Write-Output ("depot : {0} snapshot(s), {1:N1} Mio | dernier controle d'integrite : {2} ({3}) | seuil {4} j" -f `
            $e.snapshots, ($e.octets / 1MB), ($(if ($e.dernier) { $e.dernier } else { "aucun" })), $age, $SeuilJours)
    if ($perime) { Write-Output "[KO] controle d'integrite trop ancien : le depot peut pourrir sans temoin"; exit 1 }
    exit 0
}

# --- Controle -----------------------------------------------------------------
Write-Output ("depot : {0}" -f (Resolve-Path $Depot).Path)
$res = Restic @("check")
$code = $LASTEXITCODE
$lignes = ($res -split "\r?\n") | Where-Object { $_.Trim() -ne "" }
foreach ($l in $lignes) { Write-Output ("  " + $l.Trim()) }
if ($code -ne 0) {
    Write-Output "[KO] le depot est abime (restic check a echoue) : NE PAS s'appuyer sur ces sauvegardes"
    exit 1
}

if ($Donnees) {
    Write-Output ("relecture de {0}% des donnees reelles..." -f $SousEnsemblePourcent)
    $res2 = Restic @("check", "--read-data-subset=${SousEnsemblePourcent}%")
    $code2 = $LASTEXITCODE
    foreach ($l in (($res2 -split "\r?\n") | Where-Object { $_.Trim() -ne "" })) { Write-Output ("  " + $l.Trim()) }
    if ($code2 -ne 0) {
        Write-Output "[KO] donnees illisibles dans le depot (corruption detectee)"
        exit 1
    }
}

$e = EtatDepot
$maintenant = (Get-Date).ToUniversalTime().ToString("o")
if (-not $SansEcriture) {
    [IO.File]::WriteAllText($etatFichier, $maintenant + "`n", (New-Object System.Text.UTF8Encoding($false)))
}
Write-Output ""
Write-Output ("RESULTAT : depot sain ({0} snapshot(s), {1:N1} Mio, controle {2})" -f `
        $e.snapshots, ($e.octets / 1MB), $(if ($Donnees) { "structure + $SousEnsemblePourcent% des donnees" } else { "structure" }))
exit 0
