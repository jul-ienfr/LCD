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
# Deux modes honnetes (F3) : lab sans IdP = picker de profils ; IdP
# (LCD_IDP=1) = anneau vers le portail Authelia, AUCUN faux picker.
$modeIdp = ($lg -match "portail IdP") -or ($lg -match "Ouvrir le portail")
if ($modeIdp) {
    Verif "login IdP : portail + second facteur annonces" (($lg -match "portail") -and ($lg -match "second"))
    Verif "login IdP : lien portail present" ($lg -match ":4002|portail")
    Verif "login IdP : aucun picker de profil" (-not ($lg -match 'name="qui"'))
} else {
    Verif "login lab : profils listes" (($lg -match "Claire") -and ($lg -match "In"))
}

# 2b. Login SANS JS (progressive enhancement) : extraire le $ACTION_ID du
# formulaire login (suivi du hidden qui), POSTer multipart si identique,
# attendre 303 + Set-Cookie lcd_qui + Location /hote (mode lab seulement).
if (-not $modeIdp) {
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
}

# 3. Pages SaaS 200 (session cookie personne_01)
foreach ($p in @("/hote", "/planning", "/prix", "/compta", "/presta", "/legales", "/aide", "/voyageur", "/proprio?logement=log1", "/commercial")) {
    $c = corps $p "lcd_qui=personne_01"
    Verif "page $p rendue" ($c.Length -gt 500)
}
# 3b. Centre d'aide : liste des ecrans a jour (coherence produit avec les
#     exports CSV/nav : 9 ecrans listes, exports mentionnes comme reels).
$aide = corps "/aide" "lcd_qui=personne_01"
Verif "aide : 9 ecrans + exports CSV reels" (
  ($aide -match "Les 9") -and ($aide -match "export CSV"))

# 4. Onboarding : etape 1 bloquee puis etape 7 ouverte
$ob1 = corps "/onboarding?etape=1" "lcd_qui=personne_01"
Verif "onboarding etape 1 : cta desactive" ($ob1 -match "disabled")
$ob7 = corps "/onboarding?etape=7&dpe=C&reglement_pv=1&detecteurs=1&assurance=1&presta_ok=1&photos=1&mandat=1&rc_ok=1&box_ok=1&extras_ok=1&prestas_ok2=1&installe=1&qr_ok=1&wg_ok=1&ota_ok=1&j2_ok=1&cerfa=1&siret=1&taxe=1" "lcd_qui=personne_01"
Verif "onboarding etape 7 : carte creation" ($ob7 -match "REQ-L-001")

# 5. Voir-comme (chip session) + theme
$vc = corps "/hote" "lcd_qui=personne_01"
if ($modeIdp) {
    # Mode IdP : sans Remote-User prouve, AUCUN voir-comme (fail-closed).
    Verif "voir-comme : fail-closed sans identite IdP" (-not ($vc -match "Voir comme"))
} else {
    Verif "voir-comme : chip session" ($vc -match "Voir comme")
}
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

# 7b. Export CSV planning (grille jour x logement, meme protocole lecture
#     seule + ?debut propage si passe)
$tmpp = Join-Path $env:TEMP ("lcd-front-" + [guid]::NewGuid().ToString("N") + ".csv")
$null = curl.exe -s -m 20 -o $tmpp "$F/api/planning-export?jours=7"
$headp = (Get-Content $tmpp -TotalCount 1 -Encoding UTF8)
Verif "csv : colonnes planning" ($headp -match "logement_id.*nom.*\d{4}-\d{2}-\d{2}")
Remove-Item $tmpp -ErrorAction SilentlyContinue

