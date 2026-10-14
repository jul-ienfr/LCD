# ADR-005 — Routage IA centralisé, interdits non configurables

Date : 2026-10-13. Statut : accepté (§15).

Contexte : quel moteur pour quelle finalité, quel fallback, quels budgets.
Décision : `llm.yaml` versionné SANS CLÉ (vault seul), 9 usages, fallbacks
ordonnés terminés par `degrade_sans_IA`, héritage global → entité →
logement, `cloud-optin` par entité, quotas + kill-switch, redaction
PII/secrets avant prompt, logs = hash + métadonnées seuls.
Interdits durs (serrure/vanne/portail, PIN auto, envoi auto, écriture OTA
auto, décision compta seule, discrimination) : grisés + 403 loggé.
