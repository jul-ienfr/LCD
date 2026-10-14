# Registre — Risques (v2 plan-only)

| # | Risque | P×I | Mitigation | Owner | Échéance |
|---|---|---|---|---|---|
| R-01 | Double-réservation (ICS partagé / latence OTA) | H×H | ICS jamais partagé + pull 15min + stop-sell same-day + chevauchement = critique + blocage sortant (REQ-S-002) | opérateur | continu |
| R-02 | PIN/secrets en clair (log, commit, image docker) | H×H | 4 derniers seuls + `pin_transmis:bool` + `secrets.yaml`/vault jamais commités + recorder/logbook excludes (§S5) | super_admin | continu |
| R-03 | Copro non autorisée → mise en ligne illégale | M×H | `copro.verifiee:false = BLOQUÉE` + checklist `docs/logN/copro/` + accord syndic écrit (REQ-L-001) | super_admin | avant go-live |
| R-04 | Mandat tiers sans carte G | M×H | Bloquant P10-8 : carte G + GALIAN/SOCAF + RCP 2-3 mois avant 1er client | juriste | avant 1er client |
| R-05 | Split-brain prix box vs centrale | M×M | ADR-003 : LWW proposé 2 versions, humain tranche `qui+motif`, reconvergence 2ᵉ `/v1/action` (REQ-P-003) | opérateur | G4-b clos, surveillance |
| R-06 | Outbox saturée (>500) / box offline prolongé | M×M | Cap 500, alerte >50, replay idempotent `ref` 24h, digest retour, RPO 15min (REQ-P-001) | super_admin | continu |
| R-07 | Dépassement seuils P1→P2→P3 par surprise | M×M | Seuils uniques §S4 + revue mensuelle + `procedure-migration-p2-p3.md` | super_admin | mensuel |
| R-08 | Chargeback 180j sans dossier <7j | M×M | Dossier pré-assemblé + chargeback 1-tap (Should) + caution par canal tracée | comptable | par litige |
| R-09 | Contamination licence GPL (copier-coller HotelDruid/QloApps/Vik/ERPNext) | M×H | Inspiration fonctionnelle OK, copier-coller NON en repo privé/client ; MIT/Apache seul réutilisable tel quel (benchmark OSS) | super_admin | avant toute reprise |
| R-10 | Fuite token / vol box-VPS-vault | M×H | `runbook-fuite-token.md` + `runbook-vol-box-vps-vault.md` + rotation 90j `X-LCD-Box` + révocation `acces.yaml` | super_admin | drill avant G3 |
| R-11 | Bac-a-sable contamine par donnees reelles (PII/secrets/commits) | MxH | Faux jeu LAB marque seul + secrets lab faux gitignores + jamais PII reelle + runtime jamais committe + reset down -v + checkout fixtures (REQ-S-004) | super_admin | continu |
