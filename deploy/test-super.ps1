# Batterie F5 — V5/V6 §S3.5 : dash-super/dash-admin (secrets + systeme + journal).
# Preuve « secrets jamais simulés » + « 403 admin secrets » + rendus front.
#   $env:FRONT = URL front (defaut http://127.0.0.1:3100)
#   $env:GW    = URL gateway (defaut http://127.0.0.1:8443)
# Exit code = nombre d'echecs (0 = tout vert). ASCII strict (lessons cp1252).
$ErrorActionPreference = "Continue"
$F = if ($env:FRONT) { $env:FRONT.TrimEnd("/") } else { "http://127.0.0.1:3100" }
$GW = if ($env:GW) { $env:GW.TrimEnd("/") } else { "http://127.0.0.1:8443" }
$script:KO = 0
function Verif($label, $ok) {
    if ($ok) { Write-Output "[OK] $label" }
    else { Write-Output "[KO] $label"; $script:KO += 1 }
}
function corps($chemin, $cookie) {
    $a = @("-s", "-m", "20", "$F$chemin")
    if ($cookie) { $a += @("-H", "Cookie: $cookie") }
    return (curl.exe @a) -join " "
}
function gwjson($chemin) {
    return (curl.exe -s -m 15 "$GW$chemin") -join " "
}
# Motifs de fuite : une valeur de secret ne doit JAMAIS apparaitre (§S3.5-V5).
$FUITE = @('"pin"', '"token"', '"password"', '"api_key"', 'LCD_HA_', '$2a$', 'base32_secret')

