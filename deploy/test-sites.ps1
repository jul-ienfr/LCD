# Batterie G-parite (doctrine docs/71, V1) : prouver que le parc est REELLEMENT
# servi par 2 sites box en local -- pas de faux VPS, pas de site degrade, pas de
# logement orphelin. Lecture seule, aucun ecriture, aucun secret affiche.
#
#   powershell -ExecutionPolicy Bypass -File ./test-sites.ps1
#   $env:GW = "http://127.0.0.1:8443"   (defaut)
#
# Sortie : [OK]/[KO] par check ; code de sortie = nombre de KO.

$ErrorActionPreference = "Stop"
$GW = if ($env:GW) { $env:GW } else { "http://127.0.0.1:8443" }
$script:KO = 0
$script:N = 0

function Verif($label, $ok) {
    $script:N++
    if ($ok) {
        Write-Output "[OK] $label"
    } else {
        Write-Output "[KO] $label"
        $script:KO++
    }
}

function Json($chemin) {
    $raw = curl.exe -s -m 25 "$GW$chemin"
    if (-not $raw) { throw "reponse vide sur $chemin" }
    return ($raw | ConvertFrom-Json)
}

# --- 1. Topologie declaree ------------------------------------------------
$etat = Json "/etat-parc"
$boxes = @($etat.boxes)
$logts = @($etat.logements)

Verif "sites : 2 sites declares (pas 1, pas 3)" ($boxes.Count -eq 2)
Verif "sites : chaque site porte >= 1 logement" (
    ($boxes | Where-Object { @($_.logements).Count -ge 1 }).Count -eq 2)

$simule = @($boxes | Where-Object {
    ("$($_.box_id) $($_.site) $(@($_.logements) -join ' ')" -match "(?i)sim|faux|fake|dummy|placeholder")
})
Verif "sites : aucun site/logement simule dans la topologie" ($simule.Count -eq 0)

$ages = @($boxes | ForEach-Object {
    if ($_.last_seen) {
        ([datetime]::UtcNow - ([datetime]$_.last_seen).ToUniversalTime()).TotalSeconds
    } else { 9999 }
})
Verif "sites : chaque site vu il y a < 300 s" (($ages | Where-Object { $_ -lt 300 }).Count -eq 2)

# --- 2. Logements : verite terrain ----------------------------------------
Verif "logements : 3 logements suivis" ($logts.Count -eq 3)
$sains = @($logts | Where-Object {
    $_.copro_verifiee -eq $true -and (@($_.bornes_prix).Count -eq 2) -and $_.stale -ne $true
})
Verif "logements : copro verifiee + bornes + non stale (tous)" ($sains.Count -eq $logts.Count)
Verif "logements : champ alertes expose" ($null -ne $etat.nb_logements_alertes)

# --- 3. Fan-out reel : chaque moteur repond, aucun '?' --------------------
$cal = Json "/calendrier-parc?jours=7"
$calLogts = @($cal.logements)
$cases = @($calLogts | ForEach-Object { @($_.jours) })
$casesKo = @($cases | Where-Object { $_.PSObject.Properties.Name -contains "erreur" })
Verif "fan-out : calendrier 7 j x 3 logements, 0 case en erreur" (
    $cases.Count -eq 21 -and $casesKo.Count -eq 0)
Verif "fan-out : calendrier declare lecture seule" ($cal.lecture_seule -eq $true)

$ap = Json "/api/apercu-parc"
$apLogts = @($ap.logements)
Verif "fan-out : prix servis pour chaque logement (>= 1 jour)" (
    $apLogts.Count -eq 3 -and (@($apLogts | Where-Object { @($_.prix_7j).Count -ge 1 }).Count -eq 3))
Verif "fan-out : aucun logement en erreur d'apercu" (
    @($apLogts | Where-Object { $_.erreur }).Count -eq 0)

# --- 4. Parite : aucun logement orphelin ----------------------------------
$idsEtat = @($logts | ForEach-Object { $_.logement_id } | Sort-Object)
$idsCal = @($calLogts | ForEach-Object { $_.logement_id } | Sort-Object)
$idsAp = @($apLogts | ForEach-Object { $_.logement_id } | Sort-Object)
$parite = (($idsEtat -join ",") -eq ($idsCal -join ",")) -and (($idsEtat -join ",") -eq ($idsAp -join ","))
Verif "parite : memes logements dans etat-parc / calendrier / apercu" $parite

Write-Output ""
if ($script:KO -eq 0) {
    Write-Output "RESULTAT : 2 sites reels, $($logts.Count) logements, fan-out complet ($($script:N)/$($script:N) OK)"
} else {
    Write-Output "RESULTAT : $($script:KO) ECHEC(S) sur $($script:N) checks"
}
exit $script:KO
