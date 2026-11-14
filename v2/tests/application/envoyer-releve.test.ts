import { describe, expect, it, vi } from "vitest";
import { EnvoyerReleve, type GenererPdfFn } from "@/application/use-cases/envoyer-releve";
import type { RelevesRepository, EnvoisRelevesRepository, EnvoiReleve } from "@/application/ports/releves-repository";
import type { EmailSender, EmailMessage } from "@/application/ports/email";
import type { StockageFichiers } from "@/application/ports/stockage";
import type { ReleveProprietaire } from "@/domain/releve-proprietaire";

// --- Fixtures ---
const TENANT = "11111111-1111-4111-8111-111111111111";
const RELEVE_ID = "releve-1";

const RELEVE: ReleveProprietaire = {
  id: RELEVE_ID,
  tenantId: TENANT,
  proprietaireId: "user-1",
  proprietaireNom: "Jean Dupont",
  moisDebut: "2026-03",
  moisFin: "2026-03",
  periode: "mensuel",
  lignes: [
    {
      logementId: "log-1",
      logementNom: "Villa A",
      sejours: 2,
      caCentimes: 100_000,
      commissionCentimes: 20_000,
      chargesCentimes: 5_000,
      netCentimes: 75_000,
    },
  ],
  totalCaCentimes: 100_000,
  totalCommissionCentimes: 20_000,
  totalChargesCentimes: 5_000,
  totalNetCentimes: 75_000,
  genereAt: "2026-04-01T08:00:00.000Z",
};

const PDF_BYTES = new Uint8Array([37, 80, 68, 70]); // %PDF

// --- Fakes ---
function creerRelevesFake(releve: ReleveProprietaire | null): RelevesRepository {
  return {
    enregistrer: vi.fn().mockResolvedValue({ id: RELEVE_ID, cree: true }),
    trouverParId: vi.fn().mockResolvedValue(releve),
    trouverParPeriode: vi.fn().mockResolvedValue(null),
    listerParProprietaire: vi.fn().mockResolvedValue([]),
    listerParTenant: vi.fn().mockResolvedValue([]),
  };
}

function creerEnvoisFake(existant: EnvoiReleve | null): EnvoisRelevesRepository & { enregistrerMock: ReturnType<typeof vi.fn> } {
  const enregistrerMock = vi.fn().mockResolvedValue({ id: "envoi-1", cree: true });
  return {
    enregistrer: enregistrerMock,
    enregistrerMock,
    listerParReleve: vi.fn().mockResolvedValue([]),
    trouverParRef: vi.fn().mockResolvedValue(existant),
    mettreAJourStatut: vi.fn().mockResolvedValue(undefined),
  };
}

function creerEmailFake(): EmailSender & { envoyes: EmailMessage[] } {
  const envoyes: EmailMessage[] = [];
  return {
    envoyes,
    envoyer: vi.fn().mockImplementation(async (msg: EmailMessage) => {
      envoyes.push(msg);
    }),
  };
}

function creerStockageFake(): StockageFichiers & { cles: string[] } {
  const cles: string[] = [];
  return {
    cles,
    put: vi.fn().mockImplementation(async (key: string) => { cles.push(key); }),
    get: vi.fn().mockResolvedValue(PDF_BYTES),
    signedUrl: vi.fn().mockResolvedValue("/fake-url"),
    delete: vi.fn().mockResolvedValue(undefined),
  };
}

const genererPdf: GenererPdfFn = async () => PDF_BYTES;

