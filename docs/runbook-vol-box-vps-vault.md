# Runbook — vol box / compromission VPS / perte vault (G4, §16.4)

Vol box : révoquer `agent-<box>` + `rotate wg`, la box devient injoignable
(écritures désactivées, lecture dégradée `?`, jamais d'invention). Neuve box
= `agent-box --enroll` + `boxes.yaml` + `deploy-vps.sh wg-key`.

Compromission VPS : couper WG hub, cold standby (snapshot chiffré, RTO 2h,
procédure DNS), CRL publiée, rotation `X-LCD-Box` (90j) + mTLS `step-ca`
(1 an). Boxes autonomes : moteurs locaux + outbox, rien jeté.

Perte vault : escrow 2 enveloppes (super_admin + admin scellées). Perte
super_admin = perte backups (procédure assumée §16.1). `rotate` sans
redéploiement box, tout tracé.
