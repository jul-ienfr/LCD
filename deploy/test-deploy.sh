#!/bin/sh
# deploy/test-deploy.sh — jumeau sh de test-deploy.ps1.
# Mode IdP (F3) : lcd.test:4001 est TOUJOURS derriere forward_auth.
#   - anonyme : 302 portail (fail-closed) sur pages/ecritures protegees,
#     200 seulement sur les bypasss reels (/api/health, /voyageur) ;
#   - authentifie : chaine complete deleguee a test-idp.ps1 (DRY).
# Usage : cd deploy && docker compose up -d --build && sh test-deploy.sh
KO=0
check() {
  if [ "$2" = "1" ]; then echo "[OK] $1"; else echo "[KO] $1 $3"; KO=$((KO+1)); fi
}
# Code HTTP reel + entetes + corps (curl --resolve, TLS interne -k).
get_tls() {
  CODE=$(curl -s -k -m 20 --resolve "$1:$2:127.0.0.1" \
    -D /tmp/deploy-hdrs.txt -o /tmp/deploy-body.txt \
    -w "%{http_code}" "https://$1:$2$3" 2>/dev/null)
}
get_tls lcd.test 4001 "/"
H1=$(cat /tmp/deploy-hdrs.txt 2>/dev/null)
if [ "$CODE" = "302" ]; then
  case "$H1" in *lcd.test:4002*) check "anonyme / -> 302 portail (fail-closed)" 1;;
    *) check "anonyme / -> 302 portail (fail-closed)" 0 "Location absente";; esac
else
  check "anonyme / -> 302 portail (fail-closed)" 0 "code=$CODE"
fi

get_tls lcd.test 4001 "/api/v1/statut"
if [ "$CODE" = "302" ]; then check "anonyme /api/v1/statut -> 302 (moteur ferme)" 1
else check "anonyme /api/v1/statut -> 302 (moteur ferme)" 0 "code=$CODE"; fi

get_tls lcd.test 4001 "/proprio?logement=log1&qui=personne_05"
if [ "$CODE" = "302" ]; then check "anonyme /proprio -> 302 (derriere IdP)" 1
else check "anonyme /proprio -> 302 (derriere IdP)" 0 "code=$CODE"; fi

get_tls lcd.test 4001 "/api/health"
B2=$(cat /tmp/deploy-body.txt 2>/dev/null)
case "$B2" in *'"ok": true'*|*'"ok":true'*) check "bypass /api/health = 200 ok" 1;;
  *) check "bypass /api/health = 200 ok" 0 "$(echo "$B2" | head -c 120)";; esac

get_tls lcd.test 4001 "/voyageur"
B5=$(cat /tmp/deploy-body.txt 2>/dev/null)
H5=$(cat /tmp/deploy-hdrs.txt 2>/dev/null)
case "$B5" in *Voyageur*|*voyageur*|*injoignable*) check "bypass /voyageur = 200 (sans session)" 1;;
  *) check "bypass /voyageur = 200 (sans session)" 0;; esac

# HSTS + nosniff sur la reponse 200 (bypass voyageur = entetes du site TLS).
case "$H5" in *"Strict-Transport-Security"*) case "$H5" in *"nosniff"*) check "headers HSTS + nosniff" 1;; *) check "headers HSTS + nosniff" 0;; esac;; *) check "headers HSTS + nosniff" 0;; esac

TOUT="$B5$B2"
FUITE=""
for s in '"pin"' '"secret"' '"token"' '"password"' '"api_key"' 'LCD_HA_'; do
  case "$TOUT" in *"$s"*) FUITE="$FUITE $s";; esac
done
if [ -z "$FUITE" ]; then check "0 fuite secret sur reponses" 1; else check "0 fuite secret sur reponses" 0 "$FUITE"; fi

# Chaine authentifiee (1FA/2FA/revocation/logout) : meme recette que le twin
# ps1 — une seule source de verite pour les assertions avec session.
if [ "$KO" -eq 0 ]; then
  if command -v powershell.exe >/dev/null 2>&1; then
    powershell.exe -NoProfile -ExecutionPolicy Bypass \
      -File "$(dirname "$0")/test-idp.ps1" || KO=$((KO+1))
  else
    check "test-idp.ps1 execute (powershell absent = preuve absente)" 0
  fi
else
  check "test-idp.ps1 saute (prerequis anonyme en echec)" 0
fi

if [ "$KO" -gt 0 ]; then echo "RESULTAT : $KO ECHEC(S)"; exit 1; fi
echo "RESULTAT : stack self-hosted OK (IdP + Caddy + gateway lab + recette)"
