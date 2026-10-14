# 20 — Architecture + contrats (fait foi, v2 plan-only)

> Source : extrait SANS réinvention depuis `custom/passerelle-parc/openapi.yaml`,
> `boxes.yaml`, `entites.yaml`, `mandats.yaml`, `llm.yaml`, `custom/logements.yaml`,
> `custom/acces.yaml` + ADR-001..006 lus le 2026-10-14.
> En cas de divergence avec un texte de cahier v4, CE fichier + les YAML réels
> l'emportent (R4). Plan-only : aucun code modifié.

## 20.1 C4 simplifié (rappel §S2/§P1/§T1, figé)

```
[Voyageur BYOD/PWA] --HTTPS--> [Front web/ Next.js 16 : 8 dashboards plugins]
[Box site logN : HA + moteurs stdlib :8090-8100 + :8050 + :4000 + :8060, bind 127.0.0.1]
   --HTTPS/WG box-initiated keepalive 25s--> [Gateway VPS :8443 proxy authentifié]
[Super_admin /login IdP+2FA] --> [Gateway] --> [SQLite parc.db WAL + outbox/<box_id>/*.json]
```

- Gateway : jamais décideur, fan-out + cache horodaté + allowlist 1-tap + audit.
- Box : offline-first 2h (PIN/guide/scénarios sans WAN).
- Front : 1 plugin = 1 dossier + `dashboard.yaml` + batterie, chargeur strict.

## 20.2 Contrats gateway (openapi.yaml réel v1.0.0)

| Route | Sens | Rôle requis (acces.yaml) |
|---|---|---|
| `GET /health`, `/ready` | lecture | tous |
| `POST /v1/action` allowlist 14 | écriture 1-tap humaine tracée | super_admin/admin/opérateur selon action, 403 sinon |
| `GET /parc/logements`, `/calendrier-parc`, `/export-ota` | lecture seule | périmètre logement |
| `GET /v1/config-llm`, `POST /v1/llm-tester` dry-run | lecture/test sans WAN | admin seuls, 403 + anti-injection |
| `GET/POST /v1/prospects`, `GET /v1/pipeline`, `POST /v1/simulateur` (entite_id requis, 422 sinon), `POST /v1/offres` | CRM | commercial_01 isolé (jamais prix/coûts) |
| `GET /export-compta` | Chorus Pro/PDP mono-SIREN | comptable/admin |
| `GET /v1/i18n` 5 langues | `t(cle,lang,vars)`, `[cle]` si manquante | tous |
| `POST /v1/effacement` | RGPD tracé | super_admin seul |

Enveloppe erreur uniforme : `{code, message, ref: UUIDv7}`.
Sans `entite_id` : 422. Hors périmètre : 403/404 anti-énumération.
Horloge : `chrony ±5min`, sinon `401 clock_skew`.

## 20.3 Registres versionnés (0 secret, fait foi)

- `boxes.yaml` : `box-lab` (lab, log1+log2, 15 endpoints docker `http://<service>:<port>`),
  `qui_relay: passerelle_parc`. Template `box-logN` → `http://10.99.0.x:<port>` + `qui_relay: passerelle_box-logN` (G3, WG/mTLS au vault).
- `entites.yaml v1` : `ent-nom-propre-julie` (nom_propre, micro_bic_non_classe, TVA non, `iban_ref: env:...` jamais clair). Modèle SCI commenté colonne 0.
- `mandats.yaml v1` : `log1 → ent-nom-propre-julie, mode propre, 0%, mensuel_J+5, statut actif`. Cycle `brouillon→pret→actif→suspendu→resilie→archive`. Checklist 8 items tiers.
- `llm.yaml` : 9 usages (`messagerie_brouillon`, `avis_reponse`, `motif_prix`, `resume_digest`, `aide_dispatch`, `aide_calendrier`, `simulateur_explication`, `faq_voyageur`, `transcription_locale`), `seuil_confidence 0.7`, `retry 1`, `cooldown 30s`, `cache_ttl 0` sur `lcd-jev-*`, fallback terminal `degrade_sans_IA`. 6 interdits durs non configurables + héritage global→entité→logement + kill-switch.
- `logements.yaml` : héritage `global→logX`, bornes 75/290, `ics_poll 15min`, `copro.verifiee:false = BLOQUÉE`. log1 FULL (voix, lock, clim, upsell...), log2 light (lock/voix/clim off).
- `acces.yaml` : 5 rôles + 2 comptes machines (`dashboard_hote`, `passerelle_parc` lecture seule G0/G1). Lien mandat prime sur `logements` pour proprio (test 403 §60). MFA obligatoire super_admin/admin/gestionnaire, `mfa:false` = à activer.

## 20.4 Transport + split-brain + i18n + SQLite (ADR-001..006)

- ADR-001 WG : hub `10.99.0.1`, spokes keepalive 25s, 0 port entrant box.
- ADR-002 transport : HTTPS JSON fan-out + `outbox/<box_id>/*.json` `tmp+os.replace`, replay idempotent `ref` dédup 24h, cap 500 / alerte >50. MQTT = LAN box seul.
- ADR-003 split-brain : LWW = proposition affichée 2 versions, `tranche=None` jusqu'à `POST /parc/conflits/trancher (qui+motif)`, reconvergence = 2ᵉ `/v1/action`.
- ADR-004 i18n : `fr/en/es/it/de.yaml`, priorité `?lang > profil > Accept-Language > entité > fr`, socle 422/403 relu humain, IA = brouillon validé.
- ADR-005 llm : vault seul pour clés, quotas req/tokens jour, cloud-optin par entité.
- ADR-006 sqlite : `parc.db` WAL + `busy_timeout` + transactions explicites ; YAML/JSONL = échange + secours.

## 20.5 Pricing + synchro (rappel normatif, détails §S/§T3)

- Pricing : `clamp(pivot × K_saison × K_events × K_we × K_occ × K_duree × K_lastmin, min, max)`, 1×/j + par résa, direct auto, OTA reco 1-tap jamais auto. Modes `remplissage_max/equilibre/revenu_max`.
- Synchro : ICS pull 15min/logement jamais partagé, fusion direct <60s + OTA, anti-double-résa + stop-sell same-day, chevauchement = critique + blocage sortant + relogement frais propres. Overbooking INTERDIT.

## 20.6 Voix BYOD + front (rappel)

- Voix : QR/PWA consentement, STT téléphone → `:4000` → TTS téléphone, texte seul API, LLM consultatif seul `confidence<0.7 → dashboard`.
- Front : login unique `/login` IdP+2FA, rôle→dashboard+périmètre, `super_admin` voir-comme tracé `{qui_reel, vu_comme, quoi}`.
