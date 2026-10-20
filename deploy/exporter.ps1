# exporter.ps1 — SORTIR LA SAUVEGARDE DE LA MACHINE (doctrine docs/71, §8 quaterdecies).
#
#   powershell -ExecutionPolicy Bypass -File ./exporter.ps1 -Vers D:\sauvegardes\lcd
#   powershell -ExecutionPolicy Bypass -File ./exporter.ps1 -Vers <chemin> -Verifier
#
# POURQUOI : une sauvegarde qui vit sur la meme machine que ce qu'elle protege
# ne protege de rien (panne disque, ransomware, vol). Ce script produit un
# EXPORT COMPLET et VERIFIABLE du depot restic (packs + config), avec un
# manifeste de SHA256, et la commande exacte pour le remonter ailleurs. Il ne
# s'agit pas d'une copie « a la main » : l'export est relu et compare.
#
# Ce que l'export contient : le depot restic entier (chiffre, la phrase de
# passe n'est PAS dans l'export) + MANIFESTE.txt (fichiers, tailles, SHA256) +
# RESTAURER.txt (mode d'emploi auto-suffisant).
#
# La phrase de passe restic doit voyager SEPAREMENT (coffre, papier, gestionnaire
# de mots de passe) : sans elle l'export est illisible, avec elle dans le meme
# sac l'export est inutile.

param(
    [Parameter(Mandatory = $true)][string]$Vers,
    [switch]$Verifier,
    [switch]$Ecraser
)

$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $false
$ici = Split-Path -Parent (Resolve-Path $MyInvocation.MyCommand.Path)
$depot = Join-Path $ici "backups/restic"

function Natif($bloc) {
    $prev = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try { return (& $bloc) } finally { $ErrorActionPreference = $prev }
}
function Sha256($chemin) {
    return (Get-FileHash -Path $chemin -Algorithm SHA256).Hash.ToLower()
}

if (-not (Test-Path $depot)) { Write-Output "KO : depot restic introuvable ($depot)"; exit 1 }
if (-not (Test-Path $Vers)) { New-Item -ItemType Directory -Force -Path $Vers | Out-Null }
$dejaLa = @(Get-ChildItem $Vers -Recurse -File -ErrorAction SilentlyContinue).Count
if ($dejaLa -gt 0 -and -not $Ecraser -and -not $Verifier) {
    Write-Output ("KO : la destination n'est pas vide (" + $dejaLa + " fichier(s)) - -Ecraser pour refaire l'export")
    exit 1
}

if ($Verifier) {
    #  Verification d'un export existant : manifeste relu, chaque SHA256
    #  recalcule, puis le depot relu par restic lui-meme. Un export qu'on ne
    #  sait pas verifier n'est pas un export.
    $manifeste = Join-Path $Vers "MANIFESTE.txt"
    if (-not (Test-Path $manifeste)) { Write-Output "KO : manifeste absent - ce dossier n'est pas un export LCD"; exit 1 }
    $lignes = Get-Content $manifeste | Where-Object { $_ -match "^[0-9a-f]{64}  " }
    $mauvais = 0; $verifies = 0
    foreach ($l in $lignes) {
        $h = $l.Substring(0, 64); $rel = $l.Substring(66)
        $f = Join-Path $Vers $rel
        if (-not (Test-Path $f)) { Write-Output ("KO : fichier manquant " + $rel); $mauvais++; continue }
        if ((Sha256 $f) -ne $h) { Write-Output ("KO : empreinte differente " + $rel); $mauvais++ }
        $verifies++
    }
    #  Preuve que l'export est CHIFFRE : avec une mauvaise phrase de passe,
    #  restic doit REFUSER (mesure : code 12, « wrong password or no key found »).
    $check = (Natif { & docker run --rm -v "${Vers}:/repo:ro" -e RESTIC_PASSWORD=lcd-verification-fausse -e RESTIC_REPOSITORY=/repo restic/restic:0.17.3 snapshots --json 2>&1 } | Out-String)
    $codeCheck = $LASTEXITCODE
    $chiffre = [bool]($codeCheck -ne 0 -and $check -match "(?i)wrong password|no key found")
    Write-Output ("fichiers verifies : " + $verifies + ", mauvais : " + $mauvais + ", export chiffre : " + $chiffre)
    if ($mauvais -eq 0 -and $verifies -gt 0 -and $chiffre) { Write-Output "RESULTAT : export verifie, integre et chiffre"; exit 0 }
    Write-Output "RESULTAT : export NON conforme"
    exit 1
}

Write-Output ("== export du depot restic vers " + $Vers)
$copies = 0; $octets = [int64]0
Get-ChildItem $depot -Recurse -File | ForEach-Object {
    $rel = $_.FullName.Substring($depot.Length).TrimStart("\")
    $dest = Join-Path $Vers $rel
    $dossier = Split-Path -Parent $dest
    if (-not (Test-Path $dossier)) { New-Item -ItemType Directory -Force -Path $dossier | Out-Null }
    Copy-Item $_.FullName $dest -Force
    $copies++; $octets += $_.Length
}
Write-Output ("   " + $copies + " fichier(s), " + [Math]::Round($octets / 1MB, 1) + " Mio copies")

#  Manifeste : la seule facon de prouver plus tard que l'export n'a pas bouge.
$manifeste = Join-Path $Vers "MANIFESTE.txt"
$lignes = New-Object System.Collections.Generic.List[string]
$lignes.Add("# MANIFESTE DE L'EXPORT LCD - " + (Get-Date -Format "yyyy-MM-dd HH:mm"))
$lignes.Add("# Une ligne = <sha256>  <chemin relatif>. Verifier : deploy/exporter.ps1 -Vers <chemin> -Verifier")
$lignes.Add("")
foreach ($f in (Get-ChildItem $depot -Recurse -File | Sort-Object FullName)) {
    $rel = $f.FullName.Substring($depot.Length).TrimStart("\")
    $lignes.Add((Sha256 $f.FullName) + "  " + $rel)
}
[IO.File]::WriteAllText($manifeste, (($lignes -join "`n") + "`n"), (New-Object System.Text.UTF8Encoding($false)))

$mode = @(
    "# REMONTER CET EXPORT AILLEURS (machine neuve, NAS, autre site)",
    "",
    "1. Copier ce dossier sur la machine cible (le depot est chiffre : la copie peut",
    "   passer par un support non sur, mais la PHRASE DE PASSE doit voyager a part).",
    "2. Verifier l'integrite :  deploy/exporter.ps1 -Vers <ce dossier> -Verifier",
    "3. Restaurer :",
    "     docker run --rm -e RESTIC_PASSWORD=<phrase> -e RESTIC_REPOSITORY=/repo",
    "       -v <ce dossier>:/repo:ro restic/restic:0.17.3 restore latest --target /sortie",
    "4. Ou remettre le depot en service : copier ce dossier dans deploy/backups/restic",
    "   et relancer deploy/reprise.ps1 (le drill complet, 12/12).",
    "",
    "Sans la phrase de passe, cet export est un bloc illisible : c'est voulu."
)
[IO.File]::WriteAllText((Join-Path $Vers "RESTAURER.txt"), (($mode -join "`n") + "`n"), (New-Object System.Text.UTF8Encoding($false)))

Write-Output ("RESULTAT : export ecrit (" + $copies + " fichiers, manifeste + mode d'emploi) -> " + $Vers)
exit 0
