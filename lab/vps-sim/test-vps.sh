#!/bin/sh
# lab/vps-sim/test-vps.sh — test du faux VPS (jumeau sh de test-vps.ps1).
# Suppose le compose vps-sim DÉMARRÉ. Vérifie : health TLS, /v1/statut,
# /metrics, POST relayé, socle fermé, headers HSTS+nosniff, 0 secret.
# Résolution via --resolve (pas de hosts). TLS -k (CA interne de sim).
set -e
cd "$(dirname "$0")"
KO=0
check() {
  if [ "$2" = "1" ]; then echo "[OK] $1"; else echo "[KO] $1 $3"; KO=$((KO+1)); fi
}
get_tls() {
  curl -s -k -m 15 --resolve "$1:$2:127.0.0.1" -D - -o /tmp/vps-sim-body.json "https://$1:$2$3" 2>/dev/null
}
post_tls() {
  code=$(curl -s -k -m 20 --resolve "$1:$2:127.0.0.1" -o /tmp/vps-sim-post.json -w "%{http_code}" -X POST -H "content-type: application/json" -d "$4" "https://$1:$2$3")
  echo "$code"
}
H1=$(get_tls parc.test 4433 /health)
B1=$(cat /tmp/vps-sim-body.json 2>/dev/null)
case "$B1" in *'"ok": true'*|*'"ok":true'*) check "parc.test:4433/health = 200" 1;; *) check "parc.test:4433/health = 200" 0 "$B1";; esac
H2=$(get_tls api.test 4443 /v1/statut)
B2=$(cat /tmp/vps-sim-body.json 2>/dev/null)
case "$B2" in *'"phase_conseillee"'*) check "api.test:4443/v1/statut = 200 + phase" 1;; *) check "api.test:4443/v1/statut = 200 + phase" 0 "$B2";; esac
H3=$(get_tls api.test 4443 /metrics)
B3=$(cat /tmp/vps-sim-body.json 2>/dev/null)
case "$B3" in *'"lecture_seule": true'*|*'"lecture_seule":true'*) check "api.test:4443/metrics lecture seule" 1;; *) check "api.test:4443/metrics lecture seule" 0 "$B3";; esac
C4=$(post_tls api.test 4443 /v1/action '{"box_id":"box-sim","logement_id":"log1","action":"prix","qui":"personne_01","ref":"SIM-1","champs":{"logement_id":"log1","date":"2027-03-04","prix":120}}')
case "$C4" in 200|400|409) check "POST /v1/action via api = metier (200/400/409)" 1;; *) check "POST /v1/action via api = metier (200/400/409)" 0 "HTTP $C4";; esac
PUBS=$(docker ps --format "{{.Names}} {{.Ports}}" 2>/dev/null | grep "^lcd-vps-sim-" | grep "0\.0\.0\.0:" | grep -v "4433->443" | grep -v "4443->443" || true)
if [ -z "$PUBS" ]; then check "sim : seul Caddy publie (4433+4443), socle en expose seul" 1; else check "sim : seul Caddy publie (4433+4443), socle en expose seul" 0 "$PUBS"; fi
H6=$(get_tls parc.test 4433 /health)
case "$H6" in *"Strict-Transport-Security"*) case "$H6" in *"nosniff"*) check "headers HSTS + nosniff" 1;; *) check "headers HSTS + nosniff" 0;; esac;; *) check "headers HSTS + nosniff" 0;; esac
TOUT="$(cat /tmp/vps-sim-body.json 2>/dev/null)$(cat /tmp/vps-sim-post.json 2>/dev/null)"
FUITE=""
for s in '"pin"' '"secret"' '"token"' '"password"' '"api_key"' 'LCD_HA_'; do
  case "$TOUT" in *"$s"*) FUITE="$FUITE $s";; esac
done
if [ -z "$FUITE" ]; then check "0 fuite secret sur reponses sim" 1; else check "0 fuite secret sur reponses sim" 0 "$FUITE"; fi
if [ "$KO" -gt 0 ]; then echo "RESULTAT : $KO ECHEC(S)"; exit 1; fi
echo "RESULTAT : faux VPS OK (TLS + 2 origines + allowlist + socle ferme)"
