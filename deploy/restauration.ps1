# restauration.ps1 — restauration VERIFIEE depuis le depot restic (doctrine
# docs/71, V4).
#
#   powershell -ExecutionPolicy Bypass -File ./restauration.ps1                 # liste
#   powershell -ExecutionPolicy Bypass -File ./restauration.ps1 -Verifier       # controle complet
#   powershell -ExecutionPolicy Bypass -File ./restauration.ps1 -Volume <nom> [-Cible <nom>]
#
# -Verifier : restaure CHAQUE volume sauvegarde dans un volume jetable et
#   compare le contenu restaure a CE QUE CONTIENT LE SNAPSHOT (`restic ls`) :
#   nombre de fichiers et octets. On ne compare JAMAIS au volume de production :
#   un volume vivant change en permanence (ecritures des conteneurs), un ecart
#   avec lui ne prouverait rien — c'est une mesure fausse attrapee le
#   2026-10-19 (16 "KO" fantomes). La fidelite octet a octet d'une
#   restauration est prouvee separement par le test destructif de
#   test-backup.ps1 sur un volume fige.
#
# -Cible : restaure vraiment dans ce volume (remplacement volontaire, geste
#   humain, jamais automatique).

param(
    [string]$Volume,
    [string]$Cible,
    [switch]$Verifier,
    [string]$Depot
)

$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $false
$RESTIC = "restic/restic:0.17.3"
$ALPINE = "alpine:3.22"
# Chemin ABSOLU obligatoire (cf. sauvegarde.ps1 : un chemin relatif est resolu
# par le demon docker, pas par le shell).
$ici = Split-Path -Parent (Resolve-Path $MyInvocation.MyCommand.Path)
if (-not $Depot) { $Depot = Join-Path $ici "backups/restic" }
$passFile = Join-Path $ici "backups/.restic-pass"
if (-not (Test-Path $passFile)) { Write-Error "mot de passe du depot absent : $passFile" }
if (-not (Test-Path $Depot)) { Write-Error "depot absent : $Depot" }

$envr = @("-e", "RESTIC_PASSWORD_FILE=/pw", "-e", "RESTIC_REPOSITORY=/repo")
$vol = @("-v", "${Depot}:/repo", "-v", "${passFile}:/pw:ro")
$jetables = New-Object System.Collections.Generic.List[string]

function Natif($bloc) {
    # Les outils natifs ecrivent sur stderr : avec $ErrorActionPreference=Stop,
    # PowerShell 5.1 en fait une exception avant lecture du code de sortie.
    $prev = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try { return (& $bloc) } finally { $ErrorActionPreference = $prev }
}

function ResticCli {
    param([string[]]$SousCommande, [string[]]$Montages = @())
    $sortie = Natif { docker @(@("run", "--rm") + $envr + $vol + $Montages + @($RESTIC) + $SousCommande) 2>&1 }
    return @{ code = $LASTEXITCODE; sortie = ($sortie -join "`n") }
}

function ContenuSnapshot($tag) {
    # Nombre de fichiers et octets DANS LE SNAPSHOT (source de verite).
    $r = ResticCli -SousCommande @("ls", "--json", "latest", "--tag", $tag)
    $nb = 0; $octets = 0
    foreach ($l in ($r.sortie -split "`n")) {
        if (-not $l.Trim().StartsWith("{")) { continue }
        try { $n = $l | ConvertFrom-Json } catch { continue }
        if ($n.type -eq "file") { $nb++; if ($n.size) { $octets += [int64]$n.size } }
    }
    return @{ nb = $nb; octets = $octets }
}

