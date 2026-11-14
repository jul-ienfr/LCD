# Batterie G-docs V2 : la documentation active doit rester vraie.
#
#   pwsh -File ./deploy/test-docs.ps1
#
# Checks :
#   1. chaque document structurant existe et porte un en-tete `Statut` ;
#   2. le statut appartient a la liste autorisee ;
#   3. un document ACTIF a une date de verification <= 90 jours ;
#   4. docs/INDEX.md liste tous les documents de docs/ (hors README/INDEX) ;
#   5. les liens relatifs des documents structurants existent ;
#   6. aucun document ARCHIVE n'est cite comme source de verite ;
#   7. aucun document actif ne cite un chemin V1 non archive ;
#   8. les compteurs des tasks.md sont lisibles (x / [ ] / [~]).

$ErrorActionPreference = "Stop"
$script:KO = 0
$script:N = 0
$racine = Split-Path -Parent (Split-Path -Parent (Resolve-Path $MyInvocation.MyCommand.Path))

function Verif($label, $ok, $detail = "") {
    $script:N++
    if ($ok) { Write-Output "[OK] $label" }
    else { Write-Output "[KO] $label$(if ($detail) { " -> $detail" })"; $script:KO++ }
}
function Lire($rel) {
    $p = Join-Path $racine $rel
    if (Test-Path -LiteralPath $p) { return (Get-Content -LiteralPath $p -Raw) }
    return $null
}
function Entete($texte) {
    if (-not $texte) { return $null }
    $lignes = $texte -split "`r?`n"
    $bloc = ($lignes | Select-Object -First 14) -join "`n"
    if ($bloc -match "(?m)^Statut\s*:\s*(\S+)") { return $Matches[1] }
    return $null
}
function DateEntete($texte) {
    if ($texte -match "(?m)^Dernière vérification\s*:\s*(\d{4}-\d{2}-\d{2})") { return $Matches[1] }
    return $null
}

$statuts = @("ACTIF", "TERMINÉ", "ARCHIVE", "GÉNÉRÉ", "OBSOLÈTE", "REMPLACÉ")

$structurants = @(
    "README.md",
    "docs/INDEX.md",
    "docs/00-vision-portee.md",
    "docs/10-exigences-produit.md",
    "docs/20-architecture-v2.md",
    "docs/72-runbooks.md",
    "docs/80-stack-sveltekit.md",
    "docs/plans/PLAN-GLOBAL-SPEC-KIT-2026-11-14.md",
    "docs/plans/ROADMAP-GO-LIVE-2026-11-14.md",
    "docs/plans/PLAN-MIGRATION-V1-V2.md",
    "docs/ops/runbook-production.md",
    "docs/ops/runbook-bascule.md",
    "docs/ops/recette-2026-11/journal.md",
    "docs/registres/etat-reel.md",
    "docs/registres/changelog.md",
    "docs/analyses/AUDIT-ET-PLAN-DOCUMENTATION-2026-11-14.md",
    "v2/README.md",
    "v2/ECARTS-V1.md",
    "v2/MATRICE-MUST-HAVE-CHANNEL-MANAGER.md",
    "v2/TESTS-A-FAIRE.md",
    "v2/DEPLOIEMENT.md",
    "v2/DEPLOIEMENT-VPS.md",
    "v2/BACKUPS.md",
    "v2/MONITORING.md",
    "v2/RUNBOOK-OTA.md",
    "v2/docs/qa-manuel.md",
    "specs/001-i18n-staff/spec.md",
    "specs/001-i18n-staff/tasks.md",
    "specs/002-parite-lodgify/spec.md",
    "specs/002-parite-lodgify/tasks.md",
    "specs/002-parite-lodgify/plan.md",
    "specs/002-parite-lodgify/matrice-fr.md",
    "specs/002-parite-lodgify/traceability.md",
    "specs/003-audit-parite-plans-initiaux/spec.md",
    "specs/003-audit-parite-plans-initiaux/tasks.md",
    "specs/004-ergonomie-experience-client/spec.md",
    "specs/004-ergonomie-experience-client/tasks.md",
    "specs/005-mise-en-production/spec.md",
    "specs/005-mise-en-production/tasks.md",
    "specs/005-mise-en-production/plan.md"
)

