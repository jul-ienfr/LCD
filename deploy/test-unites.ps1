# Batterie « tests unitaires » (vitest) — cahier 70 §F9 : les regles pures
# (designs/contraste, parseurs, etc.) sont prouvees par des tests qui
# s'executent SANS conteneur, en quelques secondes.
#
# Preuve exigee :
#   1. la suite reelle passe (0 echec) et compte au moins 13 tests ;
#   2. TEMOIN NEGATIF : un test volontairement faux DOIT echouer — sans lui,
#      « 0 echec » pourrait signifier « 0 test execute ».
#
# Exit code = nombre d'echecs (0 = vert).
$ErrorActionPreference = "Continue"
$script:KO = 0
function Verif($label, $ok) {
    if ($ok) { Write-Output "[OK] $label" }
    else { Write-Output "[KO] $label"; $script:KO += 1 }
}

$racine = Split-Path $PSScriptRoot -Parent
$web = Join-Path $racine "web"
if (-not (Test-Path (Join-Path $web "package.json"))) {
    Write-Output "[KO] web/package.json introuvable"
    exit 1
}

Push-Location $web
try {
    # ---- 1) Suite reelle ---------------------------------------------------
    $sortie = (npm test 2>&1 | Out-String)
    $code = $LASTEXITCODE
    $nb = [regex]::Match($sortie, "Tests\s+(\d+) passed").Groups[1].Value
    Verif "vitest : 0 echec (exit $code)" ($code -eq 0 -and ($sortie -notmatch "failed"))
    Verif "vitest : au moins 13 tests executes (mesure : $nb)" ([int]$nb -ge 13)

    # ---- 2) Temoin negatif : un test faux doit etre vu rouge ----------------
    $temoin = Join-Path $web "src\lib\__temoin-batterie.test.ts"
    [IO.File]::WriteAllText($temoin,
        "import { expect, it } from `"vitest`";`nit(`"temoin negatif`", () => { expect(1).toBe(2); });`n",
        [Text.UTF8Encoding]::new($false))
    $sortieT = (npx vitest run "src/lib/__temoin-batterie.test.ts" 2>&1 | Out-String)
    $codeT = $LASTEXITCODE
    Remove-Item -LiteralPath $temoin -ErrorAction SilentlyContinue
    Verif "temoin negatif : un test faux est bien detecte" ($codeT -ne 0 -and ($sortieT -match "failed"))
} finally {
    Pop-Location
}

if ($script:KO -eq 0) { Write-Output "RESULTAT : tests unitaires OK (suite verte + temoin negatif)" }
else { Write-Output "RESULTAT : $script:KO ECHEC(S)" }
exit $script:KO
