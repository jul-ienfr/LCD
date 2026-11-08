# QA manuel — refonte V2 (checklist)

Ordre conseillé : public → voyageur → staff. À faire sur une instance propre
(`npm run db:seed && npm run db:seed-demo`, apparence publiée `sejour`).

## 1. Public (sans JavaScript)

- [ ] `/` : héros photo plein écran, H1 rendu, thème `sejour` appliqué
      (`--accent:#0e7c6b` en inline style), aucun écran blanc sans JS.
- [ ] `/reserver` : les 3 logements de démo s'affichent avec tarif.
- [ ] `/login` : formulaire visible, POST natif fonctionne (mode dégradé),
      erreurs en français.
- [ ] `/design` : galerie « Design system » lisible (couleurs, typo, composants).
- [ ] `/aide`, `/legales`, `/offline` : 200 et contenu rendu.

## 2. Voyageur (HTML-first, `csr=false`)

- [ ] Lien voyageur HMAC : ouvrir un lien `/voyageur?token=…` depuis une
      réservation ; vérifier en-tête séjour + accordéons.
- [ ] Préférences : remplir ménage/horaire/consignes, enregistrer, recharger —
      **les valeurs doivent être relues depuis la base** (regression textarea).
- [ ] Formulaire incident et avis : dépôt sans JS (navigateur désactivé),
      message de confirmation, unicité.
- [ ] Lien facture `/facture/{token}` : facture lisible, aucun lien interne
      cassé (origine de requête, pas `APP_URL` codé en dur).

## 3. Staff (JS, forms natifs)

- [ ] Connexion `admin@lcd.test` → `/hote` ; chaque rôle route correctement
      (`presta`→`/presta`, `proprietaire`→`/proprio`, `commercial`→`/commercial`).
- [ ] Assistant : générer un brouillon, vérifier que les **détails saisis
      apparaissent dans le prompt** (regression textarea) puis enregistrer.
- [ ] Inventaire : « Utilisé + lavé », puis changer l'état — le tableau doit
      afficher le **nouvel** état (regression `select` + `selected=`).
- [ ] Factures : créer, envoyer (visible dans Mailpit :8025), relancer,
      message « N facture(s) échue(s) à relancer ».
- [ ] Phrases : installer les modèles, modifier un titre + message avec
      variables `{voyageur}`/`{logement}`, vérifier l'aperçu substitué.
- [ ] Annonce : DPE/GES sélectionnés, publication, mentions.
- [ ] Audit : période par défaut « 90 derniers jours », filtre famille,
      export CSV.
- [ ] Design (super admin) : choisir un thème, publier, vérifier application
      immédiate sur `/` et changement global pour tous les utilisateurs.

## 4. Environnement & pièges connus

- [ ] Quota assistant : 100 brouillons/mois ; une journée intensive de tests
      l'épuise. Réinitialiser avec
      `DELETE FROM assistant_consommations;` (table RLS, requête en superuser
      `lcd`).
- [ ] Seed démo : `npm run db:seed` (tenant + comptes) puis
      `npm run db:seed-demo` (3 logements + 120 jours de tarifs, idempotent).
- [ ] Nettoyage post-suites : `UPDATE logements SET statut='archive' WHERE
      statut='actif' AND code ~ '^(pro-[ab]-|wp-|dbg-|tmp-manual-|.*e2e.*)';`
      puis republier `sejour` dans `apparence_versions` si un test l'a changé.
- [ ] Ne jamais lancer la pile V1 (`deploy/demarrer.ps1`) ni `lab-run.ps1`
      (voir AGENTS.md racine).
