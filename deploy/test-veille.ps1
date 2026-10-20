# Batterie G-veille (doctrine docs/71, V6) : prouver que la surveillance
# DETECTE une panne reelle, et qu'elle ne crie pas a tort sur une pile saine.
#
#   powershell -ExecutionPolicy Bypass -File ./test-veille.ps1
#
# Checks :
#   1. pile saine -> 0 alerte critique (regle disque neutralisee par seuil) ;
#   2. chaque regle se declenche quand on abaisse son seuil (site muet,
#      disque, sauvegarde) : une regle qui ne peut pas crier n'est pas une
#      regle ;
#   3. PANNE INDUITE REELLE : arret du conteneur front -> alerte front +
#      entree ; redemarrage -> plus d'alerte (detection ET retour a la normale) ;
#   4. journalisation : alertes.jsonl recoit l'alerte, etat.json est relisible ;
#   5. le dossier de veille est gitignore (aucun etat runtime dans git).

$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $false
$script:KO = 0
$script:N = 0
$ici = Split-Path -Parent (Resolve-Path $MyInvocation.MyCommand.Path)
$veille = Join-Path $ici "veille.ps1"
$journal = Join-Path $ici "veille/alertes.jsonl"
$etatF = Join-Path $ici "veille/etat.json"
$FRONT_CT = "lcd-deploy-web-1"

function Verif($label, $ok) {
    $script:N++
    if ($ok) { Write-Output "[OK] $label" } else { Write-Output "[KO] $label"; $script:KO++ }
}
function LancerVeille {
    param([string[]]$Plus = @())
    $sortie = & powershell -ExecutionPolicy Bypass -File $veille @Plus 2>&1
    return ($sortie -join "`n")
}

$racine = Split-Path -Parent $ici
Push-Location $racine
$etaitArrete = $false
try {
    # --- 5. Hygiene git ----------------------------------------------------
    $null = & git check-ignore -q -- "deploy/veille" 2>$null
    Verif "dossier de veille gitignore (deploy/veille)" ($LASTEXITCODE -eq 0)

    # --- 1. Pile saine : aucune alerte critique ---------------------------
    # Seuil disque a 0 : sur cet hote le disque est volontairement signale
    # (5,1 % libre) ; le controle « pile saine » ne doit pas en dependre.
    $sain = LancerVeille @("-SeuilDisque", "0")
    $crit = ([regex]::Matches($sain, "\[CRITIQUE\]")).Count
    Verif "pile saine : 0 alerte critique" ($crit -eq 0)
    if ($crit -gt 0) { Write-Output ($sain -split "`n" | Where-Object { $_ -match "CRITIQUE" } | Select-Object -First 3) }

    # --- 2. Les regles savent crier ---------------------------------------
    Verif "regle site muet : declenchee avec -SeuilSite 0" ((LancerVeille @("-SeuilSite", "0", "-SeuilDisque", "0")) -match "site-muet-")
    Verif "regle disque : declenchee avec -SeuilDisque 100" ((LancerVeille @("-SeuilDisque", "100")) -match "\] disque -")
    Verif "regle sauvegarde : declenchee avec -SeuilSauvegardeHeures 0" (
        (LancerVeille @("-SeuilDisque", "0", "-SeuilSauvegardeHeures", "0")) -match "sauvegarde trop ancienne")

    # --- 3. Panne INDUITE : le front tombe --------------------------------
    $etatConteneur = (& docker inspect --format "{{.State.Running}}" $FRONT_CT 2>$null | Out-String).Trim()
    if ($etatConteneur -ne "true") { $etaitArrete = $true }
    & docker stop $FRONT_CT 2>&1 | Out-Null
    Start-Sleep -Seconds 3
    $panne = LancerVeille @("-SeuilDisque", "0")
    Verif "panne induite : front arrete detecte (http-front)" ($panne -match "http-front")
    Verif "panne induite : conteneur arrete detecte" ($panne -match "conteneur-$FRONT_CT")

    # --- 4. Journalisation ------------------------------------------------
    $avantJournal = if (Test-Path $journal) { (Get-Content $journal).Count } else { 0 }
    $null = LancerVeille @("-SeuilDisque", "0")
    $apresJournal = if (Test-Path $journal) { (Get-Content $journal).Count } else { 0 }
    Verif "journal : alerte ecrite dans alertes.jsonl" ($apresJournal -gt $avantJournal)
    $derniere = if (Test-Path $journal) { Get-Content $journal -Tail 5 } else { @() }
    Verif "journal : l'alerte front y figure (JSON valide)" (
        (@($derniere) | Where-Object { $_ -match '"id":"http-front"' }).Count -ge 1)
    $etatOk = $false
    try { $e = Get-Content $etatF -Raw | ConvertFrom-Json; $etatOk = ($null -ne $e.controles) } catch { }
    Verif "etat.json relisible (dernier etat complet)" $etatOk

    # --- 3 bis. Retour a la normale --------------------------------------
    & docker start $FRONT_CT 2>&1 | Out-Null
    $revenu = $false
    for ($i = 0; $i -lt 30; $i++) {
        Start-Sleep -Seconds 2
        $apres = LancerVeille @("-SeuilDisque", "0")
        if (-not ($apres -match "http-front")) { $revenu = $true; break }
    }
    Verif "retour a la normale : plus d'alerte front apres redemarrage" $revenu
    if (-not $revenu) { Write-Output ($apres -split "`n" | Where-Object { $_ -match "CRITIQUE" } | Select-Object -First 3) }

} finally {
    if (-not $etaitArrete) { & docker start $FRONT_CT 2>&1 | Out-Null }
    Pop-Location
}

Write-Output ""
if ($script:KO -eq 0) {
    Write-Output "RESULTAT : veille operationnelle, panne detectee puis retour a la normale ($($script:N)/$($script:N) OK)"
} else {
    Write-Output "RESULTAT : $($script:KO) ECHEC(S) sur $($script:N) checks"
}
exit $script:KO
