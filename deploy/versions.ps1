# versions.ps1 - journal des VERSIONS DEPLOYEES (doctrine docs/71, §8 terdecies).
#
#   powershell -ExecutionPolicy Bypass -File ./versions.ps1            # ecrit docs/75-versions-verifiees.md
#   powershell -ExecutionPolicy Bypass -File ./versions.ps1 -Verifier  # compare, code 1 si une version a bouge
#   powershell -ExecutionPolicy Bypass -File ./versions.ps1 -Accepter  # enregistre un changement VOULU
#
# POURQUOI : une image peut changer sans que personne ne l'ait decide - un
# `docker compose build`, un tag flottant (`caddy:2-alpine`), un rebuild local
# du front. Le SAS « definitif » ne doit pas se modifier tout seul : ce journal
# enregistre l'IDENTIFIANT d'image reellement execute (digest court) pour chaque
# service, et -Verifier echoue des qu'il differe. Accepter un changement est un
# geste explicite, date, et qui laisse une trace dans le document.

param(
    [switch]$Verifier,
    [switch]$Accepter,
    [string]$Sortie
)

$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $false
$ici = Split-Path -Parent (Resolve-Path $MyInvocation.MyCommand.Path)
$racine = Split-Path -Parent $ici
if (-not $Sortie) { $Sortie = Join-Path $racine "docs/75-versions-verifiees.md" }
$projet = "lcd-deploy"

function Natif($bloc) {
    $prev = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try { return (& $bloc) } finally { $ErrorActionPreference = $prev }
}

#  Le service de compose et le conteneur qui le porte (nommage du projet
#  lcd-deploy : lcd-deploy-<service>-1). On lit la REFERENCE d'image declaree
#  dans le compose ET l'identifiant reellement execute : les deux comptent,
#  parce qu'un tag flottant peut pointer ailleurs demain.
$services = @("web", "authelia", "caddy")
$lignes = @()
foreach ($s in $services) {
    $conteneur = "${projet}-${s}-1"
    $image = (Natif { & docker inspect --format "{{.Image}}" $conteneur 2>$null } | Out-String).Trim()
    $ref = (Natif { & docker inspect --format "{{.Config.Image}}" $conteneur 2>$null } | Out-String).Trim()
    $cree = (Natif { & docker inspect --format "{{.Created}}" $conteneur 2>$null } | Out-String).Trim()
    if (-not $image) { $lignes += [ordered]@{ service = $s; ref = "(absent)"; digest = "(absent)"; cree = "" }; continue }
    $digest = $image.Replace("sha256:", "").Substring(0, 12)
    $lignes += [ordered]@{ service = $s; ref = $ref; digest = $digest; cree = $cree }
}

$contenu = New-Object System.Collections.Generic.List[string]
$contenu.Add("# 75 - Versions deployees (genere)")
$contenu.Add("")
$contenu.Add("**Genere le** : " + (Get-Date -Format "yyyy-MM-dd HH:mm") + " par ``deploy/versions.ps1``.")
$contenu.Add("**Ne pas editer a la main** : ``-Accepter`` enregistre un changement **voulu**, avec sa date.")
$contenu.Add("")
$contenu.Add("Ce document dit ce qui tourne **vraiment**, pas ce que le depot demande : l'identifiant")
$contenu.Add("d'image execute est la seule preuve qu'un rebuild n'a pas change le service en douce.")
$contenu.Add("")
$contenu.Add("| Service | Image demandee | Image EXECUTEE | Conteneur cree le |")
$contenu.Add("|---|---|---|---|")
foreach ($l in $lignes) {
    $q = if ($l.cree.Length -ge 16) { $l.cree.Substring(0, 16) } else { $l.cree }
    $contenu.Add(("| {0} | ``{1}`` | ``{2}`` | {3} |" -f $l.service, $l.ref, $l.digest, $q))
}
$contenu.Add("")
$contenu.Add("## Verification")
$contenu.Add("")
$contenu.Add("``deploy/versions.ps1 -Verifier`` : sort en **code 1** des qu'un identifiant differe du")
$contenu.Add("document - une mise a jour subie n'est pas une mise a jour acceptee. Le geste d'acceptation")
$contenu.Add("est ``-Accepter``, qui reecrit le document et laisse la trace.")
$texte = (($contenu -join "`n") + "`n")

if ($Verifier) {
    if (-not (Test-Path $Sortie)) { Write-Output "[KO] document absent : lancer deploy/versions.ps1"; exit 1 }
    $actuel = [IO.File]::ReadAllText($Sortie, [Text.Encoding]::UTF8)
    $ecarts = @()
    foreach ($l in $lignes) {
        #  On cherche la ligne du service et l'identifiant qu'elle porte.
        $motif = "(?m)^\| " + [regex]::Escape($l.service) + " \|.*?``([0-9a-f]{12}|\(absent\))`` \|"
        $m = [regex]::Match($actuel, $motif)
        if (-not $m.Success) { $ecarts += ($l.service + " absent du document") ; continue }
        if ($m.Groups[1].Value -ne $l.digest) { $ecarts += ("{0} : document={1} execute={2}" -f $l.service, $m.Groups[1].Value, $l.digest) }
    }
    if ($ecarts.Count -eq 0) { Write-Output ("RESULTAT : versions conformes au document (" + $lignes.Count + " services)"); exit 0 }
    Write-Output "[KO] une version a change sans acceptation :"
    foreach ($e in $ecarts) { Write-Output ("       " + $e) }
    Write-Output "       geste attendu : deploy/versions.ps1 -Accepter (et le dire dans le changelog)"
    exit 1
}

[IO.File]::WriteAllText($Sortie, $texte, (New-Object System.Text.UTF8Encoding($false)))
$action = if ($Accepter) { "changement ACCEPTE" } else { "journal ecrit" }
Write-Output ("RESULTAT : " + $action + " (" + $lignes.Count + " services) -> " + $Sortie)
exit 0