// --- Tests ---
describe("EnvoyerReleve", () => {
  it("envoie un relevé par email avec PDF joint et archive", async () => {
    const envoisFake = creerEnvoisFake(null);
    const emailFake = creerEmailFake();
    const stockageFake = creerStockageFake();
    const useCase = new EnvoyerReleve(
      creerRelevesFake(RELEVE),
      envoisFake,
      emailFake,
      stockageFake,
      genererPdf,
    );

    const resultat = await useCase.executer({
      tenantId: TENANT,
      releveId: RELEVE_ID,
      emailDestinataire: "jean@example.com",
      proprietaireNom: "Jean Dupont",
      cleStockage: `releves/${TENANT}/${RELEVE_ID}`,
    });

    expect(resultat.dejaEnvoye).toBe(false);
    expect(resultat.envoiId).toBe("envoi-1");
    expect(resultat.cleArchive).toBe(`releves/${TENANT}/${RELEVE_ID}.pdf`);
    // Email envoyé avec la pièce jointe
    expect(emailFake.envoyes).toHaveLength(1);
    expect(emailFake.envoyes[0]!.to).toBe("jean@example.com");
    expect(emailFake.envoyes[0]!.subject).toContain("Relevé propriétaire");
    expect(emailFake.envoyes[0]!.attachments).toHaveLength(1);
    expect(emailFake.envoyes[0]!.attachments![0]!.contentType).toBe("application/pdf");
    // Archive dans le stockage
    expect(stockageFake.cles).toContain(`releves/${TENANT}/${RELEVE_ID}.pdf`);
    // Envoi tracé
    expect(envoisFake.enregistrerMock).toHaveBeenCalled();
  });

  it("est idempotent : un rejeu ne renvoie pas l'email", async () => {
    const envoiExistant: EnvoiReleve = {
      id: "envoi-existant",
      tenantId: TENANT,
      releveId: RELEVE_ID,
      proprietaireId: "user-1",
      canal: "email",
      destinataire: "jean@example.com",
      envoiRef: `releve:${TENANT}:${RELEVE_ID}`,
      envoyeAt: "2026-04-01T09:00:00.000Z",
      statut: "envoye",
      erreur: null,
    };
    const envoisFake = creerEnvoisFake(envoiExistant);
    const emailFake = creerEmailFake();
    const useCase = new EnvoyerReleve(
      creerRelevesFake(RELEVE),
      envoisFake,
      emailFake,
      creerStockageFake(),
      genererPdf,
    );

    const resultat = await useCase.executer({
      tenantId: TENANT,
      releveId: RELEVE_ID,
      emailDestinataire: "jean@example.com",
      proprietaireNom: "Jean Dupont",
      cleStockage: `releves/${TENANT}/${RELEVE_ID}`,
    });

    expect(resultat.dejaEnvoye).toBe(true);
    expect(resultat.envoiId).toBe("envoi-existant");
    // Aucun email envoyé
    expect(emailFake.envoyes).toHaveLength(0);
  });

  it("lève une erreur si le relevé est introuvable", async () => {
    const useCase = new EnvoyerReleve(
      creerRelevesFake(null),
      creerEnvoisFake(null),
      creerEmailFake(),
      creerStockageFake(),
      genererPdf,
    );

    await expect(
      useCase.executer({
        tenantId: TENANT,
        releveId: "inexistant",
        emailDestinataire: "jean@example.com",
        proprietaireNom: "Jean",
        cleStockage: "releves/x/y",
      }),
    ).rejects.toThrow("Relevé introuvable");
  });

  it("marque l'envoi en échec si l'email échoue", async () => {
    const envoisFake = creerEnvoisFake(null);
    const emailFake: EmailSender = {
      envoyer: vi.fn().mockRejectedValue(new Error("SMTP timeout")),
    };
    const useCase = new EnvoyerReleve(
      creerRelevesFake(RELEVE),
      envoisFake,
      emailFake,
      creerStockageFake(),
      genererPdf,
    );

    await expect(
      useCase.executer({
        tenantId: TENANT,
        releveId: RELEVE_ID,
        emailDestinataire: "jean@example.com",
        proprietaireNom: "Jean Dupont",
        cleStockage: `releves/${TENANT}/${RELEVE_ID}`,
      }),
    ).rejects.toThrow("Envoi email échoué");

    // Le statut a été mis à jour en echec
    expect(envoisFake.mettreAJourStatut).toHaveBeenCalledWith(
      TENANT,
      "envoi-1",
      "echec",
    );
  });
});
