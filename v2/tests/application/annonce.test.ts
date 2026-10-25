import { describe, expect, it } from "vitest";
import type {
  AnnoncesConformiteRepository,
  EnregistrerConformiteData,
} from "@/application/ports/annonces-conformite-repository";
import { EnregistrerConformiteAnnonce } from "@/application/use-cases/annonce";
import {
  MENTIONS_ANNONCE,
  type ConformiteAnnonce,
} from "@/domain/annonce";
import { LogementRepositoryMemoire } from "../helpers/logement-repository-memoire";

class MemoireConformites implements AnnoncesConformiteRepository {
  items: ConformiteAnnonce[] = [];

  async trouverParLogement(tenantId: string, logementId: string) {
    return (
      this.items.find(
        (c) => c.tenantId === tenantId && c.logementId === logementId,
      ) ?? null
    );
  }
  async enregistrer(
    data: EnregistrerConformiteData,
  ): Promise<ConformiteAnnonce> {
    const existante = await this.trouverParLogement(
      data.tenantId,
      data.logementId,
    );
    if (existante) {
      Object.assign(existante, data, { updatedAt: new Date() });
      return existante;
    }
    const conformite: ConformiteAnnonce = { ...data, updatedAt: new Date() };
    this.items.push(conformite);
    return conformite;
  }
}

async function preparer() {
  const logements = new LogementRepositoryMemoire();
  const logement = await logements.creer({
    tenantId: "t1",
    code: "log1",
    nom: "Logement 1",
  });
  const conformites = new MemoireConformites();
  const cas = new EnregistrerConformiteAnnonce(conformites, logements);
  return { logement, conformites, cas };
}

const toutesCochees = Object.fromEntries(
  MENTIONS_ANNONCE.map((m) => [m.code, true]),
);

describe("cas d'usage conformité annonce", () => {
  it("enregistre une conformité complète", async () => {
    const { logement, conformites, cas } = await preparer();
    const conformite = await cas.executer({
      tenantId: "t1",
      logementId: logement.id,
      mentions: toutesCochees,
      dpeClasse: "D",
      gesClasse: "B",
      classement: "3_etoiles",
    });
    expect(conformite.dpeClasse).toBe("D");
    expect(conformite.gesClasse).toBe("B");
    expect(conformite.mentions.surface).toBe(true);
    expect(conformites.items).toHaveLength(1);
  });

  it("met à jour la conformité du même logement", async () => {
    const { logement, conformites, cas } = await preparer();
    await cas.executer({
      tenantId: "t1",
      logementId: logement.id,
      mentions: toutesCochees,
      dpeClasse: "D",
      gesClasse: "B",
    });
    const misAJour = await cas.executer({
      tenantId: "t1",
      logementId: logement.id,
      mentions: { ...toutesCochees, charges: false },
      dpeClasse: "E",
      gesClasse: "C",
    });
    expect(misAJour.dpeClasse).toBe("E");
    expect(misAJour.mentions.charges).toBe(false);
    expect(conformites.items).toHaveLength(1);
  });

  it("refuse un logement inconnu", async () => {
    const { conformites, cas } = await preparer();
    await expect(
      cas.executer({
        tenantId: "t1",
        logementId: "inconnu",
        mentions: toutesCochees,
      }),
    ).rejects.toMatchObject({ code: "ANNONCE_INVALIDE" });
    expect(conformites.items).toHaveLength(0);
  });

  it("refuse une étiquette invalide sans rien écrire", async () => {
    const { logement, conformites, cas } = await preparer();
    await expect(
      cas.executer({
        tenantId: "t1",
        logementId: logement.id,
        mentions: toutesCochees,
        dpeClasse: "Z",
      }),
    ).rejects.toMatchObject({ code: "ANNONCE_INVALIDE" });
    expect(conformites.items).toHaveLength(0);
  });
});