# ---- V5 : /v1/secrets super seul, JAMAIS de valeur -------------------------
$health = gwjson "/health"
if ($health -match "ok") {
    $s1 = gwjson "/v1/secrets?qui=personne_01"
    # `total` variable : le registre reel (gitignore, doctrine 71 S2) ou
    # l'EXAMPLE versionne — on prouve la STRUCTURE, pas un compte exact.
    Verif "V5 : secrets super_admin 200 + slots" (($s1 -match '"slots"') -and ($s1 -match '"total": [1-9]'))
    Verif "V5 : valeurs_incluses=false annonce" ($s1 -match '"valeurs_incluses": false')
    Verif "V5 : source en reference env/vault (pas de valeur)" ($s1 -match '"source": "(env|vault):')
    # ZECHEC si une valeur fuit dans la reponse.
    # NOTE : -match avec [regex]::Escape inline = piege de precedance PowerShell
    # (faux positif prouve) ; .Contains() ordinal est non-ambigu.
    $fuite = $false
    foreach ($m in $FUITE) { if ($s1.Contains($m)) { $fuite = $true } }
    Verif "V5 : 0 fuite de secret sur /v1/secrets" (-not $fuite)

    # ---- V6 : 403 admin (et non-super) sur secrets + rotation --------------
    $s2 = curl.exe -s -m 15 -o NUL -w "%{http_code}" "$GW/v1/secrets?qui=personne_02"
    Verif "V6 : 403 admin sur /v1/secrets" ($s2 -eq "403")
    $s3 = curl.exe -s -m 15 -o NUL -w "%{http_code}" "$GW/v1/secrets?qui=personne_03"
    Verif "V6 : 403 operateur sur /v1/secrets" ($s3 -eq "403")
    $s4 = curl.exe -s -m 15 -o NUL -w "%{http_code}" "$GW/v1/secrets?qui=personne_05"
    Verif "V6 : 403 proprietaire sur /v1/secrets" ($s4 -eq "403")

    # Rotation : admin refuse (403), super accepte (200) SANS valeur.
    # Slot pris dans la reponse (le registre reel gitignore ou l'EXAMPLE).
    $slotTest = [regex]::Match($s1, '"id":\s*"([a-z0-9_]+)"').Groups[1].Value
    if (-not $slotTest) { $slotTest = "authelia_session_secret" }
    $tmpj = Join-Path $env:TEMP ("lcd-f5-" + [guid]::NewGuid().ToString("N") + ".json")
    [IO.File]::WriteAllText($tmpj, ('{"qui":"personne_02","slot":"' + $slotTest + '","date":"2026-10-21"}'), [Text.UTF8Encoding]::new($false))
    $r2 = curl.exe -s -m 15 -o NUL -w "%{http_code}" -X POST -H "content-type: application/json" --data-binary "@$tmpj" "$GW/v1/secrets/rotate"
    Verif "V6 : 403 admin sur rotation" ($r2 -eq "403")
    [IO.File]::WriteAllText($tmpj, ('{"qui":"personne_01","slot":"' + $slotTest + '","date":"2026-10-21"}'), [Text.UTF8Encoding]::new($false))
    $r1 = curl.exe -s -m 15 -X POST -H "content-type: application/json" --data-binary "@$tmpj" "$GW/v1/secrets/rotate"
    $r1s = $r1 -join " "
    Verif "V5 : rotation super 200 + tracee" (($r1s -match '"ok": true') -and ($r1s -match '"declare_par": "personne_01"'))
    Verif "V5 : rotation sans valeur communiquee" ($r1s -match '"valeur_communiquee": false')
    Remove-Item $tmpj -ErrorAction SilentlyContinue

    # ---- Journal : admin lit, comptable refuse (403) -----------------------
    $j1 = gwjson "/v1/journal?qui=personne_01&jours=90"
    Verif "V5 : journal admin 200 + entrees" ($j1 -match '"entrees"')
    $j2 = curl.exe -s -m 15 -o NUL -w "%{http_code}" "$GW/v1/journal?qui=personne_04"
    Verif "V6 : 403 comptable sur journal" ($j2 -eq "403")

    # ---- §P8 : tickets (file unique SLA) + messagerie 3 fils + recherche ---
    $tj = Join-Path $env:TEMP ("lcd-f5-t-" + [guid]::NewGuid().ToString("N") + ".json")
    [IO.File]::WriteAllText($tj, '{"qui":"personne_05","sujet":"Volet casse (batterie)","description":"Le volet ne ferme pas.","priorite":"P2","logement_id":"log1"}', [Text.UTF8Encoding]::new($false))
    $tc = (curl.exe -s -m 15 -X POST -H "content-type: application/json" --data-binary "@$tj" "$GW/v1/tickets") -join " "
    Verif "P8 : ticket cree (ref TICKET-, statut ouvert)" (($tc -match '"ref": "TICKET-') -and ($tc -match '"statut": "ouvert"'))
    $refT = [regex]::Match($tc, '"ref":\s*"(TICKET-[0-9]+-[0-9]+)"').Groups[1].Value
    # Cloisonnement : l'autre client ne voit PAS le ticket ; le staff si.
    $tl = gwjson "/v1/tickets?qui=personne_07"
    Verif "P8 : ticket cloisonne hors staff" (-not $tl.Contains($refT))
    $ts = gwjson "/v1/tickets?qui=personne_01"
    Verif "P8 : staff voit la file complete" ($ts.Contains($refT))
    # Cloture : client = 403, staff sans motif = 400, staff avec motif = 200.
    [IO.File]::WriteAllText($tj, ('{"qui":"personne_05","ref":"' + $refT + '","statut":"cloture","motif":"x"}'), [Text.UTF8Encoding]::new($false))
    $c1 = curl.exe -s -m 15 -o NUL -w "%{http_code}" -X POST -H "content-type: application/json" --data-binary "@$tj" "$GW/v1/tickets/statut"
    Verif "P8 : 403 clotaure non-staff" ($c1 -eq "403")
    [IO.File]::WriteAllText($tj, ('{"qui":"personne_01","ref":"' + $refT + '","statut":"cloture"}'), [Text.UTF8Encoding]::new($false))
    $c2 = curl.exe -s -m 15 -o NUL -w "%{http_code}" -X POST -H "content-type: application/json" --data-binary "@$tj" "$GW/v1/tickets/statut"
    Verif "P8 : 400 cloture sans motif" ($c2 -eq "400")
    [IO.File]::WriteAllText($tj, ('{"qui":"personne_01","ref":"' + $refT + '","statut":"cloture","motif":"repare en presence"}'), [Text.UTF8Encoding]::new($false))
    $c3 = (curl.exe -s -m 15 -X POST -H "content-type: application/json" --data-binary "@$tj" "$GW/v1/tickets/statut") -join " "
    Verif "P8 : cloture staff avec motif tracee" ($c3 -match '"motif_cloture": "repare en presence"')
    Remove-Item $tj -ErrorAction SilentlyContinue

    # Messagerie : 3 fils, ACL fail-closed (client hors auteur = 403), staff.
    $mj = Join-Path $env:TEMP ("lcd-f5-m-" + [guid]::NewGuid().ToString("N") + ".json")
    [IO.File]::WriteAllText($mj, '{"qui":"personne_05","type":"proprio","ref":"log1","texte":"Batterie : volet bloque."}', [Text.UTF8Encoding]::new($false))
    $m1 = (curl.exe -s -m 15 -X POST -H "content-type: application/json" --data-binary "@$mj" "$GW/v1/messagerie") -join " "
    Verif "P8 : fil proprio cree (auteur=client)" ($m1 -match '"fil_id": "proprio:log1"')
    [IO.File]::WriteAllText($mj, '{"qui":"personne_06","type":"proprio","ref":"log1","texte":"x"}', [Text.UTF8Encoding]::new($false))
    $m2 = curl.exe -s -m 15 -o NUL -w "%{http_code}" -X POST -H "content-type: application/json" --data-binary "@$mj" "$GW/v1/messagerie"
    Verif "P8 : 403 ecriture fil d un autre" ($m2 -eq "403")
    $m3 = curl.exe -s -m 15 -o NUL -w "%{http_code}" "$GW/v1/messagerie?qui=personne_06&fil_id=proprio:log1"
    Verif "P8 : 403 lecture fil d un autre (existence cachee)" ($m3 -eq "403")
    [IO.File]::WriteAllText($mj, '{"qui":"personne_03","type":"voyageur","ref":"RES-BATTERIE","texte":"Batterie : code porte."}', [Text.UTF8Encoding]::new($false))
    $m4 = (curl.exe -s -m 15 -X POST -H "content-type: application/json" --data-binary "@$mj" "$GW/v1/messagerie") -join " "
    Verif "P8 : fil voyageur cree par operateur" ($m4 -match '"fil_id": "voyageur:RES-BATTERIE"')
    $m5 = gwjson "/v1/messagerie?qui=personne_03"
    Verif "P8 : staff liste tous les fils" ($m5 -match '"total": [1-9]')
    $m6 = gwjson "/v1/messagerie?qui=personne_05"
    Verif "P8 : client ne voit que ses fils" (($m6 -match '"total": 1') -and (-not $m6.Contains("voyageur:")))
    Remove-Item $mj -ErrorAction SilentlyContinue

    # Recherche par ref (§P8) : connue = 200, inconnue = 404, non-admin = 403.
    $rq1 = gwjson ("/v1/recherche?qui=personne_01&ref=" + $refT)
    Verif "P8 : recherche ref connue = dossier" ($rq1.Contains($refT))
    $rq2 = curl.exe -s -m 15 -o NUL -w "%{http_code}" "$GW/v1/recherche?qui=personne_01&ref=TICKET-0000-9999"
    Verif "P8 : 404 ref inconnue" ($rq2 -eq "404")
    $rq3 = curl.exe -s -m 15 -o NUL -w "%{http_code}" ("$GW/v1/recherche?qui=personne_03&ref=" + $refT)
    Verif "P8 : 403 recherche non-admin" ($rq3 -eq "403")
} else {
    Write-Output "[KO] gateway ($GW) injoignable : tests V5/V6 sautes."
    $script:KO += 10
}

