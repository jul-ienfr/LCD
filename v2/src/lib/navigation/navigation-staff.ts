import type { RoleUtilisateur } from "@/domain/utilisateur";
import type { LienNavigation, NavigationStaff } from "./modele";

/**
 * Rôles réellement acceptés par les gardes serveur de chaque route.
 *
 * Source : `requireRole(event, [...])` (et `requireSuperAdmin`) du
 * `+page.server.ts` de la route. `super_admin` est toujours ajouté (il
 * contourne les gardes) et `operateur` est ajouté quand `hote` est accepté,
 * car `requireRole` normalise l'opérateur en hôte.
 *
 * Le but est d'éliminer les liens de menu qui mènent à
 * `/login?erreur=acces` : aucun lien affiché ne doit être refusé ensuite.
 * Une route absente de cette table (par exemple `/hote/securite`, ouverte à
 * toute session) conserve la visibilité déclarée dans le modèle.
 */
const ROLES_GARDES: Record<string, readonly RoleUtilisateur[]> = {
  "/hote": ["super_admin", "admin", "hote", "operateur", "comptable"],
  "/hote/acces": ["super_admin", "admin"],
  "/hote/annonce": ["super_admin", "admin", "hote", "operateur"],
  "/hote/assistant": ["super_admin", "admin", "hote", "operateur"],
  "/hote/audit": ["super_admin", "admin"],
  "/hote/automatisations": ["super_admin", "admin", "hote", "operateur"],
  "/hote/avis": ["super_admin", "admin", "hote", "operateur"],
  "/hote/avis-voyageur": ["super_admin", "admin", "hote", "operateur"],
  "/hote/cautions": ["super_admin", "admin", "hote", "operateur", "comptable"],
  "/hote/compta": ["super_admin", "admin", "hote", "operateur", "comptable"],
  "/hote/demandes": ["super_admin", "admin", "hote", "operateur"],
  "/hote/demandes-extra": ["super_admin", "admin", "hote", "operateur"],
  "/hote/dispatch": ["super_admin", "admin", "hote", "operateur"],
  "/hote/entite": ["super_admin", "admin"],
  "/hote/entretien": ["super_admin", "admin", "hote", "operateur"],
  "/hote/etats-des-lieux": ["super_admin", "admin", "hote", "operateur"],
  "/hote/extras": ["super_admin", "admin", "hote", "operateur"],
  "/hote/factures": ["super_admin", "admin", "hote", "operateur", "comptable"],
  "/hote/formation": ["super_admin", "admin", "hote", "operateur"],
  "/hote/installation": ["super_admin", "admin", "hote", "operateur"],
  "/hote/integrations": ["super_admin", "admin", "hote", "operateur"],
  "/hote/inventaire": ["super_admin", "admin", "hote", "operateur"],
  "/hote/logements": ["super_admin", "admin", "hote", "operateur"],
  "/hote/menage": ["super_admin", "admin", "hote", "operateur"],
  "/hote/messages": ["super_admin", "admin", "hote", "operateur"],
  "/hote/messages/fils": ["super_admin", "admin", "hote", "operateur"],
  "/hote/missions": ["super_admin", "admin", "hote", "operateur"],
  "/hote/notifications": ["super_admin", "admin", "hote", "operateur"],
  "/hote/objets-trouves": ["super_admin", "admin", "hote", "operateur"],
  "/hote/onboarding": ["super_admin", "admin", "hote", "operateur"],
  "/hote/phrases": ["super_admin", "admin", "hote", "operateur"],
  "/hote/planning": ["super_admin", "admin", "hote", "operateur"],
  "/hote/planning/canaux": ["super_admin", "admin", "hote", "operateur"],
  "/hote/police": ["super_admin", "admin", "hote", "operateur"],
  "/hote/prix": ["super_admin", "admin", "hote", "operateur"],
  "/hote/promotions": ["super_admin", "admin", "hote", "operateur"],
  "/hote/proprietaires": ["super_admin", "admin", "hote", "operateur"],
  "/hote/questionnaires": ["super_admin", "admin", "hote", "operateur"],
  "/hote/rapports": ["super_admin", "admin", "hote", "operateur", "comptable"],
  "/hote/recherche": [
    "super_admin",
    "admin",
    "hote",
    "operateur",
    "comptable",
  ],
  "/hote/rgpd": ["super_admin", "admin", "hote", "operateur"],
  "/hote/sinistres": ["super_admin", "admin", "hote", "operateur"],
  "/hote/stocks": ["super_admin", "admin", "hote", "operateur"],
  "/hote/tourisme": ["super_admin", "admin", "hote", "operateur"],
  "/hote/tranquillite": ["super_admin", "admin", "hote", "operateur"],
  "/hote/utilisateurs": ["super_admin", "admin"],
  "/supervision/apparence": ["super_admin"],
  "/supervision/espaces": ["super_admin"],
  "/supervision/journaux": ["super_admin"],
  "/supervision/maintenance": ["super_admin"],
};

