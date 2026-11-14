# Journal de recette — novembre 2026

- **Version testée** : `v2.0.0-rc1` (commit `d8ff261`)
- **Environnement** : à renseigner (URL publique, base, date de déploiement)
- **Référentiel** : `v2/TESTS-A-FAIRE.md` (155 cases) et `v2/docs/qa-manuel.md` (21 parcours)
- **Règle** : une ligne n'est valide que si `Résultat`, `Date`, `Opérateur` et `Preuve` sont remplis.

## Mode d'emploi

| Colonne | Valeurs |
| --- | --- |
| Résultat | `OK`, `KO`, `N/A` (avec justification), `BLOQUÉ` (avec dépendance) |
| Sévérité d'un KO | `S1` perte de donnée/sécurité, `S2` parcours bloqué, `S3` gêne avec contournement, `S4` cosmétique |
| Preuve | URL, capture, identifiant de réservation, numéro de facture, sortie de commande |

Un `KO` S1 ou S2 interdit la signature. Un `KO` S3 est accepté avec contournement écrit et signataire. Un `N/A` exige une justification.

## A. Cases fonctionnelles (`TESTS-A-FAIRE.md`)

Total : **155** cases.

| ID | Section | Case | Date | Opérateur | Résultat | Preuve | Défaut |
| --- | --- | --- | --- | --- | --- | --- | --- |
| REC-001 | 0. Pré-requis de la recette | URL HTTPS publique stable. |  |  |  |  |  |
| REC-002 | 0. Pré-requis de la recette | `DATABASE_URL` pointe sur le rôle **`lcd_app`**, pas le owner. |  |  |  |  |  |
| REC-003 | 0. Pré-requis de la recette | `MIGRATION_DATABASE_URL` (owner) disponible pour migrations/backups. |  |  |  |  |  |
| REC-004 | 0. Pré-requis de la recette | Migrations `0001` → `0103` appliquées (104 fichiers SQL). |  |  |  |  |  |
| REC-005 | 0. Pré-requis de la recette | `npm run db:test-rls` exécuté sur la base de production : `RLS VALIDÉE : isolation tenant effective`. Déjà validé en local le 2026-10-26 (owner `lcd`, rôle `lcd_app`) ; les 45 tests Playwright passent avec `DATABASE_URL` sur le rôle applicatif. |  |  |  |  |  |
| REC-006 | 0. Pré-requis de la recette | `/api/health` → `200`, `/api/ready` → `200`, `db: up`, `schema: ok`. |  |  |  |  |  |
| REC-007 | 0. Pré-requis de la recette | `/api/ready` bien **503 `schema: pending`** si une migration manque (test à faire sur une base de staging vide ou incomplète) ; le compteur `migrations` est comparé au journal Drizzle. Validé en local le 2026-10-26 sur base vide : 503 `db: up`, sept entrées `manquants` ; rejouer le test avec le journal courant (104 migrations). |  |  |  |  |  |
| REC-008 | 0. Pré-requis de la recette | `/api/ready` → `200` avec toutes les migrations appliquées. |  |  |  |  |  |
| REC-009 | 1. Auth, rôles et sécurité | Connexion admin, déconnexion, reconnexion. |  |  |  |  |  |
| REC-010 | 1. Auth, rôles et sécurité | Enrôlement TOTP, déconnexion, reconnexion avec code TOTP. |  |  |  |  |  |
| REC-011 | 1. Auth, rôles et sécurité | `AUTH_2FA_REQUIRED=true` : un admin sans TOTP est renvoyé sur `/hote/securite` ; après activation, l’accès au reste de l’espace revient. |  |  |  |  |  |
| REC-012 | 1. Auth, rôles et sécurité | Code TOTP invalide refusé ; trop de tentatives verrouillées. |  |  |  |  |  |
| REC-013 | 1. Auth, rôles et sécurité | `/api/auth/sign-up/email` refusé (`400`) sur la production. |  |  |  |  |  |
| REC-014 | 1. Auth, rôles et sécurité | `tenantId` et `role` refusés par `/api/auth/update-user` (`FIELD_NOT_ALLOWED`). |  |  |  |  |  |
| REC-015 | 1. Auth, rôles et sécurité | Création d’un compte par admin, connexion du compte. |  |  |  |  |  |
| REC-016 | 1. Auth, rôles et sécurité | Réinitialisation du mot de passe : sessions fermées. |  |  |  |  |  |
| REC-017 | 1. Auth, rôles et sécurité | Sessions actives : deux navigateurs connectés, la session courante est marquée, « Fermer les autres sessions » ferme la seconde et laisse la première ouverte (audit `utilisateur.sessions`). |  |  |  |  |  |
| REC-018 | 1. Auth, rôles et sécurité | Désactivation : session fermée, connexion refusée. |  |  |  |  |  |
| REC-019 | 1. Auth, rôles et sécurité | Changement de rôle : accès recalculé sans reconnexion. |  |  |  |  |  |
| REC-020 | 1. Auth, rôles et sécurité | Dernier admin : désactivation et retrait de rôle refusés. |  |  |  |  |  |
| REC-021 | 1. Auth, rôles et sécurité | Non-admin : `/hote`, `/hote/utilisateurs`, `/hote/audit` refusés. |  |  |  |  |  |
| REC-022 | 1. Auth, rôles et sécurité | Prestataire : `/hote/securite` accessible, `/hote` refusé. |  |  |  |  |  |
| REC-023 | 1. Auth, rôles et sécurité | Exports CSV et JSON complets refusés aux non-admins/hôtes/comptables selon les règles. |  |  |  |  |  |
| REC-024 | 1. Auth, rôles et sécurité | Aucun secret dans l’export JSON complet (webhooks, URLs ICS, credentials). |  |  |  |  |  |
| REC-025 | 1. Auth, rôles et sécurité | Rate limit de connexion vérifié (trop de tentatives → refus temporaire). |  |  |  |  |  |
| REC-026 | 1. Auth, rôles et sécurité | En-têtes HTTP en production : CSP, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, HSTS au proxy. |  |  |  |  |  |
| REC-027 | 1. Auth, rôles et sécurité | 2FA réellement exigée après activation, sur un autre navigateur. |  |  |  |  |  |
| REC-028 | 2. Gestion locative | Création/modification logement, guide, WiFi, règles. |  |  |  |  |  |
| REC-029 | 2. Gestion locative | Onboarding : nouveau logement « Non publiable » et absent de `/reserver` ; cocher la vérification copro le rend publiable ; « Publier le logement » le rend visible ; « Dépublier » le remasque (audits `logement.copro`, `logement.publication`). |  |  |  |  |  |
| REC-030 | 2. Gestion locative | Archivage : double confirmation, logement masqué, restauration en brouillon ; réservation future non annulée → refus avec sa `ref`. |  |  |  |  |  |
| REC-031 | 2. Gestion locative | Entité juridique : nature, régime, TVA, SIREN, adresse, mentions ; SIREN invalide refusé. |  |  |  |  |  |
| REC-032 | 2. Gestion locative | Facture HTML/PDF/Factur-X : nom, adresse, SIREN et mentions de l’entité. |  |  |  |  |  |
| REC-033 | 2. Gestion locative | Mandat logement : mode propre/mandat tiers, commission, statut, dates, notes ; commission forcée à 0 en mode propre. |  |  |  |  |  |
| REC-034 | 2. Gestion locative | Portail propriétaire : commission et net cohérents avec le mandat. |  |  |  |  |  |
| REC-035 | 2. Gestion locative | Prix par jour, plusieurs logements, isolation. |  |  |  |  |  |
| REC-036 | 2. Gestion locative | Réservation manuelle, anti-chevauchement, annulation. |  |  |  |  |  |
| REC-037 | 2. Gestion locative | Import ICS manuel : fichier valide, HTML refusé, doublons ignorés. |  |  |  |  |  |
| REC-038 | 2. Gestion locative | Flux HTTPS réel Airbnb/Booking : import, rattachement `fluxIcsId`, dates et noms corrects ; URL `webcal://` normalisée en `https://`. |  |  |  |  |  |
| REC-039 | 2. Gestion locative | Deux synchronisations consécutives : la seconde répond 304 ou « contenu inchangé », aucun doublon, une exécution dans l’historique. |  |  |  |  |  |
| REC-040 | 2. Gestion locative | Déplacement d’un séjour dans l’OTA : dates mises à jour dans LCD ; séjour supprimé dans l’OTA : ligne supprimée après réconciliation. |  |  |  |  |  |
| REC-041 | 2. Gestion locative | Conflit avec une réservation directe : l’événement OTA n’est pas inséré, le conflit est visible dans le flux et l’historique, les autres événements passent. |  |  |  |  |  |
| REC-042 | 2. Gestion locative | Calendrier vide : premier cycle « partiel » sans suppression, second cycle confirme et supprime les séjours absents. |  |  |  |  |  |
| REC-043 | 2. Gestion locative | Suppression du flux : les réservations importées restent, leur `fluxIcsId` devient nul, les autres flux ne sont pas affectés. |  |  |  |  |  |
| REC-044 | 2. Gestion locative | Blocages OTA sans impact CA. |  |  |  |  |  |
| REC-045 | 2. Gestion locative | Export ICS : abonnement Google Calendar ou Apple Calendar réel, rafraîchi avec `REFRESH-INTERVAL:PT5M`, ETag/304, `Last-Modified`. |  |  |  |  |  |
| REC-046 | 2. Gestion locative | Lien ICS invalide → `401` ; mauvais logement → `401`. |  |  |  |  |  |
| REC-047 | 2. Gestion locative | Planificateur : `ICS_SCHEDULER_ENABLED=true`, bail unique, reprise après expiration, arrêt propre sur SIGTERM ; `/api/ics/sante` cohérent. |  |  |  |  |  |
| REC-048 | 2. Gestion locative | Cron de secours : `POST /api/cron/sync-ota?force=1` avec et sans `CRON_SECRET`, verrou déjà pris → réponse `verrouille: true`. |  |  |  |  |  |
| REC-049 | 2. Gestion locative | Channel manager : ajout Airbnb avec URL iCal, flux lié au canal, état visible, synchronisation forcée, URL d’export par canal. |  |  |  |  |  |
| REC-050 | 2. Gestion locative | Deux annonces Airbnb du même logement : clés distinctes, pas de doublon ; deux canaux différents avec la même URL → refus explicite. |  |  |  |  |  |
| REC-051 | 2. Gestion locative | Export par canal : buffer de 1 jour après départ, réservations du flux cible exclues, réservations des autres flux et réservations directes incluses. |  |  |  |  |  |
| REC-052 | 2. Gestion locative | Canal désactivé ou export coupé → URL par canal en `404` ; URL globale toujours valide. |  |  |  |  |  |
| REC-053 | 2. Gestion locative | Suppression d’un canal : flux et historique supprimés, réservations importées conservées avec `fluxIcsId` nul. |  |  |  |  |  |
| REC-054 | 2. Gestion locative | Reprise d’un flux existant après migration : canal `generique` hérité, édition sans collision de clé. |  |  |  |  |  |
| REC-055 | 2. Gestion locative | Rotation `BETTER_AUTH_SECRET` : toutes les URLs par canal sont refusées. |  |  |  |  |  |
| REC-056 | 2. Gestion locative | Connecteurs API natifs : non testés, car non activés sans contrat partenaire ; aucun écran ne doit laisser croire le contraire. |  |  |  |  |  |
| REC-057 | 2. Gestion locative | Portail voyageur signé : séjour, guide, extras, incident. |  |  |  |  |  |
| REC-058 | 2. Gestion locative | Voyageur sans JavaScript à 320 px sur un vrai téléphone ancien. |  |  |  |  |  |
| REC-059 | 2. Gestion locative | PWA installée, hors ligne, rejeu IndexedDB. |  |  |  |  |  |
| REC-060 | 2. Gestion locative | Facture : PDF, XML Factur-X, envoi email, paiement manuel, solde. |  |  |  |  |  |
| REC-061 | 2. Gestion locative | Caution : réception, restitution, retenue motivée. |  |  |  |  |  |
| REC-062 | 2. Gestion locative | Design : bascule des 4 thèmes, persistance après reconnexion, rendu mobile et contraste réel sur écran. |  |  |  |  |  |
| REC-063 | 2. Gestion locative | Identité : nom, logo, accent et contacts visibles sur `/`, `/login`, `/legales` et le manifeste ; accent trop clair refusé ; retour au repli env. |  |  |  |  |  |
| REC-064 | 2. Gestion locative | Stocks : rotation de ménage, seuils, liste de courses, réassort, historique des mouvements. |  |  |  |  |  |
| REC-065 | 2. Gestion locative | Inventaire : QR imprimé scanné sur place, usage + lavage, état, alertes dormant/garantie/remplacement, coût par séjour. |  |  |  |  |  |
| REC-066 | 2. Gestion locative | Tourisme : lieu global et lieu par logement, filtre `?cat=`, lien extra, désactivation, rendu sans JavaScript. |  |  |  |  |  |
| REC-067 | 2. Gestion locative | Réservation directe : catalogue tenant, devis complet, dates sans tarif refusées, chevauchement refusé, email client enregistré, honeypot, lien espace séjour, visibilité en brouillon côté planning. |  |  |  |  |  |
| REC-068 | 2. Gestion locative | Mémoire voyageur : opt-in, mise à jour, effacement, email absent de la base (seulement le hash), expiration à 24 mois, purge cron. |  |  |  |  |  |
| REC-069 | 2. Gestion locative | Avis : dépôt voyageur sans JavaScript, un seul avis par séjour, moyenne des avis publiés, masquage/publication côté hôte, isolation tenant. |  |  |  |  |  |
| REC-070 | 2. Gestion locative | États des lieux : constat depuis l’inventaire durable, bien manquant chiffré au prix d’achat, dégradations signalées, historique par logement, isolation tenant. |  |  |  |  |  |
| REC-071 | 2. Gestion locative | Carnet d’entretien : intervention (entretien/réparation/contrôle), coût cumulé, prestataire, historique par logement, isolation tenant. |  |  |  |  |  |
| REC-072 | 2. Gestion locative | Ménage : planification liée à un séjour, checklist cochée, avancement, passage à « fait » et consommation de rotation une seule fois, isolation tenant. |  |  |  |  |  |
| REC-073 | 2. Gestion locative | Contrat : lien signé, parties/logement/séjour/prix exacts, caution affichée si présente, signature falsifiée refusée. |  |  |  |  |  |
| REC-074 | 2. Gestion locative | Questionnaire : dépôt voyageur sans JS, une seule réponse par séjour, moyennes par critère côté hôte, isolation tenant. |  |  |  |  |  |
| REC-075 | 2. Gestion locative | Phrases types : modèles installés une fois, variables remplacées, édition, suppression, isolation tenant. |  |  |  |  |  |
| REC-076 | 2. Gestion locative | Formation : progression par module et par membre, reprise après rechargement, étapes inconnues ignorées. |  |  |  |  |  |
| REC-077 | 2. Gestion locative | Objets trouvés : déclaration, réclamation à 15 €, envoi, don bloqué avant 30 jours, isolation tenant. |  |  |  |  |  |
| REC-078 | 2. Gestion locative | Tranquillité : mesures dB jour/nuit, dépassements, attestations, lettre au syndic sur 12 mois glissants, isolation tenant. |  |  |  |  |  |
| REC-079 | 2. Gestion locative | Annonce : 9 mentions, étiquettes DPE/GES, classement, conformité recalculée et persistance par logement. |  |  |  |  |  |
| REC-080 | 2. Gestion locative | RGPD : 7 traitements, DPO, hébergement, durées, complétude et désactivation d’un traitement. |  |  |  |  |  |
| REC-081 | 2. Gestion locative | Sinistres : déclaration idempotente, franchise, expertise, indemnisation, clôture et montants attendus. |  |  |  |  |  |
| REC-082 | 2. Gestion locative | Dispatch : une offre active par mission, retrait, acceptation avec réassignation, réponse prestataire. |  |  |  |  |  |
| REC-083 | 2. Gestion locative | Messages voyageurs : refus des codes d’accès, brouillon, envoi e-mail réel (Mailpit) ou marquage manuel, unicité et journalisation. Canal SMS : numéro normalisé et envoi Brevo si `SMS_ENABLED=true`. Validé en local le 2026-10-26 : message reçu par Mailpit avec l’adresse saisie, statut `envoye` après succès SMTP. |  |  |  |  |  |
| REC-084 | 2. Gestion locative | Préférences séjour : bornes 0–30 jours, heure HH:MM, mise à jour idempotente par réservation, formulaire sans JS. |  |  |  |  |  |
| REC-085 | 2. Gestion locative | Accès : registre nominatif, session courante non révocable, révocation effective (session supprimée et utilisateur déconnecté). |  |  |  |  |  |
| REC-086 | 2. Gestion locative | Ménage : évaluation réservée aux rotations faites, bornes score 1–5, coût et durée, moyennes et alerte qualité sous 3,5. |  |  |  |  |  |
| REC-087 | 2. Gestion locative | Assistant : routage selon intention/ton, prompt borné, refus des codes d’accès, comparaison neutre/chaleureux/concis, garde-fous de sortie (80 mots, PIN, promesses), quotas 20/heure et 100/mois, budget 10 €/mois, brouillon déterministe local, adapter LLM OpenAI-compatible optionnel avec repli local, enregistrement idempotent en message brouillon puis envoi e-mail ou marquage manuel. |  |  |  |  |  |
| REC-088 | 2. Gestion locative | LLM distant (si `LLM_API_URL`/`LLM_API_KEY`) : génération réelle, modèle premium sur avis chaleureux, repli local si erreur HTTP ou timeout. |  |  |  |  |  |
| REC-089 | 2. Gestion locative | Audit : bornes 90 jours par défaut, filtres 7/30/90 j et famille, recherche, export CSV filtré limité à 5 000 lignes, rétention affichée et purge manuelle protégée par confirmation. |  |  |  |  |  |
| REC-090 | 2. Gestion locative | Mission : création staff, exécution prestataire, statuts. |  |  |  |  |  |
| REC-091 | 2. Gestion locative | Portail propriétaire : rattachement, commission, relevé, isolation. |  |  |  |  |  |
| REC-092 | 2. Gestion locative | CRM : prospect, offre, pipeline. |  |  |  |  |  |
| REC-093 | 2. Gestion locative | Support : ticket, réponse, résolution. |  |  |  |  |  |
| REC-094 | 2. Gestion locative | Recherche globale `/hote/recherche` : refs réservation/facture/paiement, groupement par catégorie, requête < 2 caractères refusée, isolation tenant. |  |  |  |  |  |
| REC-095 | 2. Gestion locative | Audit : les actions ci-dessus apparaissent dans `/hote/audit`. |  |  |  |  |  |
| REC-096 | 3. Paiements Stripe | Checkout test depuis une facture publique. |  |  |  |  |  |
| REC-097 | 3. Paiements Stripe | Retour `?paiement=ok` et facture soldée. |  |  |  |  |  |
| REC-098 | 3. Paiements Stripe | Webhook signé accepté ; signature invalide refusée. |  |  |  |  |  |
| REC-099 | 3. Paiements Stripe | Rejeu du même webhook : idempotent, pas de double paiement. |  |  |  |  |  |
| REC-100 | 3. Paiements Stripe | Paiement partiel, surpaiement refusé. |  |  |  |  |  |
| REC-101 | 3. Paiements Stripe | Passage en mode live après validation test. |  |  |  |  |  |
| REC-102 | 4. Emails | Envoi d’une facture à une adresse réelle. |  |  |  |  |  |
| REC-103 | 4. Emails | Réception, expéditeur, reply-to, lien public. |  |  |  |  |  |
| REC-104 | 4. Emails | Email désactivé : l’application ne casse pas et affiche l’erreur. |  |  |  |  |  |
| REC-105 | 4. Emails | Domaine SPF/DKIM/DMARC si Brevo/OVH. |  |  |  |  |  |
| REC-106 | 4. Emails | Boîte de réception et spam vérifiés. |  |  |  |  |  |
| REC-107 | 5. Intégrations et cron | Webhook HA/Moli : création, secret, livraison, signature `X-LCD-Signature`. |  |  |  |  |  |
| REC-108 | 5. Intégrations et cron | Adaptateur `RuntimeBox` réel : config `BOX_RUNTIME_CONFIG`, état, commande HA ou générique, Bearer token, timeout. |  |  |  |  |  |
| REC-109 | 5. Intégrations et cron | Cron `/api/cron/webhooks` avec `CRON_SECRET` ; sans secret → `401/503`. |  |  |  |  |  |
| REC-110 | 5. Intégrations et cron | Cron `/api/cron/sync-ota` avec `CRON_SECRET` ; flux réel. |  |  |  |  |  |
| REC-111 | 5. Intégrations et cron | Cron `/api/cron/memoire` avec `CRON_SECRET` ; sans secret → `401/503`, purge réelle des entrées expirées. |  |  |  |  |  |
| REC-112 | 5. Intégrations et cron | Cron `/api/cron/purge-police` : créer une fiche avec `purge_at` passée (SQL), lancer le cron, vérifier la suppression et le compteur `supprimees`. |  |  |  |  |  |
| REC-113 | 5. Intégrations et cron | GitHub Actions `v2-sync-ota` et `v2-webhooks` avec secrets configurés. |  |  |  |  |  |
| REC-114 | 5. Intégrations et cron | Test d’échec : URL webhook morte, retry/backoff, statut `failed`. |  |  |  |  |  |
| REC-115 | 5. Intégrations et cron | Connecteurs HA/Moli spécifiques : adaptateur HTTP générique/HA testé ; API Moli propriétaire à cadrer avec le fournisseur. |  |  |  |  |  |
| REC-116 | 6. Observabilité, sauvegardes et exploitation | `SENTRY_DSN` configuré : une erreur serveur et une erreur client apparaissent dans Sentry. |  |  |  |  |  |
| REC-117 | 6. Observabilité, sauvegardes et exploitation | Uptime Kuma : monitors `/api/health`, `/api/ready`, `/login`. |  |  |  |  |  |
| REC-118 | 6. Observabilité, sauvegardes et exploitation | Alerte testée (email/ntfy) sur arrêt volontaire. |  |  |  |  |  |
| REC-119 | 6. Observabilité, sauvegardes et exploitation | `MIGRATION_DATABASE_URL` configuré dans GitHub Secrets. |  |  |  |  |  |
| REC-120 | 6. Observabilité, sauvegardes et exploitation | Backup GitHub Actions vert, artefact téléchargeable. |  |  |  |  |  |
| REC-121 | 6. Observabilité, sauvegardes et exploitation | Restauration réelle dans une base de staging : comptes, logements, réservations, factures, paiements. Validé en local le 2026-10-26 : checksum refusé si altéré, manifeste comparé (1 tenant, 196 users, 1 260 logements, 54 tables, 81 migrations). |  |  |  |  |  |
| REC-122 | 6. Observabilité, sauvegardes et exploitation | Copie hors site (R2/rsync) vérifiée. |  |  |  |  |  |
| REC-123 | 6. Observabilité, sauvegardes et exploitation | Rotation `BETTER_AUTH_SECRET` testée : liens voyageur/facture/calendrier invalidés, sessions invalides. |  |  |  |  |  |
| REC-124 | 6. Observabilité, sauvegardes et exploitation | Rotation du token Netlify et du mot de passe admin. |  |  |  |  |  |
| REC-125 | 6. Observabilité, sauvegardes et exploitation | Super-admin réel : `/supervision`, `/systeme`, `/secrets`, `/journal` avec `MIGRATION_DATABASE_URL` ; vérifier l’accès refusé pour un admin ordinaire et l’absence de valeur de secret dans le HTML. |  |  |  |  |  |
| REC-126 | 6. Observabilité, sauvegardes et exploitation | Retirer `MIGRATION_DATABASE_URL` : les quatre pages affichent un avertissement, sans repli sur la connexion RLS. |  |  |  |  |  |
| REC-127 | 6. Observabilité, sauvegardes et exploitation | « Voir comme » : bandeau, écritures refusées (formulaire et appel direct), arrêt, audit `apercu.demarrer/arreter`, cookie expiré après 2 h. |  |  |  |  |  |
| REC-128 | 7. Performance et compatibilité | Lighthouse mobile sur `/`, `/login`, `/voyageur`. |  |  |  |  |  |
| REC-129 | 7. Performance et compatibilité | Test 3G lente / CPU throttle sur un téléphone réel. |  |  |  |  |  |
| REC-130 | 7. Performance et compatibilité | 320 px, 360 px, 390 px, 768 px, desktop. |  |  |  |  |  |
| REC-131 | 7. Performance et compatibilité | Budget JS `/voyageur` mesuré : `npm run measure:js`. |  |  |  |  |  |
| REC-132 | 7. Performance et compatibilité | Marque blanche : `MARQUE`/`MARQUE_COURTE` changés puis redémarrage ; landing, titre d’onglet, manifeste et pied de page cohérents, sans « LCD Parc » résiduel. |  |  |  |  |  |
| REC-133 | 7. Performance et compatibilité | Charge : 30 utilisateurs simultanés, 100 réservations, 30 flux OTA. |  |  |  |  |  |
| REC-134 | 7. Performance et compatibilité | `pg_dump`/restore chronométré (RTO < 30 min). |  |  |  |  |  |
| REC-135 | 7. Performance et compatibilité | Aucun 5xx dans Sentry après 24 h de pilote. |  |  |  |  |  |
| REC-136 | 7. Performance et compatibilité | **Lighthouse rejoué après tout changement d'images, de police ou de CSS** : la première mesure avait révélé deux régressions invisibles à l'œil (image LCP en `loading="lazy"`, photos de 1000 px dans une vignette de 360 px), la seconde un CLS de 0,289 déclenché par la simple largeur des liens de navigation. Relancer `npm run assets:photos` après avoir changé une photo, puis la commande ci-dessus : le protocole exact est dans `specs/004-ergonomie-experience-client/quickstart.md` § 10.7. |  |  |  |  |  |
| REC-137 | 7. Performance et compatibilité | **Test utilisateurs n° 2 (5 personnes)** : demande de réservation sans aide en < 3 min (SC-001), 80 % de réussite, SUS ≥ 80 ou SEQ ≥ 5,5/7 (SC-010). |  |  |  |  |  |
| REC-138 | 7. Performance et compatibilité | **Test voyageur** : trouver Wi-Fi, accès et heure de départ en < 10 s sur `/voyageur` (SC-003). |  |  |  |  |  |
| REC-139 | 7. Performance et compatibilité | **Lecteur d'écran réel** (NVDA ou VoiceOver) sur les trois parcours P1 : `/` → `/reserver` → confirmation, `/voyageur`, `/hote` → `/hote/planning`. axe ne remplace pas une navigation réelle au lecteur d'écran. |  |  |  |  |  |
| REC-140 | 7. Performance et compatibilité | **Thème non conforme** : tenter de publier un thème échouant au contraste AA et tenter un thème échouant aux cibles 44 px ; vérifier les deux refus (SC-012, `/supervision/apparence`). |  |  |  |  |  |
| REC-141 | 7. Performance et compatibilité | **Recette super-admin ergonomie** : brouillon, aperçu, blocage, correction, publication sur un thème réel (T103). |  |  |  |  |  |
| REC-142 | 7. Performance et compatibilité | **Parcours mesurés en conditions réelles** : après quelques jours d'usage, relire `suivi_evenements` (P-RESA, P-SEJOUR, P-RECHERCHE, P-HOTE-5) et confirmer qu'aucune donnée personnelle n'y apparaît ; vérifier la purge (`npm run db:purge-suivi`). |  |  |  |  |  |
| REC-143 | 7. Performance et compatibilité | **Appareil mobile réel 320 px** : confirmer l'absence de défilement horizontal et le confort des cibles tactiles sur un téléphone étroit. |  |  |  |  |  |
| REC-144 | 7. Performance et compatibilité | **Rejouer la suite e2e sur un serveur provisionné** : le serveur de démonstration lancé à la main n'a pas `ENQUIRY_ENABLED`, ce qui fait échouer à tort les 10 tests de `demande-sejour.spec.ts` (`?/demande` n'est rendu que si le drapeau est actif). Pour une passe complète et verte : `ENQUIRY_ENABLED=true`, `APP_URL`/`BETTER_AUTH_URL` sur le port du serveur, plus `DATABASE_URL`/`MIGRATION_DATABASE_URL` exportés depuis `.env.demo.local` (base `lcd_demo`) avant `npx playwright test`. Résultat attendu : 260 tests, 0 échec (voir `specs/004-ergonomie-experience-client/resultats.md` § 2.1). |  |  |  |  |  |
| REC-145 | 7. Performance et compatibilité | **Incohérence de rôle à instruire** : `admin@lcd.test` est `admin` dans la base `lcd` mais `super_admin` dans `lcd_demo`, et `/support` ne reconnaît comme staff que `admin`/`hote` alors que `requireRole` laisse tout faire à `super_admin` (`src/routes/support/+page.server.ts:18`). Décider si `super_admin` doit être staff partout, puis aligner les deux bases de démonstration. |  |  |  |  |  |
| REC-146 | 7. Performance et compatibilité | **Au déploiement, après le déploiement** (décision du 2026-11-13) : supprimer les **faux comptes et faux logements créés pour tester** — 120 comptes `@lcd.test`, 614 logements sur 617 (fixtures `E2E…`, `Onboarding…`, `Logement plan/dérivé/Archive/Recherche…`, `Relevé…`, `Import…`, `Proprio A/B…`, `Diag…`) et leurs dépendances — en gardant Villa Santa Severa, Le Mas des Oliviers, Le Loft du Port. Ces données sont nécessaires pour tester : on ne les supprime pas maintenant. Procédure complète et outil dédié (lecture seule par défaut, trois verrous avant écriture) : `DEPLOIEMENT.md` § 8 et `npm run db:nettoyer-recette`. Tant que ce n'est pas fait, deux tests au moins (`confiance.spec.ts`, `ergonomie-reservation.spec.ts`) peuvent échouer sur « le tunnel de réservation n'a abouti sur aucune des six tentatives » : échec connu, accepté et tracé (friction R-11). |  |  |  |  |  |
| REC-147 | 7. Performance et compatibilité | Correctif de fond à instruire : que chaque spec qui crée un logement le supprime en fin de test (ou travaille dans un tenant dédié). Élargir le vivier du tunnel au sélecteur des 64 logements a été mesuré **contre-productif** (2 → 5 échecs) : 61 candidats sur 64 n'ont pas de tarif. |  |  |  |  |  |
| REC-148 | 8. Conformité et facturation | Mentions légales, RGPD, politique de confidentialité, DPA. |  |  |  |  |  |
| REC-149 | 8. Conformité et facturation | Factur-X validé par une plateforme de dématérialisation (PDF/A-3 signé non implémenté). |  |  |  |  |  |
| REC-150 | 8. Conformité et facturation | ZIP mensuel `/api/exports/factur-x` déposé sur une PDP/Chorus de test : factures acceptées, doublons et mois vide refusés proprement. |  |  |  |  |  |
| REC-151 | 8. Conformité et facturation | Rapprochement sur un relevé bancaire réel anonymisé : formats débit/crédit séparés, virements internes, orphelines >7 j, alerte 2 %. |  |  |  |  |  |
| REC-152 | 8. Conformité et facturation | Vérification SIREN/TVA de l’entité émettrice. |  |  |  |  |  |
| REC-153 | 8. Conformité et facturation | Numérotation de factures continue et sans trou. |  |  |  |  |  |
| REC-154 | 8. Conformité et facturation | Export complet du tenant testé sur la production (admin). |  |  |  |  |  |
| REC-155 | 8. Conformité et facturation | Procédure d’effacement/archivage client définie. |  |  |  |  |  |

