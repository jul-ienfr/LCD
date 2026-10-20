# index-docs.ps1 — produit docs/README.md, l'index des documents du SAS.
#
#   powershell -ExecutionPolicy Bypass -File ./index-docs.ps1            # ecrit l'index
#   powershell -ExecutionPolicy Bypass -File ./index-docs.ps1 -Verifier  # verifie sans ecrire (code 1 si derive)
#
# POURQUOI : vingt-trois documents, dont deux PRODUITS par la mesure
# (73-inventaire-donnees, 74-etat-verifie) et un que l'on relit en panne
# (72-runbooks). Sans index, on ne sait plus ce qui fait foi ni ce qui est
# generee — et un document genere edite a la main devient faux en silence.
# L'index est donc lui aussi genere, et la batterie test-docs.ps1 verifie
# qu'il est a jour.

param(
    [switch]$Verifier,
    [string]$Dossier
)

$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $false
$ici = Split-Path -Parent (Resolve-Path $MyInvocation.MyCommand.Path)
$racine = Split-Path -Parent $ici
if (-not $Dossier) { $Dossier = Join-Path $racine "docs" }

#  Les documents produits par un outil sont signales comme tels : les editer a
#  la main serait perdu a la regeneration suivante.
$generes = @{
    "73-inventaire-donnees.md" = "deploy/inventaire-donnees.ps1"
    "74-etat-verifie.md"       = "deploy/tout-verifier.ps1"
}
$roles = @{
    "00-vision-portee.md"              = "vision et portee du produit"
    "10-socle-v2.md"                   = "socle technique (etape depassee, garde pour l'histoire)"
    "20-architecture-contrats.md"      = "architecture et contrats entre briques"
    "30-passerelle-v5.md"              = "passerelle de parc"
    "40-logement-v5.md"                = "logement (regles, planning, prix)"
    "50-technique-box-v5.md"           = "box et technique terrain"
    "60-execution-v6.md"               = "plan d'execution V6"
    "70-front-v1.md"                   = "front (vues, PWA)"
    "71-production-locale.md"          = "ETAT DE PRODUCTION LOCAL : doctrine, portes de preuve"
    "72-runbooks.md"                   = "runbooks d'exploitation et de reprise (R-01 a R-11)"
    "73-inventaire-donnees.md"         = "inventaire des donnees (GENERE)"
    "74-etat-verifie.md"               = "etat verifie du SAS (GENERE par la passe)"
    "ag-sas-p10-12.md"                 = "assemblee generale / SAS"
    "checklist-taches-restantes.md"    = "checklist des taches restantes"
    "decision-serrure-acces.md"        = "decision : serrure et acces"
    "marque-formation-p10-11.md"       = "marque et formation"
    "panier-p0-chiffre.md"             = "panier P0 chiffre"
    "revue-modele-eco-p10-10.md"       = "revue du modele economique"
    "runbook-fuite-token.md"           = "runbook : fuite de token"
    "runbook-panne-wg-restore.md"      = "runbook : panne passerelle / restauration"
    "runbook-setup-lab-rea.md"         = "runbook : mise en place du lab de rea"
    "runbook-vol-box-vps-vault.md"     = "runbook : vol de box / VPS / coffre"
    "suivi-p0-terrain.md"              = "suivi P0 terrain"
}

function LireTitre($chemin) {
    foreach ($l in (Get-Content $chemin -TotalCount 40)) {
        if ($l -match '^#\s+(.+?)\s*$') { return $Matches[1] }
    }
    return ""
}
function PremierePhrase($chemin) {
    $vuTitre = $false
    foreach ($l in (Get-Content $chemin)) {
        if (-not $vuTitre) { if ($l -match '^#\s+') { $vuTitre = $true }; continue }
        $t = $l.Trim()
        #  Triples backticks en SIMPLE quotes : dans une chaine a double quotes,
        #  le troisieme backtick echappe le guillemet fermant et casse le parseur
        #  (« terminateur manquant », mesure du 2026-10-19).
        if ($t -eq "" -or $t.StartsWith("#") -or $t.StartsWith("|") -or $t.StartsWith('```')) { continue }
        $t = ($t -replace '\*\*', '' -replace '`', '')
        if ($t.Length -gt 150) { $t = $t.Substring(0, 147) + "..." }
        return $t
    }
    return ""
}

