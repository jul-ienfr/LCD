import { describe, expect, it } from "vitest";
import type {
  LogementAvecMandat,
  RapportsRepository,
  ReservationPeriodeRapport,
} from "@/application/ports/rapports-repository";
import type { RelevesRepository } from "@/application/ports/releves-repository";
import type { ReleveProprietaire } from "@/domain/releve-proprietaire";
import {
  bornesPeriode,
  GenererReleve,
  moisFinPeriode,
} from "@/application/use-cases/generer-releve";

// --- Fakes mémoire ---

class RapportsMemoire implements RapportsRepository {
  constructor(
    private readonly reservations: ReservationPeriodeRapport[],
    private readonly mandats: LogementAvecMandat[],
  ) {}

  async listerReservationsPeriode(
    _tenantId: string,
    _premierJour: string,
    _dernierJourExclu: string,
  ): Promise<ReservationPeriodeRapport[]> {
    // Le filtrage de chevauchement est supposé fait par la base ; le fake
    // renvoie tout pour tester la logique du use case.
    return this.reservations;
  }

  async listerLogementsAvecMandat(
    _tenantId: string,
  ): Promise<LogementAvecMandat[]> {
    return this.mandats;
  }
}

class RelevesMemoire implements RelevesRepository {
  readonly enregistres: ReleveProprietaire[] = [];

  async enregistrer(
    _tenantId: string,
    releve: ReleveProprietaire,
  ): Promise<{ id: string; cree: boolean }> {
    const existant = this.enregistres.find(
      (r) =>
        r.proprietaireId === releve.proprietaireId &&
        r.moisDebut === releve.moisDebut &&
        r.periode === releve.periode,
    );
    if (existant) return { id: existant.id, cree: false };
    this.enregistres.push(releve);
    return { id: releve.id, cree: true };
  }

  async trouverParId(
    _tenantId: string,
    _releveId: string,
  ): Promise<ReleveProprietaire | null> {
    return null;
  }

  async trouverParPeriode(
    _tenantId: string,
    _proprietaireId: string,
    _moisDebut: string,
    _periode: string,
  ): Promise<ReleveProprietaire | null> {
    return null;
  }

  async listerParProprietaire(
    _tenantId: string,
    _proprietaireId: string,
    _limite?: number,
  ): Promise<ReleveProprietaire[]> {
    return [];
  }

  async listerParTenant(
    _tenantId: string,
    _options?: { moisDebut?: string; moisFin?: string },
  ): Promise<ReleveProprietaire[]> {
    return [];
  }
}

// --- Fixtures ---

const TENANT = "11111111-1111-4111-8111-111111111111";
const PROPRIO = "user-proprio-1";

const mandats: LogementAvecMandat[] = [
  {
    logementId: "log-1",
    logementNom: "Villa A",
    proprietaireId: PROPRIO,
    proprietaireNom: "Jean Dupont",
    proprietaireEmail: "jean.dupont@lcd-parc.test",
    commissionBp: 2_000,
    chargesMensuellesCentimes: 5_000,
  },
  {
    logementId: "log-2",
    logementNom: "Villa B",
    proprietaireId: PROPRIO,
    proprietaireNom: "Jean Dupont",
    proprietaireEmail: "jean.dupont@lcd-parc.test",
    commissionBp: 1_500,
    chargesMensuellesCentimes: 0,
  },
  {
    logementId: "log-autre",
    logementNom: "Villa d'un autre proprio",
    proprietaireId: "user-autre",
    proprietaireNom: "Autre",
    proprietaireEmail: null,
    commissionBp: 2_000,
    chargesMensuellesCentimes: 0,
  },
];

const reservations: ReservationPeriodeRapport[] = [
  {
    logementId: "log-1",
    debut: "2026-03-05",
    fin: "2026-03-10",
    statut: "confirmee",
    montantCentimes: 100_000,
    source: "direct",
  },
  {
    logementId: "log-1",
    debut: "2026-03-15",
    fin: "2026-03-18",
    statut: "annulee",
    montantCentimes: 80_000,
    source: "fournisseur:beds24",
  },
  {
    logementId: "log-2",
    debut: "2026-03-01",
    fin: "2026-03-08",
    statut: "confirmee",
    montantCentimes: 50_000,
    source: "fournisseur:beds24",
  },
];

// --- Tests helpers ---

describe("generer-releve — helpers", () => {
  it("moisFinPeriode : mensuel = même mois", () => {
    expect(moisFinPeriode("2026-03", "mensuel")).toBe("2026-03");
  });

  it("moisFinPeriode : trimestriel = mois + 2", () => {
    expect(moisFinPeriode("2026-01", "trimestriel")).toBe("2026-03");
    expect(moisFinPeriode("2026-11", "trimestriel")).toBe("2027-01");
  });

  it("bornesPeriode : premier jour et lendemain du dernier jour", () => {
    expect(bornesPeriode("2026-03", "2026-03")).toEqual({
      premierJour: "2026-03-01",
      dernierJourExclu: "2026-04-01",
    });
    expect(bornesPeriode("2026-01", "2026-03")).toEqual({
      premierJour: "2026-01-01",
      dernierJourExclu: "2026-04-01",
    });
  });
});

// --- Tests use case ---

