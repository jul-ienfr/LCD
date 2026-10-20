# Batterie G-donnees (doctrine docs/71, V2) : l'inventaire des donnees doit
# etre exact, regenerable et capable de DENONCER un placeholder.
#
#   powershell -ExecutionPolicy Bypass -File ./test-donnees.ps1
#
# Checks :
#   1. l'inventaire versionne est a jour des fixtures (-Verifier) ;
#   2. il est suivi par git (une preuve qu'il fait partie du livrable) ;
#   3. CONTROLE POSITIF du detecteur : une fixture fabriquee avec un placeholder
#      et une valeur recopiee de docs/ donne les deux verdicts attendus ;
#   4. controle negatif : une valeur technique (nombre) n'est pas classee en
#      defaut ;
#   5. recoupement : 3 placeholders reels des fixtures figurent bien dans le
#      document genere (le document n'est pas vide ni generique) ;
#   6. coherence des compteurs (la somme des verdicts egale le total examine).

$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $false
$script:KO = 0
$script:N = 0
$ici = Split-Path -Parent (Resolve-Path $MyInvocation.MyCommand.Path)
$racine = Split-Path -Parent $ici
$doc = Join-Path $racine "docs/73-inventaire-donnees.md"

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
function Compteurs($sortie) {
    $m = [regex]::Match($sortie, "placeholder=(\d+) a_documenter=(\d+) source=(\d+) vide=(\d+) technique=(\d+)")
    if (-not $m.Success) { return $null }
    return @{
        placeholder  = [int]$m.Groups[1].Value
        a_documenter = [int]$m.Groups[2].Value
        source       = [int]$m.Groups[3].Value
        vide         = [int]$m.Groups[4].Value
        technique    = [int]$m.Groups[5].Value
        total        = [int]([regex]::Match($sortie, "(\d+) valeurs examinees").Groups[1].Value)
    }
}

Push-Location $racine
try {
    # --- 1. Inventaire a jour --------------------------------------------
    #  On GENERE vers un fichier temporaire (pour obtenir les compteurs) puis on
    #  compare au document versionne : meme semantique que -Verifier, mais les
    #  compteurs restent disponibles pour les autres checks.
    $tmpDoc = Join-Path $env:TEMP ("lcd-inv-" + [guid]::NewGuid().ToString("N") + ".md")
    $v = (Natif { powershell -ExecutionPolicy Bypass -File (Join-Path $ici "inventaire-donnees.ps1") -Sortie $tmpDoc 2>&1 } | Out-String)
    $c = Compteurs $v
    $genere = if (Test-Path $doc) { Get-Content $doc -Raw } else { "" }
    $neuf = if (Test-Path $tmpDoc) { Get-Content $tmpDoc -Raw } else { "" }
    $norm = { param($x) ((($x -split "\r?\n") | Where-Object { $_ -notmatch '^\*\*Genere le' }) -join "`n").Trim() }
    Verif "inventaire a jour des fixtures (regenere = versionne)" ((& $norm $neuf) -eq (& $norm $genere))
    Remove-Item $tmpDoc -Force -ErrorAction SilentlyContinue

    # --- 2. Versionne -----------------------------------------------------
    $suivi = (Natif { git ls-files -- "docs/73-inventaire-donnees.md" 2>$null } | Out-String).Trim()
    Verif "l'inventaire est versionne (git ls-files)" ($suivi -ne "")

    # --- 3. Controle positif du detecteur --------------------------------
    #  Une valeur recopiee d'un document reel doit sortir "source" ; un
    #  placeholder doit sortir "placeholder". Sans ce controle, un detecteur
    #  qui ne classe tout en "technique" passerait pour vert.
    $temoin = Join-Path $env:TEMP ("lcd-temoin-" + [guid]::NewGuid().ToString("N") + ".yaml")
    $docTemoin = Join-Path $env:TEMP ("lcd-temoin-" + [guid]::NewGuid().ToString("N") + ".md")
    #  "lcd.test" est present dans docs/ (nom d'entree du deploiement).
    $contenu = @(
        "temoin:",
        "  source_reelle: Authelia",
        "  fausse_donnee: Fournisseur Lab",
        "  nombre: 42",
        "  trou: ?"
    ) -join "`n"
    [IO.File]::WriteAllText($temoin, $contenu, [Text.UTF8Encoding]::new($false))
    $r = (Natif { powershell -ExecutionPolicy Bypass -File (Join-Path $ici "inventaire-donnees.ps1") -Fichiers $temoin -Sortie $docTemoin 2>&1 } | Out-String)
    $ct = Compteurs $r
    Verif "detecteur : le placeholder fabrique est denonce (1)" ($ct -and $ct.placeholder -eq 1)
    Verif "detecteur : la valeur presente dans docs/ est classee source (1)" ($ct -and $ct.source -eq 1)
    Verif "detecteur : le nombre n'est pas un defaut (technique 1)" ($ct -and $ct.technique -eq 1)
    Verif "detecteur : le trou '?' est conforme (vide 1)" ($ct -and $ct.vide -eq 1)
    $docT = if (Test-Path $docTemoin) { Get-Content $docTemoin -Raw } else { "" }
    Verif "detecteur : le document cite la valeur fautive" ($docT -match "Fournisseur Lab")
    Remove-Item $temoin, $docTemoin -Force -ErrorAction SilentlyContinue

    # --- 5. Recoupement avec les fixtures reelles ------------------------
    $genere = if (Test-Path $doc) { Get-Content $doc -Raw } else { "" }
    $placeholders = @()
    foreach ($f in (Get-ChildItem (Join-Path $racine "lab") -Recurse -Include *.yaml, *.yml -File |
                Where-Object { $_.FullName -notmatch "vps-sim|__pycache__" -and $_.Name -notmatch "^docker-compose" })) {
        foreach ($l in [IO.File]::ReadAllLines($f.FullName, [Text.Encoding]::UTF8)) {
            if ($l -match ":\s*(.+?)\s*$") {
                $val = $Matches[1]
                if ($val -match "(?i)(fournisseur lab|marque lab|fictif|example\.invalid)") { $placeholders += ($val.Trim('"').Trim()) }
            }
        }
    }
    $temoinReels = @($placeholders | Select-Object -Unique | Select-Object -First 3)
    $trouves = @($temoinReels | Where-Object { $genere.Contains($_) }).Count
    Verif "recoupement : les placeholders reels cites dans le document ($trouves/$($temoinReels.Count))" (
        $temoinReels.Count -gt 0 -and $trouves -eq $temoinReels.Count)

    # --- 6. Coherence des compteurs --------------------------------------
    $somme = $c.placeholder + $c.a_documenter + $c.source + $c.vide + $c.technique
    Verif "compteurs coherents (somme=$somme, total=$($c.total))" ($c -and $somme -eq $c.total)

} finally {
    Pop-Location
}

Write-Output ""
if ($script:KO -eq 0) {
    Write-Output "RESULTAT : inventaire des donnees exact et regenerable ($($script:N)/$($script:N) OK)"
} else {
    Write-Output "RESULTAT : $($script:KO) ECHEC(S) sur $($script:N) checks"
}
exit $script:KO