function ContenuDossier($volDocker) {
    # Deux pieges evites ici (mesures fausses du 2026-10-19, 16 "KO" fantomes) :
    #   - busybox n'a PAS `find -printf` ;
    #   - PowerShell mange `$1` d'un awk ecrit entre guillemets doubles.
    # On demande donc la liste "taille chemin" (sans aucun `$`) et on additionne
    # cote PowerShell.
    $s = Natif { docker run --rm -v "${volDocker}:/d:ro" $ALPINE sh -c `
            "find /d -type f -exec stat -c '%s %n' {} +" 2>&1 }
    $nb = 0; $octets = [int64]0
    foreach ($l in @($s)) {
        if ("$l" -match '^\s*(\d+)\s') { $nb++; $octets += [int64]$Matches[1] }
    }
    return @{ nb = $nb; octets = $octets }
}

function Restaurer($tag, $cible) {
    return ResticCli -SousCommande @("restore", "latest", "--tag", $tag, "--target", "/out", "--quiet") `
        -Montages @("-v", "${cible}:/out")
}

# --- Inventaire du depot -----------------------------------------------------
$json = (ResticCli -SousCommande @("snapshots", "--json")).sortie
$debutJson = $json.IndexOf("[")
if ($debutJson -lt 0) { Write-Error "restic snapshots n'a pas renvoye de JSON exploitable" }
$volumes = @()
$hote = $false
foreach ($s in ($json.Substring($debutJson) | ConvertFrom-Json)) {
    foreach ($t in $s.tags) {
        if ($t -like "volume=*") { $volumes += $t.Substring(7) }
        if ($t -eq "hote=lcd") { $hote = $true }
    }
}
$volumes = @($volumes | Sort-Object -Unique)
if ($volumes.Count -eq 0) { Write-Error "aucun snapshot de volume dans le depot (lancer sauvegarde.ps1)" }

if (-not $Verifier -and -not $Volume) {
    Write-Output "Volumes sauvegardes : $($volumes.Count)  (etat hote sauvegarde : $hote)"
    $volumes | ForEach-Object { Write-Output "  - $_" }
    Write-Output "Utiliser -Verifier (controle complet) ou -Volume <nom> [-Cible <nom>]."
    exit 0
}

$cibles = if ($Verifier) { $volumes } else { @($Volume) }
$script:KO = 0
$script:N = 0
$debut = Get-Date
foreach ($v in $cibles) {
    $dest = $Cible
    if (-not $dest) {
        $dest = "lcd-restaure-" + [guid]::NewGuid().ToString("N").Substring(0, 8)
        $jetables.Add($dest)
        & docker volume create $dest | Out-Null
    }
    $snap = ContenuSnapshot "volume=$v"
    $r = Restaurer "volume=$v" $dest
    $obtenu = ContenuDossier $dest
    $script:N++
    $ok = ($r.code -eq 0) -and ($obtenu.nb -eq $snap.nb) -and ($obtenu.octets -eq $snap.octets)
    if ($ok) {
        Write-Output ("[OK] $v  ($($obtenu.nb) fichiers, $($obtenu.octets) octets = snapshot)")
    } else {
        Write-Output "[KO] $v (restic=$($r.code))"
        Write-Output ("     snapshot  : $($snap.nb) fichiers / $($snap.octets) octets")
        Write-Output ("     restaure  : $($obtenu.nb) fichiers / $($obtenu.octets) octets")
        $script:KO++
    }
}

foreach ($j in $jetables) { & docker volume rm -f $j 2>$null | Out-Null }
$duree = [int]((Get-Date) - $debut).TotalSeconds

Write-Output ""
Write-Output "duree : ${duree}s pour $($cibles.Count) volume(s)"
Write-Output "note  : comparaison au CONTENU DU SNAPSHOT (un volume vivant change en"
Write-Output "        permanence ; la fidelite octet a octet est prouvee par le test"
Write-Output "        destructif de test-backup.ps1 sur un volume fige)."
if ($script:KO -eq 0) {
    Write-Output "RESULTAT : restauration verifiee ($($script:N)/$($script:N) volumes conformes au snapshot)"
} else {
    Write-Output "RESULTAT : $($script:KO) volume(s) NON restitues conformement"
}
exit $script:KO
