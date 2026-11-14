/**
 * T605 — Tests de la préparation du code d'accès à J-7 par le planificateur.
 *
 * `preparerAccesArrivee` orchestre `CreerAccesSerrure` avec deux ports mockés :
 * - `AccesSerrureRepository` (double en mémoire : idempotence par `ref`) ;
 * - `SerrureConnecteePort` (disponible, indisponible, en échec).
 *
 * Contrats vérifiés : idempotence (un rejeu ne reprogramme pas de code), repli
 * manuel systématique, et non-blocage (aucune exception ne remonte, même si la
 * persistance échoue).
 */
import { describe, expect, it } from "vitest";
import type {
  AccesSerrureRepository,
  AccesSerrureRow,
} from "@/application/ports/guides-repository";
import type { SerrureConnecteePort } from "@/application/ports/serrure-connectee";
import { CODE_ACCES_LONGUEUR } from "@/domain/acces-serrure";
import { preparerAccesArrivee } from "@/lib/server/planificateur-messages";

const TENANT = "11111111-1111-4111-8111-111111111111";
const LOGEMENT = "22222222-2222-4222-8222-222222222222";
const RESERVATION = "33333333-3333-4333-8333-333333333333";

const INPUT = {
  tenantId: TENANT,
  logementId: LOGEMENT,
  reservationId: RESERVATION,
  arrivee: "2027-06-10",
  depart: "2027-06-17",
};

interface DataCreer {
  logementId: string;
  reservationId?: string | null;
  ref: string;
  type: "numerique" | "manuel";
  code?: string | null;
  fournisseur?: string | null;
  valideDe: string;
  valideA: string;
  expireLe?: string | null;
  note?: string | null;
  externalId?: string | null;
}

/** Double en mémoire : unicité par (tenant, ref) comme la version Drizzle. */
function creerRepoMemoire(options?: { echouer?: boolean }) {
  const rows: AccesSerrureRow[] = [];
  const appels: DataCreer[] = [];
  const repo: AccesSerrureRepository = {
    creer: async (tenantId, data) => {
      if (options?.echouer) throw new Error("base indisponible");
      appels.push(data);
      const existant = rows.find(
        (row) => row.tenantId === tenantId && row.ref === data.ref,
      );
      if (existant) return { id: existant.id, cree: false };
      const row: AccesSerrureRow = {
        id: `acces-${rows.length + 1}`,
        tenantId,
        logementId: data.logementId,
        reservationId: data.reservationId ?? null,
        ref: data.ref,
        type: data.type,
        code: data.code ?? null,
        statut: "actif",
        fournisseur: data.fournisseur ?? null,
        valideDe: data.valideDe,
        valideA: data.valideA,
        expireLe: data.expireLe ?? null,
        note: data.note ?? null,
        revoqueLe: null,
        revoquePar: null,
        externalId: data.externalId ?? null,
      };
      rows.push(row);
      return { id: row.id, cree: true };
    },
    trouverParRef: async (tenantId, ref) =>
      rows.find((row) => row.tenantId === tenantId && row.ref === ref) ?? null,
    trouverParId: async (tenantId, id) =>
      rows.find((row) => row.tenantId === tenantId && row.id === id) ?? null,
    listerParLogement: async (tenantId, logementId) =>
      rows.filter(
        (row) => row.tenantId === tenantId && row.logementId === logementId,
      ),
    listerParReservation: async (tenantId, reservationId) =>
      rows.filter(
        (row) =>
          row.tenantId === tenantId && row.reservationId === reservationId,
      ),
    revoquer: async (tenantId, id) => {
      const row = rows.find((item) => item.tenantId === tenantId && item.id === id);
      if (!row) return null;
      row.statut = "revoque";
      return row;
    },
  };
  return { repo, rows, appels };
}

function creerSerrureMock(options?: {
  disponible?: boolean;
  erreur?: boolean;
}) {
  const programmations: string[] = [];
  const serrure: SerrureConnecteePort = {
    nom: "nuki",
    estDisponible: () => options?.disponible ?? true,
    creerCode: async ({ code }) => {
      if (options?.erreur) throw new Error("Nuki a refusé le code");
      programmations.push(code);
      return { externalId: "nuki-code-1" };
    },
    revoquerCode: async () => {},
  };
  return { serrure, programmations };
}

describe("preparerAccesArrivee (T605 — J-7)", () => {
  it("programme un code Nuki quand la serrure est disponible", async () => {
    const { repo, rows } = creerRepoMemoire();
    const { serrure, programmations } = creerSerrureMock();

    const acces = await preparerAccesArrivee(
      { acces: repo, serrure },
      { ...INPUT, serrureId: "nuki-123" },
    );

    expect(acces).not.toBeNull();
    expect(acces?.fournisseur).toBe("nuki");
    expect(acces?.fallback).toBe(false);
    expect(acces?.existant).toBe(false);
    expect(acces?.code).toHaveLength(CODE_ACCES_LONGUEUR);
    expect(programmations).toEqual([acces?.code]);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.reservationId).toBe(RESERVATION);
  });

  it("bascule en code manuel quand la serrure est indisponible", async () => {
    const { repo, rows } = creerRepoMemoire();
    const { serrure } = creerSerrureMock({ disponible: false });

    const acces = await preparerAccesArrivee(
      { acces: repo, serrure },
      { ...INPUT, serrureId: "nuki-123" },
    );

    expect(acces?.fournisseur).toBe("manuel");
    // Serrure non configurée : ce n'est pas un échec Nuki, donc pas de `fallback`.
    expect(acces?.fallback).toBe(false);
    expect(acces?.code).toMatch(/^\d{6}$/);
    expect(rows[0]?.type).toBe("manuel");
    expect(rows[0]?.fournisseur).toBe("manuel");
  });

  it("bascule en code manuel quand Nuki échoue, sans lever", async () => {
    const { repo, rows } = creerRepoMemoire();
    const { serrure } = creerSerrureMock({ erreur: true });

    const acces = await preparerAccesArrivee(
      { acces: repo, serrure },
      { ...INPUT, serrureId: "nuki-123" },
    );

    expect(acces?.fallback).toBe(true);
    expect(acces?.fournisseur).toBe("manuel");
    expect(rows).toHaveLength(1);
  });

  it("est idempotent : un rejeu ne reprogramme pas de code", async () => {
    const { repo, rows, appels } = creerRepoMemoire();
    const { serrure, programmations } = creerSerrureMock();

    const premier = await preparerAccesArrivee(
      { acces: repo, serrure },
      { ...INPUT, serrureId: "nuki-123" },
    );
    const rejeu = await preparerAccesArrivee(
      { acces: repo, serrure },
      { ...INPUT, serrureId: "nuki-123" },
    );

    expect(rejeu?.existant).toBe(true);
    expect(rejeu?.ref).toBe(premier?.ref);
    expect(rejeu?.code).toBe(premier?.code);
    expect(rows).toHaveLength(1);
    // Le rejeu sort tôt : aucune écriture, aucune reprogrammation.
    expect(appels).toHaveLength(1);
    expect(programmations).toHaveLength(1);
  });

  it("ne bloque jamais le message : une panne de persistance retourne null", async () => {
    const { repo } = creerRepoMemoire({ echouer: true });
    const { serrure } = creerSerrureMock();

    const acces = await preparerAccesArrivee(
      { acces: repo, serrure },
      { ...INPUT, serrureId: "nuki-123" },
    );

    expect(acces).toBeNull();
  });
});
