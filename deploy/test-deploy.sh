#!/bin/sh
# deploy/test-deploy.sh — jumeau sh de test-deploy.ps1 (7 checks).
# Usage : cd deploy && docker compose up -d --build && sh test-deploy.sh
KO=0
check() {
  if [ "$2" = "1" ]; then echo "[OK] $1"; else echo "[KO] $1 $3"; KO=$((KO+1)); fi
}
get_tls() {
  curl -s -k -m 20 --resolve "$1:$2:127.0.0.1" -D /tmp/deploy-hdrs.txt -o /tmp/deploy-body.txt "https://$1:$2$3" 2>/dev/null
}
get_tls lcd.test 4001 "/"
B1=$(cat /tmp/deploy-body.txt 2>/dev/null); H1=$(cat /tmp/deploy-hdrs.txt 2>/dev/null)
case "$B1" in *Pilotage*|*Relev*|*Voyageur*|*LCD*|*injoignable*) check "front : page pilotage 200 (SSR)" 1;; *) check "front : page pilotage 200 (SSR)" 0;; esac
get_tls lcd.test 4001 "/api/health"
B2=$(cat /tmp/deploy-body.txt 2>/dev/null)
case "$B2" in *'"ok": true'*|*'"ok":true'*) check "gateway via Caddy : /api/health = ok" 1;; *) check "gateway via Caddy : /api/health = ok" 0 "$(echo "$B2" | head -c 120)";; esac
get_tls lcd.test 4001 "/api/v1/statut"
B3=$(cat /tmp/deploy-body.txt 2>/dev/null)
case "$B3" in *phase_conseillee*) check "gateway via Caddy : /api/v1/statut = phase" 1;; *) check "gateway via Caddy : /api/v1/statut = phase" 0 "$(echo "$B3" | head -c 120)";; esac
get_tls lcd.test 4001 "/proprio?logement=log1&qui=personne_05"
B4=$(cat /tmp/deploy-body.txt 2>/dev/null)
case "$B4" in *Relev*|*releve*|*injoignable*) check "front : /proprio (releve mandat) 200" 1;; *) check "front : /proprio (releve mandat) 200" 0;; esac
get_tls lcd.test 4001 "/voyageur"
B5=$(cat /tmp/deploy-body.txt 2>/dev/null)
case "$B5" in *Voyageur*|*voyageur*|*injoignable*) check "front : /voyageur 200" 1;; *) check "front : /voyageur 200" 0;; esac
case "$H1" in *"Strict-Transport-Security"*) case "$H1" in *"nosniff"*) check "headers HSTS + nosniff" 1;; *) check "headers HSTS + nosniff" 0;; esac;; *) check "headers HSTS + nosniff" 0;; esac
TOUT="$B1$B2$B3"
FUITE=""
for s in '"pin"' '"secret"' '"token"' '"password"' '"api_key"' 'LCD_HA_'; do
  case "$TOUT" in *"$s"*) FUITE="$FUITE $s";; esac
done
if [ -z "$FUITE" ]; then check "0 fuite secret sur reponses" 1; else check "0 fuite secret sur reponses" 0 "$FUITE"; fi
if [ "$KO" -gt 0 ]; then echo "RESULTAT : $KO ECHEC(S)"; exit 1; fi
echo "RESULTAT : stack self-hosted OK (front + Caddy + gateway lab)"
