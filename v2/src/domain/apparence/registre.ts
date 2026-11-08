import type { Theme } from "./types";

const SANS =
  '"Inter Variable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const SERIF =
  '"Fraunces Variable", "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, ui-serif, serif';
const MONO =
  'ui-monospace, "Cascadia Mono", "SFMono-Regular", Consolas, "Liberation Mono", monospace';

const TYPO_SANS = {
  policeTexte: SANS,
  policeTitre: SANS,
  policeMono: MONO,
  graisseTitre: 650,
  interlettrageTitre: "-0.02em",
} as const;

const TYPO_EDITORIAL = {
  policeTexte: SANS,
  policeTitre: SERIF,
  policeMono: MONO,
  graisseTitre: 600,
  interlettrageTitre: "-0.01em",
} as const;

const TYPO_MONO = {
  policeTexte: SANS,
  policeTitre: MONO,
  policeMono: MONO,
  graisseTitre: 700,
  interlettrageTitre: "0em",
} as const;

const SEJOUR: Theme = {
  id: "sejour",
  nom: "Séjour",
  description: "Teal de la marque, sans-serif sobre, cartes ombrées (défaut).",
  clair: {
    fond: "#f4f5f7",
    surface: "#ffffff",
    surface2: "#f2f4f7",
    bordure: "#e2e5ec",
    encre: "#131722",
    encreDouce: "#3f4756",
    encreFaine: "#69707f",
    accent: "#0e7c6b",
    accentFonce: "#0a5f52",
    accentDouce: "#ddf2ec",
  },
  sombre: {
    fond: "#0b0e14",
    surface: "#131826",
    surface2: "#1a2132",
    bordure: "#263049",
    encre: "#eef1f7",
    encreDouce: "#c2cad8",
    encreFaine: "#8a94a8",
    accent: "#2dd4a8",
    accentFonce: "#5ee8c0",
    accentDouce: "#0e2b25",
  },
  typographie: TYPO_SANS,
  formes: {
    rayonControle: "0.75rem",
    rayonCarte: "1rem",
    rayonGrand: "1.5rem",
    rayonBouton: "999px",
    bordureLargeur: "1px",
  },
  ombres: {
    carte: "0 1px 2px rgb(16 24 40 / 0.06), 0 4px 16px rgb(16 24 40 / 0.08)",
    elevee: "0 8px 30px rgb(16 24 40 / 0.16)",
  },
  densite: {
    espaceSection: "2rem",
    espaceCarte: "1.5rem",
    hauteurControle: "2.75rem",
  },
  variantes: { nav: "pilule", entete: "gauche" },
};

const OCEAN: Theme = {
  id: "ocean",
  nom: "Océan",
  description: "Bleu profond, sans-serif dense, cartes à bordure nette.",
  clair: {
    fond: "#f2f6fb",
    surface: "#ffffff",
    surface2: "#e7eef8",
    bordure: "#d6e2f0",
    encre: "#0d1b2a",
    encreDouce: "#28405a",
    encreFaine: "#566b84",
    accent: "#1d4ed8",
    accentFonce: "#1e40af",
    accentDouce: "#dbe7ff",
  },
  sombre: {
    fond: "#070c14",
    surface: "#0e1622",
    surface2: "#16202f",
    bordure: "#22334a",
    encre: "#eaf1fb",
    encreDouce: "#b9c9dd",
    encreFaine: "#8497ae",
    accent: "#60a5fa",
    accentFonce: "#93c5fd",
    accentDouce: "#0d2440",
  },
  typographie: {
    ...TYPO_SANS,
    graisseTitre: 700,
    interlettrageTitre: "-0.03em",
  },
  formes: {
    rayonControle: "0.5rem",
    rayonCarte: "0.75rem",
    rayonGrand: "1rem",
    rayonBouton: "0.5rem",
    bordureLargeur: "1px",
  },
  ombres: {
    carte: "0 1px 0 rgb(13 27 42 / 0.08), 0 2px 8px rgb(13 27 42 / 0.06)",
    elevee: "0 10px 24px rgb(13 27 42 / 0.18)",
  },
  densite: {
    espaceSection: "1.75rem",
    espaceCarte: "1.25rem",
    hauteurControle: "2.5rem",
  },
  variantes: { nav: "souligne", entete: "gauche" },
};

const SABLE: Theme = {
  id: "sable",
  nom: "Sable",
  description: "Titres serif, terracotta et papier — esprit maison d’hôtes.",
  clair: {
    fond: "#faf6ef",
    surface: "#fffdf8",
    surface2: "#f2ead9",
    bordure: "#e6d9c3",
    encre: "#2a2117",
    encreDouce: "#55483a",
    encreFaine: "#6f6252",
    accent: "#a34707",
    accentFonce: "#92400e",
    accentDouce: "#f7e2c4",
  },
  sombre: {
    fond: "#14100b",
    surface: "#1d1811",
    surface2: "#282018",
    bordure: "#3a2f22",
    encre: "#f6efe4",
    encreDouce: "#d8c9b6",
    encreFaine: "#a99a86",
    accent: "#fbbf24",
    accentFonce: "#fcd34d",
    accentDouce: "#2e230c",
  },
  typographie: TYPO_EDITORIAL,
  formes: {
    rayonControle: "0.25rem",
    rayonCarte: "0.5rem",
    rayonGrand: "0.75rem",
    rayonBouton: "0.375rem",
    bordureLargeur: "1px",
  },
  ombres: {
    carte: "none",
    elevee: "0 12px 32px rgb(42 33 23 / 0.18)",
  },
  densite: {
    espaceSection: "3rem",
    espaceCarte: "2rem",
    hauteurControle: "3rem",
  },
  variantes: { nav: "souligne", entete: "editorial" },
};

