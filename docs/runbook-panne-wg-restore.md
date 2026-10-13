# Runbook — panne WG / restore backup (G4, §16.4)

Panne WG : `wg show` (handshake < 2 min), `PersistentKeepalive 25s`,
`systemctl restart wg-quick@wg0`, sonde `/ready` (last_seen par box).
Coupure = outbox qui grandit (cap 500, reporting évincé d'abord, financier
jamais), rejeu idempotent au retour, split-brain affiché + humain tranche.

Restore backup : snapshot chiffré `age` + escrow, RTO 2h, test semestriel.
Restaurer `parc-registre/` depuis `*.modele.yaml` + snapshots horodatés
(`tmp+os.replace`, rollback 1 commande). Vérifier `GET /ready`, `digest`,
`0 fuite` (§59/§65). Disque plein = refus propre, jamais JSON tronqué.
