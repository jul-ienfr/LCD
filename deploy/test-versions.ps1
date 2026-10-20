# Batterie G-versions (doctrine docs/71, §8 terdecies) : rien ne change en douce.
#
#   powershell -ExecutionPolicy Bypass -File ./test-versions.ps1
#
# Checks :
#   1. le journal des versions existe et couvre les trois services ;
#   2. `versions.ps1 -Verifier` est vert (l'execute correspond au document) ;
#   3. CONTROLE POSITIF : un identifiant falsifie dans une copie est VU, et
#      le service fautif est nomme ;
#   4. apres regeneration, la copie redevient verte ;
#   5. le document cite bien l'identifiant du conteneur REEL (relu a la main) ;
#   6. le document porte son avertissement de document genere ;
#   7. le document est VERSIONNE (une trace non committee ne prouve rien) ;
#   8. l'image a tag flottant (caddy) a bien un identifiant enregistre -- c'est
#      precisement pour elle que ce journal existe.

$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $false
$script:KO = 0
$script:N = 0
$ici = Split-Path -Parent (Resolve-Path $MyInvocation.MyCommand.Path)
$racine = Split-Path -Parent $ici
$outil = Join-Path $ici "versions.ps1"
$doc = Join-Path $racine "docs/75-versions-verifiees.md"

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

Verif "le journal des versions existe" ([bool](Test-Path $doc))
if (-not (Test-Path $doc)) {
    Write-Output ""; Write-Output "RESULTAT : 1 ECHEC(S) sur 1"; exit 1
}
$texte = [IO.File]::ReadAllText($doc, [Text.Encoding]::UTF8)
$services = @("web", "authelia", "caddy")
$presents = @($services | Where-Object { $texte -match ("(?m)^\| " + $_ + " \|") })
Verif ("les trois services sont decrits (" + $presents.Count + "/3)") ([bool]($presents.Count -eq 3))

$v = Outil @("-Verifier")
Verif "l'execute correspond au document (verificateur vert)" ([bool]($v.code -eq 0))

# --- 3-4. Controle positif sur une copie falsifiee --------------------------
$copie = Join-Path $env:TEMP ("lcd-versions-" + [guid]::NewGuid().ToString("N") + ".md")
try {
    $faux = [regex]::Replace($texte, "(?m)^(\| web \|.*?``)([0-9a-f]{12})(``)", { param($m) $m.Groups[1].Value + "000000000000" + $m.Groups[3].Value }, 1)
    [IO.File]::WriteAllText($copie, $faux, (New-Object System.Text.UTF8Encoding($false)))
    $r = Outil @("-Verifier", "-Sortie", $copie)
    Verif "controle positif : un identifiant falsifie est vu" ([bool]($r.code -eq 1))
    Verif "controle positif : le service fautif est nomme" ([bool]($r.sortie -match "web"))
    $regen = Outil @("-Sortie", $copie)
    $r2 = Outil @("-Verifier", "-Sortie", $copie)
    Verif "apres regeneration de la copie, elle redevient verte" ([bool]($r2.code -eq 0))
} finally {
    Remove-Item $copie -Force -ErrorAction SilentlyContinue
}

# --- 5. L'identifiant cite est celui du conteneur REEL ----------------------
$reel = (Natif { & docker inspect --format "{{.Image}}" "lcd-deploy-caddy-1" 2>$null } | Out-String).Trim().Replace("sha256:", "")
$court = if ($reel.Length -ge 12) { $reel.Substring(0, 12) } else { $reel }
Verif ("le document cite l'identifiant reel de caddy (" + $court + ")") ([bool]($court -ne "" -and $texte -match [regex]::Escape($court)))

Verif "le document porte son avertissement de document genere" ([bool]($texte -match "Ne pas editer a la main" -and $texte -match "Genere le"))

$suivi = (Natif { git -C $racine ls-files --error-unmatch -- "docs/75-versions-verifiees.md" 2>&1 } | Out-String)
Verif "le journal est versionne dans git" ([bool]($LASTEXITCODE -eq 0))

$ligneCaddy = ([regex]::Match($texte, "(?m)^\| caddy \|.*$")).Value
Verif "l'image a tag flottant (caddy) a bien un identifiant enregistre" ([bool]($ligneCaddy -match "``[0-9a-f]{12}``"))

Write-Output ""
if ($script:KO -eq 0) {
    Write-Output ("RESULTAT : les versions deployees sont journalisees et verifiees (" + $script:N + "/" + $script:N + " OK)")
    exit 0
}
Write-Output ("RESULTAT : " + $script:KO + " ECHEC(S) sur " + $script:N)
exit $script:KO
