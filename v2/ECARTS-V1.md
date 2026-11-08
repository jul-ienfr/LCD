# Écarts V1 → V2

État au 2026-11-01, vérifié dans le code (`v2/src`, `v2/tests`). Objectif :
porter dans `v2/` toutes les fonctionnalités logicielles de la V1 (`web/`,
`deploy/`, `lab/`, `custom/`) et les exigences fonctionnelles des plans/docs.
Le matériel, la box, Home Assistant, les rendez-vous terrain et les contrats
externes restent hors périmètre logiciel.

Légende : **Fait** · **Partiel** · **Absent** · **Exclu** (matériel, contrat ou
infra V1).

## Public et légal

| Exigence V1 / plan | V2 | Preuve / reste à faire |
|---|---|---|
| Landing marketing (features, forfaits, marque) | Fait | Contenu V1 porté : capacités, forfaits, CTA. |
| `/aide` (rôles, écrans, limites) | Fait | `/aide`, sans JS. |
| `/legales` (LCEN, mandat, RGPD, SIREN réel) | Fait | `/legales`, lit `tenants` ; « à compléter » si absent. |
| Bandeau cookies (refus = zéro traceur) | Fait | Cookies essentiels seulement, acquittement, détails `/legales`. |
| Médiation conso sur site et factures | Fait | `domain/mediation.ts` ; `/legales`, facture HTML, PDF et Factur-X. Renseigner `MEDIATEUR_NOM` / `_URL` / `_ADRESSE` en production. |

## Auth, rôles, sécurité

| Exigence | V2 | Preuve / reste à faire |
|---|---|---|
| Login + 2FA TOTP staff | Fait | Better Auth + plugin 2FA. |
| Sessions listables / révocation | Fait | `/hote/securite` + fermeture des autres sessions. |
| Rate-limit login + CAPTCHA | Fait | `lib/server/auth.ts`, `domain/captcha.ts`, `/login`, tests. |
| 2FA obligatoire staff | Fait | `AUTH_2FA_REQUIRED=true` ; garde sur les pages (`requireRole`) et sur les API staff (`verifierAccesApi`) : exports, PDF, Factur-X. |
| 8 rôles V1 | Fait | `domain/utilisateur.ts` ; `operateur` est un alias terrain de `hote`. |
| Élévation `super_admin` protégée | Fait | Création, changement de rôle, activation, reset mot de passe et reset 2FA réservés à un super-admin. |
| « Voir comme » + bandeau + audit `qui_reel` | Fait | Cookie HMAC 2 h, bandeau, écritures refusées, audit `apercu.*`. |
| Double validation 4 yeux | Fait | `/hote/sorties` : reversements, remboursements et gestes commerciaux enregistrés, approuvés par un second compte (jamais le demandeur), puis marqués payés ; caution > 300 € conservée. |
| Isolation RLS + `withTenant()` | Fait | Test RLS dédié. |

## Super-admin / exploitation

| Écran V1 | V2 | Preuve / reste à faire |
|---|---|---|
| `/supervision` (santé, box, métriques) | Fait | Agrégats cross-tenant lecture seule, owner requis. |
| `/systeme` (santé gateway, hébergement, design) | Fait | Versions, migrations, RLS, runtime ; design sur `/hote/design`. |
| `/secrets` (métadonnées + rotation) | Fait | États sans valeurs, alertes, procédure de rotation. |
| `/journal` 90 j + recherche par `ref` | Fait | `/hote/audit`, export CSV, `/hote/recherche`. |
| `/metrics` Prometheus | Fait | `/api/metrics` : up, readiness DB, uptime, latence ; jeton facultatif. |

## Logements, onboarding, annonces

