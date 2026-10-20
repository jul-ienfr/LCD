# Batterie G-acces (doctrine docs/71, §8 duodecies) : les secrets locaux ne
# doivent etre lisibles que par le compte d'exploitation, SYSTEM et les
# administrateurs — et le durcissement doit continuer de laisser travailler.
#
#   powershell -ExecutionPolicy Bypass -File ./test-acces.ps1
#
# Checks :
#   1. les trois fichiers de secrets existent ;
#   2. aucun droit hors liste (via durcir-secrets.ps1 -Verifier) ;
#   3. l'heritage d'ACL est coupe sur les trois ;
#   4. CONTROLE POSITIF : un fichier rendu lisible par Tout le monde est VU ;
#   5. apres durcissement de ce fichier, il n'est plus signale ;
#   6. le durcissement est IDEMPOTENT (ACL identiques au second passage) ;
#   7. les secrets restent lisibles par le compte (le SAS peut demarrer) ;
#   8. la phrase de passe restic reste utilisable (un vrai `restic snapshots`) ;
#   9. les sauvegardes d'ACL existent et vivent hors de git.

$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $false
$script:KO = 0
$script:N = 0
$ici = Split-Path -Parent (Resolve-Path $MyInvocation.MyCommand.Path)
$racine = Split-Path -Parent $ici
$outil = Join-Path $ici "durcir-secrets.ps1"
$secrets = @((Join-Path $ici ".env"), (Join-Path $ici "backups/.restic-pass"), (Join-Path $ici "authelia/totp-secrets.json"))

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
function Empreinte($chemin) {
    return ((Get-Acl $chemin).Access | ForEach-Object { "$($_.IdentityReference)|$($_.FileSystemRights)|$($_.AccessControlType)" } | Sort-Object) -join ";"
}

Verif ("les trois fichiers de secrets existent (" + @($secrets | Where-Object { Test-Path $_ }).Count + "/3)") (
    [bool](@($secrets | Where-Object { Test-Path $_ }).Count -eq 3))

$v = Outil @("-Verifier")
Verif "aucun droit hors liste sur les secrets (verificateur vert)" ([bool]($v.code -eq 0)) 
$herite = @($secrets | Where-Object { (Get-Acl $_).AreAccessRulesProtected })
Verif ("l'heritage d'ACL est coupe sur les trois (" + $herite.Count + "/3)") ([bool]($herite.Count -eq 3))

# --- 4-6. Controle positif sur un fichier fabrique ---------------------------
$temoin = Join-Path $env:TEMP ("lcd-secret-temoin-" + [guid]::NewGuid().ToString("N") + ".txt")
try {
    [IO.File]::WriteAllText($temoin, "secret fabrique`n", [Text.UTF8Encoding]::new($false))
    $null = Natif { & icacls $temoin /grant "*S-1-1-0:(R)" 2>&1 }   # Tout le monde : lecture
    $doux = Outil @("-Verifier", "-Fichiers", $temoin)
    Verif "controle positif : un fichier lisible par Tout le monde est signale" ([bool]($doux.code -eq 1))
    $dur = Outil @("-Fichiers", $temoin)
    $encore = Outil @("-Verifier", "-Fichiers", $temoin)
    Verif "controle positif : apres durcissement il n'est plus signale" ([bool]($encore.code -eq 0))
    $e1 = Empreinte $temoin
    $null = Outil @("-Fichiers", $temoin)
    Verif "le durcissement est idempotent (ACL changee au 2e passage ? non)" ([bool]((Empreinte $temoin) -eq $e1))
} finally {
    Remove-Item $temoin -Force -ErrorAction SilentlyContinue
}

# --- 7-8. Le SAS peut toujours travailler ------------------------------------
$lu = $true
foreach ($s in $secrets) {
    try { $null = Get-Content $s -TotalCount 1 } catch { $lu = $false }
}
Verif "les secrets restent lisibles par le compte d'exploitation" ([bool]$lu)

$compose = (Natif { Push-Location $ici; try { & docker compose -p lcd-deploy config -q 2>&1 } finally { Pop-Location } } | Out-String)
Verif "la pile reste configurable (docker compose config -q)" ([bool]($LASTEXITCODE -eq 0))

$restic = (Natif { & docker run --rm -e RESTIC_PASSWORD_FILE=/pw -e RESTIC_REPOSITORY=/repo `
            -v "$(Join-Path $ici 'backups/restic'):/repo" -v "$(Join-Path $ici 'backups/.restic-pass'):/pw:ro" `
            restic/restic:0.17.3 snapshots --json 2>&1 } | Out-String)
Verif "la phrase de passe restic reste utilisable (snapshots lus)" ([bool]($restic -match '"short_id"'))

# --- 9. Sauvegardes d'ACL hors git -------------------------------------------
$sauves = @(Get-ChildItem (Join-Path $ici "veille/acl-avant") -Filter "*.acl" -File -ErrorAction SilentlyContinue)
Verif ("des sauvegardes d'ACL existent (" + $sauves.Count + ")") ([bool]($sauves.Count -ge 1))
$ignore = (Natif { git -C $racine check-ignore "deploy/veille/acl-avant/x.acl" 2>$null } | Out-String).Trim()
Verif "les sauvegardes d'ACL sont hors de git" ([bool]($ignore -ne ""))

Write-Output ""
if ($script:KO -eq 0) {
    Write-Output ("RESULTAT : acces aux secrets conforme et prouve (" + $script:N + "/" + $script:N + " OK)")
    exit 0
}
Write-Output ("RESULTAT : " + $script:KO + " ECHEC(S) sur " + $script:N)
exit $script:KO
