import { describe, expect, it } from "vitest";
import type {
  EnregistrerRegistreData,
  RegistresRgpdRepository,
} from "@/application/ports/registres-rgpd-repository";
import { EnregistrerRegistreRgpd } from "@/application/use-cases/rgpd";
import type { RegistreRgpd } from "@/domain/rgpd";
import { entreesParDefaut } from "@/domain/rgpd";

class MemoireRegistres implements RegistresRgpdRepository {
  items: RegistreRgpd[] = [];

  async trouver(tenantId: string) {
    return this.items.find((r) => r.tenantId === tenantId) ?? null;
  }
  async enregistrer(data: EnregistrerRegistreData): Promise<RegistreRgpd> {
    const existant = await this.trouver(data.tenantId);
    if (existant) {
      Object.assign(existant, data, { updatedAt: new Date() });
      return existant;
    }
    const registre: RegistreRgpd = { ...data, updatedAt: new Date() };
    this.items.push(registre);
    return registre;
  }
}

function preparer() {
  const registres = new MemoireRegistres();
  const cas = new EnregistrerRegistreRgpd(registres);
  return { registres, cas };
}

describe("cas d'usage registre RGPD", () => {
  it("enregistre un registre complet", async () => {
    const { registres, cas } = preparer();
    const registre = await cas.executer({
      tenantId: "t1",
      dpoNom: "Camille Martin",
      dpoContact: "dpo@exemple.fr",
      hebergement: "Union européenne",
      entrees: entreesParDefaut(),
    });
    expect(registre.dpoContact).toBe("dpo@exemple.fr");
    expect(Object.keys(registre.entrees)).toHaveLength(7);
    expect(registres.items).toHaveLength(1);
  });

  it("met à jour le registre du même tenant", async () => {
    const { registres, cas } = preparer();
    await cas.executer({
      tenantId: "t1",
      dpoContact: "dpo@exemple.fr",
      hebergement: "Union européenne",
      entrees: entreesParDefaut(),
    });
    const misAJour = await cas.executer({
      tenantId: "t1",
      dpoContact: "nouveau@exemple.fr",
      hebergement: "UE — Francfort",
      entrees: {
        ...entreesParDefaut(),
        avis: { actif: false, dureeMois: 24, notes: "Désactivé" },
      },
    });
    expect(misAJour.dpoContact).toBe("nouveau@exemple.fr");
    expect(misAJour.hebergement).toBe("UE — Francfort");
    expect(misAJour.entrees.avis!.actif).toBe(false);
    expect(registres.items).toHaveLength(1);
  });

  it("refuse une durée invalide sans rien écrire", async () => {
    const { registres, cas } = preparer();
    await expect(
      cas.executer({
        tenantId: "t1",
        dpoContact: "dpo@exemple.fr",
        hebergement: "Union européenne",
        entrees: {
          ...entreesParDefaut(),
          reservations: { actif: true, dureeMois: 0, notes: "" },
        },
      }),
    ).rejects.toMatchObject({ code: "RGPD_INVALIDE" });
    expect(registres.items).toHaveLength(0);
  });

  it("refuse un hébergement vide", async () => {
    const { registres, cas } = preparer();
    await expect(
      cas.executer({
        tenantId: "t1",
        dpoContact: "dpo@exemple.fr",
        hebergement: "  ",
        entrees: entreesParDefaut(),
      }),
    ).rejects.toMatchObject({ code: "RGPD_INVALIDE" });
    expect(registres.items).toHaveLength(0);
  });
});