| Exigence | V2 | Preuve / reste à faire |
|---|---|---|
| Onboarding 7 étapes | Partiel | `/hote/onboarding` = état réel des gates ; visite, contrat, pack, installation et go-live restent terrain. |
| Gate copro `copro.verifiee=false` → en ligne bloquée | Fait | `logements.copro_verifiee`, filtre `/reserver`, audit. |
| Conformité annonce (9 mentions, DPE/GES, Cerfa) | Fait | `/hote/annonce`. |
| Machine d’état publication | Fait | `brouillon` par défaut, publication explicite auditée ; « prêt » fusionné avec l’onboarding. |
| Config générale groupée + dry-run/rollback | Fait | `/hote/reglages-groupe` : sélection multi-logements, buffer/cutoff/stratégie, diff sans écriture, version snapshot et retour arrière auditée. |
| Archivage doux + double confirmation | Fait | `/hote/annonce#cycle-vie`, refus si réservation future, audit. |

## Planning, prix, OTA

| Exigence | V2 | Preuve / reste à faire |
|---|---|---|
| ICS pull par logement + anti-chevauchement | Fait | Scheduler 5 min ou cron, ETag/304, backoff, verrou, réconciliation, confirmation d’un calendrier vide, historique. |
| Channel manager iCal maison | Fait | `/hote/planning/canaux` : catalogue, plusieurs annonces, mapping externe, flux par canal, export signé, buffer, RLS. |
| Abonnement OTA au calendrier LCD | Fait | `/api/calendrier/[id]?t=…` et par canal (`canalId`) ; l’OTA relit à sa cadence. |
| Écriture OTA automatique | Exclu sans contrat | API natives soumises à certification partenaire ; le socle ARI existe côté adapters. |
| Pricing borné, saison, events, last-minute | Fait | `/hote/prix`. |
| Modes remplissage / équilibre / revenu | Fait | `domain/strategie-prix.ts`, branché dans `/hote/prix`. |
| Stop commercial global 1-clic | Fait | `/hote/planning` : blocage direct, flux ICS fermé et disponibilités ARI poussées à zéro vers les canaux. |
| Export OTA à >10 unités | Partiel | Socle canal prêt ; comptes, certification et test de charge fournisseur restent à contractualiser. |

## Séjour, ménage, incidents

| Exigence | V2 | Preuve / reste à faire |
|---|---|---|
| Ménage : checklist, preuves, clôture bloquante | Fait | `/hote/menage`. |
| Dispatch + score | Fait | `/hote/dispatch`. |
| RC presta expirée → dispatch bloqué | Fait | `domain/utilisateur.ts`, `application/use-cases/dispatch.ts`. |
| EDL photos + comparatif + coût | Fait | `/hote/etats-des-lieux`. |
| Questionnaire, extras, incidents, objets trouvés | Fait | Pages dédiées. |
| Fiche de police 1/personne + purge 6 mois | Fait | `/voyageur/police` (HMAC), `/hote/police`, cron, RLS. |
| Check-out guidé 1-tap | Fait | Checklist 4 étapes + note auditée, ménage de rotation et brouillon d’EDL de sortie créés automatiquement ; brouillon à compléter dans `/hote/etats-des-lieux/[id]`, purge des blobs via `db:purge-blobs`. |
| Quota preuves 5 Go + éviction | Fait | Upload/UI sur la fiche ménage, service authentifié, stockage local à volume persistant, éviction oldest-first ; adapter S3 interchangeable. |

## Paiements, factures, compta

| Exigence | V2 | Preuve / reste à faire |
|---|---|---|
| Factures PDF + Factur-X | Fait | `/api/factures/[id]/pdf` et `/factur-x`. |
| Caution : hold, débit sur justificatifs, restitution | Fait | `/hote/cautions` ; double validation de la retenue. |
| Relevé propriétaire (brut, charges, net) | Fait | Charges mensuelles par mandat (`/hote/proprietaires`), `/proprio` avec net après charges, exports CSV et PDF (`/api/proprio/releve`). |
| Exports compta (CSV, Chorus/PDP) | Partiel | CSV + ZIP Factur-X mensuel ; dépôt/validation PDP-Chorus dépend d’un compte externe. |
| Rapprochement >2 % | Fait | Import CSV, appariement ±3 j, orphelines >7 j, alerte 2 %, RLS. |
| Simulateur micro / réel | Fait | `/hote/compta/simulateur` ; barème 2025, comparaison des bases, déficit reportable. |
| Taxe de séjour | Fait | Paramètres + factures. |
| Chargeback / dossier pré-rempli | Fait | `/hote/factures/[id]/litige` : dossier factuel, événements `charge.dispute.*` audités, réponse texte envoyée à Stripe et clôture en un clic ; les pièces jointes restent à ajouter dans Stripe. |
| Relances impayés J+3/J+7 | Fait | Cron `relances`. |

