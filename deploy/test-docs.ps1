# Batterie G-docs (doctrine docs/71, §8 nonies) : la documentation doit rester
# VRAIE — index a jour, titres presents, scripts cites existants, aucune
# batterie orpheline. Une doc qui cite un script renomme est un mensonge
# silencieux.
#
#   powershell -ExecutionPolicy Bypass -File ./test-docs.ps1
#
# Checks :
#   1. l'index existe et liste TOUS les documents du dossier (et rien d'autre) ;
#   2. l'index est a jour (regenerable a l'identique) ;
#   3. CONTROLE POSITIF : un document ajoute rend -Verifier ROUGE (derive vue) ;
#   4. le nombre annonce dans l'index est le nombre reel ;
#   5. chaque document a un titre de niveau 1 ;
#   6. chaque script deploy/*.ps1 cite dans la doc existe sur le disque ;
#   7. chaque battement deploy/test-*.ps1 existe... euh : chaque batterie du
#      disque est citee au moins une fois dans la documentation ;
#   8. les documents generes portent l'avertissement « ne pas editer a la main » ;
#   9. aucun residu (.tmp, .bak, .orig) dans docs/.

$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $false
$script:KO = 0
$script:N = 0
$ici = Split-Path -Parent (Resolve-Path $MyInvocation.MyCommand.Path)
$racine = Split-Path -Parent $ici
$docs = Join-Path $racine "docs"
$index = Join-Path $docs "README.md"
$outil = Join-Path $ici "index-docs.ps1"

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
function Index([string[]]$extra) {
    $a = @("-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $outil) + $extra
    $sortie = (Natif { & powershell @a 2>&1 } | Out-String)
    return [ordered]@{ code = $LASTEXITCODE; sortie = $sortie }
}

$documents = @(Get-ChildItem $docs -Filter "*.md" -File | Where-Object { $_.Name -ne "README.md" } | Sort-Object Name)
$md = if (Test-Path $index) { Get-Content $index -Raw } else { "" }
Verif "l'index existe" ($md.Length -gt 300)

$absents = @($documents | Where-Object { $md -notmatch [regex]::Escape("``" + $_.Name + "``") })
Verif ("l'index liste tous les documents ({0}/{1})" -f ($documents.Count - $absents.Count), $documents.Count) (
    $absents.Count -eq 0) 

$fantomes = @()
foreach ($m in [regex]::Matches($md, "``([0-9a-zA-Z_.-]+\.md)``")) {
    if ($m.Groups[1].Value -eq "README.md") { continue }
    if (-not (Test-Path (Join-Path $docs $m.Groups[1].Value))) { $fantomes += $m.Groups[1].Value }
}
Verif ("aucun document fantome dans l'index ({0})" -f ($fantomes -join ", ")) ($fantomes.Count -eq 0)

$verif = Index @("-Verifier")
Verif "l'index est a jour (regenerable a l'identique)" ($verif.code -eq 0) $verif.sortie.Trim()

# --- 3. controle positif : un document de plus doit etre vu ------------------
$temoin = Join-Path $docs "zz-temoin-batterie-docs.md"
try {
    [IO.File]::WriteAllText($temoin, "# Temoin`n`nDocument fabrique par test-docs.ps1.`n", [Text.UTF8Encoding]::new($false))
    $derive = Index @("-Verifier")
    Verif "controle positif : un document ajoute rend -Verifier rouge" ($derive.code -eq 1)
} finally {
    Remove-Item $temoin -Force -ErrorAction SilentlyContinue
}
$apres = Index @("-Verifier")
Verif "apres suppression du temoin, l'index redevient juste" ($apres.code -eq 0)

$annonce = 0
if ($md -match "\*\*(\d+) documents\*\*") { $annonce = [int]$Matches[1] }
Verif ("le nombre annonce est le nombre reel ($annonce / $($documents.Count))") ($annonce -eq $documents.Count)

$sansTitre = @($documents | Where-Object { -not ((Get-Content $_.FullName -TotalCount 20) -match '^#\s+\S') })
Verif ("chaque document a un titre de niveau 1 ({0} sans titre)" -f $sansTitre.Count) ($sansTitre.Count -eq 0) (
    ($sansTitre | ForEach-Object { $_.Name }) -join ", ")

# --- 6. scripts cites vs scripts existants -----------------------------------
$cites = New-Object System.Collections.Generic.List[string]
foreach ($d in $documents) {
    foreach ($m in [regex]::Matches((Get-Content $d.FullName -Raw), "deploy/([a-zA-Z0-9_.-]+\.ps1)")) {
        if (-not $cites.Contains($m.Groups[1].Value)) { $cites.Add($m.Groups[1].Value) }
    }
}
$citesAbsents = @($cites | Where-Object { -not (Test-Path (Join-Path $ici $_)) })
Verif ("les {0} scripts cites dans la doc existent" -f $cites.Count) ($citesAbsents.Count -eq 0) ($citesAbsents -join ", ")

$batteries = @(Get-ChildItem $ici -Filter "test-*.ps1" -File | ForEach-Object { $_.Name })
$orphaenes = @($batteries | Where-Object {
        $nom = $_
        -not ($documents | Where-Object { (Get-Content $_.FullName -Raw) -match [regex]::Escape($nom) })
    })
Verif ("les {0} batteries sont citees dans la doc ({1} orpheline(s))" -f $batteries.Count, $orphaenes.Count) (
    $orphaenes.Count -eq 0) ($orphaenes -join ", ")

# --- 8. documents generes ----------------------------------------------------
$generes = @("73-inventaire-donnees.md", "74-etat-verifie.md")
$sansAvert = @($generes | Where-Object {
        $p = Join-Path $docs $_
        (Test-Path $p) -and ((Get-Content $p -Raw) -notmatch "(?i)ne pas editer|genere")
    })
Verif "les documents generes portent leur avertissement" ($sansAvert.Count -eq 0) ($sansAvert -join ", ")

$residus = @(Get-ChildItem $docs -File | Where-Object { $_.Name -match "\.(tmp|bak|orig)$" })
Verif ("aucun residu dans docs/ ({0})" -f $residus.Count) ($residus.Count -eq 0) (($residus | ForEach-Object { $_.Name }) -join ", ")

Write-Output ""
if ($script:KO -eq 0) {
    Write-Output "RESULTAT : documentation coherente et index a jour ($($script:N)/$($script:N) OK)"
} else {
    Write-Output "RESULTAT : $($script:KO) ECHEC(S) sur $($script:N) checks"
}
exit $script:KO
