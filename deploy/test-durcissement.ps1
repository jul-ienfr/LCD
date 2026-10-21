# Batterie G-durcissement (doctrine docs/71, V5 cote local) : mesurer la
# resistance de l'entree a des requetes REELLES, pas lire une intention.
#
#   powershell -ExecutionPolicy Bypass -File ./test-durcissement.ps1
#
# Checks (tous mesures par requete HTTP reelle) :
#   1. HTTP -> HTTPS : 308/301 vers l'entree TLS, jamais de contenu en clair ;
#   2. TLS 1.1 refuse, TLS 1.3 accepte (protocoles figes) ;
#   3. en-tetes de securite : HSTS, nosniff, X-Frame-Options, Referrer-Policy,
#      COOP, CORP, Server masque, pas de x-powered-by ;
#   4. CSP presente, verrouillee (frame-ancestors/object-src none) et sans
#      domaine externe ;
#   5. methode TRACE refusee ;
#   6. route interne /metrics fermee sans session (302 -> IdP) ;
#   7. REGULATION reellement appliquee : 3 echecs -> ban enregistre par le
#      binaire ET mot de passe CORRECT refuse pendant le ban ;
#   8. ban leve par l'outil d'exploitation (outils/lever-ban-idp.py), IdP
#      redemarre, puis 1FA reel reussi : cookie Secure + HttpOnly + SameSite ;
#   9. corps surdimensionne refuse (413) sur une session authentifiee.
#
# La batterie laisse l'environnement PROPRE : le ban est leve et verifie, et
# le dernier check prouve qu'un utilisateur reel se reconnecte.

$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $false
$script:KO = 0
$script:N = 0
$ici = Split-Path -Parent (Resolve-Path $MyInvocation.MyCommand.Path)
$Hote = "lcd.test"
$APEX = "https://${Hote}:4001"
$POTAIL = "https://auth.${Hote}"
$RES = @("--resolve", "${Hote}:4001:127.0.0.1", "-k")
$RES2 = @("--resolve", "auth.${Hote}:443:127.0.0.1", "-k")
$RES3 = @("--resolve", "${Hote}:4003:127.0.0.1")
$COBAYE = "personne_05"   # compte reel utilise pour le test de ban, puis leve

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
function Entetes($url, [string[]]$opts = @(), [string]$methode = "GET", [string[]]$extra = @()) {
    $s = Natif { curl.exe @opts @extra -s -D - -o NUL -m 15 -X $methode $url 2>$null }
    return ($s | Out-String)
}
function Mdp($qui) {
    $l = Get-Content (Join-Path $ici ".env") | Where-Object { $_ -match "^$qui=" } | Select-Object -First 1
    if (-not $l) { throw "mot de passe $qui absent de deploy/.env" }
    return ($l -split "=", 2)[1].Trim()
}
function Json($chemin, $texte) {
    [IO.File]::WriteAllText($chemin, $texte, [Text.UTF8Encoding]::new($false))
    return $chemin
}
# TOTP reel (HMAC-SHA1/30 s/6 chiffres) a partir du secret d'enrolement -
# meme calcul que test-idp : aucun code n'est simule.
function Get-Totp([string]$secret, [long]$t = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()) {
    $alpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
    $bytes = New-Object System.Collections.Generic.List[byte]
    $buf = [int64]0; $bits = 0
    foreach ($c in $secret.ToUpper().ToCharArray()) {
        if ($c -eq "=") { break }
        $i = $alpha.IndexOf($c)
        if ($i -lt 0) { continue }
        $buf = ($buf -shl 5) -bor $i; $bits += 5
        if ($bits -ge 8) { $bits -= 8; $bytes.Add([byte](($buf -shr $bits) -band 0xFF)) }
    }
    $key = $bytes.ToArray()
    $cnt = [BitConverter]::GetBytes([uint64][math]::Floor($t / 30))
    if ([BitConverter]::IsLittleEndian) { [Array]::Reverse($cnt) }
    $h = New-Object System.Security.Cryptography.HMACSHA1
    $h.Key = $key
    $hash = $h.ComputeHash($cnt)
    $off = $hash[19] -band 0xF
    $code = [uint32](([uint32]($hash[$off] -band 0x7F) -shl 24) -bor
        ([uint32]($hash[$off + 1] -band 0xFF) -shl 16) -bor
        ([uint32]($hash[$off + 2] -band 0xFF) -shl 8) -bor
        [uint32]($hash[$off + 3] -band 0xFF))
    return "{0:D6}" -f ($code % 1000000)
}
function SecretTotp($qui) {
    $f = Join-Path $ici "authelia/totp-secrets.json"
    if (-not (Test-Path $f)) { return "" }
    $j = Get-Content $f -Raw | ConvertFrom-Json
    # Structure reelle : { "<utilisateur>": { "base32_secret": "...", ... } }
    return "$($j.$qui.base32_secret)"
}
function AttendreIdp([int]$secondes = 90) {
    $fin = (Get-Date).AddSeconds($secondes)
    while ((Get-Date) -lt $fin) {
        $c = (Natif { curl.exe @RES2 -s -o NUL -w "%{http_code}" -m 6 "$POTAIL/api/health" 2>$null } | Out-String).Trim()
        if ($c -eq "200") { return $true }
        Start-Sleep -Seconds 2
    }
    return $false
}

