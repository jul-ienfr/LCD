import { describe, expect, it } from "vitest";
import {
  CONSERVATION_MOIS,
  dateExpiration,
  memoireValide,
} from "@/domain/memoire";
import { ErreurMetier } from "@/domain/erreurs";
import {
  LireMemoireVoyageur,
  MemoriserVoyageur,
  OublierVoyageur,
} from "@/application/use-cases/memoire";
import type {
  EnregistrerMemoireData,
  MemoireRepository,
  MemoireVoyageur,
} from "@/application/ports/memoire-repository";
import { hashEmail } from "@/lib/memoire";

class MemoireRepositoryMemoire implements MemoireRepository {
  rows: MemoireVoyageur[] = [];

  async enregistrer(data: EnregistrerMemoireData): Promise<MemoireVoyageur> {
    const existant = this.rows.find(
      (r) =>
        r.tenantId === data.tenantId && r.emailHash === data.emailHash,
    );
    const now = new Date();
    if (existant) {
      Object.assign(existant, data, { updatedAt: now, lastSeenAt: now });
      return existant;
    }
    const row: MemoireVoyageur = {
      id: `m-${this.rows.length + 1}`,
      ...data,
      lastSeenAt: now,
      createdAt: now,
      updatedAt: now,
    };
    this.rows.push(row);
    return row;
  }

  async trouverParHash(tenantId: string, emailHash: string) {
    return (
      this.rows.find(
        (r) => r.tenantId === tenantId && r.emailHash === emailHash,
      ) ?? null
    );
  }

  async supprimer(tenantId: string, emailHash: string) {
    const avant = this.rows.length;
    this.rows = this.rows.filter(
      (r) => !(r.tenantId === tenantId && r.emailHash === emailHash),
    );
    return this.rows.length < avant;
  }

  async purgerExpires(tenantId: string, maintenant = new Date()) {
    const avant = this.rows.length;
    this.rows = this.rows.filter(
      (r) => !(r.tenantId === tenantId && r.expireAt < maintenant),
    );
    return avant - this.rows.length;
  }
}

const base = {
  tenantId: "t1",
  email: "Camille@Example.test",
  nom: "Camille",
  preferences: "Lit bébé\nÉtage calme",
  consentement: true,
};

describe("mémoire voyageur", () => {
  it("hache l’email de façon déterministe et non réversible", () => {
    expect(hashEmail(" Camille@Example.test ")).toBe(
      hashEmail("camille@example.test"),
    );
    expect(hashEmail("camille@example.test")).toHaveLength(64);
    expect(hashEmail("a@example.test")).not.toBe(
      hashEmail("b@example.test"),
    );
  });

  it("expire après 24 mois", () => {
    const debut = new Date("2026-01-31T12:00:00Z");
    const fin = dateExpiration(debut);
    expect(fin.getUTCMonth()).toBe((debut.getUTCMonth() + CONSERVATION_MOIS) % 12);
    expect(memoireValide(fin, new Date("2027-01-01T00:00:00Z"))).toBe(true);
    expect(memoireValide(fin, new Date("2028-02-01T00:00:00Z"))).toBe(false);
  });

  it("enregistre seulement l’empreinte, pas l’email en clair", async () => {
    const repo = new MemoireRepositoryMemoire();
    const row = await new MemoriserVoyageur(repo).executer(base);
    expect(row.emailHash).toBe(hashEmail(base.email));
    expect(JSON.stringify(row)).not.toContain("camille@example.test");
    expect(row.preferences).toBe("Lit bébé\nÉtage calme");
  });

  it("refuse sans consentement et met à jour sans doublon", async () => {
    const repo = new MemoireRepositoryMemoire();
    await expect(
      new MemoriserVoyageur(repo).executer({
        ...base,
        consentement: false,
      }),
    ).rejects.toBeInstanceOf(ErreurMetier);

    await new MemoriserVoyageur(repo).executer(base);
    await new MemoriserVoyageur(repo).executer({
      ...base,
      preferences: "Lit bébé",
    });
    expect(repo.rows).toHaveLength(1);
    expect(repo.rows[0]?.preferences).toBe("Lit bébé");
  });

  it("lit, oublie et purge les entrées expirées", async () => {
    const repo = new MemoireRepositoryMemoire();
    await new MemoriserVoyageur(repo).executer(base);
    const lu = await new LireMemoireVoyageur(repo).executer("t1", base.email);
    expect(lu?.nom).toBe("Camille");

    expect(await new OublierVoyageur(repo).executer("t1", base.email)).toBe(
      true,
    );
    expect(repo.rows).toHaveLength(0);

    await repo.enregistrer({
      tenantId: "t1",
      emailHash: hashEmail(base.email),
      nom: "Camille",
      preferences: "",
      consentementAt: new Date("2020-01-01T00:00:00Z"),
      expireAt: new Date("2021-01-01T00:00:00Z"),
    });
    expect(await new LireMemoireVoyageur(repo).executer("t1", base.email)).toBe(
      null,
    );
    expect(repo.rows).toHaveLength(0);
  });
});