## B. Parcours manuels (`qa-manuel.md`)

Total : **21** parcours.

| ID | Section | Parcours | Date | Opérateur | Résultat | Preuve | Défaut |
| --- | --- | --- | --- | --- | --- | --- | --- |
| QA-001 | 1. Public (sans JavaScript) | `/` : héros photo plein écran, H1 rendu, thème `sejour` appliqué (`--accent:#0e7c6b` en inline style), aucun écran blanc sans JS. |  |  |  |  |  |
| QA-002 | 1. Public (sans JavaScript) | `/reserver` : les 3 logements de démo s'affichent avec tarif. |  |  |  |  |  |
| QA-003 | 1. Public (sans JavaScript) | `/login` : formulaire visible, POST natif fonctionne (mode dégradé), erreurs en français. |  |  |  |  |  |
| QA-004 | 1. Public (sans JavaScript) | `/design` : galerie « Design system » lisible (couleurs, typo, composants). |  |  |  |  |  |
| QA-005 | 1. Public (sans JavaScript) | `/aide`, `/legales`, `/offline` : 200 et contenu rendu. |  |  |  |  |  |
| QA-006 | 2. Voyageur (HTML-first, `csr=false`) | Lien voyageur HMAC : ouvrir un lien `/voyageur?token=…` depuis une réservation ; vérifier en-tête séjour + accordéons. |  |  |  |  |  |
| QA-007 | 2. Voyageur (HTML-first, `csr=false`) | Préférences : remplir ménage/horaire/consignes, enregistrer, recharger — **les valeurs doivent être relues depuis la base** (regression textarea). |  |  |  |  |  |
| QA-008 | 2. Voyageur (HTML-first, `csr=false`) | Formulaire incident et avis : dépôt sans JS (navigateur désactivé), message de confirmation, unicité. |  |  |  |  |  |
| QA-009 | 2. Voyageur (HTML-first, `csr=false`) | Lien facture `/facture/{token}` : facture lisible, aucun lien interne cassé (origine de requête, pas `APP_URL` codé en dur). |  |  |  |  |  |
| QA-010 | 3. Staff (JS, forms natifs) | Connexion `admin@lcd.test` → `/hote` ; chaque rôle route correctement (`presta`→`/presta`, `proprietaire`→`/proprio`, `commercial`→`/commercial`). |  |  |  |  |  |
| QA-011 | 3. Staff (JS, forms natifs) | Assistant : générer un brouillon, vérifier que les **détails saisis apparaissent dans le prompt** (regression textarea) puis enregistrer. |  |  |  |  |  |
| QA-012 | 3. Staff (JS, forms natifs) | Inventaire : « Utilisé + lavé », puis changer l'état — le tableau doit afficher le **nouvel** état (regression `select` + `selected=`). |  |  |  |  |  |
| QA-013 | 3. Staff (JS, forms natifs) | Factures : créer, envoyer (visible dans Mailpit :8025), relancer, message « N facture(s) échue(s) à relancer ». |  |  |  |  |  |
| QA-014 | 3. Staff (JS, forms natifs) | Phrases : installer les modèles, modifier un titre + message avec variables `{voyageur}`/`{logement}`, vérifier l'aperçu substitué. |  |  |  |  |  |
| QA-015 | 3. Staff (JS, forms natifs) | Annonce : DPE/GES sélectionnés, publication, mentions. |  |  |  |  |  |
| QA-016 | 3. Staff (JS, forms natifs) | Audit : période par défaut « 90 derniers jours », filtre famille, export CSV. |  |  |  |  |  |
| QA-017 | 3. Staff (JS, forms natifs) | Design (super admin) : choisir un thème, publier, vérifier application immédiate sur `/` et changement global pour tous les utilisateurs. |  |  |  |  |  |
| QA-018 | 4. Environnement & pièges connus | Quota assistant : 100 brouillons/mois ; une journée intensive de tests l'épuise. Réinitialiser avec `DELETE FROM assistant_consommations;` (table RLS, requête en superuser `lcd`). |  |  |  |  |  |
| QA-019 | 4. Environnement & pièges connus | Seed démo : `npm run db:seed` (tenant + comptes) puis `npm run db:seed-demo` (3 logements + 120 jours de tarifs, idempotent). |  |  |  |  |  |
| QA-020 | 4. Environnement & pièges connus | Nettoyage post-suites : `UPDATE logements SET statut='archive' WHERE statut='actif' AND code ~ '^(pro-[ab]-|wp-|dbg-|tmp-manual-|.*e2e.*)';` puis republier `sejour` dans `apparence_versions` si un test l'a changé. |  |  |  |  |  |
| QA-021 | 4. Environnement & pièges connus | Ne jamais lancer la pile V1 (`deploy/demarrer.ps1`) ni `lab-run.ps1` (voir AGENTS.md racine). |  |  |  |  |  |

## C. Défauts

| Défaut | Sévérité | Case(s) | Description | Propriétaire | Échéance | Statut | Correctif |
| --- | --- | --- | --- | --- | --- | --- | --- |

## D. Preuves minimales

- [ ] Un e-mail réel reçu dans une boîte externe.
- [ ] Un paiement test de bout en bout (Stripe test).
- [ ] Une sauvegarde restaurée sur une base jetable, avec durée.
- [ ] Un cron exécuté réellement, avec sortie archivée.
- [ ] Un parcours complet sans JavaScript.
- [ ] Un rollback applicatif répété et chronométré.

## E. Signature

- Cases exécutées : ____ / 155
- Parcours exécutés : ____ / 21
- S1 ouverts : ____ · S2 ouverts : ____ · S3 acceptés : ____
- Signataire : ______________________
- Date : ______________________
- Décision : ☐ ouverture autorisée · ☐ ouverture différée · ☐ retour en correction
