# Batterie G-LAN (doctrine docs/71, V4) : prouver que la MEME pile se sert
# sous un autre nom d'entree (local -> LAN -> Internet) sans changement de code.
#
#   powershell -ExecutionPolicy Bypass -File ./test-lan.ps1
#   powershell -ExecutionPolicy Bypass -File ./test-lan.ps1 -Exiger   # la
#       joignabilite depuis l'IP LAN devient un KO (a activer le jour ou la
#       regle pare-feu hote est posee ; sinon elle est seulement MESUREE).
#
# Ce que la batterie verifie :
#   1. le Caddyfile ne contient PLUS aucun nom d'hote en dur (parametrable),
#   2. la configuration IdP rendue est conforme au modele (reproductible),
#   3. le rendu pour `lcd.local` est VALIDE par le vrai binaire Authelia,
#   4. compose cable LCD_HOTE -> Caddy ET -> lien portail du front,
#   5. l'entree par defaut (lcd.test) repond : 200 health, 200 portail,
#      302 anonyme vers le portail,
#   6. une paire JETABLE (IdP + Caddy) rendue pour `lcd.local` sert la meme
#      pile : 200 health, 200 portail, 302 anonyme dont la Location porte
#      lcd.local (le nom suit partout, y compris le chainage forward_auth),
#   7. la joignabilite depuis l'IP LAN est mesuree (etape hote : pare-feu).
#
# Aucun secret n'est affiche : les valeurs de deploy/.env sont lues pour
# alimenter l'IdP jetable, jamais imprimees.

param([switch]$Exiger)

$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $false
$script:KO = 0
$script:N = 0
$HOTE_LAN = "lcd.local"
$PORT_APP = 4011
$PORT_IDP = 4012
$AUTHELIA = "authelia/authelia:4.39.28"
$temp = $null

function Verif($label, $ok) {
    $script:N++
    if ($ok) { Write-Output "[OK] $label" } else { Write-Output "[KO] $label"; $script:KO++ }
}
function Attendre($url, $resolve, $attendu = 200, $max = 40) {
    for ($i = 0; $i -lt $max; $i++) {
        $code = & curl.exe --resolve $resolve -k -s -o NUL -w "%{http_code}" -m 5 $url 2>$null
        if ($code -eq "$attendu") { return $true }
        Start-Sleep -Milliseconds 800
    }
    return $false
}

