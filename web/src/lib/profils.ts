// lib/profils.ts — table UNIQUE des profils humains (DRY, partagée côté
// serveur et client : aucune dépendance next/headers, pur data).
// Les ids correspondent EXACTEMENT aux sujets de custom/acces.yaml
// (zéro table de traduction — le sujet IdP EST le `qui` LCD).
export type Profil = {
  nom: string;
  role: string;
  titre: string;
  court: string;
  icone: string;
  cible: string;
};

export const PROFILS: Record<string, Profil> = {
  personne_01: {
    nom: "Claire",
    role: "super_admin",
    titre: "Super admin — fondatrice",
    court: "Cl. super_admin",
    icone: "👑",
    cible: "/hote",
  },
  personne_02: {
    nom: "Alex",
    role: "admin",
    titre: "Admin — exploitant",
    court: "Al. admin",
    icone: "🛠️",
    cible: "/hote",
  },
  personne_03: {
    nom: "Sam",
    role: "opérateur",
    titre: "Opérateur — terrain",
    court: "S. opérateur",
    icone: "🧰",
    // Terrain : son planning, pas le tableau de bord de l'hotel.
    cible: "/planning",
  },
  personne_04: {
    nom: "Ruth",
    role: "comptable",
    titre: "Comptable — lecture/validate",
    court: "R. comptable",
    icone: "📊",
    // Comptabilite : sa page, pas le tableau de bord de l'hotel.
    cible: "/compta",
  },
  personne_05: {
    nom: "Marc",
    role: "proprio",
    titre: "Propriétaire — portail tiers",
    court: "M. proprio",
    icone: "🏡",
    cible: "/proprio?logement=log1&qui=personne_05",
  },
  commercial_01: {
    nom: "Inès",
    role: "commercial",
    titre: "Commercial — CRM/offres",
    court: "I. commercial",
    icone: "🤝",
    cible: "/commercial",
  },
};

/** Libellé affichable d'un sujet ("Claire (super_admin)" ; brut si inconnu). */
export function libelleProfil(qui: string): string {
  const p = PROFILS[qui];
  return p ? `${p.nom} (${p.role})` : qui;
}
