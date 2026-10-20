# Batterie G-depot (doctrine docs/71, §8 septies ; runbook R-06) : le controle
# d'integrite du depot de sauvegarde doit DETECTER une corruption, pas seulement
# dire « c'est bon ». Le controle positif se fait sur une COPIE abimee : le
# depot reel n'est jamais touche.
#
#   powershell -ExecutionPolicy Bypass -File ./test-depot.ps1
#
# Checks :
#   1. le depot reel passe le controle (code 0, RESULTAT « depot sain ») ;
#   2. le nombre de snapshots annonce est le reel ;
#   3. CONTROLE POSITIF : une copie dont un pack est tronque ECHOUE (code non nul) ;
#   4. l'echec est nomme (le message parle de pack/donnees abimees) ;
#   5. -Etat sans historique sort en code 1 (« jamais » verifie) ;
#   6. -Etat apres controle sort en code 0 avec un age en jours ;
#   7. -Etat avec un historique ancien sort en code 1 (seuil respecte) ;
#   8. -SansEcriture ne touche pas l'historique (preuve par date inchangee) ;
#   9. le mot de passe restic n'apparait JAMAIS dans la sortie ;
#  10. l'historique vit hors de git (gitignoré).

$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $false
$script:KO = 0
$script:N = 0
$ici = Split-Path -Parent (Resolve-Path $MyInvocation.MyCommand.Path)
$racine = Split-Path -Parent $ici
$outil = Join-Path $ici "verifier-depot.ps1"
$depot = Join-Path $ici "backups/restic"
$etatReel = Join-Path $ici "backups/.derniere-verification"

function Verif($label, $ok, $detail = "") {
    $script:N++
    if ($ok) { Write-Output "[OK] $label" }
    else { Write-Output "[KO] $label$(if ($detail) { " -> $detail" })"; $script:KO++ }
}
function Natif($bloc) {
    $prev = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try { return (& $bloc) } finally { $ErrorActionPreference = $prev }
}
function Outil([string[]]$extra) {
    $a = @("-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $outil) + $extra
    $sortie = (Natif { & powershell @a 2>&1 } | Out-String)
    return [ordered]@{ code = $LASTEXITCODE; sortie = $sortie }
}

# --- 1-2. depot reel ---------------------------------------------------------
$e = Outil @()
Verif "le depot reel passe le controle (code 0)" ($e.code -eq 0) ("code=" + $e.code)
Verif "le resultat nomme l'etat sain" ($e.sortie -match "RESULTAT : depot sain")

$snap = (Natif { & docker run --rm -e RESTIC_PASSWORD_FILE=/pw -e RESTIC_REPOSITORY=/repo -v "$(Resolve-Path $depot):/repo" -v "$(Resolve-Path (Join-Path $ici 'backups/.restic-pass')):/pw:ro" restic/restic:0.17.3 snapshots --json 2>$null } | Out-String)
$reels = ([regex]::Matches($snap, '"short_id"')).Count
$annonce = 0
if ($e.sortie -match "depot sain \((\d+) snapshot") { $annonce = [int]$Matches[1] }
Verif ("le nombre de snapshots annonce est le reel ($annonce / $reels)") ($reels -gt 0 -and $annonce -eq $reels)

# --- 3-4. controle positif sur une copie abimee -------------------------------
$copie = Join-Path $env:TEMP ("lcd-depot-abime-" + [guid]::NewGuid().ToString("N"))
try {
    Copy-Item $depot $copie -Recurse -Force
    $pack = @(Get-ChildItem (Join-Path $copie "data") -Recurse -File | Sort-Object Length -Descending | Select-Object -First 1)
    Verif "un pack de copie a ete trouve pour l'abimer" ($pack.Count -eq 1)
    if ($pack.Count -eq 1) {
        #  Les packs restic sont en lecture seule (0444) : Copy-Item conserve
        #  l'attribut, donc il faut le retirer avant de tronquer (mesure :
        #  « Acces au chemin refuse » sinon).
        [IO.File]::SetAttributes($pack[0].FullName, [IO.FileAttributes]::Normal)
        $flux = [IO.File]::Open($pack[0].FullName, "Open", "ReadWrite")
        $taille = $flux.Length
        $flux.SetLength([Math]::Max(64, $taille - 4096))
        $flux.Dispose()
        $abime = Outil @("-Depot", $copie, "-SansEcriture")
        Verif "controle positif : la copie abimee ECHOUE (code non nul)" ($abime.code -ne 0) ("code=" + $abime.code)
        Verif "l'echec est nomme (pack/donnees abimees)" (
            $abime.sortie -match "(?i)abime|damaged|pack|corrupt|invalid")
    }
} finally {
    Remove-Item $copie -Recurse -Force -ErrorAction SilentlyContinue
}

# --- 5-8. etat et historique --------------------------------------------------
$temoin = Join-Path $env:TEMP ("lcd-etat-" + [guid]::NewGuid().ToString("N"))
$sauvegarde = if (Test-Path $etatReel) { Get-Content $etatReel -Raw } else { $null }
try {
    if (Test-Path $etatReel) { Remove-Item $etatReel -Force }
    $sans = Outil @("-Etat")
    Verif "sans historique, -Etat sort en code 1" ($sans.code -eq 1)
    Verif "sans historique, l'etat dit « jamais »" ($sans.sortie -match "jamais")

    $null = Outil @("-SansEcriture")
    Verif "-SansEcriture ne cree pas d'historique" (-not (Test-Path $etatReel))

    $null = Outil @()
    Verif "apres controle, l'historique existe" (Test-Path $etatReel)
    $frais = Outil @("-Etat")
    Verif ("apres controle, -Etat est vert (code 0) et donne l'age") (
        $frais.code -eq 0 -and $frais.sortie -match "\(\d+ jour")

    $vieux = (Get-Date).ToUniversalTime().AddDays(-45).ToString("o")
    [IO.File]::WriteAllText($etatReel, $vieux + "`n", [Text.UTF8Encoding]::new($false))
    $perime = Outil @("-Etat", "-SeuilJours", "30")
    Verif ("historique de 45 j : -Etat sort en code 1 (seuil 30)") ($perime.code -eq 1)
} finally {
    if ($sauvegarde) { [IO.File]::WriteAllText($etatReel, $sauvegarde, [Text.UTF8Encoding]::new($false)) }
}

# --- 9-10. hygiene ------------------------------------------------------------
$mdp = (Get-Content (Join-Path $ici "backups/.restic-pass") -Raw).Trim()
Verif "le mot de passe restic n'apparait pas dans la sortie" ($e.sortie -notmatch [regex]::Escape($mdp))
$ignore = (Natif { git -C $racine check-ignore "deploy/backups/.derniere-verification" 2>$null } | Out-String).Trim()
Verif "l'historique de controle est gitignoré" ($ignore -ne "")

Write-Output ""
if ($script:KO -eq 0) {
    Write-Output "RESULTAT : integrite du depot prouvee, corruption detectee ($($script:N)/$($script:N) OK)"
} else {
    Write-Output "RESULTAT : $($script:KO) ECHEC(S) sur $($script:N) checks"
}
exit $script:KO