describe("GenererReleve", () => {
  it("génère un relevé mensuel avec une ligne par logement du propriétaire", async () => {
    const releves = new RelevesMemoire();
    const useCase = new GenererReleve(
      new RapportsMemoire(reservations, mandats),
      releves,
    );

    const { releve, cree } = await useCase.executer({
      tenantId: TENANT,
      proprietaireId: PROPRIO,
      proprietaireNom: "Jean Dupont",
      moisDebut: "2026-03",
      periode: "mensuel",
    });

    expect(cree).toBe(true);
    expect(releve.periode).toBe("mensuel");
    expect(releve.moisDebut).toBe("2026-03");
    expect(releve.moisFin).toBe("2026-03");
    // Seulement les 2 logements du propriétaire, pas celui d'un autre.
    expect(releve.lignes).toHaveLength(2);

    // Villa A : 100 000 de CA (l'annulée de 80 000 est exclue).
    const villaA = releve.lignes.find((l) => l.logementId === "log-1");
    expect(villaA?.caCentimes).toBe(100_000);
    expect(villaA?.sejours).toBe(1);
    expect(villaA?.commissionCentimes).toBe(20_000); // 20 % de 100 000
    expect(villaA?.chargesCentimes).toBe(5_000);
    expect(villaA?.netCentimes).toBe(75_000);

    // Villa B : 50 000 de CA, commission 15 %, pas de charges.
    const villaB = releve.lignes.find((l) => l.logementId === "log-2");
    expect(villaB?.caCentimes).toBe(50_000);
    expect(villaB?.commissionCentimes).toBe(7_500); // 15 % de 50 000
    expect(villaB?.netCentimes).toBe(42_500);

    // Totaux agrégés.
    expect(releve.totalCaCentimes).toBe(150_000);
    expect(releve.totalCommissionCentimes).toBe(27_500);
    expect(releve.totalChargesCentimes).toBe(5_000);
    expect(releve.totalNetCentimes).toBe(117_500);
  });

  it("un logement sans réservation a un CA nul mais des charges", async () => {
    const releves = new RelevesMemoire();
    const useCase = new GenererReleve(
      new RapportsMemoire([], mandats),
      releves,
    );

    const { releve } = await useCase.executer({
      tenantId: TENANT,
      proprietaireId: PROPRIO,
      proprietaireNom: "Jean Dupont",
      moisDebut: "2026-03",
      periode: "mensuel",
    });

    const villaA = releve.lignes.find((l) => l.logementId === "log-1");
    expect(villaA?.caCentimes).toBe(0);
    expect(villaA?.sejours).toBe(0);
    expect(villaA?.chargesCentimes).toBe(5_000);
    expect(villaA?.netCentimes).toBe(-5_000);
  });

  it("est idempotent : un rejeu retourne le même relevé sans le dupliquer", async () => {
    const releves = new RelevesMemoire();
    const useCase = new GenererReleve(
      new RapportsMemoire(reservations, mandats),
      releves,
    );
    const input = {
      tenantId: TENANT,
      proprietaireId: PROPRIO,
      proprietaireNom: "Jean Dupont",
      moisDebut: "2026-03",
      periode: "mensuel" as const,
    };

    const premier = await useCase.executer(input);
    const second = await useCase.executer(input);

    expect(premier.cree).toBe(true);
    expect(second.cree).toBe(false);
    expect(second.releve.id).toBe(premier.releve.id);
    expect(releves.enregistres).toHaveLength(1);
  });

  it("un propriétaire sans mandat reçoit un relevé vide", async () => {
    const releves = new RelevesMemoire();
    const useCase = new GenererReleve(
      new RapportsMemoire(reservations, mandats),
      releves,
    );

    const { releve } = await useCase.executer({
      tenantId: TENANT,
      proprietaireId: "user-inexistant",
      proprietaireNom: "Personne",
      moisDebut: "2026-03",
      periode: "mensuel",
    });

    expect(releve.lignes).toHaveLength(0);
    expect(releve.totalCaCentimes).toBe(0);
  });

  it("rejette une période trimestrielle incohérente", async () => {
    const releves = new RelevesMemoire();
    const useCase = new GenererReleve(
      new RapportsMemoire(reservations, mandats),
      releves,
    );

    // moisDebut invalide (format).
    await expect(
      useCase.executer({
        tenantId: TENANT,
        proprietaireId: PROPRIO,
        proprietaireNom: "Jean Dupont",
        moisDebut: "2026-13",
        periode: "mensuel",
      }),
    ).rejects.toThrow("Période de relevé invalide");
  });

  it("génère un relevé trimestriel sur trois mois", async () => {
    const releves = new RelevesMemoire();
    const resaTrimestre: ReservationPeriodeRapport[] = [
      {
        logementId: "log-1",
        debut: "2026-02-10",
        fin: "2026-02-15",
        statut: "confirmee",
        montantCentimes: 60_000,
        source: "direct",
      },
    ];
    const useCase = new GenererReleve(
      new RapportsMemoire(resaTrimestre, mandats),
      releves,
    );

    const { releve } = await useCase.executer({
      tenantId: TENANT,
      proprietaireId: PROPRIO,
      proprietaireNom: "Jean Dupont",
      moisDebut: "2026-01",
      periode: "trimestriel",
    });

    expect(releve.moisDebut).toBe("2026-01");
    expect(releve.moisFin).toBe("2026-03");
    // Charges × 3 mois pour la Villa A.
    const villaA = releve.lignes.find((l) => l.logementId === "log-1");
    expect(villaA?.caCentimes).toBe(60_000);
    expect(villaA?.chargesCentimes).toBe(15_000);
  });
});