const NUIT: Theme = {
  id: "nuit",
  nom: "Nuit",
  description: "Violet graphite, angles généreux, allure premium.",
  clair: {
    fond: "#f6f4fb",
    surface: "#ffffff",
    surface2: "#ece7f8",
    bordure: "#ddd4ef",
    encre: "#1a1425",
    encreDouce: "#42385a",
    encreFaine: "#665b80",
    accent: "#6d28d9",
    accentFonce: "#5b21b6",
    accentDouce: "#e6ddff",
  },
  sombre: {
    fond: "#0b0813",
    surface: "#140f20",
    surface2: "#1d1730",
    bordure: "#2d2447",
    encre: "#f0eafb",
    encreDouce: "#cfc4e4",
    encreFaine: "#9a8db5",
    accent: "#a78bfa",
    accentFonce: "#c4b5fd",
    accentDouce: "#241a3f",
  },
  typographie: TYPO_SANS,
  formes: {
    rayonControle: "1rem",
    rayonCarte: "1.25rem",
    rayonGrand: "2rem",
    rayonBouton: "999px",
    bordureLargeur: "1px",
  },
  ombres: {
    carte: "0 2px 4px rgb(26 20 37 / 0.08), 0 12px 32px rgb(109 40 217 / 0.12)",
    elevee: "0 18px 50px rgb(109 40 217 / 0.28)",
  },
  densite: {
    espaceSection: "2.5rem",
    espaceCarte: "1.5rem",
    hauteurControle: "2.75rem",
  },
  variantes: { nav: "pilule", entete: "centre" },
};

const FORET: Theme = {
  id: "foret",
  nom: "Forêt",
  description: "Verts naturels, bordures franches, navigation en blocs.",
  clair: {
    fond: "#f3f7f2",
    surface: "#ffffff",
    surface2: "#e6efe4",
    bordure: "#d3e2cf",
    encre: "#10210f",
    encreDouce: "#33492f",
    encreFaine: "#566b52",
    accent: "#166534",
    accentFonce: "#14532d",
    accentDouce: "#dcfce7",
  },
  sombre: {
    fond: "#08130b",
    surface: "#0f1f13",
    surface2: "#172b1c",
    bordure: "#24402c",
    encre: "#e9f5ea",
    encreDouce: "#bcd6bf",
    encreFaine: "#8fae94",
    accent: "#4ade80",
    accentFonce: "#86efac",
    accentDouce: "#0d2a15",
  },
  typographie: TYPO_SANS,
  formes: {
    rayonControle: "0.75rem",
    rayonCarte: "1.25rem",
    rayonGrand: "2rem",
    rayonBouton: "0.75rem",
    bordureLargeur: "1px",
  },
  ombres: {
    carte: "0 1px 2px rgb(16 33 15 / 0.08)",
    elevee: "0 10px 28px rgb(16 33 15 / 0.2)",
  },
  densite: {
    espaceSection: "2rem",
    espaceCarte: "1.5rem",
    hauteurControle: "2.75rem",
  },
  variantes: { nav: "bloc", entete: "gauche" },
};

const ARDOISE: Theme = {
  id: "ardoise",
  nom: "Ardoise",
  description: "Monochrome administratif, titres mono, angles droits.",
  clair: {
    fond: "#f5f6f7",
    surface: "#ffffff",
    surface2: "#eceef0",
    bordure: "#d7dbdf",
    encre: "#111417",
    encreDouce: "#3c4248",
    encreFaine: "#5f666d",
    accent: "#1f2937",
    accentFonce: "#111827",
    accentDouce: "#e5e7eb",
  },
  sombre: {
    fond: "#0a0c0e",
    surface: "#121619",
    surface2: "#1a2024",
    bordure: "#2a3238",
    encre: "#f0f2f4",
    encreDouce: "#c3c9ce",
    encreFaine: "#939ca4",
    accent: "#e5e7eb",
    accentFonce: "#f9fafb",
    accentDouce: "#262d33",
  },
  typographie: TYPO_MONO,
  formes: {
    rayonControle: "0",
    rayonCarte: "0",
    rayonGrand: "0",
    rayonBouton: "0",
    bordureLargeur: "2px",
  },
  ombres: {
    carte: "none",
    elevee: "none",
  },
  densite: {
    espaceSection: "1.5rem",
    espaceCarte: "1rem",
    hauteurControle: "2.5rem",
  },
  variantes: { nav: "bloc", entete: "gauche" },
};

export const THEMES: readonly Theme[] = [
  SEJOUR,
  OCEAN,
  SABLE,
  NUIT,
  FORET,
  ARDOISE,
];

export const THEME_DEFAUT = SEJOUR.id;

export function themeParId(id: string | null | undefined): Theme | undefined {
  return THEMES.find((theme) => theme.id === id);
}

export function estThemeValide(id: string): boolean {
  return THEMES.some((theme) => theme.id === id);
}

export function themeOuDefaut(id: string | null | undefined): Theme {
  return themeParId(id) ?? SEJOUR;
}
