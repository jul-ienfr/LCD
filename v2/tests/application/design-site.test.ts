import { describe, expect, it } from "vitest";
import { ErreurMetier } from "@/domain/erreurs";
import {
  ChoisirDesignSite,
  LireDesignSite,
} from "@/application/use-cases/design-site";
import { DESIGN_DEFAUT, DESIGNS } from "@/lib/themes";

class MemoireParametresSite {
  valeurs = new Map<string, string>();
  async lire(cle: string) {
    return this.valeurs.get(cle) ?? null;
  }
  async ecrire(cle: string, valeur: string) {
    this.valeurs.set(cle, valeur);
  }
}

describe("design du site", () => {
  it("retombe sur le design par défaut sans valeur", async () => {
    const design = await new LireDesignSite(
      new MemoireParametresSite(),
    ).executer();
    expect(design.id).toBe(DESIGN_DEFAUT);
  });

  it("lit le design enregistré", async () => {
    const repo = new MemoireParametresSite();
    repo.valeurs.set("design", "ocean");
    const design = await new LireDesignSite(repo).executer();
    expect(design.id).toBe("ocean");
  });

  it("ignore un design inconnu en base", async () => {
    const repo = new MemoireParametresSite();
    repo.valeurs.set("design", "pirate");
    const design = await new LireDesignSite(repo).executer();
    expect(design.id).toBe(DESIGN_DEFAUT);
  });

  it("refuse un design hors liste fermée", async () => {
    const repo = new MemoireParametresSite();
    await expect(
      new ChoisirDesignSite(repo).executer("pirate"),
    ).rejects.toBeInstanceOf(ErreurMetier);
    expect(repo.valeurs.has("design")).toBe(false);
  });

  it("écrit un design valide", async () => {
    const repo = new MemoireParametresSite();
    for (const d of DESIGNS) {
      const design = await new ChoisirDesignSite(repo).executer(d.id);
      expect(design.id).toBe(d.id);
      expect(repo.valeurs.get("design")).toBe(d.id);
    }
  });
});
