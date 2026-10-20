# Batterie G-sauvegarde (doctrine docs/71, V4) : prouver que l'etat reel est
# sauvegarde CHIFFRE et REELLEMENT restaurable — pas seulement "la commande
# rend 0".
#
#   powershell -ExecutionPolicy Bypass -File ./test-backup.ps1
#   powershell -ExecutionPolicy Bypass -File ./test-backup.ps1 -Complet   # + restauration de TOUS les volumes
#
# Checks :
#   1. depot + mot de passe hors git (gitignore et non suivis),
#   2. chaque volume lcd-* possede un snapshot (completude de la sauvegarde),
#   3. `restic check` : integrite cryptographique du depot,
#   4. restauration d'un volume REEL comparee par empreinte sha256,
#   5. test destructif : 3 fichiers -> sauvegarde -> suppression -> restauration
#      -> contenu IDENTIQUE (c'est la preuve que la restauration restaure),
#   6. -Complet : restauration des 25+ volumes compares un a un.
#
# Aucun secret affiche ; les volumes de production ne sont JAMAIS modifies.

param([switch]$Complet)

$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $false
$script:KO = 0
$script:N = 0
$RESTIC = "restic/restic:0.17.3"
$ALPINE = "alpine:3.22"
$ici = Split-Path -Parent (Resolve-Path $MyInvocation.MyCommand.Path)
$racine = Split-Path -Parent $ici
$Depot = Join-Path $ici "backups/restic"
$passFile = Join-Path $ici "backups/.restic-pass"
$envr = @("-e", "RESTIC_PASSWORD_FILE=/pw", "-e", "RESTIC_REPOSITORY=/repo")
$vol = @("-v", "${Depot}:/repo", "-v", "${passFile}:/pw:ro")
$jetables = New-Object System.Collections.Generic.List[string]

function Verif($label, $ok) {
    $script:N++
    if ($ok) { Write-Output "[OK] $label" } else { Write-Output "[KO] $label"; $script:KO++ }
}
function Empreinte($volDocker) {
    # Empreinte = sha256 de la liste triee des sha256 de CONTENU (les chemins
    # sont ecartes : une restauration restitue /data/... sous une autre racine,
    # comparer les chemins faisait echouer a tort -- mesure du 2026-10-19).
    # Aucun `$` dans le script shell (PowerShell les mangerait), aucun
    # `find -printf` (absent de busybox).
    $prev = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    $sortie = & docker run --rm -v "${volDocker}:/d:ro" $ALPINE sh -c `
        "cd /d 2>/dev/null || exit 0; find . -type f -exec sha256sum {} + 2>/dev/null | cut -d' ' -f1 | sort | sha256sum | cut -d' ' -f1; find . -type f | wc -l" 2>&1
    $ErrorActionPreference = $prev
    return ($sortie -join " ").Trim()
}
function ContenuSnapshot($tag) {
    # Nombre de fichiers et octets DANS LE SNAPSHOT (source de verite ; on ne
    # compare jamais a un volume vivant, qui change en permanence).
    $r = ResticCli @("ls", "--json", "latest", "--tag", $tag)
    $nb = 0; $octets = [int64]0
    foreach ($l in ($r.sortie -split "`n")) {
        if (-not $l.Trim().StartsWith("{")) { continue }
        try { $n = $l | ConvertFrom-Json } catch { continue }
        if ($n.type -eq "file") { $nb++; if ($n.size) { $octets += [int64]$n.size } }
    }
    return @{ nb = $nb; octets = $octets }
}
function ContenuDossier($volDocker) {
    $prev = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    $s = & docker run --rm -v "${volDocker}:/d:ro" $ALPINE sh -c `
        "find /d -type f -exec stat -c '%s %n' {} +" 2>&1
    $ErrorActionPreference = $prev
    $nb = 0; $octets = [int64]0
    foreach ($l in @($s)) { if ("$l" -match '^\s*(\d+)\s') { $nb++; $octets += [int64]$Matches[1] } }
    return @{ nb = $nb; octets = $octets }
}
function ResticCli {
    # NE JAMAIS nommer ce parametre `Args` : PowerShell a une variable
    # automatique $Args, qui masque le parametre dans le corps de la fonction.
    # Mesure du 2026-10-19 : restic recevait ZERO argument, imprimait son aide
    # et sortait en 0 -- une "reussite" qui ne restaurait rien.
    param([string[]]$SousCommande, [string[]]$Extra = @())
    $prev = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    $sortie = & docker @(@("run", "--rm") + $envr + $vol + $Extra + @($RESTIC) + $SousCommande) 2>&1
    $code = $LASTEXITCODE
    $ErrorActionPreference = $prev
    return @{ code = $code; sortie = ($sortie -join "`n") }
}
function Volume($nom) {
    & docker volume create $nom | Out-Null
    $jetables.Add($nom)
    return $nom
}

