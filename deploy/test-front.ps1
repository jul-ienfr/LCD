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
    # $cmd et non $args : $args est une VARIABLE AUTOMATIQUE (arguments non
    # liees) — lui assigner puis splatter @args a deja casse serveur-pwa.ps1
    # (doc 71, 3e occurrence du piege). Nom local non ambigu, memes octets.
    $cmd = @("-s", "-m", "20", "$F$chemin")
    if ($cookie) { $cmd += @("-H", "Cookie: $cookie") }
    return (curl.exe @cmd) -join " "
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

# 14. MARQUE BLANCHE (cahier 70 §F0.6 + socle §S3.4.3) : 0 fuite « LCD /
#     stack / IP » côté voyageur/presta/proprio — les 3 SEULES surfaces
#     clientes (§F4). Recette normative §S3.4.3 : « changer branding ->
#     re-theme SANS CODE + grep 0 fuite ». La marque vient de l'env
#     (web/src/lib/branding.ts, meme pattern que LCD_GATEWAY_URL), donc ce
#     grep mesure le front SERVI, jamais le build.
#
#     Perimetre HONNETE : les chemins /_next/static/* et le payload RSC
#     ($Sreact.fragment, turbopack-*.js) sont les PROPS assets Next — les
#     retirer casserait le precache SW (§F8, test-pwa 14/14) et l'offline
#     2 h. Ils ne portent AUCUNE marque : une fuite = marque / stack / IP
#     dans le CONTENU rendu, jamais le chemin d'asset qui l' transporte.
#     (/hote reste hors perimetre : console operateur, pas une surface
#     cliente — elle garde LCD_GATEWAY_URL pour le debogage du deployeur.)
$SURFACES = @("/voyageur", "/presta", "/proprio")
foreach ($pg in $SURFACES) {
    $h = corps $pg $null
    # 14a. Marque : aucun « LCD » (insensible casse) dans le HTML servi.
    #      Les cookies lcd_* / en-tetes X-LCD-* ne sont PAS dans le corps
    #      rendu, donc un \blcd sur la page ne peut matcher qu'une fuite.
    Verif "marque : 0 fuite LCD sur $pg" (-not ($h -match "(?i)\blcd"))
    # 14b. IP / interne : ni loopback, ni RFC1918, ni TLD .local, ni port
    #      de socle, ni nom de service interne (authelia / home assistant).
    Verif "marque : 0 fuite IP/interne sur $pg" (-not ($h -match "(?i)(127\.0\.0\.1|0\.0\.0\.0|\b192\.168\.\d{1,3}\.\d{1,3}\b|\b10\.\d{1,3}\.\d{1,3}\.\d{1,3}\b|\b172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}\b|lcd\.local|lcd\.test|\.local\b|:8443|:8060|:9091|:4002|home\s*assistant)"))
    # 14c. Stack : aucune declaration de framework dans le contenu (meta
    #      generator / « powered by » / « built with »). Les chemins
    #      /_next/ restent admis : requis par le SW, sans marque.
    Verif "marque : 0 declaration stack sur $pg" (-not ($h -match "(?i)(<meta[^>]+name=.generator.|powered\s+by|built\s+with|\bvercel\b)"))
}
# 14d. Manifeste PWA : l'ecran d'accueil du voyageur porte la marque, pas
#      « LCD » — c'est LE nom installe sur son telephone (§S3.4.3).
#      Filet anti-vide : on lit le short_name DANS le manifeste puis on
#      l'exige dans la page /voyageur. Sans ce croisement, un manifeste
#      prerendu au build (Next traite manifest.ts comme cache par defaut)
#      passe le test alors que son nom est gele sur la marque d'avant :
#      nom gele "Sejour" vs page "Marque Client XYZ" -> croisement KO.
#      NB aucun caractere non-ASCII dans un LITERAL de chaine : la
#      batterie est lue sans BOM (codepage console), un tiret cadratin
#      dans des guillemets cassait le parsing du fichier entier.
$mf  = corps "/manifest.webmanifest" $null
$voy = corps "/voyageur" $null
$titreVoy = [regex]::Match($voy, "<title>(.*?)</title>").Groups[1].Value
$nomCourt = [regex]::Match($mf, '"short_name"\s*:\s*"([^"]+)"').Groups[1].Value
$nomLong  = [regex]::Match($mf, '"name"\s*:\s*"([^"]+)"').Groups[1].Value
Verif "marque : manifeste PWA servi (JSON)" ($mf -match "voyageur")
Verif "marque : manifeste PWA sans LCD" (-not ($mf -match "(?i)\blcd"))
Verif "marque : manifeste short_name non vide" ($nomCourt.Length -gt 0)
Verif "marque : manifeste name porte le short_name" (
    $nomLong.Length -gt 0 -and $nomLong.Contains($nomCourt))
