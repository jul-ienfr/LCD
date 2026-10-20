# Batterie G-taches (doctrine docs/71, V6) : l'exploitation automatique doit
# etre POSEe et PROUVEE (une tache qui ne demarre jamais est pire qu'aucune
# tache : elle rassure a tort).
#
#   powershell -ExecutionPolicy Bypass -File ./test-taches.ps1
#
# Checks :
#   1. les 5 taches existent et sont actives (API Windows, pas la sortie texte) ;
#   2. chaque action appelle le SCRIPT ABSOLU attendu (pas un chemin relatif) ;
#   3. une execution forcee de la sauvegarde ecrit VRAIMENT (snapshots en plus) ;
#   4. une execution forcee de la veille reecrit son journal ;
#   5. le code de retour de la tache est 0 (le planificateur ne signale pas
#      d'echec) ;
#   6. les journaux sont dans deploy/veille/ (gitignore) et non dans git ;
#   7. desinstallation puis reinstallation : la pose est idempotente.

$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $false
$script:KO = 0
$script:N = 0
$ici = Split-Path -Parent (Resolve-Path $MyInvocation.MyCommand.Path)
$racine = Split-Path -Parent $ici
$installeur = Join-Path $ici "installer-taches.ps1"
$veilleDir = Join-Path $ici "veille"

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
function Lancer($mode) {
    return (Natif { powershell -ExecutionPolicy Bypass -File $installeur $mode 2>&1 } | Out-String)
}
function CompteurSnapshots {
    $repo = Join-Path $ici "backups/restic"
    $pass = Join-Path $ici "backups/.restic-pass"
    if (-not (Test-Path (Join-Path $repo "config"))) { return -1 }
    $json = (Natif {
            docker run --rm -e RESTIC_PASSWORD_FILE=/pw -e RESTIC_REPOSITORY=/repo `
                -v "${repo}:/repo" -v "${pass}:/pw:ro" restic/restic:0.17.3 snapshots --json 2>$null
        } | Out-String)
    $i = $json.IndexOf("[")
    if ($i -lt 0) { return -1 }
    return @(($json.Substring($i) | ConvertFrom-Json)).Count
}

Push-Location $racine
try {
    # --- 1-2. Taches presentes et ciblees --------------------------------
    foreach ($nom in @("LCD sauvegarde quotidienne", "LCD veille", "LCD batteries hebdo", "LCD entretien", "LCD reprise hebdo")) {
        $t = $null
        try { $t = Get-ScheduledTask -TaskName $nom -ErrorAction Stop } catch { }
        Verif "tache presente et active : $nom" ($null -ne $t -and $t.State -ne "Disabled")
        if ($t) {
            $arg = "$($t.Actions[0].Arguments)"
            $cible = "$($t.Actions[0].Execute)"
            Verif "  -> appelle un script ABSOLU du depot ($nom)" (
                $cible -match "powershell" -and $arg -match [regex]::Escape($ici) -and $arg -match "\.ps1")
        }
    }

    # --- 3. La sauvegarde ecrit vraiment ---------------------------------
    $avant = CompteurSnapshots
    Start-ScheduledTask -TaskName "LCD sauvegarde quotidienne"
    $apres = $avant
    for ($i = 0; $i -lt 90; $i++) {
        Start-Sleep -Seconds 5
        $apres = CompteurSnapshots
        if ($apres -gt $avant) { break }
    }
    Verif "sauvegarde forcee : snapshots $avant -> $apres" ($apres -gt $avant -and $apres -gt 0)

    # --- 4. La veille reecrit son journal --------------------------------
    $etat = Join-Path $veilleDir "etat.json"
    $avantT = if (Test-Path $etat) { (Get-Item $etat).LastWriteTime } else { [datetime]::MinValue }
    Start-ScheduledTask -TaskName "LCD veille"
    $veilleOk = $false
    for ($i = 0; $i -lt 40; $i++) {
        Start-Sleep -Seconds 3
        if ((Test-Path $etat) -and (Get-Item $etat).LastWriteTime -gt $avantT) { $veilleOk = $true; break }
    }
    Verif "veille forcee : etat.json reecrit" $veilleOk

    # --- 5. Code de retour du planificateur ------------------------------
    $codeSauvegarde = (Get-ScheduledTaskInfo -TaskName "LCD sauvegarde quotidienne").LastTaskResult
    $codeVeille = (Get-ScheduledTaskInfo -TaskName "LCD veille").LastTaskResult
    Verif "planificateur : sauvegarde terminee sans erreur (code=$codeSauvegarde)" ($codeSauvegarde -eq 0 -or $codeSauvegarde -eq 267009)
    Verif "planificateur : veille terminee sans erreur (code=$codeVeille)" ($codeVeille -eq 0 -or $codeVeille -eq 267009)

    # --- 6. Journaux hors git -------------------------------------------
    $journal = Join-Path $veilleDir "sauvegarde.log"
    Verif "journal de sauvegarde ecrit (deploy/veille/sauvegarde.log)" (Test-Path $journal)
    $suivi = (Natif { git ls-files -- "deploy/veille" 2>$null } | Out-String).Trim()
    Verif "aucun etat d'exploitation versionne (deploy/veille ignore)" ($suivi -eq "")

    # --- 7. Idempotence de la pose ---------------------------------------
    $null = Lancer "-Desinstaller"
    $apresDesinstall = @(Get-ScheduledTask -TaskName "LCD *" -ErrorAction SilentlyContinue).Count
    $null = Lancer "-Installer"
    $apresInstall = @(Get-ScheduledTask -TaskName "LCD *" -ErrorAction SilentlyContinue).Count
    Verif "desinstallation puis reinstallation (0 puis 5 taches)" ($apresDesinstall -eq 0 -and $apresInstall -eq 5)

} finally {
    Pop-Location
}

Write-Output ""
if ($script:KO -eq 0) {
    Write-Output "RESULTAT : exploitation automatique posee et prouvee ($($script:N)/$($script:N) OK)"
} else {
    Write-Output "RESULTAT : $($script:KO) ECHEC(S) sur $($script:N) checks"
}
exit $script:KO