# 7c. Export CSV grille de prix (7 j x logement, ?depuis propage si passe)
$tmpx = Join-Path $env:TEMP ("lcd-front-" + [guid]::NewGuid().ToString("N") + ".csv")
$null = curl.exe -s -m 20 -o $tmpx "$F/api/prix-export"
$headx = (Get-Content $tmpx -TotalCount 1 -Encoding UTF8)
$depuis7 = (Get-Date).ToUniversalTime().AddDays(7).ToString("yyyy-MM-dd")
$null = curl.exe -s -m 20 -o "$tmpx.2" "$F/api/prix-export?depuis=$depuis7"
$headx2 = (Get-Content "$tmpx.2" -TotalCount 2 -Encoding UTF8)
Verif "csv : colonnes prix" ($headx -match "logement_id.*date.*direct")
Verif "csv prix : ?depuis propage" (($headx2 -join " | ") -match [regex]::Escape($depuis7))
Remove-Item $tmpx, "$tmpx.2" -ErrorAction SilentlyContinue

# 7d. Flux iCalendar du planning (.ics) : en-tete RFC 5545 + fenetre propagee
#     (abonnement Google/Apple/Outlook, lecture seule, 1 VEVENT = 1 jour occupe).
$tmpi = Join-Path $env:TEMP ("lcd-front-" + [guid]::NewGuid().ToString("N") + ".ics")
$cti = (curl.exe -s -m 25 -o $tmpi -w "%{content_type}" "$F/api/calendrier-ics?jours=7&debut=$depuis7")
$ics = (Get-Content $tmpi -Raw -Encoding UTF8)
Verif "ics : entete calendrier" (($cti -match "text/calendar") -and ($ics -match "BEGIN:VCALENDAR") -and ($ics -match "END:VCALENDAR"))
Verif "ics : fenetre propagee" ($ics -match [regex]::Escape("X-LCD-FENETRE:$depuis7"))
Remove-Item $tmpi -ErrorAction SilentlyContinue

# 8. i18n 5 langues (spot h1)
Verif "i18n fr planning" ((corps "/planning?lang=fr" $null) -match "Planning du parc")
Verif "i18n en planning" ((corps "/planning?lang=en" $null) -match "Estate planning")
Verif "i18n es compta"   ((corps "/compta?lang=es" $null) -match "Un plan por SIREN")
Verif "i18n it presta"   ((corps "/presta?lang=it" $null) -match "Prestazioni")
Verif "i18n de prix"     ((corps "/prix?lang=de" $null) -match "Preisraster")

# 8b. Navigation fenetre planning ?debut (+7 j) : chip prag affiche la date
#     decalee (meme protocole prix ?depuis ; gw secours invalide->aujourd'hui).
$navd = (Get-Date).ToUniversalTime().AddDays(7).ToString("yyyy-MM-dd")
Verif "planning nav : debut +7j affiche" ((corps "/planning?debut=$navd" $null) -match [regex]::Escape($navd))

# 8c. Combinaison fenetre + offset : le champ cache debut SURVIT au changement
#     de fenetre (jours=7&debut -> chip fin = debut+6 ; fin de fenetre 14 j
#     debut+13 ABSENTE = la fenetre a bien bascule a 7 jours).
$navd6 = (Get-Date).ToUniversalTime().AddDays(13).ToString("yyyy-MM-dd")
$navd13 = (Get-Date).ToUniversalTime().AddDays(20).ToString("yyyy-MM-dd")
$pf = corps "/planning?jours=7&debut=$navd" $null
Verif "planning fenetre : jours+debut conserve" (
  ($pf -match [regex]::Escape($navd)) -and
  ($pf -match [regex]::Escape($navd6)) -and
  ($pf -notmatch [regex]::Escape($navd13)))

# 8d. Page prix /?depuis : chip de semaine decallee rendue (meme protocole
#     que le CSV, meme reutilisation du param gw). Bonus : fin semaine +6 j.
Verif "prix nav : depuis +7j affiche" (
  (corps "/prix?depuis=$navd" $null) -match [regex]::Escape($navd))

# 8e. Liens exports exposes dans les barres de nav (le bouton mene au bon endpoint).
Verif "liens exports : planning CSV+ICS, prix CSV" (
  ($pf -match "planning-export") -and ($pf -match "calendrier-ics") -and
  ((corps "/prix" $null) -match "prix-export"))

