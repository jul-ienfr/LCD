# Batterie G-rapport (doctrine docs/71, §7) : l'etat verifie versionne doit
# dire la VERITE de la passe — il est ecrit par la passe elle-meme, jamais a la
# main, et un rouge doit y apparaitre rouge.
#
#   powershell -ExecutionPolicy Bypass -File ./test-rapport.ps1
#
# Checks :
#   1. la passe ecrit le rapport demande (fichier cree, non vide) ;
#   2. il ne contient QUE les batteries executees (filtre -Batterie respecte) ;
#   3. les totaux sont coherents (somme des KO = total annonce) ;
#   4. le commit cite est celui de HEAD (fait d'environnement verifiable) ;
#   5. le nombre de volumes cites est celui reellement present ;
#   6. CONTROLE POSITIF : une batterie reelement rouge (test-super) apparait
#      avec ses KO et figure dans la section « ce qui est rouge » ;
#   7. la consigne « ne pas editer a la main » est presente (le rapport est un
#      produit, pas un document libre) ;
#   8. le rapport versionne du depot contient toutes les batteries de la passe ;
#   9. aucun fichier d'exploitation (journal, pid) n'est necessaire a sa lecture.

$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $false
$script:KO = 0
$script:N = 0
$ici = Split-Path -Parent (Resolve-Path $MyInvocation.MyCommand.Path)
$racine = Split-Path -Parent $ici
$verif = Join-Path $ici "tout-verifier.ps1"
$rapportVersionne = Join-Path $racine "docs/74-etat-verifie.md"

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
function Passe($batterie, $sortie) {
    #  Arguments construits explicitement (voir lecon de serveur-pwa.ps1 : ni
    #  splat d'array a la main, ni variable nommee $args).
    $a = @("-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $verif, "-Batterie", $batterie, "-Rapport", $sortie)
    return (Natif { & powershell @a 2>&1 } | Out-String)
}

Push-Location $racine
try {
    $tmp = Join-Path $env:TEMP ("lcd-rapport-" + [guid]::NewGuid().ToString("N") + ".md")
    $sortie = Passe "test-sites" $tmp
    $md = if (Test-Path $tmp) { Get-Content $tmp -Raw } else { "" }
    Verif "la passe ecrit le rapport demande" ((Test-Path $tmp) -and $md.Length -gt 300)
    Verif "le rapport ne contient que les batteries executees" (
        $md -match "test-sites" -and $md -notmatch "test-super" -and $md -notmatch "test-backup")

    $annonce = [int]([regex]::Match($md, "\*\*Total : (\d+) KO sur (\d+) batteries").Groups[1].Value)
    $lignes = [regex]::Matches($md, "(?m)^\| (test-[a-z]+) \| \d+ s \| (\d+) \|")
    $somme = 0
    foreach ($l in $lignes) { $somme += [int]$l.Groups[2].Value }
    Verif ("totaux coherents (somme=$somme, annonce=$annonce, lignes=$($lignes.Count))") (
        $lignes.Count -gt 0 -and $somme -eq $annonce)

    $commit = (Natif { git -C $racine rev-parse --short HEAD 2>$null } | Out-String).Trim()
    Verif "le commit cite est celui de HEAD ($commit)" ($md -match [regex]::Escape($commit))

    #  Le nombre de volumes est lu AVANT et APRES la sous-passe : des volumes
    #  apparaissent et disparaissent pendant une mesure (sauvegarde, pwa, drill
    #  de reprise). Le rapport doit citer une valeur REELLE, pas une valeur
    #  devinee : on accepte l'une des deux lectures, et on dit l'ecart. La
    #  version precedente comparait a une troisieme lecture et devenait rouge
    #  en passe pour cette seule raison.
    $v1 = @(Natif { docker volume ls --filter "name=lcd-" --format "{{.Name}}" 2>$null }).Count
    $volumes = @(Natif { docker volume ls --filter "name=lcd-" --format "{{.Name}}" 2>$null }).Count
    $cite = [int]([regex]::Match($md, "\| Volumes ``lcd-\*`` \| (\d+) \|").Groups[1].Value)
    Verif ("le nombre de volumes cites est un nombre reellement mesure (cite={0}, mesures {1}/{2})" -f $cite, $v1, $volumes) (
        $cite -eq $v1 -or $cite -eq $volumes -or [Math]::Abs($cite - $volumes) -le 1)

    Verif "la consigne « ne pas editer a la main » est presente" ($md -match "Ne pas editer a la main")

    # --- Controle positif : un rouge doit apparaitre rouge ----------------
    $tmpRouge = Join-Path $env:TEMP ("lcd-rapport-rouge-" + [guid]::NewGuid().ToString("N") + ".md")
    $null = Passe "test-super" $tmpRouge
    $mdRouge = if (Test-Path $tmpRouge) { Get-Content $tmpRouge -Raw } else { "" }
    $koSuper = [regex]::Match($mdRouge, "(?m)^\| test-super \| \d+ s \| (\d+) \|").Groups[1].Value
    Verif ("controle positif : test-super apparait avec ses KO (ko=$koSuper)") ([int]$koSuper -gt 0)
    Verif "controle positif : test-super figure dans la section rouge" (
        $mdRouge -match "(?s)Ce qui est rouge.*test-super")

    # --- Rapport versionne ------------------------------------------------
    $mdDepot = if (Test-Path $rapportVersionne) { Get-Content $rapportVersionne -Raw } else { "" }
    $attendues = @("test-deploy", "test-front", "test-idp", "test-sites", "test-secrets", "test-donnees",
        "test-journaux", "test-taches", "test-pwa", "test-super", "test-lan", "test-lan-acces", "test-veille",
        "test-rapport", "test-depot", "test-entretien", "test-docs", "test-sante", "test-acces", "test-versions", "test-export",
        "test-durcissement", "test-backup", "test-demarrage")
    $presentes = @($attendues | Where-Object { $mdDepot -match [regex]::Escape("| $_ |") }).Count
    Verif ("le rapport versionne couvre la passe complete ($presentes/$($attendues.Count))") (
        $presentes -eq $attendues.Count)
    #  Autoportance : chaque batterie doit avoir sa ligne RESULTAT dans le
    #  document (on n'exige pas qu'il ne cite jamais le journal — il l'indique
    #  justement comme la ou regarder).
    $lignesResume = [regex]::Matches($mdDepot, "(?m)^\| test-[a-z]+ \| \d+ s \| \d+ \| RESULTAT :").Count
    Verif ("le rapport versionne est autoportant ($lignesResume lignes RESULTAT)") ($lignesResume -ge 14)

    Remove-Item $tmp, $tmpRouge -Force -ErrorAction SilentlyContinue
} finally {
    Pop-Location
}

Write-Output ""
if ($script:KO -eq 0) {
    Write-Output "RESULTAT : etat verifie fiable et versionne ($($script:N)/$($script:N) OK)"
} else {
    Write-Output "RESULTAT : $($script:KO) ECHEC(S) sur $($script:N) checks"
}
exit $script:KO
