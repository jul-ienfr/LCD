# Écarts V1 → V2

```text
Statut : ACTIF
Propriétaire : fondateur
Dernière vérification : 2026-11-14
Remplace / remplacé par : docs/archive/v1/AUDIT-COMPLET-PLANS-VS-V2.md (pour l'audit)
Source de vérité : v2/src, v2/tests, docs/registres/etat-reel.md
```

État au 2026-11-01, reverifié le 2026-11-14 dans le code (`v2/src`,
`v2/tests`). Objectif : porter dans `v2/` toutes les fonctionnalités
logicielles de la V1 (`web/`, `deploy/`, `lab/`, `custom/`) et les exigences
fonctionnelles des plans/docs. Le matériel, la box, Home Assistant, les
rendez-vous terrain et les contrats externes restent hors périmètre logiciel.

## Mise à jour du 2026-11-14

Corrections apportées après l'audit documentaire :

| Sujet | État au 2026-11-01 | État vérifié au 2026-11-14 |
|---|---|---|
| Lighthouse | « non mesuré, absent du dépôt » | **mesuré le 2026-11-13** via `npx lighthouse` (13.6.0, sans dépendance ajoutée) : mobile 100 partout sauf `/reserver` 93–95, desktop 100 partout |
| Accessibilité | 18 routes mesurées | **21 pages publiques + 70 routes staff** : 0 violation axe, 0 cible < 44 px, 0 débordement 320 px |
| Site public | non couvert par ce document | `/`, `/reserver` (2 étapes), `/reserver/[ref]`, `/tarifs`, `/logement` absent (écart assumé), 5 langues, sans JS |
| Channel manager | cut-off « pas encore modélisé » (voir `MATRICE`) | **cut-off, buffer et restrictions implémentés** (`/hote/planning/canaux`, `PLAN-LEVER-LIMITES-OTA.md` §4.2) |
| L4 pricing | absent | `/hote/prix`, stratégies remplissage/équilibre/revenu, saisons, événements, last-minute |
| L5 reporting | absent | relevé propriétaire mensuel (brut, charges, net), exports CSV et PDF |
| L6 API | absent | `/api/v1/*`, clés à scopes, webhooks HMAC, OpenAPI 3.1 |
| L7 onboarding | absent | `/hote/onboarding`, réservation test, import CSV |
| Migrations | 94 | **104** (`npm run db:test-migrations`) |

Les sections ci-dessous restent la référence détaillée ; les lignes corrigées
portent la date du 2026-11-14.

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
| Import CSV logements/réservations | Fait | `/hote/import` : parseur `,`/`;`, guillemets, BOM/CRLF, rapport ligne par ligne, refus des chevauchements, création partielle et audit `import.csv`. |
| Parcours de réservation test | Fait | `/hote/onboarding/reservation-test` : séjour `TEST-…`, lien guide signé, annulation, audit ; aucun impact sur le CA. |
| Tenant de démonstration lecture seule | Fait | `tenants.lecture_seule` (migration 0100) + garde `hooks.server.ts` : écritures refusées (303 staff, 403 API), lectures et authentification ouvertes ; seed `SEED_DEMO_PASSWORD`. |
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

## API, intégrations, développeurs

| Exigence | V2 | Preuve / reste à faire |
|---|---|---|
| Clés API à scopes | Fait | `/hote/integrations/api` : clé `lcd_…` affichée une fois, empreinte SHA-256 seule persistée, six scopes, expiration, révocation idempotente, audit. |
| API v1 en lecture | Fait | `/api/v1/{logements,reservations,disponibilites,prix,proprietaires,releves}` : Bearer, 120 req/min, pagination, `X-Request-Id`, erreurs homogènes. |
| Documentation développeurs | Fait | `/developpeurs` et `GET /api/v1/openapi` (OpenAPI 3.1), exemples cURL. |
| Webhooks signés + rejeu | Fait | `/hote/integrations` : HMAC `X-LCD-Signature`, 5 tentatives `[0,1,5,15,60]` min, cron, historique des livraisons. |
| Serrure Nuki | Fait (mode manuel sans token) | `/hote/integrations/nuki`, `/hote/logements/[id]/serrure` ; adapter US6 et contrat sandbox opt-in. |
| Guide partenaire Duve/Touch Stay | Non retenu | Aucun contrat/API partenaire fourni ; le guide natif reste la source. |
| Swikly | En attente | La caution interne reste opérationnelle ; l'adapter externe exige le contrat Swikly. |

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

