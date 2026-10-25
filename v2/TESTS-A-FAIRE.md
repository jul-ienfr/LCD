# Tests restant à faire après déploiement

Ce document liste ce qui ne peut pas être validé tant que l’application n’est
pas déployée sur l’hébergement réel, ou tant que les services externes ne sont
pas configurés. Les tests locaux déjà faits sont rappelés en fin de document.

## 0. Pré-requis de la recette

- [ ] URL HTTPS publique stable.
- [ ] `DATABASE_URL` pointe sur le rôle **`lcd_app`**, pas le owner.
- [ ] `MIGRATION_DATABASE_URL` (owner) disponible pour migrations/backups.
- [ ] Migrations `0026` → `0044` appliquées.
- [ ] `npm run db:test-rls` exécuté sur la base de production :
  `RLS VALIDÉE : isolation tenant effective`.
- [ ] `/api/health` → `200`, `/api/ready` → `200`, `db: up`, `schema: ok`.
- [ ] `/api/ready` bien **503 `schema: pending`** si une migration manque
  (test à faire sur une base de staging vide ou incomplète).

## 1. Auth, rôles et sécurité

- [ ] Connexion admin, déconnexion, reconnexion.
- [ ] Enrôlement TOTP, déconnexion, reconnexion avec code TOTP.
- [ ] Code TOTP invalide refusé ; trop de tentatives verrouillées.
- [ ] `/api/auth/sign-up/email` refusé (`400`) sur la production.
- [ ] `tenantId` et `role` refusés par `/api/auth/update-user`
  (`FIELD_NOT_ALLOWED`).
- [ ] Création d’un compte par admin, connexion du compte.
- [ ] Réinitialisation du mot de passe : sessions fermées.
- [ ] Désactivation : session fermée, connexion refusée.
- [ ] Changement de rôle : accès recalculé sans reconnexion.
- [ ] Dernier admin : désactivation et retrait de rôle refusés.
- [ ] Non-admin : `/hote`, `/hote/utilisateurs`, `/hote/audit` refusés.
- [ ] Prestataire : `/hote/securite` accessible, `/hote` refusé.
- [ ] Exports CSV et JSON complets refusés aux non-admins/hôtes/comptables
  selon les règles.
- [ ] Aucun secret dans l’export JSON complet (webhooks, URLs ICS,
  credentials).
- [ ] Rate limit de connexion vérifié (trop de tentatives → refus temporaire).
- [ ] 2FA réellement exigée après activation, sur un autre navigateur.

## 2. Gestion locative

- [ ] Création/modification logement, guide, WiFi, règles.
- [ ] Entité juridique : nature, régime, TVA, SIREN, adresse, mentions ;
  SIREN invalide refusé.
- [ ] Facture HTML/PDF/Factur-X : nom, adresse, SIREN et mentions de l’entité.
- [ ] Mandat logement : mode propre/mandat tiers, commission, statut, dates,
  notes ; commission forcée à 0 en mode propre.
- [ ] Portail propriétaire : commission et net cohérents avec le mandat.
- [ ] Prix par jour, plusieurs logements, isolation.
- [ ] Réservation manuelle, anti-chevauchement, annulation.
- [ ] Import ICS manuel + flux HTTPS + cron OTA.
- [ ] Blocages OTA sans impact CA.
- [ ] Export ICS : abonnement Google Calendar ou Apple Calendar réel.
- [ ] Lien ICS invalide → `401` ; mauvais logement → `401`.
- [ ] Portail voyageur signé : séjour, guide, extras, incident.
- [ ] Voyageur sans JavaScript à 320 px sur un vrai téléphone ancien.
- [ ] PWA installée, hors ligne, rejeu IndexedDB.
- [ ] Facture : PDF, XML Factur-X, envoi email, paiement manuel, solde.
- [ ] Caution : réception, restitution, retenue motivée.
- [ ] Design : bascule des 4 thèmes, persistance après reconnexion, rendu
  mobile et contraste réel sur écran.
- [ ] Stocks : rotation de ménage, seuils, liste de courses, réassort,
  historique des mouvements.
- [ ] Inventaire : QR imprimé scanné sur place, usage + lavage, état,
  alertes dormant/garantie/remplacement, coût par séjour.
- [ ] Tourisme : lieu global et lieu par logement, filtre `?cat=`, lien extra,
  désactivation, rendu sans JavaScript.
- [ ] Réservation directe : catalogue tenant, devis complet, dates sans tarif
  refusées, chevauchement refusé, email client enregistré, honeypot, lien
  espace séjour, visibilité en brouillon côté planning.
- [ ] Mémoire voyageur : opt-in, mise à jour, effacement, email absent de la
  base (seulement le hash), expiration à 24 mois, purge cron.
- [ ] Avis : dépôt voyageur sans JavaScript, un seul avis par séjour,
  moyenne des avis publiés, masquage/publication côté hôte, isolation tenant.
- [ ] États des lieux : constat depuis l’inventaire durable, bien manquant
  chiffré au prix d’achat, dégradations signalées, historique par logement,
  isolation tenant.
- [ ] Carnet d’entretien : intervention (entretien/réparation/contrôle), coût
  cumulé, prestataire, historique par logement, isolation tenant.
- [ ] Ménage : planification liée à un séjour, checklist cochée, avancement,
  passage à « fait » et consommation de rotation une seule fois, isolation
  tenant.
- [ ] Contrat : lien signé, parties/logement/séjour/prix exacts, caution
  affichée si présente, signature falsifiée refusée.
- [ ] Questionnaire : dépôt voyageur sans JS, une seule réponse par séjour,
  moyennes par critère côté hôte, isolation tenant.