# ---- Front : les 4 pages rendent (session super) ---------------------------
$p1 = corps "/systeme" "lcd_qui=personne_01"
Verif "front /systeme rendu" ($p1.Length -gt 500)
$p2 = corps "/secrets" "lcd_qui=personne_01"
Verif "front /secrets rendu + slots" (($p2.Length -gt 500) -and ($p2 -match "authelia_session_secret"))
$p3 = corps "/journal" "lcd_qui=personne_01"
Verif "front /journal rendu" ($p3.Length -gt 500)
$p4 = corps "/supervision" "lcd_qui=personne_02"
Verif "front /supervision rendu (admin)" (($p4.Length -gt 500) -and ($p4 -match "Supervision"))
$p5 = corps "/support" "lcd_qui=personne_01"
Verif "front /support rendu (tickets + fils)" (($p5.Length -gt 500) -and ($p5 -match "Tickets") -and ($p5 -match "SLA"))

# ---- Front : /secrets n'affiche AUCUNE valeur (contains fuite sur le HTML) --
$fuiteFront = $false
foreach ($m in $FUITE) { if ($p2.Contains($m)) { $fuiteFront = $true } }
Verif "V5 : 0 fuite de secret sur /secrets (front)" (-not $fuiteFront)
Verif "V5 : /secrets dit 'metadonnees/vault'" ($p2 -match "m.tadonn|vault")