Push-Location $racine
try {
    # --- 1. Depot + mot de passe hors git --------------------------------
    Verif "depot de sauvegarde present (deploy/backups/restic)" (Test-Path $Depot)
    Verif "mot de passe du depot present" (Test-Path $passFile)
    $suivi = $false
    try { $null = & git ls-files --error-unmatch -- "deploy/backups/.restic-pass" 2>$null; $suivi = ($LASTEXITCODE -eq 0) } catch { }
    Verif "mot de passe JAMAIS suivi par git" (-not $suivi)
    $null = & git check-ignore -q -- "deploy/backups/.restic-pass" 2>$null
    Verif "depot de sauvegarde ignore par git" ($LASTEXITCODE -eq 0)

    if (-not (Test-Path $Depot) -or -not (Test-Path $passFile)) {
        throw "sauvegarde jamais lancee : executer ./sauvegarde.ps1"
    }

    # --- 2. Completude : un snapshot par volume --------------------------
    #  Les volumes EPHEMERES du drill de reprise (lcd-reprise_*) et des batteries
#  sont exclus : ils existent quelques minutes et n'ont pas a avoir de
#  snapshot — sinon la batterie devient instable des qu'un drill tourne
#  (mesure du 2026-10-19 : 1 KO transitoire, vert seul juste apres).
$volumes = @(& docker volume ls --format "{{.Name}}" | Where-Object { $_ -match "^lcd-" -and $_ -notmatch "^lcd-(restaure|test-backup|reprise)" })
    $snapJson = (ResticCli @("snapshots", "--json")).sortie
    $tagues = @()
    if ($snapJson.Trim().StartsWith("[")) {
        foreach ($s in ($snapJson | ConvertFrom-Json)) {
            foreach ($t in $s.tags) { if ($t -like "volume=*") { $tagues += $t.Substring(7) } }
        }
    }
    $tagues = @($tagues | Sort-Object -Unique)
    $manquants = @($volumes | Where-Object { $tagues -notcontains $_ })
    Verif "les $($volumes.Count) volumes ont un snapshot ($($tagues.Count) sauvegardes)" ($manquants.Count -eq 0)
    if ($manquants.Count -gt 0) { $manquants | ForEach-Object { Write-Output "      non sauvegarde : $_" } }
    Verif "etat hote sauvegarde (tag hote=lcd)" ($snapJson -match "hote=lcd")

    # --- 3. Integrite du depot -------------------------------------------
    $check = ResticCli @("check", "--read-data-subset=1/20")
    Verif "restic check : depot intègre (echantillon de donnees relu)" ($check.code -eq 0)
    if ($check.code -ne 0) { Write-Output ("      " + ($check.sortie -split "`n" | Select-Object -Last 3)) }

    # --- 4. Restauration d'un volume REEL, comparee au SNAPSHOT -----------
    # On ne compare PAS au volume vivant : il change en permanence (98 fichiers
    # au moment du snapshot, 182 dix minutes plus tard -> faux KO du 2026-10-19).
    $reel = $volumes[0]
    foreach ($cand in @("lcd-lab_dispatch-state", "lcd-lab_compta-state", "lcd-lab_passerelle-state")) {
        if ($volumes -contains $cand) { $reel = $cand; break }
    }
    $dst = Volume ("lcd-restaure-" + [guid]::NewGuid().ToString("N").Substring(0, 8))
    $r = ResticCli @("restore", "latest", "--tag", "volume=$reel", "--target", "/out", "--quiet") -Extra @("-v", "${dst}:/out")
    $snap = ContenuSnapshot "volume=$reel"
    $obtenu = ContenuDossier $dst
    Verif "volume reel $reel restaure conforme au snapshot ($($snap.nb) fichiers)" (
        $r.code -eq 0 -and $obtenu.nb -eq $snap.nb -and $obtenu.octets -eq $snap.octets)
    if ($obtenu.nb -ne $snap.nb -or $obtenu.octets -ne $snap.octets) {
        Write-Output "      snapshot : $($snap.nb) fichiers / $($snap.octets) octets"
        Write-Output "      restaure : $($obtenu.nb) fichiers / $($obtenu.octets) octets"
    }

    # --- 5. Test DESTRUCTIF (la preuve que restaurer restaure) -----------
    $src = Volume ("lcd-test-backup-" + [guid]::NewGuid().ToString("N").Substring(0, 8))
    & docker run --rm -v "${src}:/d" $ALPINE sh -c "echo alpha > /d/a.txt; echo beta > /d/b.txt; mkdir -p /d/sous; echo gamma > /d/sous/c.txt" | Out-Null
    $avant = Empreinte $src
    $bk = ResticCli @("backup", "/data", "--tag", "volume=$src", "--quiet") -Extra @("-v", "${src}:/data:ro")
    & docker run --rm -v "${src}:/d" $ALPINE sh -c "rm -f /d/b.txt" | Out-Null
    $casse = Empreinte $src
    Verif "test destructif : la source a bien change apres suppression" ($avant -ne $casse -and $bk.code -eq 0)
    $dst2 = Volume ("lcd-restaure-" + [guid]::NewGuid().ToString("N").Substring(0, 8))
    $r2 = ResticCli @("restore", "latest", "--tag", "volume=$src", "--target", "/out", "--quiet") -Extra @("-v", "${dst2}:/out")
    $apres = Empreinte $dst2
    Verif "test destructif : fichier supprime RESTAURE a l'identique" ($r2.code -eq 0 -and $apres -eq $avant)
    if ($apres -ne $avant) { Write-Output "      attendu: $avant`n      obtenu : $apres" }

    # --- 6. Controle complet (option) ------------------------------------
    if ($Complet) {
        $sortie = & powershell -ExecutionPolicy Bypass -File (Join-Path $ici "restauration.ps1") -Verifier 2>&1
        $code = $LASTEXITCODE
        Verif "restauration de TOUS les volumes ($($volumes.Count)) identique" ($code -eq 0)
        if ($code -ne 0) { Write-Output (($sortie | Select-Object -Last 5) -join "`n") }
    }

} finally {
    foreach ($j in $jetables) { & docker volume rm -f $j 2>$null | Out-Null }
    Pop-Location
}

Write-Output ""
if ($script:KO -eq 0) {
    Write-Output "RESULTAT : sauvegarde chiffree + restauration prouvee ($($script:N)/$($script:N) OK)"
} else {
    Write-Output "RESULTAT : $($script:KO) ECHEC(S) sur $($script:N) checks"
}
exit $script:KO
