# ADR-001 — WireGuard pur hub-and-spoke, box-initiated

Date : 2026-10-09. Statut : accepté.

Contexte : relier N box au VPS sans exposer les moteurs en WAN.
Décision : VPS = hub WireGuard 10.99.0.1, box = spokes `PersistentKeepalive
25s`, aucun port entrant box, binds moteurs `127.0.0.1`.
Alternatives écartées : Tailscale (SaaS US, 25-40 Mo, coût/device, RGPD),
Headscale v1 (non officiel), NetBird v1 (Postgres+Redis, maturité moindre).
Conséquences : offline sans control-plane, traverse CGNAT, roaming natif.