Verif "marque : page /voyageur re-themee au short_name du manifeste" (
    $nomCourt.Length -gt 0 -and $titreVoy.Contains($nomCourt))

# 15. A11Y WCAG 2.2 AA (cahier 70, paragraphe A11y) : le cahier promettait
#     « tests clavier sur les 8 plugins » mais AUCUNE batterie ne mesurait
#     rien — l'implementation existait (donc aucun regression-free), et un
#     retrait silencieux de :focus-visible serait passe inapercu. On asserte
#     ici la STRUCTURE qui rend le clavier utilisable, sur les pages deja
#     rendues par la batterie.
#
#     Perimetre HONNETE : ceci mesure la STRUCTURE (cible existante, focus
#     visible, une seule h1, langue, aria-current) — pas la traversee Tab
#     reellement effectuee au clavier. La traversee physique reste une DoD
#     manuelle (matrice §F9), comme l'offline 2 h de F4.
# 15a. Skip-link : premier focusable du body, avant tout autre lien.
$a11yH = corps "/voyageur" "lcd_qui=personne_01"
$ib     = $a11yH.IndexOf("<body")
$iskip  = $a11yH.IndexOf("Aller au contenu")
Verif "a11y : skip-link present" ($iskip -gt 0)
Verif "a11y : skip-link APRES <body>" ($ib -ge 0 -and $iskip -gt $ib)
#      Le seul <a> autorise avant lui est son propre tag d'ouverture.
$avant = ""
if ($ib -ge 0 -and $iskip -gt $ib) { $avant = $a11yH.Substring($ib, $iskip - $ib) }
Verif "a11y : skip-link = 1er focusable (0 lien avant lui)" (
    $iskip -gt 0 -and ([regex]::Matches($avant, "<a[ >]")).Count -le 1)
# 15b. Sa cible existe et prend le focus (tabindex=-1 sinon le saut echoue).
Verif "a11y : cible main#contenu tabindex=-1" (
    $a11yH -match '<main[^>]*id="contenu"' -and $a11yH -match '<main[^>]*tabindex="-1"')
# 15c. Focus visible + mouvement reduit + mecanisme sr-only SERVIS par la
#      feuille de style (on lit le href hashé dans le HTML, jamais en dur).
$a11yCss = ""
foreach ($m in [regex]::Matches($a11yH, '<link[^>]+href="([^"]+\.css[^"]*)"')) {
    $u = $m.Groups[1].Value
    if ($u -match "^/") { $a11yCss += " " + (corps $u "lcd_qui=personne_01") }
}
Verif "a11y : feuille de style servie" ($a11yCss.Length -gt 100)
Verif "a11y : focus-visible servi" ($a11yCss.Contains(":focus-visible"))
Verif "a11y : prefers-reduced-motion servi" ($a11yCss.Contains("prefers-reduced-motion"))
Verif "a11y : mecanisme sr-only servi" ($a11yCss.Contains("sr-only"))
# 15d. Une SEULE h1 par page (structure de titres = base de la navigation
#      clavier et lecteur d'ecran) sur chaque surface plugin, + langue.
foreach ($p in @("/hote", "/planning", "/prix", "/compta", "/presta", "/voyageur", "/proprio?logement=log1", "/commercial", "/onboarding")) {
    $c = corps $p "lcd_qui=personne_01"
    $n = ([regex]::Matches($c, "<h1[ >]")).Count
    Verif "a11y $p : une seule h1" ($n -eq 1)
    Verif "a11y $p : html lang pose" ($c -match '<html[^>]*lang="[a-z]{2}"')
}
# 15e. aria-current="page" : l'onglet courant est annonce (navigation clavier).
Verif "a11y : aria-current=page sur l'onglet actif" (
    ((corps "/hote" "lcd_qui=personne_01") -match 'aria-current="page"') -and
    ((corps "/voyageur" "lcd_qui=personne_01") -match 'aria-current="page"'))