/**
 * Rôles d'un lien : intersection de la visibilité déclarée dans le modèle et
 * des gardes serveur. Un lien sans `roles` hérite simplement des gardes.
 */
function rolesEffectifs(lien: LienNavigation): readonly RoleUtilisateur[] {
  const gardes = ROLES_GARDES[lien.href];
  if (!gardes) return lien.roles ?? [];
  if (!lien.roles) return gardes;
  return lien.roles.filter(
    (role) => role === "super_admin" || gardes.includes(role),
  );
}

function avecGardes(lien: LienNavigation): LienNavigation {
  const gardes = ROLES_GARDES[lien.href];
  if (!gardes) return lien;
  return { ...lien, roles: rolesEffectifs(lien) };
}

/**
 * Source unique de la navigation staff (V2).
 * Invariants vérifiés par `validerNavigation()` et
 * `tests/ergonomie/navigation.test.ts` :
 * - au plus 7 entrées principales ;
 * - aucun doublon de href ;
 * - tous les hrefs internes à `/hote` ou `/supervision` ;
 * - aucun lien affiché n'est refusé par les gardes serveur.
 *
 * Les libellés ne sont pas stockés ici : chaque lien porte une `cle` résolue
 * avec `data.tNav` (i18n 5 langues).
 */
const NAVIGATION_BRUT: NavigationStaff = {
  principal: [
    { href: "/hote", cle: "tableau" },
    { href: "/hote/planning", cle: "planning" },
    { href: "/hote/logements", cle: "logements" },
    { href: "/hote/messages", cle: "messages" },
    { href: "/hote/menage", cle: "menage" },
    {
      href: "/hote/factures",
      cle: "factures",
      roles: ["super_admin", "admin", "hote", "comptable", "operateur"],
    },
    {
      href: "/hote/rapports",
      cle: "rapports",
      roles: ["super_admin", "admin", "hote", "comptable", "commercial"],
    },
  ],

  domaines: [
    {
      id: "exploitation",
      cle: "exploitation",
      groupes: [
        {
          id: "operations",
          cle: "exploitation",
          liens: [
            { href: "/hote/planning/canaux", cle: "canaux" },
            { href: "/hote/installation", cle: "installation" },
            { href: "/hote/etats-des-lieux", cle: "etatsDesLieux" },
            { href: "/hote/entretien", cle: "entretien" },
            { href: "/hote/missions", cle: "missions" },
            { href: "/hote/dispatch", cle: "dispatch" },
            {
              href: "/hote/cautions",
              cle: "cautions",
              roles: ["super_admin", "admin", "hote", "comptable"],
            },
            { href: "/hote/extras", cle: "extras" },
            { href: "/hote/stocks", cle: "stocks" },
            { href: "/hote/inventaire", cle: "inventaire" },
          ],
        },
        {
          id: "automatisation",
          cle: "automatisations",
          liens: [
            { href: "/hote/automatisations", cle: "automatisations" },
            { href: "/hote/notifications", cle: "notifications" },
          ],
        },
      ],
    },
    {
      id: "relation",
      cle: "relation",
      groupes: [
        {
          id: "voyageurs",
          cle: "filsVoyageurs",
          liens: [
            { href: "/hote/messages/fils", cle: "filsVoyageurs" },
            { href: "/hote/demandes", cle: "demandes" },
            { href: "/hote/demandes-extra", cle: "demandesExtra" },
            { href: "/hote/assistant", cle: "assistant" },
          ],
        },
        {
          id: "avis",
          cle: "avis",
          liens: [
            { href: "/hote/avis", cle: "avis" },
            { href: "/hote/avis-voyageur", cle: "avisVoyageur" },
            { href: "/hote/questionnaires", cle: "questionnaires" },
          ],
        },
        {
          id: "contenus",
          cle: "tourisme",
          liens: [
            { href: "/hote/tourisme", cle: "tourisme" },
            { href: "/hote/phrases", cle: "phrases" },
          ],
        },
      ],
    },
    {
      id: "conformite",
      cle: "conformite",
      groupes: [
        {
          id: "reglementaire",
          cle: "conformite",
          liens: [
            { href: "/hote/annonce", cle: "annonce" },
            { href: "/hote/onboarding", cle: "onboarding" },
            { href: "/hote/formation", cle: "formation" },
            { href: "/hote/police", cle: "police" },
            { href: "/hote/rgpd", cle: "rgpd" },
          ],
        },
        {
          id: "risques",
          cle: "sinistres",
          liens: [
            { href: "/hote/objets-trouves", cle: "objetsTrouves" },
            { href: "/hote/sinistres", cle: "sinistres" },
            { href: "/hote/tranquillite", cle: "tranquillite" },
          ],
        },
      ],
    },
    {
      id: "administration",
      cle: "administration",
      groupes: [
        {
          id: "pilotage",
          cle: "prix",
          liens: [
            { href: "/hote/recherche", cle: "recherche" },
            {
              href: "/hote/prix",
              cle: "prix",
              roles: ["super_admin", "admin", "hote", "operateur", "commercial"],
            },
            {
              href: "/hote/promotions",
              cle: "promotions",
              roles: ["super_admin", "admin", "hote", "operateur", "commercial"],
            },
          ],
        },
        {
          id: "organisation",
          cle: "administration",
          liens: [
            {
              href: "/hote/proprietaires",
              cle: "proprietaires",
              roles: ["super_admin", "admin", "hote"],
            },
            {
              href: "/hote/acces",
              cle: "acces",
              roles: ["super_admin", "admin"],
            },
            {
              href: "/hote/entite",
              cle: "entite",
              roles: ["super_admin", "admin"],
            },
            {
              href: "/hote/integrations",
              cle: "integrations",
              roles: ["super_admin", "admin"],
            },
            {
              href: "/hote/audit",
              cle: "audit",
              roles: ["super_admin", "admin"],
            },
            {
              href: "/hote/utilisateurs",
              cle: "utilisateurs",
              roles: ["super_admin", "admin"],
            },
            {
              href: "/hote/securite",
              cle: "securite",
              roles: ["super_admin", "admin"],
            },
          ],
        },
        {
          id: "finance",
          cle: "compta",
          liens: [
            {
              href: "/hote/compta",
              cle: "compta",
              roles: ["super_admin", "admin", "hote", "comptable"],
            },
          ],
        },
      ],
    },
    {
      id: "supervision",
      cle: "supervision",
      groupes: [
        {
          id: "plateforme",
          cle: "supervision",
          liens: [
            {
              href: "/supervision/apparence",
              cle: "apparence",
              roles: ["super_admin"],
            },
            {
              href: "/supervision/espaces",
              cle: "espaces",
              roles: ["super_admin"],
            },
            {
              href: "/supervision/maintenance",
              cle: "maintenance",
              roles: ["super_admin"],
            },
            {
              href: "/supervision/journaux",
              cle: "journaux",
              roles: ["super_admin"],
            },
          ],
        },
      ],
    },
  ],
};

/**
 * Navigation effective : chaque lien est aligné sur les gardes serveur de sa
 * route avant d'être exposé au menu et au fil d'Ariane.
 */
export const NAVIGATION_STAFF: NavigationStaff = {
  principal: NAVIGATION_BRUT.principal.map(avecGardes),
  domaines: NAVIGATION_BRUT.domaines.map((domaine) => ({
    ...domaine,
    groupes: domaine.groupes.map((groupe) => ({
      ...groupe,
      liens: groupe.liens.map(avecGardes),
    })),
  })),
};