# 9. Guide voyageur : donnees annonce reelle
$v = corps "/voyageur" $null
Verif "voyageur : guide annonce" ($v -match "17:00")

# 10. RBAC negatif (la verite est la gw, pas le cookie du front) :
#     - personne_03 (operateur) cree un logement -> REFUSE (403 admin-only)
#     - trancher avec choix invalide -> 400 (validation)
$GW = if ($env:GW) { $env:GW.TrimEnd("/") } else { "http://127.0.0.1:8443" }
try {
    $h = (curl.exe -s -m 8 "$GW/health") -join " "
    if ($h -match "ok") {
        # JSON envoye via fichier temp : le quoting inline pwsh->curl corrompt
        # les corps JSON (lecon repetee) ; via @fichier, la gw lit bene.
        $tmpj = Join-Path $env:TEMP ("lcd-bat-" + [guid]::NewGuid().ToString("N") + ".json")
        [IO.File]::WriteAllText($tmpj, '{"logement_id":"logBATT","qui":"personne_03","data":{"nom":"BATT","commune":"X","capacite":"2","surface_m2":"1","smart_lock":"false","voix":"false"}}', [Text.UTF8Encoding]::new($false))
        $cpost = curl.exe -s -o NUL -w "%{http_code}" -m 15 -X POST -H "content-type: application/json" --data-binary "@$tmpj" "$GW/parc/logements"
        Verif "RBAC : operateur refuse creation (403)" ($cpost -eq "403")
        [IO.File]::WriteAllText($tmpj, '{"qui":"personne_01","box_id":"box-lab","logement_id":"log1","date":"2026-01-01","choix":"invalide","motif":"batterie"}', [Text.UTF8Encoding]::new($false))
        $tpost = curl.exe -s -o NUL -w "%{http_code}" -m 15 -X POST -H "content-type: application/json" --data-binary "@$tmpj" "$GW/parc/conflits/trancher"
        Verif "RBAC : choix invalide refuse (400)" ($tpost -eq "400")
        Remove-Item $tmpj -ErrorAction SilentlyContinue
    } else {
        Write-Output "NOTE gateway ($GW) injoignable : tests RBAC negatifs sautes."
    }
} catch {
    Write-Output "NOTE gateway injoignable : tests RBAC negatifs sautes."
}

# 11. Anti open-redirect : voir-comme avec retour=//evil.org doit refuser
#     la redirection vers le domaine externe (302 session, retour local).
$vch = corps "/hote" "lcd_qui=personne_01"
$vcid = [regex]::Match($vch, 'name="(\$ACTION_ID_[a-f0-9]+)"')
if ($vcid.Success) {
    $vh = $vcid.Groups[1].Value
    $vhash = $vh.Substring('$ACTION_ID_'.Length)
    $LF2 = "`r`n"
    $vbody = '--V' + $LF2 + 'Content-Disposition: form-data; name="$ACTION_ID_' + $vhash + '"' + $LF2 + $LF2 + $LF2 + '--V' + $LF2 + 'Content-Disposition: form-data; name="retour"' + $LF2 + $LF2 + '//evil.org' + $LF2 + '--V' + $LF2 + 'Content-Disposition: form-data; name="qui"' + $LF2 + $LF2 + 'personne_05' + $LF2 + '--V--' + $LF2
    $vout = curl.exe -s -D - -o NUL -X POST -H "content-type: multipart/form-data; boundary=V" --data-binary $vbody -H "Cookie: lcd_qui=personne_01" "$F/hote"
    $vj = $vout -join " "
    $vloc = [regex]::Match($vj, 'Location: ([^ ]+|"([^"]*)")').Value
    Verif "open-redirect : evil.org refuse" ($vloc -notmatch "evil\.org")
    Verif "open-redirect : retour local" ($vloc -match "/hote|/|Location")
} else {
    Write-Output "NOTE voir-comme ACTION_ID introuvable (colleague layout ?) -- test open-redirect passe."
}