# ---- Design du site (super_admin, /systeme) : bascule SITE-WIDE, sans JS ----
# Le formulaire est un <form action> natif : on le poste comme le ferait un
# navigateur sans JavaScript (multipart + $ACTION_ID_*), et on constate que
# TOUTES les pages changent de palette en quelques secondes (data-design +
# jetons injectes), sans rebuild ni redemarrage.
$fichierDesign = Join-Path (Split-Path $PSScriptRoot -Parent) "custom\design.yaml"
$avantDesign = if (Test-Path -LiteralPath $fichierDesign) { [IO.File]::ReadAllText($fichierDesign) } else { "" }
function PosterDesign([string]$design) {
    $page = corps "/systeme" "lcd_qui=personne_01"
    $i = $page.IndexOf('id="design"')
    if ($i -lt 0) { return "" }
    $id = [regex]::Match($page.Substring($i), 'name="(\$ACTION_ID_[0-9a-f]+)"').Groups[1].Value
    if (-not $id) { return "" }
    return ((curl.exe -s -i -m 20 -H "Cookie: lcd_qui=personne_01" -H "Origin: $F" -F "$id=" -F "design=$design" "$F/systeme") -join " ")
}
try {
    $sd = corps "/systeme" "lcd_qui=personne_01"
    Verif "design : section presente sur /systeme" ($sd -match 'id="design"')
    Verif "design : 4 themes proposes" (([regex]::Matches($sd, 'name="design"')).Count -eq 4)
    Verif "design : actif pour super_admin (pas de fieldset desactive)" (-not ($sd -match '<fieldset disabled'))
    $sda = corps "/systeme" "lcd_qui=personne_02"
    Verif "design : refuse a l'admin (fieldset desactive)" ($sda -match '<fieldset disabled')

    # Bascule reelle : ocean, puis tentative d'id inconnu, puis retour.
    $rOcean = PosterDesign "ocean"
    Start-Sleep -Milliseconds 400
    Verif "design : bascule ocean acceptee (303 -> ?design=ocean)" (($rOcean -match 'HTTP/1\.1 303') -and ($rOcean -match 'design=ocean'))
    Verif "design : fichier runtime ecrit (design: ocean)" ((Test-Path -LiteralPath $fichierDesign) -and ((Get-Content -LiteralPath $fichierDesign -Raw) -match '(?m)^design:\s*ocean'))
    $hoteOcean = corps "/hote"
    Verif "design : tout le site bascule (data-design=ocean + accent ocean)" (($hoteOcean -match 'data-design="ocean"') -and ($hoteOcean -match '--accent:#1d4ed8'))
    Verif "design : barre navigateur/PWA suit le design (theme-color ocean)" ($hoteOcean -match 'content="#1d4ed8"')

    $rPirate = PosterDesign "pirate"
    Start-Sleep -Milliseconds 300
    Verif "design : id inconnu refuse (liste fermee, fichier inchange)" (($rPirate -match 'design=erreur') -and ((Get-Content -LiteralPath $fichierDesign -Raw) -match '(?m)^design:\s*ocean'))

    $rSejour = PosterDesign "sejour"
    Start-Sleep -Milliseconds 400
    $hoteSejour = corps "/hote"
    Verif "design : retour au defaut applique (accent sejour)" (($rSejour -match 'design=sejour') -and ($hoteSejour -match '--accent:#0e7c6b'))
    Verif "design : barre navigateur revenue au defaut (theme-color sejour)" ($hoteSejour -match 'content="#0e7c6b"')
} finally {
    # Toujours remettre le fichier dans l'etat trouve (meme si un KO survient).
    if ($avantDesign) { [IO.File]::WriteAllText($fichierDesign, $avantDesign, [Text.UTF8Encoding]::new($false)) }
}

if ($script:KO -eq 0) { Write-Output "RESULTAT : F5 V5/V6 OK (batterie complete verte)" }
else { Write-Output "RESULTAT : $script:KO ECHEC(S)" }
exit $script:KO