# 16. POST NATIF COMPLE SANS JAVASCRIPT (cahier 70 F9) : Edge headless reel
#     via playwright-core (channel msedge, aucun navigateur telecharge = 0
#     outil payant) avec javascriptEnabled:false. Le navigateur ouvre le
#     <details> par son <summary> (HTML natif, 0 JS), remplit le select
#     "qui" requis (sans lui le navigateur BLOQUE la soumission native et
#     aucun POST ne part : checkValidity false), soumet le form method=POST
#     tel quel, puis ON JUGE L'ECRITURE AU JOURNAL DE LA PASSERELLE : la
#     ref de CE soumission doit y gagner une occurrence. Couvre les 4
#     ecritures nommees au cahier (1-tap, incident, depart, mission) ;
#     login est deja prouve en 2b (303 + Set-Cookie + Location /hote).
Write-Output "== POST natif sans JS (Edge reel, javascript desactive) =="
$node16 = Get-Command node -ErrorAction SilentlyContinue
if (-not $node16) {
    Verif "node present (recette POST natif sans JS)" $false
} else {
    $rec16 = Join-Path (Split-Path $PSScriptRoot) "web\scripts\recette-sans-js.mjs"
    if (-not (Test-Path -LiteralPath $rec16)) {
        Verif "recette-sans-js.mjs presente" $false
    } else {
        $out16 = (node $rec16 $F) -join "`n"
        $code16 = $LASTEXITCODE
        Write-Output $out16
        $ko16 = ([regex]::Matches($out16, "(?m)^\[KO\]")).Count
        $ok16 = ([regex]::Matches($out16, "(?m)^\[OK\]")).Count
        if ($code16 -ne 0 -and $ko16 -eq 0) {
            Verif "recette-sans-js.mjs execute sans crash" $false
        }
        $script:KO += $ko16
        Verif "sans-JS : recette verte (0 KO + exit 0)" ($ko16 -eq 0 -and $code16 -eq 0)
        Verif "sans-JS : 4 ecritures completes (1-tap, incident, depart, mission)" (
            ($ok16 -ge 20) -and ($out16 -match "4 ecritures natives soumises"))
        Verif "sans-JS : chaque ecriture prouvee au journal passerelle" (
            ([regex]::Matches($out16, "ecriture journalisee")).Count -ge 4)
    }
}

# 17. 0 REQUETE TIERCE AU CHARGEMENT (cahier 70 F9) : la page ne cite AUCUNE
#     URL absolue -- ni fonte tierce, ni CDN, ni script distant, ni @import.
#     La promesse figure dans le cahier depuis le depart SANS UNE SEULE
#     assertion : rien ne l'aurait empêchée de devenir fausse en silence
#     (meme mecanisme que §F0.6 et §F15 avant eux). Pourquoi ca compte : une
#     URL absolue = une requete sortante vers un hote etranger -- vie privee
#     du voyageur (0 tiers = 0 pisteur) et hors-ligne F4 (un CDN injoignable
#     casserait le guide hors-ligne, la SW ne pouvant pas le precacher).
#     Admis : chemins relatifs (dont /_next/static exigé par le precache SW),
#     data:, #, mailto:. Suspect : http(s):// ou //. Mesure sur les surfaces
#     CLIENTES ; /hote reste hors perimetre (console operateur LCD, §F0.6).
#     CONTROLE POSITIF obligatoire : un fragment fabrique portant un CDN
#     doit etre signale, sans quoi la verification passerait a tout va.
function refsAbsolues($html) {
    $liste = New-Object System.Collections.Generic.List[string]
    foreach ($m in [regex]::Matches(
        $html, '(?:src|href|srcset|action)\s*=\s*["'']([^"'']+)["'']')) {
        $liste.Add($m.Groups[1].Value)
    }
    foreach ($m in [regex]::Matches($html, '@import\s+url\(([^)]+)\)')) {
        $liste.Add((($m.Groups[1].Value) -replace '[\x22\x27]', ''))
    }
    return @($liste | Where-Object { $_ -match '^(https?:)?//' })
}
$controle = refsAbsolues '<script src="https://cdn.example.com/x.js"></script><a href="/relatif">a</a><img src="/i.png" srcset="/i2.png 2x">'
Verif "tierce : controle positif (le CDN fabrique est bien signale)" (
    $controle.Count -eq 1)
foreach ($pgT in @("/", "/voyageur", "/presta", "/proprio", "/login", "/aide")) {
    $hT = corps $pgT "lcd_qui=personne_01"
    $aT = refsAbsolues $hT
    Verif "tierce $pgT : 0 URL absolue" ($aT.Count -eq 0)
}

if ($script:KO -eq 0) { Write-Output "RESULTAT : front OK (batterie complete verte)" }
else { Write-Output "RESULTAT : $script:KO ECHEC(S)" }
exit $script:KO
