# Écarts V1 → V2

État au 2026-10-26. Objectif : porter dans `v2/` toutes les fonctionnalités
logicielles de la V1 (`web/`, `deploy/`, `lab/`, `custom/`) et les exigences
fonctionnelles des plans/docs. Le matériel, la box, Home Assistant et les
opérations terrain sont hors périmètre logiciel.

Légende : **Fait** · **Partiel** · **Absent** · **Exclu** (matériel/infra V1).

## Public et légal

| Exigence V1 / plan | V2 | Note |
|---|---|---|
| Landing marketing (features, forfaits, marque) | Fait | Contenu V1 porté : 6 capacités, forfaits 149/190/290, CTA. |
| `/aide` (rôles, écrans, limites) | Fait | `/aide`, sans JS. |
| `/legales` (LCEN, mandat, RGPD, SIREN réel) | Fait | `/legales`, lit `tenants` ; « à compléter » si absent. |
| Bandeau cookies (refus = zéro traceur) | Absent | Aucun traceur public aujourd’hui. |
| Médiation conso + lien ODR sur factures/site | Partiel | Section médiation sur `/legales` ; coordonnées du médiateur à désigner, mention facture absente. |

## Auth, rôles, sécurité

| Exigence | V2 | Note |
|---|---|---|
| Login + 2FA TOTP staff | Fait | Better Auth + plugin 2FA. |
| Sessions listables / révocation | Fait | `/hote/securite` + fermeture des autres sessions. |
| Rate-limit login | Partiel | `rateLimit` Better Auth activé ; CAPTCHA absent. |
| 2FA obligatoire staff | Fait (opt-in) | `AUTH_2FA_REQUIRED=true` ; CAPTCHA login absent. |
| 8 rôles V1 (super_admin, opérateur…) | Partiel | 6 rôles ; pas de `super_admin` ni d’`operateur` distinct. |
| « Voir comme » + bandeau + audit `qui_reel` | Absent | Non porté. |
| Double validation 4 yeux | Absent | Reversements/débits > seuils. |
| Isolation RLS + `withTenant()` | Fait | Test RLS dédié. |

## Super-admin / exploitation

| Écran V1 | V2 | Note |
|---|---|---|
| `/supervision` (santé, box, métriques) | Absent | `/api/health` et `/api/ready` existent. |
| `/systeme` (santé gateway, hébergement, design) | Partiel | Design sur `/hote/design` ; pas de page système. |
| `/secrets` (métadonnées + rotation) | Absent | Secrets webhooks gérés sur `/hote/integrations`. |
| `/journal` 90 j + recherche par `ref` | Partiel | `/hote/audit` + export ; pas de recherche globale. |
| `/metrics` Prometheus | Absent | `/api/telemetry` seulement. |

## Logements, onboarding, annonces

| Exigence | V2 | Note |
|---|---|---|
| Onboarding 7 étapes | Partiel | `/hote/onboarding` = état réel des gates ; étapes physiques exclues. |
| Gate copro `copro.verifiee=false` → en ligne bloquée | Fait | `logements.copro_verifiee`, filtre `/reserver`, audit. |
| Conformité annonce (9 mentions, DPE/GES, Cerfa) | Fait | `/hote/annonce`. |
| Machine d’état publication (brouillon→prêt→publié) | Fait (2 états) | `brouillon` par défaut, publication explicite auditée ; état « prêt » fusionné avec `/hote/onboarding`. |
| Config générale groupée + dry-run/rollback | Absent | Pas d’équivalent V1. |
| Archivage doux + double confirmation | Partiel | Statut `archive` en base ; pas d’UI dédiée. |

## Planning, prix, OTA

| Exigence | V2 | Note |
|---|---|---|
| ICS pull par logement + anti-chevauchement | Fait | Import + cron + conflits. |
| Écriture OTA automatique | Exclu | V1 ne l’écrivait pas non plus (lecture seule). |
| Pricing borné, saison, events, last-minute | Fait | `/hote/prix`. |
| Modes remplissage/équilibre/revenu | À vérifier | À confronter à `/hote/prix`. |
| Stop commercial global 1-clic | Absent | Pas de bouton tous canaux. |
| Export OTA à >10 unités | Exclu | Décision PMS différée. |

