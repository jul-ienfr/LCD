# test-idp.ps1 - Recette IdP F3 : chaine Authelia 4.39.28 REELLE, bout en bout.
# Rien n'est simule : vrais mots de passe (deploy/.env), vrai OTC (notifier
# filesystem), vrai TOTP (HMAC-SHA1 calcule ici, secret = app d'authentif.),
# vrais refus RBAC (revocation decision -> 403 passerelle).
#
# Couvre : anonyme -> 302 portail (rd) ; bypass /api/health + /voyageur 200 ;
# 1FA -> niveau 1 ; /hote avec niveau 1 -> 302 (redirection 2FA) ; 2FA TOTP ->
# niveau 2 ; /hote 200 + identite Remote-User affichee ; /api/v1/statut 200 ;
# ecriture avec compte REVOQUE -> 403 ; logout -> acces perdu (302).
#
# Usage : powershell -NoProfile -ExecutionPolicy Bypass -File test-idp.ps1
#   -ResetTotp   : re-enrolement TOTP reel (elevation OTC + QR + confirm).
# Prerequis : lab up + deploy up (web LCD_IDP=1 + caddy + authelia healthy).
# Sortie : exit code = nombre d'echecs (0 = tout vert). ASCII strict.
param([switch]$ResetTotp)
$ErrorActionPreference = "Continue"
$QUI = "personne_01"
$APP = "https://lcd.test:4001"
$POTAIL = "https://lcd.test:4002"
$RA = @("--resolve", "lcd.test:4001:127.0.0.1", "-k")
$RP = @("--resolve", "lcd.test:4002:127.0.0.1", "-k")
$JAR = Join-Path $env:TEMP "lcd-recette-jar.txt"
$FSECR = Join-Path $PSScriptRoot "authelia\totp-secrets.json"
$script:KO = 0
function Verif($label, $ok) {
    if ($ok) { Write-Output "[OK] $label" }
    else { Write-Output "[KO] $label"; $script:KO += 1 }
}
function Mdp($qui) {
    $l = Get-Content (Join-Path $PSScriptRoot ".env") |
        Where-Object { $_ -match "^$qui=" } | Select-Object -First 1
    if (-not $l) { throw "mot de passe $qui absent de deploy/.env (generer-secrets.ps1)" }
    return ($l -split "=", 2)[1].Trim()
}
$script:TMPF = @()
function Corps($corps) {
    $f = Join-Path $env:TEMP ("lcd-rec-" + [guid]::NewGuid().ToString("N") + ".json")
    [IO.File]::WriteAllText($f, $corps, [Text.UTF8Encoding]::new($false))
    $script:TMPF += $f
    return $f
}
# POST JSON. $jar : chemin du cookie jar (cumul si existant) ; $null = anonyme.
function PostJson($base, $chemin, $corps, $jar, $res) {
    $f = Corps $corps
    $a = @("-s", "-X", "POST", "-H", "content-type: application/json",
           "--data-binary", "@$f")
    if ($jar) { $a += @("-b", $jar, "-c", $jar) }
    if ($res) { $a += $res }
    $out = curl.exe @a "$base$chemin"
    return ($out -join "")
}
function GetJson($base, $chemin, $jar, $res) {
    $a = @("-s")
    if ($jar) { $a += @("-b", $jar) }
    if ($res) { $a += $res }
    $out = curl.exe @a "$base$chemin"
    return ($out -join "")
}
# Code HTTP + entetes (Location...). Corps ecarte (-o NUL).
function Head($url, $jar, $res) {
    $a = @("-s", "-o", "NUL", "-D", "-", "-w", "|CODE=%{http_code}")
    if ($jar) { $a += @("-b", $jar) }
    if ($res) { $a += $res }
    $out = (curl.exe @a $url) -join "`n"
    $code = ""
    $m = [regex]::Match($out, "\|CODE=(\d+)")
    if ($m.Success) { $code = $m.Groups[1].Value }
    return @{ t = $out; code = $code }
}
# TOTP reel : HMAC-SHA1, 6 chiffres, 30 s (RFC 6238, secret base32).
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
# Dernier one-time code emis par le notifier filesystem (canal reel type email).
function DernierOTC() {
    $log = docker exec lcd-deploy-authelia-1 sh -c `
        "tail -40 /config/notification.log" 2>$null
    $m = [regex]::Matches(($log -join "`n"), "(?m)^([A-Z0-9]{8})$")
    if ($m.Count -eq 0) { return "" }
    return ($m | Select-Object -Last 1).Groups[1].Value
}
function Etat() {
    $s = GetJson $POTAIL "/api/state" $JAR $RP
    $m = [regex]::Match($s, '"authentication_level":(\d+)')
    if ($m.Success) { return [int]$m.Groups[1].Value }
    return -1
}