$racine = (& git rev-parse --show-toplevel).Trim()
Push-Location $racine
try {
    $caddyfile = Join-Path $racine "deploy/Caddyfile"
    $autheliaDir = Join-Path $racine "deploy/authelia"
    $compose = Join-Path $racine "deploy/docker-compose.yml"

    # --- 1. Caddyfile : aucun nom d'hote en dur ---------------------------
    $adresses = @(Select-String -Path $caddyfile -Pattern '^\s*https?://' | ForEach-Object { $_.Line.Trim() })
    $enDur = @($adresses | Where-Object { $_ -notmatch '\{\$LCD_HOTE' })
    Verif "Caddyfile : aucune adresse de site en dur ($($adresses.Count) sites)" ($enDur.Count -eq 0)
    if ($enDur.Count -gt 0) { $enDur | ForEach-Object { Write-Output "      en dur : $_" } }
    Verif "Caddyfile : le port HTTPS est parametre" (
        (Select-String -Path $caddyfile -Pattern '\{\$LCD_PORT_HTTPS' -SimpleMatch:$false).Count -ge 1)

    # --- 2. Configuration IdP rendue = conforme au modele ------------------
    & powershell -ExecutionPolicy Bypass -File (Join-Path $autheliaDir "rendre-config.ps1") -Verifier *> $null
    Verif "configuration IdP conforme au modele (rendre-config -Verifier)" ($LASTEXITCODE -eq 0)

    # --- 3. Rendus valides par le binaire Authelia ------------------------
    $temp = Join-Path $env:TEMP ("lcd-lan-" + [guid]::NewGuid().ToString("N").Substring(0, 8))
    New-Item -ItemType Directory -Path $temp | Out-Null
    Copy-Item (Join-Path $autheliaDir "users.yml") (Join-Path $temp "users.yml")
    & powershell -ExecutionPolicy Bypass -File (Join-Path $autheliaDir "rendre-config.ps1") `
        -Hote $HOTE_LAN -PortIdp $PORT_IDP -Sortie (Join-Path $temp "configuration.yml") | Out-Null
    Verif "rendu LAN : placeholders resolus" (
        -not ((Get-Content (Join-Path $temp "configuration.yml") -Raw) -match '\{\{'))

    $secrets = @{}
    foreach ($l in (Get-Content (Join-Path $racine "deploy/.env") -Encoding utf8)) {
        if ($l -match '^\s*([A-Za-z0-9_]+)\s*=\s*(.+)$') { $secrets[$Matches[1]] = $Matches[2].Trim() }
    }
    $envArgs = @(
        "-e", "AUTHELIA_SESSION_SECRET=$($secrets['LCD_AUTHELIA_SESSION_SECRET'])",
        "-e", "AUTHELIA_STORAGE_ENCRYPTION_KEY=$($secrets['LCD_AUTHELIA_STORAGE_KEY'])"
    )
    $val = & docker run --rm @envArgs -v "${temp}:/config:ro" $AUTHELIA authelia validate-config --config /config/configuration.yml 2>&1
    Verif "rendu LAN valide par le binaire Authelia (validate-config)" (
        ($val -join "`n") -match "parsed and loaded successfully")

    # --- 4. compose : le nom pilote Caddy ET le lien portail --------------
    $txtCompose = Get-Content $compose -Raw -Encoding utf8
    Verif "compose : LCD_HOTE fourni a Caddy" ($txtCompose -match '(?m)^\s*LCD_HOTE:\s*\$\{LCD_HOTE(:-lcd\.test)?\}')
    Verif "compose : lien portail derive de LCD_HOTE" (
        $txtCompose -match 'LCD_IDP_URL:\s*https://\$\{LCD_HOTE')

    # --- 5. Entree par defaut (celle qui tourne) --------------------------
    Verif "defaut : app /api/health 200" (200 -eq (& curl.exe --resolve "lcd.test:4001:127.0.0.1" -k -s -o NUL -w "%{http_code}" https://lcd.test:4001/api/health))
    Verif "defaut : portail 200" (200 -eq (& curl.exe --resolve "lcd.test:4002:127.0.0.1" -k -s -o NUL -w "%{http_code}" https://lcd.test:4002/api/health))
    $locDefaut = & curl.exe --resolve "lcd.test:4001:127.0.0.1" -k -s -o NUL -w "%{http_code} %{redirect_url}" https://lcd.test:4001/
    Verif "defaut : anonyme redirige vers le portail lcd.test:4002" (
        $locDefaut -match "^302" -and $locDefaut -match "lcd\.test:4002")

    # --- 6. MEME pile servie sous lcd.local (paire jetable) ---------------
    $caddyLan = Join-Path $temp "Caddyfile"
    (Get-Content $caddyfile -Raw) -replace 'authelia:9091', 'lcd-lan-authelia:9091' |
        Set-Content -Path $caddyLan -Encoding utf8 -NoNewline

    & docker rm -f lcd-lan-authelia lcd-lan-caddy 2>$null | Out-Null
    & docker run --rm -d --name lcd-lan-authelia --network lcd-deploy_front @envArgs `
        -v "${temp}:/config" $AUTHELIA --config /config/configuration.yml *> $null

    & docker run --rm -d --name lcd-lan-caddy --network lcd-deploy_front `
        -p "${PORT_APP}:443" -p "${PORT_IDP}:4002" `
        -e "LCD_HOTE=$HOTE_LAN" -e "LCD_PORT_HTTPS=$PORT_APP" `
        -v "${caddyLan}:/etc/caddy/Caddyfile:ro" caddy:2-alpine *> $null
    & docker network connect lcd-lab_default lcd-lan-caddy 2>$null | Out-Null

    # Le portail jetable n'existe QUE derriere l'entree jetable (Authelia n'est
    # pas publiee directement) : on le sonde via l'entree, apres demarrage.
    $idpOk = Attendre "https://${HOTE_LAN}:$PORT_IDP/api/health" "${HOTE_LAN}:${PORT_IDP}:127.0.0.1"
    Verif "LAN : IdP rendu pour $HOTE_LAN repond via l'entree (health 200)" $idpOk

    $appOk = Attendre "https://${HOTE_LAN}:$PORT_APP/api/health" "${HOTE_LAN}:${PORT_APP}:127.0.0.1"
    Verif "LAN : entree $HOTE_LAN sert la passerelle (health 200)" $appOk

    $locLan = & curl.exe --resolve "${HOTE_LAN}:${PORT_APP}:127.0.0.1" -k -s -o NUL -w "%{http_code} %{redirect_url}" "https://${HOTE_LAN}:$PORT_APP/"
    Verif "LAN : anonyme redirige vers le portail de CE nom (${HOTE_LAN}:${PORT_IDP})" (
        $locLan -match "^302" -and $locLan -match [regex]::Escape("${HOTE_LAN}:${PORT_IDP}"))
    if (-not ($locLan -match "^302")) { Write-Output "      recu : $locLan" }

    # --- 7. Joignabilite depuis l'IP LAN (etape hote) ---------------------
    $ips = @((ipconfig | Select-String "IPv4") | ForEach-Object { ($_ -split ":")[-1].Trim() } |
        Where-Object { $_ -match '^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.)' })
    if ($ips.Count -eq 0) {
        Write-Output "[--] joignabilite LAN : aucune IP privee detectee sur cet hote"
    } else {
        $joignable = $false
        foreach ($ip in $ips) {
            $c = & curl.exe --resolve "lcd.test:4001:${ip}" -k -s -o NUL -w "%{http_code}" -m 6 https://lcd.test:4001/api/health 2>$null
            if ($c -eq "200") { $joignable = $true; Write-Output "      joignable sur $ip" }
        }
        if ($joignable) {
            Verif "joignabilite LAN depuis l'IP privee de l'hote" $true
        } elseif ($Exiger) {
            Verif "joignabilite LAN depuis l'IP privee de l'hote" $false
        } else {
            Write-Output "[--] joignabilite LAN non etablie : ETAPE HOTE (admin) requise --"
            Write-Output "     New-NetFirewallRule -DisplayName 'LCD SAS LAN' -Direction Inbound -Protocol TCP -LocalPort 4001,4002,4003 -Action Allow"
            Write-Output "     (les ports sont bien publies en 0.0.0.0 ; c'est le pare-feu qui bloque)"
        }
    }

} finally {
    & docker rm -f lcd-lan-authelia lcd-lan-caddy 2>$null | Out-Null
    if ($temp -and (Test-Path $temp)) { Remove-Item -Recurse -Force $temp -ErrorAction SilentlyContinue }
    Pop-Location
}

Write-Output ""
if ($script:KO -eq 0) {
    Write-Output "RESULTAT : entree parametrable prouvee, LAN pret cote logiciel ($($script:N)/$($script:N) OK)"
} else {
    Write-Output "RESULTAT : $($script:KO) ECHEC(S) sur $($script:N) checks"
}
exit $script:KO