# 1-2. presence et statut
$manquants = @()
$sansEntete = @()
$statutInconnu = @()
$actifsTropVieux = @()
$archiveCommeVerite = @()
$dates = @{}
foreach ($rel in $structurants) {
    $texte = Lire $rel
    if (-not $texte) { $manquants += $rel; continue }
    $statut = Entete $texte
    if (-not $statut) { $sansEntete += $rel; continue }
    if ($statuts -notcontains $statut) { $statutInconnu += "$rel ($statut)" }
    $d = DateEntete $texte
    $dates[$rel] = $d
    if ($statut -eq "ACTIF") {
        if (-not $d) { $actifsTropVieux += "$rel (sans date)" }
        else {
            $dt = [datetime]::ParseExact($d, "yyyy-MM-dd", $null)
            if (((Get-Date) - $dt).TotalDays -gt 90) { $actifsTropVieux += "$rel ($d)" }
        }
    }
    if ($texte -match "(?m)^Source de vérité\s*:\s*(.+)$") {
        if ($Matches[1] -match "archive/") { $archiveCommeVerite += $rel }
    }
}
Verif ("les {0} documents structurants existent" -f $structurants.Count) ($manquants.Count -eq 0) ($manquants -join ", ")
Verif ("chaque document structurant porte un en-tete Statut" ) ($sansEntete.Count -eq 0) ($sansEntete -join ", ")
Verif ("les statuts sont dans la liste autorisee") ($statutInconnu.Count -eq 0) ($statutInconnu -join ", ")
Verif ("les documents ACTIF sont verifies depuis moins de 90 jours") ($actifsTropVieux.Count -eq 0) ($actifsTropVieux -join ", ")
Verif ("aucun document ARCHIVE n'est cite comme source de verite") ($archiveCommeVerite.Count -eq 0) ($archiveCommeVerite -join ", ")

# 4. index couvre les documents de docs/
$index = Lire "docs/INDEX.md"
if (-not $index) { $index = "" }
$docsTop = @(Get-ChildItem (Join-Path $racine "docs") -Filter "*.md" -File |
    Where-Object { $_.Name -notin @("README.md", "INDEX.md") } |
    ForEach-Object { "docs/" + $_.Name })
$nonIndexes = @($docsTop | Where-Object { $index -notmatch [regex]::Escape($_) })
Verif ("docs/INDEX.md liste les {0} documents de docs/" -f $docsTop.Count) ($nonIndexes.Count -eq 0) ($nonIndexes -join ", ")

# 5. liens relatifs
$liensCasses = @()
foreach ($rel in $structurants) {
    $texte = Lire $rel
    if (-not $texte) { continue }
    $dossier = Split-Path -Parent (Join-Path $racine $rel)
    foreach ($m in [regex]::Matches($texte, "\]\(([^)]+)\)")) {
        $cible = $m.Groups[1].Value.Trim()
        if ($cible -match "^(https?:|mailto:|#)") { continue }
        if ($cible -match "[{}$<>]") { continue }
        $cible = ($cible -split "#")[0]
        if (-not $cible) { continue }
        $cible = [uri]::UnescapeDataString($cible)
        $p = Join-Path $dossier $cible
        if (-not (Test-Path -LiteralPath $p)) { $liensCasses += "$rel -> $cible" }
    }
}
Verif ("les liens relatifs des documents structurants existent") ($liensCasses.Count -eq 0) (($liensCasses | Select-Object -First 10) -join " ; ")

# 7. chemins V1 non archives
$anciens = @("docs/30-passerelle-v5.md", "docs/40-logement-v5.md", "docs/50-technique-box-v5.md",
    "docs/60-execution-v6.md", "docs/70-front-v1.md", "docs/71-production-locale.md",
    "docs/73-inventaire-donnees.md", "docs/74-etat-verifie.md", "docs/75-versions-verifiees.md",
    "docs/76-reconstruction.md", "docs/77-identite-roles-perimetres.md", "docs/78-plan-stack-deploiement.md",
    "docs/10-socle-v2.md", "docs/20-architecture-contrats.md", "docs/72-runbooks-v1.md")
$citesV1 = @()
$historiques = @("docs/registres/changelog.md", "docs/analyses/AUDIT-ET-PLAN-DOCUMENTATION-2026-11-14.md")
foreach ($rel in $structurants) {
    if ($historiques -contains $rel) { continue }
    $texte = Lire $rel
    if (-not $texte) { continue }
    foreach ($vieux in $anciens) {
        if ($texte -match [regex]::Escape($vieux)) { $citesV1 += "$rel -> $vieux" }
    }
}
Verif ("aucun document actif ne cite un chemin V1 non archive") ($citesV1.Count -eq 0) ($citesV1 -join " ; ")

# 8. compteurs des tasks.md
$tasks = @(Get-ChildItem (Join-Path $racine "specs") -Filter "tasks.md" -Recurse -File)
foreach ($t in $tasks) {
    $texte = Get-Content -LiteralPath $t.FullName -Raw
    $fait = ([regex]::Matches($texte, "(?m)^- \[x\]")).Count
    $reste = ([regex]::Matches($texte, "(?m)^- \[ \]")).Count
    $partiel = ([regex]::Matches($texte, "(?m)^- \[~\]")).Count
    $total = $fait + $reste + $partiel
    Verif ("compteurs lisibles : {0} (x={1}, ouvert={2}, partiel={3})" -f $t.Name, $fait, $reste, $partiel) ($total -gt 0)
}

Write-Output ""
if ($script:KO -eq 0) {
    Write-Output "RESULTAT : documentation structuree coherente ($($script:N)/$($script:N) OK)"
} else {
    Write-Output "RESULTAT : $($script:KO) ECHEC(S) sur $($script:N) checks"
}
exit $script:KO
