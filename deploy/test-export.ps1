# Batterie G-export (doctrine docs/71, §8 quaterdecies) : la sauvegarde doit
# pouvoir SORTIR de la machine et etre remontable ailleurs.
#
#   powershell -ExecutionPolicy Bypass -File ./test-export.ps1
#
# Checks :
#   1. l'export se fait (fichiers + volume copies) ;
#   2. le manifeste et le mode d'emploi sont ecrits ;
#   3. la verification d'un export sain est verte (1481 empreintes recalculees) ;
#   4. CONTROLE POSITIF : un octet modifie dans un pack est vu, et nomme ;
#   5. CONTROLE POSITIF : un fichier supprime est vu ;
#   6. la phrase de passe n'est PAS dans l'export (il doit rester illisible) ;
#   7. une destination non vide est refusee sans -Ecraser ;
#   8. une donnee REELLE est relue depuis l'export (restic dump) : l'export sert
#      vraiment a quelque chose, ce n'est pas un tas de fichiers.

param([string]$TailleMinMio = 100)

$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $false
$script:KO = 0
$script:N = 0
$ici = Split-Path -Parent (Resolve-Path $MyInvocation.MyCommand.Path)
$outil = Join-Path $ici "exporter.ps1"
$mdp = Join-Path $ici "backups/.restic-pass"
$dest = Join-Path $env:TEMP ("lcd-export-batterie-" + [guid]::NewGuid().ToString("N"))

