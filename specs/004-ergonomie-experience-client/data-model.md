# Data Model — Ergonomie globale et expérience client

**Date**: 2026-11-12

**Feature**: `004-ergonomie-experience-client`

**Scope**: Modèles conceptuels et contrats de données de la refonte. Aucune
migration PostgreSQL n'est prévue en phase 1.

## 1. Principes

- Les modèles de navigation, de parcours et de critères sont **purs** : aucun
  import SvelteKit, Drizzle ou HTTP.
- Les mesures sont **anonymes** : route, action, durée, résultat ; jamais de
  nom, e-mail, téléphone, token ou contenu de message.
- Les traductions sont **typées** : une clé manquante doit casser le build ou
  le test, pas l'écran.
- Le thème reste **global** : aucun modèle de préférence par utilisateur.

## 2. Surface

```ts
type Surface =
  | "public"
  | "reservation"
  | "voyageur"
  | "staff"
  | "token"
  | "auth";
```

| Surface | Rendu | JS obligatoire | Public cible |
|---|---|---|---|
| `public` | SSR, `csr = false` | Non | Visiteur, prospect |
| `reservation` | SSR, `csr = false` | Non | Visiteur |
| `voyageur` | SSR, `csr = false` | Non | Voyageur avec lien signé |
| `staff` | SSR + îlots | Non pour les actions critiques | Hôte, admin, prestataire… |
| `token` | SSR, `csr = false` | Non | Contrat, facture |
| `auth` | SSR, `csr = false` | Non | Staff |

## 3. Modèle de navigation

```ts
interface ModeleNavigation {
  id: string;
  libelleCle: CleTraduction;
  domaine: DomaineNavigation;
  href: string;
  roles: RoleUtilisateur[];
  priorite: "principale" | "secondaire" | "rare";
  icone?: string;
  raccourci?: string;
  descriptionCle?: CleTraduction;
  parent?: string;
  badge?: () => Promise<number | null>;
}

type DomaineNavigation =
  | "aujourdhui"
  | "planning"
  | "logements"
  | "voyageurs"
  | "finances"
  | "operations"
  | "administration"
  | "supervision";
```

### Invariants

1. Une entrée n'est visible que si le rôle effectif est dans `roles`.
2. Au plus **7 entrées principales** par rôle.
3. Une entrée `rare` ne peut pas être le seul chemin vers une tâche P1.
4. Un `href` ne peut pas être dupliqué dans le même domaine.
5. Le fil d'Ariane est dérivé de `parent`, jamais écrit à la main dans la page.
6. `aria-current="page"` est posé sur l'entrée dont `href` correspond au chemin
   courant, avec correspondance par préfixe pour les sous-routes.

### Domaines proposés

| Domaine | Contenu | Rôles principaux |
|---|---|---|
| Aujourd'hui | Tableau de bord, urgences, arrivées/départs | hôte, admin, opérateur |
| Planning | Calendrier, canaux, prix, promotions | hôte, admin |
| Logements | Fiches, guides, accès, inventaire, stocks | hôte, admin, prestataire |
| Voyageurs | Messages, fils, demandes, avis, questionnaires | hôte, admin |
| Finances | Factures, compta, cautions, rapports | admin, comptable |
| Opérations | Ménage, missions, dispatch, entretien, EDL | hôte, admin, prestataire |
| Administration | Utilisateurs, intégrations, conformité, audit, recherche | admin |
| Supervision | Apparence, système, journal, secrets | super_admin |

## 4. Parcours

```ts
interface Parcours {
  id: string;
  surface: Surface;
  persona: Persona;
  objectifCle: CleTraduction;
  entree: string;
  etapes: EtapeParcours[];
  succes: CritereSucces;
  echecsConnus: string[];
  dureeCibleSecondes: number;
  mesure: MesureParcours;
}

interface EtapeParcours {
  id: string;
  route: string;
  actionCle: CleTraduction;
  obligatoire: boolean;
  sortieAttendue: string;
}
```

### Parcours P1

| ID | Persona | Entrée | Succès | Cible |
|---|---|---|---|---|
| `P-RESA` | Visiteur | `/` | Demande envoyée | < 180 s |
| `P-HOTE-5` | Hôte | `/hote` | 5 tâches réalisées | −30 % vs baseline |
| `P-SEJOUR` | Voyageur | `/voyageur?t=…` | Wi-Fi + accès + départ trouvés | < 10 s |
| `P-INCIDENT` | Voyageur | `/voyageur?t=…` | Incident signalé | < 60 s |
| `P-PRESTA` | Prestataire | `/presta` | Mission clôturée | < 3 min |

## 5. Écran

```ts
interface Ecran {
  route: string;
  surface: Surface;
  roles: RoleUtilisateur[];
  objectifCle: CleTraduction;
  actionPrimaire?: ActionEcran;
  actionsSecondaires: ActionEcran[];
  etats: ("vide" | "chargement" | "erreur" | "succes" | "hors-ligne")[];
  donneesSensibles: boolean;
  pointsDeRupture: number[];
}
```

### Invariants

