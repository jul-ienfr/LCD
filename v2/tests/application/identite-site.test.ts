import { describe, expect, it } from "vitest";
import {
  EnregistrerIdentiteSite,
  LireIdentiteSite,
} from "@/application/use-cases/identite-site";
import type { ParametresSiteRepository } from "@/application/ports/parametres-site-repository";

class MemoireParametresSite implements ParametresSiteRepository {
  private readonly valeurs = new Map<string, string>();

  async lire(cle: string): Promise<string | null> {
    return this.valeurs.get(cle) ?? null;
  }

  async ecrire(cle: string, valeur: string): Promise<void> {
    this.valeurs.set(cle, valeur);
  }
}

const SAISIE = {
  nom: "  Villa Test  ",
  logoUrl: " /logo.svg ",
  emailContact: " Contact@Villa.Test ",
  telephoneContact: "+33 6 12 34 56 78",
  adresseContact: "1 rue des Tests, 75000 Paris",
  accent: "#0e7c6b",
};

describe("identité de marque persistée", () => {
  it("enregistre et relit une identité normalisée", async () => {
    const repo = new MemoireParametresSite();
    const enregistrer = new EnregistrerIdentiteSite(repo);
    const identite = await enregistrer.executer(SAISIE);
    expect(identite).toMatchObject({
      nom: "Villa Test",
      logoUrl: "/logo.svg",
      emailContact: "contact@villa.test",
      telephoneContact: "+33 6 12 34 56 78",
      accent: "#0e7c6b",
    });
    expect(await new LireIdentiteSite(repo).executer()).toEqual(identite);
  });

  it("revient au nom d'environnement quand le nom est vide", async () => {
    const repo = new MemoireParametresSite();
    const identite = await new EnregistrerIdentiteSite(repo).executer({
      ...SAISIE,
      nom: "",
      accent: "",
      logoUrl: "",
      emailContact: "",
      telephoneContact: "",
      adresseContact: "",
    });
    expect(identite.nom.length).toBeGreaterThan(1);
    expect(identite.accent).toBeNull();
    expect(identite.logoUrl).toBeNull();
  });

  it("refuse un logo ou un contact invalide", async () => {
    const repo = new MemoireParametresSite();
    const enregistrer = new EnregistrerIdentiteSite(repo);
    await expect(
      enregistrer.executer({ ...SAISIE, logoUrl: "javascript:alert(1)" }),
    ).rejects.toMatchObject({ code: "DESIGN_INVALIDE" });
    await expect(
      enregistrer.executer({ ...SAISIE, emailContact: "pas-un-email" }),
    ).rejects.toMatchObject({ code: "DESIGN_INVALIDE" });
    await expect(
      enregistrer.executer({ ...SAISIE, accent: "#fef08a" }),
    ).rejects.toMatchObject({ code: "DESIGN_INVALIDE" });
  });
});