function Verif([string]$label, [bool]$ok) {
    $script:N++
    if ($ok) { Write-Output "[OK] $label" }
    else { Write-Output "[KO] $label"; $script:KO = $script:KO + 1 }
}
function Natif($bloc) {
    $prev = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try { return (& $bloc) } finally { $ErrorActionPreference = $prev }
}
function Outil([string[]]$extra) {
    $a = @("-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $outil) + $extra
    $sortie = (Natif { & powershell @a 2>&1 } | Out-String)
    return [ordered]@{ code = $LASTEXITCODE; sortie = $sortie }
}

try {
    # --- 1-2. L'export -------------------------------------------------------
    $e = Outil @("-Vers", $dest)
    if ($e.code -ne 0) { Write-Output ("       code=" + $e.code + " sortie=" + ($e.sortie -replace "`r?`n", " | ").Substring(0, [Math]::Min(400, $e.sortie.Length))) }
    Verif "l'export s'ecrit" ([bool]($e.code -eq 0))
    $fichiers = @(Get-ChildItem $dest -Recurse -File -ErrorAction SilentlyContinue)
    $mio = [Math]::Round((($fichiers | Measure-Object Length -Sum).Sum) / 1MB, 1)
    Verif ("l'export contient de vrais fichiers (" + $fichiers.Count + " fichiers, " + $mio + " Mio)") (
        [bool]($fichiers.Count -ge 100 -and $mio -ge $TailleMinMio))
    Verif "le manifeste et le mode d'emploi sont ecrits" (
        [bool]((Test-Path (Join-Path $dest "MANIFESTE.txt")) -and (Test-Path (Join-Path $dest "RESTAURER.txt"))))

    # --- 3. Verification saine ----------------------------------------------
    $v = Outil @("-Vers", $dest, "-Verifier")
    Verif "l'export sain se verifie (empreintes recalculees)" ([bool]($v.code -eq 0))
    Verif "le compte d'empreintes est coherent" ([bool]($v.sortie -match "fichiers verifies : (\d+), mauvais : 0" -and [int]$Matches[1] -ge 1000))

    # --- 6. La phrase de passe n'est pas dans l'export ----------------------
    $phrase = (Get-Content $mdp -Raw).Trim()
    $fuite = 0
    foreach ($f in $fichiers) {
        if ($f.Length -gt 5MB) { continue }
        #  Latin1 n'existe pas dans .NET Framework (PS 5.1) : Encoding.Latin1 est
        #  null et ReadAllText leve ArgumentNullException (mesure).
        $contenu = [IO.File]::ReadAllText($f.FullName, [System.Text.Encoding]::GetEncoding(28591))
        if ($contenu.Contains($phrase)) { $fuite++; Write-Output ("       phrase trouvee dans " + $f.Name) }
    }
    Verif ("la phrase de passe est absente de l'export (" + $fuite + " fichier(s) la contenant)") ([bool]($fuite -eq 0))

    # --- 8. Une donnee reelle relue depuis l'EXPORT -------------------------
    #  Le PREMIER snapshot du JSON n'est pas celui du volume IdP (mesure) :
    #  on le designe par son tag, comme le fait le drill de reprise.
    $snapJson = (Natif { & docker run --rm -v "${dest}:/repo" -e RESTIC_PASSWORD_FILE=/pw -e RESTIC_REPOSITORY=/repo `
                -v "$(Join-Path $ici 'backups/.restic-pass'):/pw:ro" restic/restic:0.17.3 snapshots --tag volume=lcd-deploy_authelia-data --latest 1 --json 2>&1 } | Out-String)
    $id = ""
    if ($snapJson -match '"id":"([0-9a-f]{16,})"') { $id = $Matches[1] }
    Verif "le depot exporte est lisible avec la phrase de passe" ([bool]($id -ne ""))
    $dump = ""
    if ($id) {
        $dump = (Natif { & docker run --rm -v "${dest}:/repo" -e RESTIC_PASSWORD_FILE=/pw -e RESTIC_REPOSITORY=/repo `
                    -v "$(Join-Path $ici 'backups/.restic-pass'):/pw:ro" restic/restic:0.17.3 dump $id /data/db.sqlite 2>&1 } | Out-String)
    }
    Verif "une donnee REELLE se relit depuis l'export (base IdP)" ([bool]($dump -match "SQLite format 3"))

    # --- 4-5. Controles positifs (sur une copie) ----------------------------
    $copie = Join-Path $env:TEMP ("lcd-export-faux-" + [guid]::NewGuid().ToString("N"))
    New-Item -ItemType Directory -Force -Path $copie | Out-Null
    Copy-Item (Join-Path $dest "*") $copie -Recurse -Force
    $packs = @(Get-ChildItem (Join-Path $copie "data") -Recurse -File | Sort-Object Length | Select-Object -First 1)
    if ($packs.Count -ge 1) {
        $p = $packs[0].FullName
        #  Les packs restic sont en lecture seule (0444) : sans lever
        #  l'attribut, WriteAllBytes echoue (« acces refuse », mesure).
        Set-ItemProperty -Path $p -Name IsReadOnly -Value $false
        $octets = [IO.File]::ReadAllBytes($p)
        $octets[[int]($octets.Length / 2)] = [byte](($octets[[int]($octets.Length / 2)] + 1) % 256)
        [IO.File]::WriteAllBytes($p, $octets)
        $faux = Outil @("-Vers", $copie, "-Verifier")
        Verif "controle positif : un octet modifie est vu" ([bool]($faux.code -eq 1))
        Verif "controle positif : le fichier fautif est nomme" ([bool]($faux.sortie -match "empreinte differente"))
    }
    Remove-Item (Join-Path $copie (Get-ChildItem (Join-Path $copie "data") -Recurse -File | Select-Object -First 1 | ForEach-Object { $_.Name })) -Force -ErrorAction SilentlyContinue
    $manque = Outil @("-Vers", $copie, "-Verifier")
    Verif "controle positif : un fichier manquant est vu" ([bool]($manque.code -eq 1))
    Remove-Item $copie -Recurse -Force -ErrorAction SilentlyContinue

    # --- 7. Destination non vide --------------------------------------------
    $refus = Outil @("-Vers", $dest)
    Verif "une destination deja remplie est refusee sans -Ecraser" ([bool]($refus.code -eq 1 -and $refus.sortie -match "pas vide"))
} finally {
    Remove-Item $dest -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Output ""
if ($script:KO -eq 0) {
    Write-Output ("RESULTAT : la sauvegarde peut sortir de la machine et etre remontee (" + $script:N + "/" + $script:N + " OK)")
    exit 0
}
Write-Output ("RESULTAT : " + $script:KO + " ECHEC(S) sur " + $script:N)
exit $script:KO