- Un écran a **un seul** `h1`.
- Un écran a **au plus une** action primaire visible.
- Tout état vide propose une action ou un contact.
- Toute erreur propose une sortie (réessayer, revenir, contacter).
- Toute page profonde a un fil d'Ariane.

## 6. Composant

```ts
interface ComposantErgonomique {
  id: string;
  nom: string;
  surface: Surface[];
  etats: string[];
  tailles: ("petit" | "moyen" | "grand")[];
  cibleTactileMinPx: 44;
  contrasteMin: 4.5;
  sansJs: boolean;
  test: string;
  planDeRetrait: string;
}
```

### Composants à créer

| Composant | Rôle | Sans JS |
|---|---|---|
| `lien-evitement` | Aller au contenu | Oui |
| `fil-ariane` | Contexte et retour | Oui |
| `recherche-globale` | Recherche transverse | Oui (form GET) |
| `indicateur-etapes` | Progression | Oui |
| `resume-prix` | Transparence tarifaire | Oui |
| `barre-action-mobile` | Action au pouce | Oui |
| `champ-erreur` | Erreur liée au champ | Oui |
| `etat-chargement` | Attente visible | Oui (HTML/CSS) |

## 7. Critère ergonomique

```ts
interface CritereErgonomique {
  id: string;
  surface: Surface;
  dimension:
    | "charge-cognitive"
    | "efficacite"
    | "erreurs"
    | "accessibilite"
    | "satisfaction"
    | "performance";
  metrique: string;
  seuil: number;
  unite: string;
  methode: "axe" | "lighthouse" | "playwright" | "test-utilisateur" | "journal";
  obligatoire: boolean;
}
```

### Critères obligatoires (extrait)

| ID | Critère | Seuil |
|---|---|---|
| `CE-001` | Cibles tactiles des contrôles | ≥ 44 px |
| `CE-002` | Contraste texte normal | ≥ 4,5:1 |
| `CE-003` | Débordement horizontal 320 px | 0 |
| `CE-004` | Erreurs axe sérieuses/critiques | 0 |
| `CE-005` | Lighthouse accessibilité | ≥ 90 |
| `CE-006` | Lighthouse performance mobile | ≥ 90 |
| `CE-007` | JS obligatoire public/voyageur | 0 Ko |
| `CE-008` | Temps de demande de réservation | < 180 s |
| `CE-009` | Réussite sans aide | ≥ 80 % |
| `CE-010` | SEQ | ≥ 5,5/7 |

## 8. Mesure

```ts
interface EvenementMesure {
  id: string;
  parcoursId: string;
  surface: Surface;
  route: string;
  action: string;
  resultat: "succes" | "erreur" | "abandon";
  dureeMs?: number;
  etape?: string;
  role?: RoleUtilisateur;
  date: string;
  version: string;
  // Aucun champ PII : pas d'email, nom, téléphone, token, message.
}
```

### Règles

- Agrégation côté serveur, pas de cookie publicitaire.
- Rétention : 90 jours pour les événements bruts, agrégats conservés.
- Pas d'événement sur les pages token ou les champs sensibles.
- Consentement : les mesures essentielles sont agrégées et sans PII ; le suivi
  marketing existant reste soumis au consentement.
- Un événement ne doit jamais contenir une valeur saisie par l'utilisateur.

## 9. Traduction

```ts
type Langue = "fr" | "en" | "es" | "it" | "de";

interface CleTraduction {
  cle: string;
  contexte: string;
  valeurs: Record<Langue, string>;
  longueurMax?: number;
}
```

### Invariants

- Toutes les clés publiques/voyageur existent dans les cinq langues.
- Le repli est `fr`, explicite et testé.
- Les dates et montants utilisent `Intl` avec la langue active.
- Le document porte `lang` correspondant à la langue servie.
- Les textes longs (allemand) ne cassent pas les boutons ni les cartes.

## 10. Thème et tokens

```ts
interface TokensErgonomiques {
  hauteurControleMin: number; // 44
  largeurLectureMax: number;  // ~65ch
  interligneTexte: number;    // ≥ 1.5
  contrasteTexte: number;     // ≥ 4.5
  contrasteGrandTexte: number;// ≥ 3
  espacementBase: number;     // 4
  pointsDeRupture: number[];  // 320, 360, 390, 768, 1024, 1440
}
```

### Invariants

- Aucun thème ne peut réduire `hauteurControleMin` sous 44 px.
- Aucun thème ne peut réduire le contraste sous 4,5:1 (texte normal).
- La densité peut varier sans supprimer l'espacement nécessaire au toucher.
- Le thème sombre ne doit pas utiliser la couleur seule pour un état.
- La publication vérifie ces tokens sur un échantillon de composants.

## 11. Pas de schéma DB en phase 1

Aucune table n'est ajoutée. Les besoins de mesure sont couverts par :

- les journaux serveur existants ;
- les événements d'audit existants ;
- des agrégats calculés à la volée ;
- un formulaire de retour qualitatif éventuellement stocké dans le journal.

Si une table `ergonomie_feedback` devient nécessaire, elle fera l'objet d'une
migration séparée, avec `tenant_id`, `route`, `score`, `commentaire` optionnel,
`cree_le`, purge à 90 jours et aucune PII.