Write-Output "== Recette IdP (F3) : $($APP) =="

# -- 1. Anonyme : fail-closed (302 portail, rd conserve) + bypass publics ----
$h = Head "$APP/hote" $null $RA
Verif "anonyme /hote -> 302 portail (fail-closed)" (
    $h.code -eq "302" -and $h.t -match "lcd.test:4002")
Verif "anonyme /hote : rd conserve (hote)" ($h.t -match "rd=.*hote")
$s = GetJson $APP "/api/health" $null $RA
Verif "bypass /api/health -> 200 ok" ($s -match '"ok":\s*true')
$s = GetJson $APP "/voyageur" $null $RA
Verif "bypass /voyageur -> 200 (lien signe, sans session)" (
    $s.Length -gt 500 -and $s -notmatch "lcd.test:4002")

# -- 2. 1FA reel (mot de passe deploy/.env) -> niveau 1 ----------------------
Remove-Item $JAR -ErrorAction SilentlyContinue
$mdp = Mdp $QUI
$body = Corps ('{"username":"' + $QUI + '","password":"' + $mdp +
    '","rememberMe":false}')
$a = @("-s", "-c", $JAR, "-X", "POST", "-H", "content-type: application/json",
       "--data-binary", "@$body") + $RP
$r = (curl.exe @a "$POTAIL/api/firstfactor") -join ""
Verif "1FA : POST /api/firstfactor -> OK" ($r -match '"status":\s*"OK"')
$lvl = Etat
Verif "1FA : authentication_level = 1" ($lvl -eq 1)

# -- 3. Niveau 1 insuffisant : redirection 2FA sur page protegee ------------
$h = Head "$APP/hote" $JAR $RA
Verif "/hote avec niveau 1 -> 302 (redirection 2FA)" (
    $h.code -eq "302" -and $h.t -match "lcd.test:4002")

