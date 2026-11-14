# Contrat — Navigation par tâches

**Feature**: `004-ergonomie-experience-client`

**Statut**: proposition

**Portée**: navigation staff, recherche globale, fil d'Ariane, états actifs.
La navigation publique et voyageur est décrite dans `ergonomie.md`.

## 1. Principes

1. La navigation représente des **domaines de travail**, pas l'arborescence des
   routes.
2. Un utilisateur doit pouvoir répondre à « où suis-je ? », « que puis-je
   faire ? » et « comment revenir ? » sans mémoriser l'URL.
3. Les entrées principales sont stables entre les rôles ; seules les entrées
   autorisées changent.
4. Les fonctions rares sont dans un groupe secondaire nommé, jamais dans un
   « Plus » fourre-tout.
5. La recherche est un point d'entrée permanent, pas un écran caché.

## 2. Modèle

```ts
type Role =
  | "super_admin"
  | "admin"
  | "hote"
  | "operateur"
  | "comptable"
  | "presta"
  | "proprietaire"
  | "commercial";

interface EntreeNavigation {
  id: string;
  libelle: string;          // clé i18n
  href: string;
  domaine: string;
  roles: Role[];
  priorite: "principale" | "secondaire" | "rare";
  parent?: string;
  description?: string;     // clé i18n
  badge?: "urgences" | "retards" | "messages" | "impayes";
}
```

## 3. Navigation par rôle

### 3.1 Hôte, administrateur, opérateur — 7 entrées

| # | Entrée | href | Sous-domaines |
|---|---|---|---|
| 1 | Aujourd'hui | `/hote` | — |
| 2 | Planning | `/hote/planning` | Canaux, Prix, Promotions, Import ICS |
| 3 | Logements | `/hote/logements` | Guides, Accès, Annonce, Inventaire, Stocks |
| 4 | Voyageurs | `/hote/messages` | Fils, Demandes, Extras, Avis, Questionnaires, Objets trouvés, Sinistres, Tranquillité, Tourisme |
| 5 | Finances | `/hote/factures` | Compta, Cautions, Rapports, Propriétaires |
| 6 | Opérations | `/hote/menage` | Missions, Dispatch, Entretien, États des lieux, Automatisations, Notifications |
| 7 | Administration | `/hote/utilisateurs` | Sécurité, Intégrations, Audit, Conformité, Recherche, Réglages groupe |

Les entrées `Administration` ne sont visibles que pour `admin` et
`super_admin`. Pour `hote` et `operateur`, l'entrée 7 est remplacée par
`Réglages` limité à son périmètre, ou supprimée si aucun droit.

`super_admin` ajoute une **entrée utilitaire** `Supervision` dans le menu
utilisateur, pas dans les 7 domaines, pour ne pas mélanger exploitation et
plateforme.

### 3.2 Comptable — 5 entrées

| # | Entrée | href |
|---|---|---|
| 1 | Factures | `/hote/factures` |
| 2 | Comptabilité | `/hote/compta` |
| 3 | Rapprochement | `/hote/compta/rapprochement` |
| 4 | Rapports | `/hote/rapports` |
| 5 | Recherche | `/hote/recherche` |

### 3.3 Prestataire — 4 entrées

| # | Entrée | href |
|---|---|---|
| 1 | Ma mission | `/presta` |
| 2 | Mes interventions | `/presta` (ancre ou filtre) |
| 3 | Sécurité | `/hote/securite` |
| 4 | Aide | `/aide` |

### 3.4 Propriétaire — 4 entrées

| # | Entrée | href |
|---|---|---|
| 1 | Relevés | `/proprio/releves` |
| 2 | Mon espace | `/proprio` |
| 3 | Documents | `/proprio` (section) |
| 4 | Aide | `/aide` |

### 3.5 Commercial — 4 entrées

| # | Entrée | href |
|---|---|---|
| 1 | Pipeline | `/commercial` |
| 2 | Prospects | `/commercial` (filtre) |
| 3 | Simulateur | `/commercial` (ancre) |
| 4 | Aide | `/aide` |

### 3.6 Super-admin — 7 domaines + supervision

