export type Mode = "clair" | "sombre";

export type Jetons = {
  fond: string;
  surface: string;
  surface2: string;
  bordure: string;
  encre: string;
  encreDouce: string;
  encreFaine: string;
  accent: string;
  accentFonce: string;
  accentDouce: string;
};

export type Design = {
  id: string;
  nom: string;
  description: string;
  clair: Jetons;
  sombre: Jetons;
};

const SEJOUR: Design = {
  id: "sejour",
  nom: "Séjour",
  description: "Teal de la marque, neutre et sobre (défaut).",
  clair: {
    fond: "#f4f5f7",
    surface: "#ffffff",
    surface2: "#eef0f4",
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
};

const OCEAN: Design = {
  id: "ocean",
  nom: "Océan",
  description: "Bleu profond, surfaces froides, lecture nette.",
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
};

const SABLE: Design = {
  id: "sable",
  nom: "Sable",
  description: "Chaleureux, terracotta et papier — esprit maison d'hôtes.",
  clair: {
    fond: "#faf6ef",
    surface: "#fffdf8",
    surface2: "#f2ead9",
    bordure: "#e6d9c3",
    encre: "#2a2117",
    encreDouce: "#55483a",
    encreFaine: "#6f6252",
    accent: "#b45309",
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
};

const NUIT: Design = {
  id: "nuit",
  nom: "Nuit",
  description: "Violet graphite, contraste élevé, allure premium.",
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
};

export const DESIGNS: readonly Design[] = [SEJOUR, OCEAN, SABLE, NUIT];

export const DESIGN_DEFAUT = SEJOUR.id;

export function designParId(id: string): Design | undefined {
  return DESIGNS.find((d) => d.id === id);
}

export function estDesignValide(id: string): boolean {
  return DESIGNS.some((d) => d.id === id);
}

export function jetonsCss(
  design: Design,
  mode: Mode,
): Record<string, string> {
  const j = mode === "clair" ? design.clair : design.sombre;
  return {
    "--fond": j.fond,
    "--surface": j.surface,
    "--surface-2": j.surface2,
    "--bordure": j.bordure,
    "--encre": j.encre,
    "--encre-douce": j.encreDouce,
    "--encre-faine": j.encreFaine,
    "--accent": j.accent,
    "--accent-fonce": j.accentFonce,
    "--accent-douce": j.accentDouce,
  };
}

export function styleDesign(design: Design): string {
  const css = (j: Record<string, string>) =>
    Object.entries(j)
      .map(([k, v]) => `${k}:${v};`)
      .join("");
  return [
    `:root:root{${css(jetonsCss(design, "clair"))}}`,
    `@media (prefers-color-scheme: dark){:root:root:not(.theme-clair){${css(jetonsCss(design, "sombre"))}}}`,
    `:root:root.theme-sombre{${css(jetonsCss(design, "sombre"))}}`,
  ].join("");
}
