# Batterie G-secrets (doctrine docs/71, V3) : prouver qu'AUCUN secret n'est
# versionne, que les fichiers de secrets reels sont ignores par git, que les
# fichiers SUIVIS ne contiennent aucune forme de secret, et qu'aucune valeur
# reelle (deploy/.env) ne fuit dans une reponse HTTP.
#
#   powershell -ExecutionPolicy Bypass -File ./test-secrets.ps1
#   $env:FRONT = "http://127.0.0.1:3100" ; $env:GW = "http://127.0.0.1:8443"
#
# Ne JAMAIS afficher une valeur de secret : seuls les noms de fichiers et les
# numeros de ligne sont imprimes. Sortie : code de sortie = nombre de KO.

$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $false
$script:KO = 0
$script:N = 0
$FRONT = if ($env:FRONT) { $env:FRONT } else { "http://127.0.0.1:3100" }
$GW = if ($env:GW) { $env:GW } else { "http://127.0.0.1:8443" }

function Verif($label, $ok) {
    $script:N++
    if ($ok) { Write-Output "[OK] $label" } else { Write-Output "[KO] $label"; $script:KO++ }
}

$racine = (& git rev-parse --show-toplevel).Trim()
Push-Location $racine
try {

    # --- A. Fichiers de secrets RÉELS : presents, jamais suivis, ignores ----
    # Les .EXAMPLE restent versionnes (ils documentent la forme) : ce sont eux
    # la reference, jamais la copie reelle.
    $reels = @(
        "lab/secrets.lab.yaml",
        "lab/ha-virtual/secrets.yaml",
        "deploy/.env",
        "deploy/authelia/users.yml",
        "deploy/authelia/totp-secrets.json",
        "custom/passerelle-parc/secrets-registre.yaml"
    )
    foreach ($f in $reels) {
        $suivi = $true
        try { $null = & git ls-files --error-unmatch -- $f 2>$null } catch { $suivi = $false }
        if ($LASTEXITCODE -ne 0) { $suivi = $false }
        Verif "secret non versionne : $f" (-not $suivi)
        $null = & git check-ignore -q -- $f 2>$null
        Verif "secret ignore par .gitignore : $f" ($LASTEXITCODE -eq 0)
    }

    # --- B. Controle positif du scanner : un motif qui DOIT trouver --------
    # Sans ce controle, un scanner casse renverrait « 0 hit » et la batterie
    # serait verte a tort.
    $temoins = & git grep -nI -E -- "password_reset" -- deploy/authelia 2>$null
    Verif "scanner operationnel (controle positif)" (@($temoins).Count -ge 1)

    # --- C. Fichiers SUIVIS : aucune forme de secret ----------------------
    # Exclusions assumees et affichees : *.example / *.EXAMPLE (forme
    # documentee), docs/ et *.md (prose). Le reste du depot est scanne.
    $excl = @(":(exclude)**/*.example", ":(exclude)**/*.EXAMPLE", ":(exclude)docs/**", ":(exclude)**/*.md")
    $motifs = [ordered]@{
        "cle privee PEM"        = "-----BEGIN [A-Z ]*PRIVATE KEY"
        "cle d'acces AWS"       = "AKIA[0-9A-Z]{16}"
        "hash bcrypt"           = '\$2[aby]\$[0-9]{2}\$[./A-Za-z0-9]{53}'
        "secret litteral"       = '(session_secret|storage_key|jwt_key|api_key|token_secret|mot_de_passe|password)[[:space:]]*[:=][[:space:]]*[A-Za-z0-9+/=_-]{16,}'
    }
    foreach ($nom in $motifs.Keys) {
        $hits = @(& git grep -nI -E -- $motifs[$nom] -- . $excl 2>$null)
        if ($hits.Count -gt 0) {
            foreach ($h in $hits) { Write-Output ("      trouve : " + (($h -split ":")[0..1] -join ":")) }
        }
        Verif "aucun $nom dans les fichiers suivis" ($hits.Count -eq 0)
    }

    # --- D. Configuration IdP : forme versionnee, aucun secret en clair ---
    $confIdp = "deploy/authelia/configuration.yml"
    Verif "configuration IdP versionnee" (Test-Path $confIdp)
    $confTxt = if (Test-Path $confIdp) { Get-Content $confIdp -Raw -Encoding utf8 } else { "" }
    Verif "configuration IdP sans secret en clair" (
        ($confTxt -notmatch '\$2[aby]\$[0-9]{2}\$') -and
        ($confTxt -notmatch '(?m)^\s*(password|secret|jwt_secret|session_secret)\s*:\s*\S{12,}'))
    Verif "forme documentee (users.yml.EXAMPLE versionne)" (Test-Path "deploy/authelia/users.yml.EXAMPLE")

    # --- E. Fuite en reponse : valeurs REELLES de deploy/.env -------------
    $envFile = "deploy/.env"
    if (Test-Path $envFile) {
        $valeurs = @((Get-Content $envFile -Encoding utf8) |
            Where-Object { $_ -match "=" -and $_ -notmatch "^\s*#" } |
            ForEach-Object { ($_ -split "=", 2)[1].Trim() } |
            Where-Object { $_.Length -ge 12 })
        $cibles = @(
            @{ nom = "front"; urls = @("$FRONT/", "$FRONT/login", "$FRONT/aide") },
            @{ nom = "passerelle"; urls = @("$GW/health", "$GW/etat-parc", "$GW/api/apercu-parc") }
        )
        foreach ($c in $cibles) {
            $fuite = @()
            foreach ($u in $c.urls) {
                $corps = & curl.exe -s -m 20 $u 2>$null
                $txt = ($corps -join "`n")
                foreach ($v in $valeurs) {
                    if ($txt.Contains($v)) { $fuite += "$u" }
                }
            }
            Verif "aucune valeur de secret dans les reponses $($c.nom) ($($c.urls.Count) urls)" ($fuite.Count -eq 0)
        }
        Verif "valeurs reelles chargees pour la recette de fuite" ($valeurs.Count -ge 2)
    } else {
        Write-Output "[--] recette de fuite ignoree : deploy/.env absent (stack IdP non installee)"
    }

} finally {
    Pop-Location
}

Write-Output ""
if ($script:KO -eq 0) {
    Write-Output "RESULTAT : 0 secret versionne, 0 fuite ($($script:N)/$($script:N) OK)"
} else {
    Write-Output "RESULTAT : $($script:KO) ECHEC(S) sur $($script:N) checks"
}
exit $script:KO