## Ergonomie et expérience client (plan 004)

| Exigence | V2 | Preuve / reste à faire |
|---|---|---|
| Navigation staff par tâches | Fait | Modèle `ModeleNavigation` (domaines, tâches, rôles, priorité), 7 entrées principales au maximum, fil d'Ariane sur les pages profondes (`contracts/navigation.md`, `tests/ergonomie/navigation.test.ts`). |
| Recherche globale staff | Fait | `/hote/recherche` : référence, logement, voyageur, filtres par rôle, état vide expliqué, cible tactile conforme. |
| Sélecteur de langue public | Fait | 5 langues (`fr,en,it,es,de`) sans JavaScript, cookie `lcd_langue`, `lang` résolu côté serveur, `hreflang`. |
| Tunnel de réservation en 2 étapes | Fait | `/reserver` : étape 1 dates/logement (GET, URL partageable), étape 2 coordonnées (POST), erreurs localisées conservant la saisie, récapitulatif collant + barre d'action mobile (T037–T041). |
| Confirmation rassurante | Fait | `/reserver/[ref]` : référence sélectionnable, récapitulatif, échéances si présentes, prochaine étape, délai, contact, aide (T084). |
| Fiche logement publique | Écart assumé | `/logement/[slug]` n'existe pas en V2 : les inclusions, la taxe et le délai sont publiés sur le tunnel et la confirmation. |
| Espace voyageur hiérarchisé | Fait | `/voyageur` : essentiel en premier écran, sommaire, sections `<details>` ouvertes par défaut, offline/outbox (T047–T053). |
| Accessibilité WCAG 2.2 AA | Fait | 0 violation axe sur **21 pages publiques et 70 routes staff** (mesure 2026-11-13), lien d'évitement, zones défilantes focusables, contrastes vérifiés. |
| Cibles tactiles ≥ 44 px / 320 px | Fait | 0 cible < 44 px et 0 px de débordement sur **21 pages publiques et 70 routes staff** (mesure 2026-11-13, `baseline-320*.json`). |
| Budget JS | Fait | 4 routes P1 : 1,8 Ko gzip cumulés (voyageur 1,4 Ko), 0 Ko obligatoire sur public/voyageur. |
| Thèmes super-admin sous garde-fous | Fait | `/supervision/apparence` : publication bloquée si contraste AA ou cible 44 px échoue, aperçu, journal (T097–T101). |
| Mesure first-party des parcours | Fait | Événements serveur anonymes (P-RESA, P-SEJOUR, P-RECHERCHE, P-HOTE-5), consentement `mesure`, aucun texte saisi, échec de mesure non bloquant (T089–T092). |
| Lighthouse mobile (SC-004) | Fait | Mesuré le 2026-11-13 via `npx lighthouse` (13.6.0) : mobile 100 partout sauf `/reserver` 93–95, desktop 100 partout. Aucune dépendance ajoutée au projet ; voir `v2/README.md`. |
| Tests utilisateurs et SUS/SEQ (SC-001, SC-003, SC-010) | À faire | Second round de 5 personnes (T107) ; pas de substitut automatisable. |

## Prochaines priorités

1. i18n staff : **Fait** (2026-11-08) — plus aucune page métier à traduire.
2. Intégrations partenaires live : **Partiel** (2026-11-10) — API v1, clés, webhooks et Nuki sont livrés ; Duve/Touch Stay, Swikly, Zapier/Make et MCP restent dépendants de contrats ou de comptes partenaires.
3. Tarifs publics : **Fait** (2026-11-10) — `/tarifs` FULL/PILOTAGE/KIT avec calculateur HTML-first et FAQ.
2. Contrat channel manager : comptes, certification et test >10 unités.
   - **Socle logiciel : Fait** (2026-11-08) — adaptateurs 5 fournisseurs, cas d’usage ARI, cron /api/cron/fournisseurs (batch 20, porte FOURNISSEUR_SYNC_ENABLED), registre super-admin, synchronisation manuelle /hote/planning/canaux.
   - **Test >10 unités : Fait** (2026-11-08) — `tests/fournisseur-ari-charge.test.ts` : 12 logements, poussée ARI complète (disponibilités + tarifs + restrictions), détection configuration incomplète. Comptes et certification restent externes.