## CRM, support, messagerie

| Exigence | V2 | Preuve / reste à faire |
|---|---|---|
| Pipeline 8 étapes + simulateur + offres | Fait | `/commercial`. |
| Tickets SLA + messagerie | Fait | `/support`. |
| 3 fils internes (proprio / presta / voyageur) | Fait | `/hote/fils` : création par canal, réponses, clôture/réouverture, logement validé tenant, audit. |
| Relances J+3/J+7/J+15 | Fait | Cron/CRM. |

## IA, notifications, transverse

| Exigence | V2 | Preuve / reste à faire |
|---|---|---|
| Assistant IA + garde-fous | Fait | `/hote/assistant`, quotas, audit. |
| UI routage LLM (test alias) | Fait | `/supervision/assistant` : aperçu des 15 routages, surcharges standard/premium persistées, kill-switch immédiat et audité. |
| Voix BYOD | Exclu | Matériel/PWA terrain. |
| Email transactionnel | Fait | SMTP/Mailpit. |
| SMS transactionnel | Fait | Brevo, `SMS_ENABLED=true` + `BREVO_API_KEY`. |
| PWA + offline + outbox | Fait | `/voyageur`, `/presta`, service worker. |
| Mode léger L1 (`/api/lite`) | Fait | Cookie `lcd_lite`, classe `mode-lite`, bandeau de retour. |
| i18n 5 langues | Fait | Voyageur 5 langues ; connexion, tableau de bord, sections et navigation principale staff 5 langues avec cookie de préférence ; pages traduites : audit, logements, recherche, entité, accès, sécurité, planning, canaux, ménage, missions, factures et litiges, compta, cautions, sorties, messages, avis, questionnaires, objets trouvés, sinistres, tranquillité, annonce, onboarding, formation, police, RGPD, utilisateurs, propriétaires, intégrations, dispatch, phrases types, office de tourisme, extras voyageur, stocks/consommables, inventaire, prix, assistant, fils internes, réglages groupés, import planning, entretien, états des lieux, promotions, guides logement, calendriers et domaines personnalisés (hors libellés métier du domaine et codes d’action d’audit) ; plus aucune page métier à traduire, plan dans `PLAN-I18N-STAFF.md`. |
| Marque blanche runtime | Fait | `/hote/design`, contraste contrôlé, repli env, appliqué à la vitrine et aux pages publiques. |
| RGPD : registre, export, purge | Fait | `/hote/rgpd`, cron mémoire. |
| Audit 90 j | Fait | `/hote/audit`. |
| Recherche globale par `ref` | Fait | `/hote/recherche`. |
| `/health`, `/ready` | Fait | `db`, `schema`, `rls`, `role`. |
| Sauvegarde/restauration testées | Fait | `db:backup`, `db:restore-test`. |
| Alertes (box, disque, certificat) | Fait | `/supervision` santé système, `/api/health/systeme` (503 sous seuil disque/TLS ou box silencieuse) et `POST /api/box/heartbeat` protégé par jeton. |

## Prochaines priorités

1. i18n staff : **Fait** (2026-11-08) — plus aucune page métier à traduire.
2. Contrat channel manager : comptes, certification et test >10 unités.
   - **Socle logiciel : Fait** (2026-11-08) — adaptateurs 5 fournisseurs, cas d’usage ARI, cron /api/cron/fournisseurs (batch 20, porte FOURNISSEUR_SYNC_ENABLED), registre super-admin, synchronisation manuelle /hote/planning/canaux.
   - **Test >10 unités : Fait** (2026-11-08) — `tests/fournisseur-ari-charge.test.ts` : 12 logements, poussée ARI complète (disponibilités + tarifs + restrictions), détection configuration incomplète. Comptes et certification restent externes.