Les 7 domaines de l'administrateur, plus `Supervision` en utilitaire :
`/supervision`, `/supervision/apparence`, `/supervision/fournisseurs`,
`/supervision/assistant`, `/supervision/voir-comme`, `/systeme`, `/journal`,
`/secrets`.

## 4. Recherche globale

- Formulaire GET vers `/hote/recherche` avec `q`.
- Visible dans l'en-tête staff sur toutes les pages.
- Champs acceptés : référence (`RES-…`, `FAC-…`), nom de logement, nom de
  voyageur, e-mail (recherche exacte), ville.
- Longueur minimale : 2 caractères ; maximum : 64.
- Résultats groupés : Logements, Voyageurs, Réservations, Factures, Incidents.
- Aucun résultat : message + exemples de recherche.
- Sans JS : soumission native, page de résultats complète.
- Avec JS : raccourci `/` ou `Ctrl+K` en amélioration, jamais obligatoire.
- Les résultats respectent le rôle et le tenant ; aucune fuite.

## 5. Fil d'Ariane

### 5.1 Règle

- Affiché sur toute page dont la profondeur est > 1.
- Dérivé du modèle (`parent`), pas écrit à la main.
- Le dernier élément est la page courante, non cliquable, `aria-current="page"`.
- Le premier élément est le domaine (`Aujourd'hui`, `Planning`, etc.).
- Sur mobile, le fil peut être compacté en « ‹ Retour au domaine » + titre.

### 5.2 Exemples

| Route | Fil |
|---|---|
| `/hote/logements` | Aujourd'hui / Logements |
| `/hote/logements/[id]/calendrier` | Aujourd'hui / Logements / {nom} / Calendrier |
| `/hote/factures/[id]` | Aujourd'hui / Finances / Factures / {numéro} |
| `/supervision/apparence` | Supervision / Apparence |

## 6. État actif

- `aria-current="page"` sur l'entrée dont le `href` correspond exactement ou
  par préfixe.
- Le groupe parent est visuellement actif si un enfant est actif.
- L'entrée active est annoncée par le lecteur d'écran.
- Aucun état actif multiple dans la même liste.

## 7. Comportement mobile

- En-tête compact : logo, recherche, menu.
- Le menu est un `<details>` ou un `<dialog>` natif, pas un menu dépendant de
  JS.
- Les 7 domaines sont visibles dans le menu, groupés, avec des cibles ≥ 44 px.
- Les sous-domaines sont des sections repliables.
- Pas de barre inférieure sur le staff (elle masquerait des tableaux) ; la
  barre inférieure est réservée au tunnel et au voyageur.
- Le menu se ferme après navigation (comportement natif du lien).
- Le focus revient au déclencheur après fermeture si un îlot JS est utilisé.

## 8. Raccourcis et personnalisation

- Raccourcis clavier : recherche (`/` ou `Ctrl+K`) en amélioration.
- « Récents » : optionnel, P3, basé sur les dernières routes visitées, sans
  stockage serveur.
- « Favoris » : hors périmètre initial ; ne pas ajouter de table.
- Aucune personnalisation de thème par utilisateur.

## 9. Migration et compatibilité

- Les anciennes routes restent valides ; aucune redirection cassante.
- Les libellés actuels peuvent rester en double pendant une phase
  (ancien + nouveau) pour les utilisateurs habitués.
- Le flag serveur `ERGONOMIE_NAV=ancienne|nouvelle` est temporaire et supprimé
  après la gate G4.
- Les tests E2E de navigation couvrent chaque rôle et chaque entrée principale.

## 10. Recette

- [ ] Au plus 7 entrées principales par rôle.
- [ ] Aucun lien hors rôle visible.
- [ ] Recherche accessible partout, sans JS.
- [ ] Fil d'Ariane sur toutes les pages profondes.
- [ ] `aria-current="page"` correct.
- [ ] Menu mobile utilisable à 320 px, cibles ≥ 44 px.
- [ ] Aucun doublon de destination.
- [ ] Retour arrière du navigateur cohérent.
- [ ] Tests `super-admin`, `auth`, `prestations`, `proprietaire`,
      `commercial` verts.
