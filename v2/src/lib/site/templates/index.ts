import type { TemplateSite } from "@/domain/page-publique";

export interface TemplateDefinition {
  code: TemplateSite;
  libelle: string;
  description: string;
  accent: string;
  fond: string;
  texte: string;
  surface: string;
}

export const TEMPLATES: Record<TemplateSite, TemplateDefinition> = {
  sejour: {
    code: "sejour",
    libelle: "Séjour",
    description: "Chaleureux, éditorial, pensé pour les séjours familiaux.",
    accent: "#8a5a3b",
    fond: "#fbf7f1",
    texte: "#2d241d",
    surface: "#ffffff",
  },
  ocean: {
    code: "ocean",
    libelle: "Océan",
    description: "Clair, maritime, adapté aux locations bord de mer.",
    accent: "#0f6b78",
    fond: "#f2fbfc",
    texte: "#12343a",
    surface: "#ffffff",
  },
  sable: {
    code: "sable",
    libelle: "Sable",
    description: "Minimal, lumineux, pour les intérieurs contemporains.",
    accent: "#9a7b4f",
    fond: "#faf8f4",
    texte: "#2f2a23",
    surface: "#ffffff",
  },
};

export function templateDefinition(code: TemplateSite): TemplateDefinition {
  return TEMPLATES[code];
}