## Séjour, ménage, incidents

| Exigence | V2 | Note |
|---|---|---|
| Ménage : checklist, preuves, clôture bloquante | Fait | `/hote/menage`. |
| Dispatch + score | Fait | `/hote/dispatch`. |
| RC presta expirée → dispatch bloqué | À vérifier | Champ RC dans les utilisateurs ? |
| EDL photos + comparatif + coût | Fait | `/hote/etats-des-lieux`. |
| Questionnaire, extras, incidents, objets trouvés | Fait | Pages dédiées. |
| Fiche de police 1/personne + purge 6 mois | Fait | `/voyageur/police` (HMAC), `/hote/police`, cron `purge-police`, RLS. |
| Check-out guidé 1-tap | Partiel | Questionnaire de départ. |
| Quota preuves 5 Go + éviction | Absent | Pas de stockage photo externe. |

## Paiements, factures, compta

| Exigence | V2 | Note |
|---|---|---|
| Factures PDF + Factur-X | Fait | `/factures/[id]/pdf` et `/factur-x`. |
| Caution : hold, débit sur justificatifs, restitution | Fait | `/hote/cautions`. |
| Relevé propriétaire (brut, charges, net) | Fait | `/proprio` ; PDF à vérifier. |
| Exports compta (CSV, Chorus/PDP) | Partiel | Exports CSV ; export Factur-X en lot absent. |
| Rapprochement >2 % | Absent | Pas de file de rapprochement. |
| Simulateur micro/réel | À vérifier | Paramètres fiscaux présents. |
| Taxe de séjour | Fait | Paramètres + factures. |
| Chargeback / dossier pré-rempli | Absent | — |
| Relances impayés J+3/J+7 | Fait | Cron `relances`. |

## CRM, support, messagerie

| Exigence | V2 | Note |
|---|---|---|
| Pipeline 8 étapes + simulateur + offres | Fait | `/commercial`. |
| Tickets SLA + messagerie | Fait | `/support`. |
| 3 fils internes (proprio/presta/voyageur) | Partiel | Messages voyageur ; fils presta/proprio à vérifier. |
| Relances J+3/J+7/J+15 | Fait | Cron/CRM. |

## IA, notifications, transverse

| Exigence | V2 | Note |
|---|---|---|
| Assistant IA + garde-fous | Fait | `/hote/assistant`, quotas, audit. |
| UI routage LLM (test alias) | Partiel | `/hote/integrations` ; pas d’équivalent complet. |
| Voix BYOD | Exclu | Matériel/PWA terrain. |
| Email transactionnel | Fait | SMTP/Mailpit ; beta peut être désactivée. |
| SMS transactionnel | Absent | V1 le prévoyait via HA, jamais codé. |
| PWA + offline + outbox | Fait | `/voyageur`, `/presta`, SW. |
| Mode léger L1 (`/api/lite`) | Absent | Cookie + CSS allégé non portés. |
| i18n 5 langues | Partiel | Voyageur 5 langues ; staff FR. |
| Marque blanche runtime | Partiel | Nom/titre/manifeste/pied via `MARQUE` ; logo et couleurs non pilotés. |
| RGPD : registre, export, purge | Fait | `/hote/rgpd`, cron mémoire. |
| Audit 90 j | Fait | `/hote/audit`. |
| Recherche globale par `ref` | Absent | — |
| `/health`, `/ready` | Fait | `db`, `schema`, `rls`, `role`. |
| Sauvegarde/restauration testées | Fait | `db:backup`, `db:restore-test`. |
| Alertes (box, disque, certificat) | Partiel | Monitoring compose ; box exclue. |

## Prochaines priorités proposées

1. 2FA obligatoire pour admin/comptable + CAPTCHA login.
2. `super_admin` + pages `/supervision`, `/systeme`, `/secrets`, `/journal`
   (lecture cross-tenant encadrée) et « voir comme » audité.
3. Machine d’état de publication d’annonce + archivage doux.
4. Marque blanche complète (logo, couleurs, contacts) au-delà du nom.
5. Bandeau cookies et médiation conso.
6. Export compta Factur-X en lot + rapprochement >2 %.
7. Mode léger L1 et recherche globale par `ref`.
