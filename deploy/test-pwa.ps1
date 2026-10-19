# test-pwa.ps1 - recette PWA/offline F4 (§F8) : SW servi + versionne, puis
# recette OFFLINE REELLE via web/scripts/recette-pwa.mjs (Edge headless +
# coupure reseau CDP, outbox IndexedDB rejouee, preuve serveur par ref).
# Rien n'est simule : le navigateur reel coupe tout, y compris le SW.
# Prerequis : front up (defaut http://127.0.0.1:3101 : LCD_IDP absent,
# `npx next start -p 3101` depuis web/) + gateway lab :8443.
# Usage : powershell -NoProfile -ExecutionPolicy Bypass -File test-pwa.ps1
# Sortie : exit code = nombre d'echecs (0 = tout vert). ASCII strict.
param([string]$Front = "http://127.0.0.1:3101")
$ErrorActionPreference = "Continue"
$script:KO = 0
function Verif($label, $ok) {
    if ($ok) { Write-Output "[OK] $label" }
    else { Write-Output "[KO] $label"; $script:KO += 1 }
}
$F = $Front.TrimEnd("/")
$RA = @("-s", "-m", "20")

Write-Output "== Recette PWA (F4) : $F =="
$sw = (curl.exe @RA "$F/sw.js") -join ""
Verif "/sw.js servi (statique, scope /)" ($sw.Length -gt 500)
Verif "/sw.js versionne (cache lcd-v*, purge a l'activate)" (
    $sw -match 'VERSION = "lcd-v' -and $sw -match "lcd-purge")
Verif "/sw.js : API jamais mise en cache (le SW ne ment pas)" (
    $sw -match 'startsWith\("/api/"\)')
$v = (curl.exe @RA "$F/voyageur") -join ""
Verif "/voyageur 200 (surface offline voyageur)" ($v -match "uide de s")
$p = (curl.exe @RA "$F/presta") -join ""
Verif "/presta 200 (surface offline presta)" ($p -match "runbook|Missions")

Write-Output "== Offline reel (Edge headless + coupure CDP) =="
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
    Verif "node present (recette navigateur reel)" $false
} else {
    $racineWeb = Join-Path (Split-Path $PSScriptRoot) "web"
    $sortie = (node (Join-Path $racineWeb "scripts\recette-pwa.mjs") $F) -join "`n"
    Write-Output $sortie
    $nbKO = ([regex]::Matches($sortie, "(?m)^\[KO\]")).Count
    if ($LASTEXITCODE -ne 0 -and $nbKO -eq 0) {
        Verif "recette-pwa.mjs execute sans crash" $false
    }
    $script:KO += $nbKO
}
Write-Output ""
if ($script:KO -eq 0) {
    Write-Output "RESULTAT : PWA OK (SW + offline reel + outbox + purge)"
} else {
    Write-Output "RESULTAT : $script:KO KO"
}
exit $script:KO
