# Batterie G-entretien (doctrine docs/71, §8 octies ; runbook R-05) : la
# recuperation d'espace docker doit etre PROUVEE, et surtout ne jamais toucher
# a ce qui sert (images nommees, volumes, conteneurs).
#
#   powershell -ExecutionPolicy Bypass -File ./test-entretien.ps1
#
# Checks :
#   1. l'entretien imprime l'etat disque (la ressource qui a deja mordu) ;
#   2. sans -Prune, il dit explicitement que rien n'est recupere ;
#   3. CONTROLE POSITIF : une image flottante fabriquee SURVIT a -Prune -WhatIf ;
#   4. la meme image DISPARAIT au -Prune reel (l'effet est reel, pas declare) ;
#   5. -Prune ne supprime AUCUNE image nommee lcd-* (comptage avant/apres) ;
#   6. -Prune ne supprime AUCUN volume (les donnees du parc sont intactes) ;
#   7. -Prune ne supprime AUCUN conteneur (la pile reste en place) ;
#   8. le controle d'integrite du depot est branche dans l'entretien.

$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $false
$script:KO = 0
$script:N = 0
$ici = Split-Path -Parent (Resolve-Path $MyInvocation.MyCommand.Path)
$outil = Join-Path $ici "entretien.ps1"

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
function Entretien([string[]]$extra) {
    $a = @("-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $outil) + $extra
    $sortie = (Natif { & powershell @a 2>&1 } | Out-String)
    return [ordered]@{ code = $LASTEXITCODE; sortie = $sortie }
}
function ImagesLcd { @(Natif { & docker images --format "{{.Repository}}" 2>$null } | Where-Object { $_ -like "lcd-*" }).Count }
function Volumes { @(Natif { & docker volume ls -q 2>$null }).Count }
function Conteneurs { @(Natif { & docker ps -q 2>$null }).Count }
function Flottantes { @(Natif { & docker images -f "dangling=true" -q 2>$null } | Where-Object { $_.Trim() }).Count }

$sans = Entretien @()
Verif "l'entretien imprime l'etat disque" ($sans.sortie -match "disque C:")
Verif "sans -Prune, l'espace recuperable est dit « non demande »" ($sans.sortie -match "espace recuperable : non demande")
Verif "le controle d'integrite du depot est branche" ($sans.sortie -match "depot de sauvegarde : (RESULTAT|controle)")

# --- Fabrication d'une image flottante (preuve par l'objet) -------------------
$dir = Join-Path $env:TEMP ("lcd-jetable-" + [guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Force -Path $dir | Out-Null
$dockerfile = Join-Path $dir "Dockerfile"
[IO.File]::WriteAllText($dockerfile, "FROM scratch`nCOPY x.txt /x.txt`n", [Text.UTF8Encoding]::new($false))
try {
    [IO.File]::WriteAllText((Join-Path $dir "x.txt"), "premier`n", [Text.UTF8Encoding]::new($false))
    $null = Natif { & docker build -q -t lcd-jetable:test $dir 2>&1 }
    [IO.File]::WriteAllText((Join-Path $dir "x.txt"), "second`n", [Text.UTF8Encoding]::new($false))
    $null = Natif { & docker build -q -t lcd-jetable:test $dir 2>&1 }
    $avant = Flottantes
    Verif ("une image flottante a ete fabriquee ($avant flottante(s))") ($avant -ge 1)

    $sim = Entretien @("-Prune", "-WhatIf")
    Verif "controle positif : -WhatIf n'a rien supprime" ((Flottantes) -eq $avant)
    Verif "-WhatIf annonce ce qui serait supprime" ($sim.sortie -match "SERAIENT supprimes")

    $imgAvant = ImagesLcd
    $volAvant = Volumes
    $ctnAvant = Conteneurs
    $reel = Entretien @("-Prune")
    $apres = Flottantes
    Verif ("controle positif : le -Prune reel a supprime les flottantes ($avant -> $apres)") ($apres -lt $avant)
    Verif "le -Prune reel annonce l'espace recupere" ($reel.sortie -match "reclaimed|Total")
    Verif ("aucune image nommee lcd-* supprimee ($imgAvant -> $(ImagesLcd))") ((ImagesLcd) -eq $imgAvant)
    Verif ("aucun volume supprime ($volAvant -> $(Volumes))") ((Volumes) -eq $volAvant)
    Verif ("aucun conteneur supprime ($ctnAvant -> $(Conteneurs))") ((Conteneurs) -eq $ctnAvant)
} finally {
    $null = Natif { & docker rmi -f lcd-jetable:test 2>&1 }
    Remove-Item $dir -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Output ""
if ($script:KO -eq 0) {
    Write-Output "RESULTAT : entretien prouve (espace recupere, rien de vivant touche) ($($script:N)/$($script:N) OK)"
} else {
    Write-Output "RESULTAT : $($script:KO) ECHEC(S) sur $($script:N) checks"
}
exit $script:KO