$fichiers = @(Get-ChildItem $Dossier -Filter "*.md" -File | Where-Object { $_.Name -ne "README.md" } | Sort-Object Name)
$numerotes = @($fichiers | Where-Object { $_.Name -match '^\d\d-' })
$autres = @($fichiers | Where-Object { $_.Name -notmatch '^\d\d-' })

$md = New-Object System.Collections.Generic.List[string]
$md.Add("# Index des documents du SAS")
$md.Add("")
$md.Add("**Genere le** : " + (Get-Date -Format "yyyy-MM-dd HH:mm") + " par ``deploy/index-docs.ps1``.")
$md.Add("**Ne pas editer a la main** : relancer l'outil (``-Verifier`` dit si l'index est a jour).")
$md.Add("")
$md.Add(("**{0} documents** : {1} numerotes (l'ordre raconte le projet) et {2} autres." -f `
        $fichiers.Count, $numerotes.Count, $autres.Count))
$md.Add("")
$md.Add("Deux documents sont **produits par la mesure** : les editer a la main est perdu a la regeneration.")
$md.Add("")
#  Pas de nombre de lignes dans l'index : les documents generes changent a
#  chaque passe et l'index deriverait sans arret (mesure du 2026-10-19 :
#  test-docs rouge a chaque passe pour cette seule raison). L'index doit
#  deriver quand un DOCUMENT apparait, pas quand il grandit.
$md.Add("## Documents numerotes")
$md.Add("")
$md.Add("| # | Document | Role |")
$md.Add("|---|---|---|")
foreach ($f in $numerotes) {
    $n = ($f.BaseName -split "-")[0]
    $role = if ($roles.ContainsKey($f.Name)) { $roles[$f.Name] } else { (PremierePhrase $f.FullName) }
    $md.Add(("| {0} | ``{1}`` | {2} |" -f $n, $f.Name, $role))
}
$md.Add("")
$md.Add("## Autres documents")
$md.Add("")
$md.Add("| Document | Role |")
$md.Add("|---|---|---:|")
foreach ($f in $autres) {
    $role = if ($roles.ContainsKey($f.Name)) { $roles[$f.Name] } else { (PremierePhrase $f.FullName) }
    $md.Add(("| ``{0}`` | {1} |" -f $f.Name, $role))
}
$md.Add("")
$md.Add("## Comment lire dans l'urgence")
$md.Add("")
$md.Add("1. **71-production-locale.md** : ce qui est prouve, et par quelle batterie.")
$md.Add("2. **72-runbooks.md** : quoi faire quand ca casse (R-01 a R-11).")
$md.Add("3. **74-etat-verifie.md** : l'etat mesure du jour (regenerer avec deploy/tout-verifier.ps1).")
$md.Add("")
$md.Add("## Comment verifier que la documentation est encore vraie")
$md.Add("")
$md.Add("``deploy/test-docs.ps1`` : index a jour, titres presents, scripts cites existants, aucune batterie orpheline.")
$contenu = (($md -join "`n") + "`n")

$cible = Join-Path $Dossier "README.md"
if ($Verifier) {
    if (-not (Test-Path $cible)) { Write-Output "[KO] docs/README.md absent"; exit 1 }
    $actuel = [IO.File]::ReadAllText($cible, [Text.Encoding]::UTF8)
    #  La date de generation change a chaque ecriture : on la neutralise des
    #  deux cotes avant comparaison (motif exact avec les ** du markdown).
    $sansDate = '\*\*Genere le\*\* : .*\r?\n'
    $a = ($actuel -replace $sansDate, "") -replace "\r\n", "`n"
    $b = ($contenu -replace $sansDate, "") -replace "\r\n", "`n"
    if ($a -eq $b) { Write-Output "RESULTAT : index a jour ($($fichiers.Count) documents)"; exit 0 }
    $lignesA = @($a -split "`n"); $lignesB = @($b -split "`n")
    $premier = 0
    $max = [Math]::Min($lignesA.Count, $lignesB.Count)
    for ($i = 0; $i -lt $max; $i++) { if ($lignesA[$i] -ne $lignesB[$i]) { $premier = $i + 1; break } }
    Write-Output ("[KO] index derive (premiere divergence ligne {0}) : relancer deploy/index-docs.ps1" -f $premier)
    exit 1
}

[IO.File]::WriteAllText($cible, $contenu, (New-Object System.Text.UTF8Encoding($false)))
Write-Output ("RESULTAT : index ecrit ({0} documents) -> {1}" -f $fichiers.Count, $cible)
exit 0
