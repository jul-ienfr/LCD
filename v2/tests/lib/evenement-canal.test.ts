import { describe, expect, it } from "vitest";
import type {
  CreerEvenementCanalData,
  EvenementCanalRepository,
  ResultatEnregistrementEvenement,
} from "@/application/ports/evenement-canal-repository";
import type { EvenementCanal } from "@/domain/canal";
import { journaliserWebhookCanal } from "@/lib/server/evenement-canal";

class RepoMemoire implements EvenementCanalRepository {
  readonly appels: CreerEvenementCanalData[] = [];
  readonly parCle = new Map<string, EvenementCanal>();
  erreur: Error | null = null;

  async enregistrer(
    data: CreerEvenementCanalData,
  ): Promise<ResultatEnregistrementEvenement> {
    this.appels.push(data);
    if (this.erreur) throw this.erreur;
    const existant = this.parCle.get(data.cleIdempotence);
    if (existant) return { evenement: existant, cree: false };
    const evenement: EvenementCanal = {
      id: `evt-${this.parCle.size + 1}`,
      tenantId: data.tenantId,
      logementFournisseurId: data.logementFournisseurId,
      fournisseurCode: data.fournisseurCode,
      type: data.type,
      externalId: data.externalId ?? null,
      cleIdempotence: data.cleIdempotence,
      payload: data.payload ?? {},
      statut: "recu",
      message: null,
      traiteAt: null,
      createdAt: new Date(),
    };
    this.parCle.set(data.cleIdempotence, evenement);
    return { evenement, cree: true };
  }

  async marquerTraite(): Promise<void> {}

  async listerRecents(): Promise<EvenementCanal[]> {
    return [...this.parCle.values()];
  }
}

const ENTREE = {
  tenantId: "tenant-1",
  logementFournisseurId: "mapping-1",
  fournisseurCode: "beds24" as const,
  corps: '{"propertyId":"prop-1","event":"booking.created"}',
  propriete: "prop-1",
  headers: new Headers({
    "content-type": "application/json",
    "user-agent": "Beds24",
  }),
};

describe("journaliserWebhookCanal", () => {
  it("est idempotent pour le même corps et le même mapping", async () => {
    const repo = new RepoMemoire();
    const premier = await journaliserWebhookCanal(ENTREE, repo);
    const second = await journaliserWebhookCanal(ENTREE, repo);

    expect(premier?.cree).toBe(true);
    expect(second?.cree).toBe(false);
    expect(repo.parCle.size).toBe(1);
  });

  it("change de clé entre deux tenants", async () => {
    const repo = new RepoMemoire();
    await journaliserWebhookCanal(ENTREE, repo);
    await journaliserWebhookCanal(
      { ...ENTREE, tenantId: "tenant-2" },
      repo,
    );
    expect(repo.parCle.size).toBe(2);
  });

  it("ne stocke pas le corps brut dans le payload", async () => {
    const repo = new RepoMemoire();
    await journaliserWebhookCanal(ENTREE, repo);
    const payload = repo.appels[0]?.payload ?? {};
    expect(payload).not.toHaveProperty("corps");
    expect(payload).toMatchObject({
      propriete: "prop-1",
      taille: ENTREE.corps.length,
      contentType: "application/json",
    });
    expect(String(payload.empreinte)).toMatch(/^[a-f0-9]{16}$/);
  });

  it("ne bloque pas la synchronisation si le journal échoue", async () => {
    const repo = new RepoMemoire();
    repo.erreur = new Error("db down");
    await expect(journaliserWebhookCanal(ENTREE, repo)).resolves.toBeNull();
  });
});
