# Batterie front (SSR) : pages, sessions, gates, CSV, i18n, 404 - sans JS.
# $env:FRONT = URL front (defaut http://127.0.0.1:3100).
# Exit code = nombre d'echecs (0 = tout vert). ASCII strict (lessons cp1252).
$ErrorActionPreference = "Continue"
$F = if ($env:FRONT) { $env:FRONT.TrimEnd("/") } else { "http://127.0.0.1:3100" }
$script:KO = 0
function Verif($label, $ok) {
    if ($ok) { Write-Output "[OK] $label" }
    else { Write-Output "[KO] $label"; $script:KO += 1 }
}
function corps($chemin, $cookie) {
    $args = @("-s", "-m", "20", "$F$chemin")
    if ($cookie) { $args += @("-H", "Cookie: $cookie") }
    return (curl.exe @args) -join " "
}

# 1. Landing marketing
$l = corps "/" $null
Verif "landing : hero ecologique" ($l -match "conciergerie")

# 2. Login
$lg = corps "/login" $null
Verif "login : profils listes" (($lg -match "Claire") -and ($lg -match "In"))

# 2b. Login SANS JS (progressive enhancement) : extraire le $ACTION_ID du
# formulaire login (suivi du hidden qui), POSTer multipart si identique,
# attendre 303 + Set-Cookie lcd_qui + Location /hote.
$aid = [regex]::Match($lg, 'name="(\$ACTION_ID_[a-f0-9]+)"\s*/><input type="hidden" name="qui"')
if ($aid.Success) {
    $id = $aid.Groups[1].Value
    $hash = $id.Substring('$ACTION_ID_'.Length)
    $LF = "`r`n"
    $body = '--LCD' + $LF + 'Content-Disposition: form-data; name="$ACTION_ID_' + $hash + '"' + $LF + $LF + $LF + '--LCD' + $LF + 'Content-Disposition: form-data; name="qui"' + $LF + $LF + 'personne_03' + $LF + '--LCD--' + $LF
    $hdrs = curl.exe -s -D - -o NUL -X POST -H "content-type: multipart/form-data; boundary=LCD" --data-binary $body "$F/login"
    $hj = $hdrs -join " "
    Verif "login sans JS : 303 redirect" ($hj -match "303")
    Verif "login sans JS : cookie pose" ($hj -match "lcd_qui=personne_03")
    Verif "login sans JS : Location /hote" ($hj -match "Location: /hote")
} else {
    Write-Output "[KO] login sans JS : ACTION_ID introuvable (build change ?)"
    $script:KO += 3
}

# 3. Pages SaaS 200 (session cookie personne_01)
foreach ($p in @("/hote", "/planning", "/prix", "/compta", "/presta", "/legales", "/voyageur", "/proprio?logement=log1", "/commercial")) {
    $c = corps $p "lcd_qui=personne_01"
    Verif "page $p rendue" ($c.Length -gt 500)
}

# 4. Onboarding : etape 1 bloquee puis etape 7 ouverte
$ob1 = corps "/onboarding?etape=1" "lcd_qui=personne_01"
Verif "onboarding etape 1 : cta desactive" ($ob1 -match "disabled")
$ob7 = corps "/onboarding?etape=7&dpe=C&reglement_pv=1&detecteurs=1&assurance=1&presta_ok=1&photos=1&mandat=1&rc_ok=1&box_ok=1&extras_ok=1&prestas_ok2=1&installe=1&qr_ok=1&wg_ok=1&ota_ok=1&j2_ok=1&cerfa=1&siret=1&taxe=1" "lcd_qui=personne_01"
Verif "onboarding etape 7 : carte creation" ($ob7 -match "REQ-L-001")

# 5. Voir-comme (chip session) + theme
$vc = corps "/hote" "lcd_qui=personne_01"
Verif "voir-comme : chip session" ($vc -match "Voir comme")
$th = corps "/" "lcd_theme=sombre"
Verif "theme : classe sombre" ($th -match "theme-sombre")

# 6. 404 brandee
$nf = corps "/inexistant-xyz" $null
Verif "404 brandee" (($nf -match "404") -and ($nf -match "Accueil"))

# 7. Export CSV compta (headers + entete colonnes)
$tmp = Join-Path $env:TEMP ("lcd-front-" + [guid]::NewGuid().ToString("N") + ".csv")
$null = curl.exe -s -m 20 -o $tmp "$F/api/compta/export"
$head = (Get-Content $tmp -TotalCount 1 -Encoding UTF8)
Verif "csv : colonnes compta" ($head -match "entite_id.*logement_id.*montant_ttc")
Remove-Item $tmp -ErrorAction SilentlyContinue

# 8. i18n 5 langues (spot h1)
Verif "i18n fr planning" ((corps "/planning?lang=fr" $null) -match "Planning du parc")
Verif "i18n en planning" ((corps "/planning?lang=en" $null) -match "Estate planning")
Verif "i18n es compta"   ((corps "/compta?lang=es" $null) -match "Un plan por SIREN")
Verif "i18n it presta"   ((corps "/presta?lang=it" $null) -match "Prestazioni")
Verif "i18n de prix"     ((corps "/prix?lang=de" $null) -match "Preisraster")

# 9. Guide voyageur : donnees annonce reelle
$v = corps "/voyageur" $null
Verif "voyageur : guide annonce" ($v -match "17:00")

if ($script:KO -eq 0) { Write-Output "RESULTAT : front OK (batterie complete verte)" }
else { Write-Output "RESULTAT : $script:KO ECHEC(S)" }
exit $script:KO
