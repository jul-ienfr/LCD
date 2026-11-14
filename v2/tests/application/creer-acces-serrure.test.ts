/**
 * T607 — Tests du use case CreerAccesSerrure (fallback manuel).
 *
 * Ports mockés : AccesSerrureRepository + SerrureConnecteePort.
 * Vérifie : création nuki, fallback sur erreur nuki, fallback sur
 * indisponibilité, idempotence par ref, propagation des erreurs domaine.
 */
import { describe, expect, it } from "vitest";
import { CreerAccesSerrure } from "@/application/use-cases/creer-acces-serrure";
import type {
  AccesSerrureRepository,
  AccesSerrureRow,
} from "@/application/ports/guides-repository";
import type { SerrureConnecteePort } from "@/application/ports/serrure-connectee";
import { ErreurMetier } from "@/domain/erreurs";

const TENANT = "11111111-1111-4111-8111-111111111111";
const LOGEMENT = "22222222-2222-4222-8222-222222222222";
const RESERVATION = "33333333-3333-4333-8333-333333333333";

const INPUT_BASE = {
  tenantId: TENANT,
  logementId: LOGEMENT,
  reservationId: RESERVATION,
  arrivee: "2027-06-10",
  depart: "2027-06-17",
  serrureId: "nuki-123",
};

function creerRepoMock(options?: {
  existant?: AccesSerrureRow | null;
}) {
  const crees: Array<{ tenantId: string; data: Parameters<AccesSerrureRepository["creer"]>[1] }> = [];
  const repo: AccesSerrureRepository = {
    creer: async (tenantId, data) => {
      crees.push({ tenantId, data });
      return { id: "acces-uuid-1", cree: true };
    },
    trouverParRef: async () => options?.existant ?? null,
    trouverParId: async () => null,
    listerParLogement: async () => [],
    listerParReservation: async () => [],
    revoquer: async () => null,
  };
  return { repo, crees };
}

function creerSerrureMock(options?: {
  disponible?: boolean;
  erreur?: boolean;
}) {
  const appels: Array<{ serrureId: string; code: string }> = [];
  const serrure: SerrureConnecteePort = {
    nom: "Nuki",
    estDisponible: () => options?.disponible ?? true,
    creerCode: async (input) => {
      if (options?.erreur) {
        throw new ErreurMetier("SERRURE_INDISPONIBLE", "Nuki injoignable");
      }
      appels.push({ serrureId: input.serrureId, code: input.code });
      return { externalId: "codeId-789" };
    },
    revoquerCode: async () => {},
  };
  return { serrure, appels };
}

describe("CreerAccesSerrure", () => {
  it("crée un code Nuki quand la serrure est disponible", async () => {
    const { repo, crees } = creerRepoMock();
    const { serrure, appels } = creerSerrureMock({ disponible: true });
    const useCase = new CreerAccesSerrure(repo, serrure);

    const resultat = await useCase.executer(INPUT_BASE);

    expect(resultat.existant).toBe(false);
    expect(resultat.fallback).toBe(false);
    expect(resultat.fournisseur).toBe("nuki");
    expect(resultat.code).toMatch(/^\d{6}$/);
    expect(resultat.ref).toContain("ACC-");
    expect(resultat.valideDe).toBe("2027-06-10T15:00:00.000Z");
    expect(resultat.valideA).toBe("2027-06-17T11:00:00.000Z");
    expect(appels).toHaveLength(1);
    expect(crees).toHaveLength(1);
    expect(crees[0]!.data.type).toBe("numerique");
    expect(crees[0]!.data.fournisseur).toBe("nuki");
    expect(crees[0]!.data.externalId).toBe("codeId-789");
  });

  it("bascule en repli manuel si Nuki lève une erreur", async () => {
    const { repo, crees } = creerRepoMock();
    const { serrure } = creerSerrureMock({ disponible: true, erreur: true });
    const useCase = new CreerAccesSerrure(repo, serrure);

    const resultat = await useCase.executer(INPUT_BASE);

    expect(resultat.fallback).toBe(true);
    expect(resultat.fournisseur).toBe("manuel");
    expect(resultat.code).toMatch(/^\d{6}$/);
    expect(crees).toHaveLength(1);
    expect(crees[0]!.data.type).toBe("manuel");
    expect(crees[0]!.data.fournisseur).toBe("manuel");
    expect(crees[0]!.data.externalId).toBeNull();
  });

  it("passe directement en manuel si la serrure est indisponible", async () => {
    const { repo, crees } = creerRepoMock();
    const { serrure, appels } = creerSerrureMock({ disponible: false });
    const useCase = new CreerAccesSerrure(repo, serrure);

    const resultat = await useCase.executer(INPUT_BASE);

    expect(resultat.fallback).toBe(false);
    expect(resultat.fournisseur).toBe("manuel");
    expect(appels).toHaveLength(0);
    expect(crees).toHaveLength(1);
    expect(crees[0]!.data.type).toBe("manuel");
  });

  it("passe en manuel si aucun serrureId n'est fourni", async () => {
    const { repo, crees } = creerRepoMock();
    const { serrure, appels } = creerSerrureMock({ disponible: true });
    const useCase = new CreerAccesSerrure(repo, serrure);

    const resultat = await useCase.executer({ ...INPUT_BASE, serrureId: null });

    expect(resultat.fournisseur).toBe("manuel");
    expect(appels).toHaveLength(0);
    expect(crees).toHaveLength(1);
    expect(crees[0]!.data.type).toBe("manuel");
  });

  it("retourne l'accès existant sans en créer un nouveau (idempotence par ref)", async () => {
    const existant: AccesSerrureRow = {
      id: "acces-existant",
      tenantId: TENANT,
      logementId: LOGEMENT,
      reservationId: RESERVATION,
      ref: `ACC-${LOGEMENT.slice(0, 8)}-20270610`,
      type: "numerique",
      code: "123456",
      statut: "actif",
      fournisseur: "nuki",
      valideDe: "2027-06-10T15:00:00.000Z",
      valideA: "2027-06-17T11:00:00.000Z",
      expireLe: null,
      note: null,
      revoqueLe: null,
      revoquePar: null,
      externalId: "codeId-111",
    };
    const { repo, crees } = creerRepoMock({ existant });
    const { serrure, appels } = creerSerrureMock({ disponible: true });
    const useCase = new CreerAccesSerrure(repo, serrure);

    const resultat = await useCase.executer(INPUT_BASE);

    expect(resultat.existant).toBe(true);
    expect(resultat.id).toBe("acces-existant");
    expect(resultat.fournisseur).toBe("nuki");
    expect(appels).toHaveLength(0);
    expect(crees).toHaveLength(0);
  });

  it("propage une erreur domaine si la fenêtre est incohérente", async () => {
    const { repo } = creerRepoMock();
    const { serrure } = creerSerrureMock({ disponible: true });
    const useCase = new CreerAccesSerrure(repo, serrure);

    await expect(
      useCase.executer({ ...INPUT_BASE, arrivee: "2027-06-17", depart: "2027-06-10" }),
    ).rejects.toThrow(ErreurMetier);
  });
});