# -- 4. TOTP : secret = app d'authentif. ; sinon enrolement reel ------------
$secret = ""
if (-not ($ResetTotp) -and (Test-Path $FSECR)) {
    $j = Get-Content $FSECR -Raw | ConvertFrom-Json
    if ($j.$QUI) { $secret = $j.$QUI.base32_secret }
}
if (-not $secret) {
    Write-Output "-- Enrolement TOTP reel (elevation OTC + generate + confirm)"
    $r = PostJson $POTAIL "/api/user/session/elevation" "" $JAR $RP
    Verif "elevation : POST session/elevation -> OTC emis" (
        $r -match '"delete_id"')
    Start-Sleep -Milliseconds 800
    $otc = DernierOTC
    Verif "elevation : OTC lu dans notification.log (canal reel)" (
        $otc.Length -eq 8)
    $r = PostJson $POTAIL "/api/user/session/elevation" ('{"otc":"' + $otc +
        '"}') $JAR $RP
    Verif "elevation : PUT {otc} -> elevated" ($r -match '"status":\s*"OK"')
    $r = GetJson $POTAIL "/api/secondfactor/totp/register" $JAR $RP
    Verif "TOTP : options (SHA1/6/30)" ($r -match '"period":\s*30')
    $r = PostJson $POTAIL "/api/secondfactor/totp/register" `
        '{"algorithm":"SHA1","length":6,"period":30}' $JAR $RP
    Verif "TOTP : PUT generate -> base32_secret" ($r -match '"base32_secret"')
    $secret = [regex]::Match($r, '"base32_secret":\s*"([A-Z2-7]+)"'
        ).Groups[1].Value
    $tuse = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
    $r = PostJson $POTAIL "/api/secondfactor/totp/register" `
        ('{"token":"' + (Get-Totp $secret $tuse) + '"}') $JAR $RP
    Verif "TOTP : confirm (POST {token}) -> OK" ($r -match '"status":\s*"OK"')
    # Anti-replay Authelia : la fenetre utilisee est consommee -> fenetre suivante.
    while ([math]::Floor([DateTimeOffset]::UtcNow.ToUnixTimeSeconds() / 30) `
            -eq [math]::Floor($tuse / 30)) { Start-Sleep -Seconds 2 }
    $dir = Split-Path $FSECR
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir | Out-Null }
    $obj = [ordered]@{ }
    $obj[$QUI] = [ordered]@{ base32_secret = $secret }
    $obj | ConvertTo-Json | Set-Content -Path $FSECR -Encoding UTF8
    Write-Output "   secret TOTP memorise dans authelia\totp-secrets.json"
}

# -- 5. 2FA reel : TOTP verifie -> niveau 2 ---------------------------------
$tuse = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$r = PostJson $POTAIL "/api/secondfactor/totp" `
    ('{"token":"' + (Get-Totp $secret $tuse) + '"}') $JAR $RP
Verif "2FA : POST /api/secondfactor/totp -> OK" ($r -match '"status":\s*"OK"')
$lvl = Etat
Verif "2FA : authentication_level = 2" ($lvl -eq 2)

# -- 6. acces avec 2e facteur : 200 + identite prouvee par Remote-User -----
$h = Head "$APP/hote" $JAR $RA
Verif "/hote avec 2FA -> 200" ($h.code -eq "200")
# Chip bandeau = identite prouvee : "Claire (super_admin) . personne_01"
# (marqueurs SSR React <!-- --> ecartes avant le test).
$s = (GetJson $APP "/hote" $JAR $RA) -replace "<!-- --?>", ""
Verif "front : identite Remote-User affichee (chip bandeau)" (
    $s -match "Claire \(super_admin\) . personne_01")
$s = GetJson $APP "/api/v1/statut" $JAR $RA
Verif "/api/v1/statut avec session -> 200 (moteur)" (
    $s -match "phase_conseillee")

# -- 6b. Voir-comme IdP : formulaire natif -> bandeau S3.3 + journal -------
# (personne_01 est admin : le droit voir-comme existe ; la gateway valide
# aussi l'ecriture qui suit, et journalise le geste 90 j).
$page = (GetJson $APP "/hote" $JAR $RA) -replace "<!-- --?>", ""
$m = [regex]::Match($page,
    'name="(\$ACTION_ID_[a-f0-9]+)"(?:(?!<form).){0,700}for="voir-qui"',
    [Text.RegularExpressions.RegexOptions]::Singleline)
Verif "voir-comme : ACTION_ID du formulaire trouve" $m.Success
if ($m.Success) {
    $aid = $m.Groups[1].Value
    $LF = "`r`n"
    $mb = '--LCD' + $LF + 'Content-Disposition: form-data; name="' + $aid +
        '"' + $LF + $LF + $LF + '--LCD' + $LF +
        'Content-Disposition: form-data; name="retour"' + $LF + $LF +
        '/hote' + $LF + '--LCD' + $LF +
        'Content-Disposition: form-data; name="qui"' + $LF + $LF +
        'personne_03' + $LF + '--LCD--' + $LF
    $out = (curl.exe -s -D - -o NUL -X POST -H "content-type: multipart/form-data; boundary=LCD" --data-binary $mb -b $JAR -c $JAR -w "|CODE=%{http_code}" "$APP/hote" $RA) -join "`n"
    Verif "voir-comme : POST 303 + cookie lcd_vu=personne_03" (
        $out -match "\|CODE=303" -and $out -match "lcd_vu=personne_03")
    $h = (curl.exe -s -b $JAR "$APP/hote" $RA) -join "" -replace "<!-- --?>", ""
    Verif "voir-comme : bandeau S3.3 (voit comme Sam)" (
        $h -match "Claire \(super_admin\) voit comme Sam")
    $jrn = docker exec lcd-lab-gateway-parc-1 sh -c `
        "grep geste:voir_comme /opt/lcd/state/parc/journal-parc.jsonl | tail -1"
    Verif "voir-comme : geste journalise (gateway, 90 j)" (
        $jrn -match "personne_03" -and $jrn -match "personne_01")
}

# -- 7. Revocation RBAC reelle -> 403 ecriture (meme connecte) --------------
$CIBLE = "personne_07"
$a = @("-s")
$ac = (curl.exe @a "http://127.0.0.1:8092/acces?qui=personne_01") -join ""
$m = [regex]::Match($ac, '"id":\s*"' + $CIBLE + '"[^}]*?"statut":\s*"(\w+)"')
$statut = if ($m.Success) { $m.Groups[1].Value } else { "" }
$dejaRevoque = ($statut -eq "revoque")
if (-not $dejaRevoque) {
    $r = PostJson "http://127.0.0.1:8092" "/acces-revoquer" `
        ('{"qui":"' + $QUI + '","personne_id":"' + $CIBLE +
        '","motif":"recette idp"}') $null $null
    Verif "revocation reelle (decision /acces-revoquer)" (
        $r -match '"statut":\s*"revoque"')
}
$body = Corps ('{"box_id":"box-lab","logement_id":"log1","action":"prix",' +
    '"qui":"' + $CIBLE + '","ref":"RECETTE-IDP-403","data":{"prix":91}}')
# Cache RBAC passerelle (10 s) : on repete jusqu'a ce que la revocation porte.
$refusRevoque = $false
for ($i = 0; $i -lt 8 -and -not $refusRevoque; $i++) {
    $a = @("-s", "-X", "POST", "-H", "content-type: application/json",
           "--data-binary", "@$body", "-b", $JAR, "-w", "|CODE=%{http_code}") + $RA
    $r = (curl.exe @a "$APP/api/v1/action") -join ""
    $refusRevoque = ($r -match "compte revoque" -and $r -match "\|CODE=403")
    if (-not $refusRevoque) { Start-Sleep -Seconds 2 }
}
Verif "ecriture avec compte REVOQUE -> 403 passerelle" $refusRevoque
if (-not $dejaRevoque) {
    $r = PostJson "http://127.0.0.1:8092" "/acces-reactiver" `
        ('{"qui":"' + $QUI + '","personne_id":"' + $CIBLE + '"}') $null $null
    Verif "etablit restaure (acces-reactiver)" (
        $r -match '"statut":\s*"(reactive|deja_actif)"')
}

# -- 8. Logout IdP reel -> session morte -> acces perdu --------------------
$r = PostJson $POTAIL "/api/logout" "" $JAR $RP
Verif "logout : POST /api/logout -> OK" ($r -match '"status":\s*"OK"')
$lvl = Etat
Verif "logout : authentication_level = 0" ($lvl -eq 0)
$h = Head "$APP/hote" $JAR $RA
Verif "apres logout : /hote -> 302 (acces perdu)" ($h.code -eq "302")

Remove-Item $JAR -ErrorAction SilentlyContinue
foreach ($f in $script:TMPF) { Remove-Item $f -ErrorAction SilentlyContinue }
Write-Output ("RESULTAT : recette IdP " +
    $(if ($script:KO -eq 0) { "COMPLETE VERTE" } else { "$($script:KO) KO" }))
exit $script:KO
