import { describe, expect, it } from "vitest";
import { ChangerStatutOffre } from "@/application/use-cases/changer-statut-offre";
import { ChangerStatutProspect } from "@/application/use-cases/changer-statut-prospect";
import { CreerOffre } from "@/application/use-cases/creer-offre";
import { CreerProspect } from "@/application/use-cases/creer-prospect";
import { OffreRepositoryMemoire } from "../helpers/offre-repository-memoire";
import { ProspectRepositoryMemoire } from "../helpers/prospect-repository-memoire";

const tenantId = "11111111-1111-4111-8111-111111111111";

async function contexte() {
  const prospects = new ProspectRepositoryMemoire();
  const offreRepo = new OffreRepositoryMemoire();
  const prospect = await new CreerProspect(prospects).executer({
    tenantId,
    nom: "M. Dupont",
    email: "dupont@example.com",
    source: "site",
  });
  return { prospects, offreRepo, prospect };
}

describe("CRM commercial", () => {
  it("crée un prospect et avance dans le pipeline", async () => {
    const { prospects, prospect } = await contexte();
    expect(prospect.statut).toBe("nouveau");

    const qualifie = await new ChangerStatutProspect(prospects).executer({
      tenantId,
      prospectId: prospect.id,
      statut: "qualifie",
    });
    expect(qualifie.statut).toBe("qualifie");

    await expect(
      new ChangerStatutProspect(prospects).executer({
        tenantId,
        prospectId: prospect.id,
        statut: "gagne",
      }),
    ).rejects.toMatchObject({ code: "PROSPECT_INVALIDE" });
  });

  it("crée une offre et l'accepte", async () => {
    const { prospects, offreRepo, prospect } = await contexte();
    const offre = await new CreerOffre(offreRepo, prospects).executer({
      tenantId,
      prospectId: prospect.id,
      titre: "Forfait FULL",
      montantCentimes: 14900,
    });
    expect(offre.statut).toBe("brouillon");

    const uc = new ChangerStatutOffre(offreRepo);
    expect(
      (await uc.executer({ tenantId, offreId: offre.id, statut: "envoyee" }))
        .statut,
    ).toBe("envoyee");
    expect(
      (await uc.executer({ tenantId, offreId: offre.id, statut: "acceptee" }))
        .statut,
    ).toBe("acceptee");
  });
});