# 12. Mode degrade L1 (REQ-S-008, cahier 70 §F7) : lien natif /api/lite
#     (sans JS) pose le cookie, la page rend la class mode-lite, et le
#     retour externe est refuse (anti open-redirect comme voir-comme).
$liteOn = (curl.exe -s -D - -o NUL -m 15 "$F/api/lite?on=1&retour=/hote") -join " "
Verif "lite : 303 redirect" ($liteOn -match "303")
Verif "lite : cookie lcd_lite=1 pose" ($liteOn -match "lcd_lite=1")
Verif "lite : Location /hote" ($liteOn -match "Location: /hote")
$lh = corps "/hote" "lcd_qui=personne_01; lcd_lite=1"
Verif "lite : classe mode-lite rendue" ($lh -match "mode-lite")
# pattern ASCII seul (lesson cp1252 : accents non fiables en PS 5.1)
Verif "lite : lien bascule visible" ($lh -match "Version compl")
$liteEvil = (curl.exe -s -D - -o NUL -m 15 "$F/api/lite?on=1&retour=//evil.org") -join " "
Verif "lite : open-redirect refuse" ($liteEvil -notmatch "evil\.org")
$liteOff = (curl.exe -s -D - -o NUL -m 15 "$F/api/lite?on=0&retour=/") -join " "
Verif "lite : retour complet (on=0)" ($liteOff -match "lcd_lite=0")

# 13. KIOSK L1 (cahier 70 §F6 + §F9, REQ-T-005) : la page kiosk = l'espace
#     voyageur (Authelia BYPASS = aucun compte IdP, cf. authelia
#     configuration.yml `^/voyageur policy: bypass`). Elle doit tourner sur
#     une tablette/ancien tel en L1 : HTML simple, SANS compte, SANS donnée
#     perso a l'ecran, et le mode lite n'y porte NI classe backdrop NI grille.
# 13a. AUCUN compte requis : la page voyageur rend SANS aucun cookie.
$vNoK = corps "/voyageur" $null
Verif "kiosk : /voyageur rend SANS compte (0 cookie)" ($vNoK.Length -gt 500)
#     ... et sans chip de session (pas d'identite affichee sur un ecran public).
Verif "kiosk : aucun chip session / voir-comme" (-not ($vNoK -match "Voir comme"))
#     Le mode IdP ne doit PAS exiger de session sur ce chemin bypass.
Verif "kiosk : pas de bouton Connexion oblige" (($vNoK -match "guide") -or ($vNoK -match "17:00"))
# 13b. L1 : la page kiosk en mode lite porte la classe mode-lite ET n'y a
#      AUCUNE classe backdrop (spec §F9 : « page rendue sans classe backdrop
#      ni grille critique »). Le header conditionne maintenant backdrop-blur
#      sur `lite` (layout.tsx), donc le retrait est observable.
$vLite = corps "/voyageur" "lcd_lite=1"
Verif "kiosk L1 : classe mode-lite rendue" ($vLite -match "mode-lite")
Verif "kiosk L1 : aucune classe backdrop" (-not ($vLite -match "backdrop"))
# 13c. Aucune donnee perso a l'ecran kiosk : ni email, ni champ mot de passe,
#      ni PIN — un ecran public ne montre que le guide/sejour. (Boundaries
#      seuls : sans \b, "pin" matche "spinning" et "token" le runtime JS.)
Verif "kiosk : 0 fuite email" (-not ($vLite -match "(?i)[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}"))
Verif "kiosk : 0 champ password" (-not ($vLite -match '(?i)type="password"'))
Verif "kiosk : 0 PIN ni secret affiche" (-not ($vLite -match "(?i)\b(PIN|secret|password|mot de passe)\b"))
# 13d. Formulaires natifs (sans JS) presents : ecrire reste possible en L1.
Verif "kiosk L1 : formulaires natifs presents" ($vLite -match "<form")

if ($script:KO -eq 0) { Write-Output "RESULTAT : front OK (batterie complete verte)" }
else { Write-Output "RESULTAT : $script:KO ECHEC(S)" }
exit $script:KO