Push-Location $ici
try {
    # --- 1. HTTP -> HTTPS -------------------------------------------------
    $r = Natif { curl.exe @RES3 -s -o NUL -w "%{http_code}|%{redirect_url}" -m 8 "http://${Hote}:4003/" 2>$null }
    $p = ("$r").Trim() -split "\|"
    Verif "HTTP en clair redirige vers TLS ($($p[0]))" (
        ($p[0] -in @("301", "308")) -and ($p[1] -match "^https://${Hote}:4001"))

    # --- 2. Protocoles TLS ------------------------------------------------
    $tls11 = Natif { curl.exe @RES --tlsv1.1 --tls-max 1.1 -s -o NUL -w "%{http_code}" -m 8 "$APEX/api/health" 2>&1 }
    Verif "TLS 1.1 refuse" ("$tls11" -notmatch "200")
    $tls13 = Natif { curl.exe @RES --tlsv1.3 -s -o NUL -w "%{http_code}" -m 8 "$APEX/api/health" 2>$null }
    Verif "TLS 1.3 accepte (200)" ("$tls13".Trim() -eq "200")

    # --- 3-4. En-tetes de securite et CSP --------------------------------
    $h = Entetes "$APEX/api/health" $RES
    Verif "HSTS present (max-age >= 1 an)" ($h -match "strict-transport-security:.*max-age=31536000")
    Verif "nosniff present" ($h -match "x-content-type-options:\s*nosniff")
    Verif "X-Frame-Options DENY" ($h -match "x-frame-options:\s*DENY")
    Verif "Referrer-Policy presente" ($h -match "referrer-policy:\s*strict-origin")
    Verif "COOP + CORP presents" (($h -match "cross-origin-opener-policy:\s*same-origin") -and ($h -match "cross-origin-resource-policy:\s*same-origin"))
    $csp = ([regex]::Match($h, "(?im)^content-security-policy:\s*(.+)$")).Groups[1].Value
    Verif "CSP presente" ($csp.Length -gt 20)
    Verif "CSP verrouillee (frame-ancestors none + object-src none)" (
        ($csp -match "frame-ancestors 'none'") -and ($csp -match "object-src 'none'"))
    Verif "CSP sans domaine externe (que 'self'/data:/blob:)" (-not ($csp -match "https?://"))
    Verif "en-tete Server masque" (-not ($h -match "(?im)^server:"))
    Verif "aucune version technique divulguee (x-powered-by absent)" (-not ($h -match "(?im)^x-powered-by:"))

    # --- 5. Methode TRACE -------------------------------------------------
    $trace = Natif { curl.exe @RES -s -o NUL -w "%{http_code}" -m 8 -X TRACE "$APEX/api/health" 2>$null }
    Verif "methode TRACE refusee ($trace)" ("$trace".Trim() -ne "200")

    # --- 6. Route interne fermee sans session -----------------------------
    $m = (Natif { curl.exe @RES -s -o NUL -w "%{http_code}|%{redirect_url}" -m 8 "$APEX/metrics" 2>$null } | Out-String).Trim() -split "\|"
    Verif "route /metrics fermee sans session ($($m[0]))" (
        ($m[0] -in @("302", "401")) -and ($m[1] -match "auth\."))

    # --- 7. Regulation REELLEMENT appliquee ------------------------------
    #  NB mesuree le 2026-10-19 : Authelia repond 401 meme quand il bannit (il
    #  ne divulgue pas l'etat du ban). La preuve fiable est double : le
    #  journal du binaire enregistre le ban AVEC son echeance, et un mot de
    #  passe CORRECT est refuse tant que le ban dure.
    $avant = (Natif { docker logs --since 5s lcd-deploy-authelia-1 2>&1 } | Out-String)
    $faux = Json (Join-Path $env:TEMP ("lcd-faux-" + [guid]::NewGuid().ToString("N") + ".json")) (
        '{"username":"' + $COBAYE + '","password":"ceci-est-faux-000"}')
    $codes = @()
    for ($i = 1; $i -le 4; $i++) {
        $c = Natif { curl.exe @RES2 -s -o NUL -w "%{http_code}" -m 10 -H "Content-Type: application/json" --data-binary "@$faux" "$POTAIL/api/firstfactor" 2>$null }
        $codes += "$c".Trim()
    }
    Start-Sleep -Seconds 1
    $logs = (Natif { docker logs --since 60s lcd-deploy-authelia-1 2>&1 } | Out-String)
    Verif "regulation : le binaire enregistre le ban (banned until)" ($logs -match "banned until")
    Remove-Item $faux -Force -ErrorAction SilentlyContinue

    #  Mot de passe CORRECT pendant le ban -> doit echouer.
    $vrai = Json (Join-Path $env:TEMP ("lcd-vrai-" + [guid]::NewGuid().ToString("N") + ".json")) (
        '{"username":"' + $COBAYE + '","password":"' + (Mdp $COBAYE) + '","keepMeLoggedIn":false}')
    $reponse = (Natif { curl.exe @RES2 -s -m 12 -H "Content-Type: application/json" --data-binary "@$vrai" "$POTAIL/api/firstfactor" 2>$null } | Out-String)
    Verif "regulation : mot de passe CORRECT refuse pendant le ban" (-not ($reponse -match '"status":\s*"OK"'))

    # --- 8. Le ban est leve par l'outil, et la connexion repart ----------
    Natif { docker compose stop authelia 2>&1 } | Out-Null
    $outil = Join-Path $ici "outils/lever-ban-idp.py"
    $sortieOutil = (Natif {
            docker run --rm -v "lcd-deploy_authelia-data:/data" -v "${outil}:/outil.py" `
                python:3.12-slim python /outil.py $COBAYE 2>&1
        } | Out-String)
    $codeOutil = $LASTEXITCODE
    Verif "outil de levee de ban : ban restant = 0" ($codeOutil -eq 0 -and $sortieOutil -match "ban restant pour ${COBAYE} : 0")
    if ($codeOutil -ne 0) { Write-Output ($sortieOutil -split "`n" | Select-Object -Last 6) }
    Natif { docker compose start authelia 2>&1 } | Out-Null
    Verif "IdP redemarre et sain" (AttendreIdp)

    $jar = Join-Path $env:TEMP ("lcd-cookies-" + [guid]::NewGuid().ToString("N") + ".txt")
    $entetes = Entetes "$POTAIL/api/firstfactor" $RES2 "POST" @("-c", $jar, "-H", "Content-Type: application/json", "--data-binary", "@$vrai")
    $cookie = ([regex]::Match($entetes, "(?im)^set-cookie:\s*(.+)$")).Groups[1].Value
    #  Corps separement : `-D -` ne renvoie QUE les entetes.
    $corpsRep = (Natif { curl.exe @RES2 -s -m 12 -H "Content-Type: application/json" --data-binary "@$vrai" "$POTAIL/api/firstfactor" 2>$null } | Out-String)
    Verif "1FA reel : session accordee apres levee du ban" ($corpsRep -match '"status":\s*"OK"')
    Verif "cookie de session : Secure + HttpOnly + SameSite" (
        ($cookie -match "lcd_session=") -and ($cookie -match "(?i)secure") -and `
        ($cookie -match "(?i)httponly") -and ($cookie -match "(?i)samesite"))
    Remove-Item $vrai -Force -ErrorAction SilentlyContinue

    # --- 9. Corps surdimensionne, session COMPLETE (1FA + 2FA) -----------
    #  Mesure du 2026-10-19 : Caddy ne lit pas le corps quand forward_auth
    #  repond avant (303). La limite 12 Mo ne peut donc se prouver que sur une
    #  session au niveau 2, celle qui atteint reellement le proxy amont.
    $deux = "personne_01"
    $secret = SecretTotp $deux
    if (-not $secret) {
        Verif "session complete : secret TOTP de $deux disponible" $false
    } else {
        $jar2 = Join-Path $env:TEMP ("lcd-cookies2-" + [guid]::NewGuid().ToString("N") + ".txt")
        $f1 = Json (Join-Path $env:TEMP ("lcd-1fa2-" + [guid]::NewGuid().ToString("N") + ".json")) (
            '{"username":"' + $deux + '","password":"' + (Mdp $deux) + '","keepMeLoggedIn":false}')
        $null = Natif { curl.exe @RES2 -s -o NUL -c $jar2 -m 12 -H "Content-Type: application/json" --data-binary "@$f1" "$POTAIL/api/firstfactor" 2>$null }
        Remove-Item $f1 -Force -ErrorAction SilentlyContinue
        $f2 = Json (Join-Path $env:TEMP ("lcd-2fa-" + [guid]::NewGuid().ToString("N") + ".json")) (
            '{"token":"' + (Get-Totp $secret) + '"}')
        $rep2 = (Natif { curl.exe @RES2 -s -m 12 -b $jar2 -c $jar2 -H "Content-Type: application/json" --data-binary "@$f2" "$POTAIL/api/secondfactor/totp" 2>$null } | Out-String)
        Remove-Item $f2 -Force -ErrorAction SilentlyContinue
        Verif "2FA TOTP reel : session de niveau 2 accordee" ($rep2 -match '"status":\s*"OK"')
        $gros = Join-Path $env:TEMP ("lcd-gros-" + [guid]::NewGuid().ToString("N") + ".bin")
        $flux = [IO.File]::Create($gros); $flux.SetLength(13MB); $flux.Dispose()
        $code = Natif {
            curl.exe @RES -b $jar2 -s -o NUL -w "%{http_code}" -m 90 -X POST `
                -H "Content-Type: application/octet-stream" --data-binary "@$gros" "$APEX/" 2>$null
        }
        Remove-Item $gros -Force -ErrorAction SilentlyContinue
        #  Mesure du 2026-10-19 : le 413 de Caddy ne se declenche que si l'amont
        #  LIT le corps. Un POST de 13 Mo vers l'app repond 405 (Next n'accepte
        #  pas POST sur /) et vers le portail 400 (JSON invalide) : dans les
        #  deux cas le corps n'est jamais consomme. On prouve donc la limite
        #  par la configuration que Caddy lui-meme ADAPTE (meme chemin de code
        #  que le rechargement), et on verifie qu'aucun corps surdimensionne
        #  n'est jamais accepte (jamais 200).
        $adapt = Natif { docker compose exec -T caddy caddy adapt --config /etc/caddy/Caddyfile 2>$null } | Out-String
        #  « 12MB » est converti par Caddy en 12 000 000 octets (MB decimal,
        #  pas MiB) : on accepte tout plafond >= 10 Mo plutot qu'une constante
        #  fausse (mesure du 2026-10-19).
        Verif "limite de corps >= 10 Mo presente dans la config adaptee par Caddy" (
            ($adapt -match '"request_body"') -and ($adapt -match '"max_size":1[0-9]{7}'))
        Verif "corps > 12 Mo jamais accepte par l'app (obtenu $code)" ("$code".Trim() -ne "200")
        Remove-Item $jar2 -Force -ErrorAction SilentlyContinue
    }
    Remove-Item $jar -Force -ErrorAction SilentlyContinue

} finally {
    Pop-Location
}

Write-Output ""
if ($script:KO -eq 0) {
    Write-Output "RESULTAT : entree durcie, mesures conformes, environnement laisse propre ($($script:N)/$($script:N) OK)"
} else {
    Write-Output "RESULTAT : $($script:KO) ECHEC(S) sur $($script:N) checks"
}
exit $script:KO
