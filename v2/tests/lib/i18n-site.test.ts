import { describe, expect, it } from "vitest";
import { LANGUES_PUBLIQUES } from "@/domain/page-publique";
import { traductionsSite } from "@/lib/i18n-site";
import { TEMPLATES, templateDefinition } from "@/lib/site/templates";

describe("i18n site public", () => {
  it("fournit les six langues", () => {
    for (const langue of LANGUES_PUBLIQUES) {
      expect(traductionsSite(langue).accueil.length).toBeGreaterThan(0);
    }
    expect(traductionsSite("nl").reserver).toBe("Boeken");
  });

  it("replie sur le français pour une langue inconnue", () => {
    expect(traductionsSite("pt").accueil).toBe("Accueil");
  });

  it("traduit le formulaire de demande dans les six langues", () => {
    for (const langue of LANGUES_PUBLIQUES) {
      const t = traductionsSite(langue);
      expect(t.demandeTitre.length).toBeGreaterThan(0);
      expect(t.demandeEnvoyer.length).toBeGreaterThan(0);
      expect(t.demandeOk.length).toBeGreaterThan(0);
    }
    expect(traductionsSite("es").demandeEnvoyer).toBe("Enviar solicitud");
    expect(traductionsSite("pt").demandeTitre).toBe("Demander ce séjour");
  });
});

describe("templates site", () => {
  it("expose les trois templates avec des couleurs distinctes", () => {
    expect(Object.keys(TEMPLATES).sort()).toEqual(["ocean", "sable", "sejour"]);
    const accents = new Set(Object.values(TEMPLATES).map((t) => t.accent));
    expect(accents.size).toBe(3);
    expect(templateDefinition("ocean").libelle).toBe("Océan");
  });
});