- [ ] Phrases types : modèles installés une fois, variables remplacées,
  édition, suppression, isolation tenant.
- [ ] Formation : progression par module et par membre, reprise après
  rechargement, étapes inconnues ignorées.
- [ ] Mission : création staff, exécution prestataire, statuts.
- [ ] Portail propriétaire : rattachement, commission, relevé, isolation.
- [ ] CRM : prospect, offre, pipeline.
- [ ] Support : ticket, réponse, résolution.
- [ ] Audit : les actions ci-dessus apparaissent dans `/hote/audit`.

## 3. Paiements Stripe

Configuration requise : `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, endpoint
public `/api/stripe/webhook`.

- [ ] Checkout test depuis une facture publique.
- [ ] Retour `?paiement=ok` et facture soldée.
- [ ] Webhook signé accepté ; signature invalide refusée.
- [ ] Rejeu du même webhook : idempotent, pas de double paiement.
- [ ] Paiement partiel, surpaiement refusé.
- [ ] Passage en mode live après validation test.

## 4. Emails

Configuration requise : `SMTP_URL`, `EMAIL_FROM`, `EMAIL_ENABLED=true`.

- [ ] Envoi d’une facture à une adresse réelle.
- [ ] Réception, expéditeur, reply-to, lien public.
- [ ] Email désactivé : l’application ne casse pas et affiche l’erreur.
- [ ] Domaine SPF/DKIM/DMARC si Brevo/OVH.
- [ ] Boîte de réception et spam vérifiés.

## 5. Intégrations et cron

- [ ] Webhook HA/Moli : création, secret, livraison, signature
  `X-LCD-Signature`.
- [ ] Adaptateur `RuntimeBox` réel : config `BOX_RUNTIME_CONFIG`, état,
  commande HA ou générique, Bearer token, timeout.
- [ ] Cron `/api/cron/webhooks` avec `CRON_SECRET` ; sans secret → `401/503`.
- [ ] Cron `/api/cron/sync-ota` avec `CRON_SECRET` ; flux réel.
- [ ] Cron `/api/cron/memoire` avec `CRON_SECRET` ; sans secret → `401/503`,
  purge réelle des entrées expirées.
- [ ] GitHub Actions `v2-sync-ota` et `v2-webhooks` avec secrets configurés.
- [ ] Test d’échec : URL webhook morte, retry/backoff, statut `failed`.
- [ ] Connecteurs HA/Moli spécifiques : adaptateur HTTP générique/HA testé ;
  API Moli propriétaire à cadrer avec le fournisseur.

## 6. Observabilité, sauvegardes et exploitation

- [ ] `SENTRY_DSN` configuré : une erreur serveur et une erreur client
  apparaissent dans Sentry.
- [ ] Uptime Kuma : monitors `/api/health`, `/api/ready`, `/login`.
- [ ] Alerte testée (email/ntfy) sur arrêt volontaire.
- [ ] `MIGRATION_DATABASE_URL` configuré dans GitHub Secrets.
- [ ] Backup GitHub Actions vert, artefact téléchargeable.
- [ ] Restauration réelle dans une base de staging : comptes, logements,
  réservations, factures, paiements.
- [ ] Copie hors site (R2/rsync) vérifiée.
- [ ] Rotation `BETTER_AUTH_SECRET` testée : liens voyageur/facture/calendrier
  invalidés, sessions invalides.
- [ ] Rotation du token Netlify et du mot de passe admin.

## 7. Performance et compatibilité

- [ ] Lighthouse mobile sur `/`, `/login`, `/voyageur`.
- [ ] Test 3G lente / CPU throttle sur un téléphone réel.
- [ ] 320 px, 360 px, 390 px, 768 px, desktop.
- [ ] Budget JS `/voyageur` mesuré : `npm run measure:js`.
- [ ] Charge : 30 utilisateurs simultanés, 100 réservations, 30 flux OTA.
- [ ] `pg_dump`/restore chronométré (RTO < 30 min).
- [ ] Aucun 5xx dans Sentry après 24 h de pilote.

## 8. Conformité et facturation

- [ ] Mentions légales, RGPD, politique de confidentialité, DPA.
- [ ] Factur-X validé par une plateforme de dématérialisation (PDF/A-3 signé
  non implémenté).
- [ ] Vérification SIREN/TVA de l’entité émettrice.
- [ ] Numérotation de factures continue et sans trou.
- [ ] Export complet du tenant testé sur la production (admin).
- [ ] Procédure d’effacement/archivage client définie.

## Déjà validé localement

- Vitest : **332/332**.
- Playwright : **34/34** sur `next build` + `next start`, y compris une passe
  complète avec `DATABASE_URL`
  sur le rôle applicatif `lcd_app` (RLS active), et une passe complète sur la
  pile compose VPS avec PostgreSQL 18, RLS, seed admin/presta/proprio/
  commercial, Mailpit et Caddy.
- RLS : sans tenant = 0, avec tenant = total, autre tenant = 0, y compris sur
  une base compose fraîchement migrée et seedée.
- Entité juridique et mandats : validation, E2E, factures HTML/PDF/Factur-X.
- Build Netlify et build Docker standalone.
- Pile compose VPS : PostgreSQL 18, migrations `0031`, seed, web, Caddy HTTPS,
  headers, `/api/health`, `/api/ready`.
- Sauvegarde + restauration complètes : 44 tables, comptes, logements,
  réservations, factures, paiements, blocages.
- 2FA TOTP de bout en bout.
- Inscription publique fermée, tenant/rôle non modifiables, exports protégés.
- PWA : cache voyageur, factures/portails privés non cachés, noindex.
