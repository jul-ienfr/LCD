import { beforeEach, describe, expect, it } from "vitest";
import { ReconcilierCanal } from "@/application/use-cases/reconcilier-canal";
import type {
  DisponibiliteJour,
  EntreeWebhook,
  FournisseurCanal,
  ReservationExterne,
  RestrictionJour,
  TarifJour,
} from "@/application/ports/fournisseur-canal";
import { ficheFournisseur, type CodeFournisseur } from "@/domain/fournisseur";
import { FournisseurRepositoryMemoire } from "../helpers/fournisseur-repository-memoire";
import { ReservationRepositoryMemoire } from "../helpers/reservation-repository-memoire";

const TENANT = "11111111-1111-4111-8111-111111111111";
const LOGEMENT = "22222222-2222-4222-8222-222222222222";

class FournisseurEspion implements FournisseurCanal {
  readonly code: CodeFournisseur = "beds24";
  readonly mode;
  readonly capacites;
  reservations: ReservationExterne[] = [];
  erreur: Error | null = null;

  constructor() {
    const fiche = ficheFournisseur("beds24");
    if (!fiche) throw new Error("Fournisseur de test inconnu.");
    this.mode = fiche.mode;
    this.capacites = fiche.capacites;
  }

  async testerConnexion() {
    return { ok: true, message: "ok" };
  }

  async listerLogements() {
    return [];
  }

  async recupererReservations(): Promise<ReservationExterne[]> {
    if (this.erreur) throw this.erreur;
    return this.reservations;
  }

  async pousserDisponibilites(_changements: readonly DisponibiliteJour[]) {}
  async pousserTarifs(_tarifs: readonly TarifJour[]) {}
  async pousserRestrictions(_restrictions: readonly RestrictionJour[]) {}
  async verifierWebhook(_entree: EntreeWebhook) {
    return true;
  }
}

describe("ReconcilierCanal", () => {
  let fournisseurs: FournisseurRepositoryMemoire;
  let reservations: ReservationRepositoryMemoire;
  let fournisseur: FournisseurEspion;
  let useCase: ReconcilierCanal;

  beforeEach(async () => {
    fournisseurs = new FournisseurRepositoryMemoire();
    reservations = new ReservationRepositoryMemoire();
    fournisseur = new FournisseurEspion();
    await fournisseurs.definirActivation("beds24", true, "test");
    await fournisseurs.affecter({
      tenantId: TENANT,
      logementId: LOGEMENT,
      fournisseurCode: "beds24",
      externalPropertyId: "prop-1",
      externalRoomTypeId: "room-1",
      externalRatePlanId: null,
    });
    useCase = new ReconcilierCanal(
      fournisseurs,
      reservations,
      () => fournisseur,
    );
  });

  it("rapporte une réservation externe absente localement", async () => {
    fournisseur.reservations = [
      {
        externalId: "EXT-1",
        externalPropertyId: "prop-1",
        externalRoomTypeId: "room-1",
        reference: "BK-1",
        arrivee: "2026-12-01",
        depart: "2026-12-05",
        statut: "confirmee",
        clientNom: "Alice",
        clientEmail: null,
        montantCentimes: 50000,
        devise: "EUR",
      },
    ];

    const resultat = await useCase.executer({
      tenantId: TENANT,
      logementId: LOGEMENT,
      depuis: "2026-12-01",
      jusqua: "2026-12-31",
    });

    expect(resultat.fournisseurCode).toBe("beds24");
    expect(resultat.manquantes).toBe(1);
    expect(resultat.ecarts[0]?.ref).toBe("fournisseur:beds24:EXT-1");
  });

  it("ne rapporte rien quand la réservation locale correspond", async () => {
    fournisseur.reservations = [
      {
        externalId: "EXT-1",
        externalPropertyId: "prop-1",
        externalRoomTypeId: "room-1",
        reference: "BK-1",
        arrivee: "2026-12-01",
        depart: "2026-12-05",
        statut: "confirmee",
        clientNom: "Alice",
        clientEmail: null,
        montantCentimes: 50000,
        devise: "EUR",
      },
    ];
    await reservations.creer({
      tenantId: TENANT,
      logementId: LOGEMENT,
      ref: "fournisseur:beds24:EXT-1",
      debut: "2026-12-01",
      fin: "2026-12-05",
      statut: "confirmee",
      source: "fournisseur:beds24",
      voyageurs: 2,
      montantCentimes: 50000,
    });

    const resultat = await useCase.executer({
      tenantId: TENANT,
      logementId: LOGEMENT,
      depuis: "2026-12-01",
      jusqua: "2026-12-31",
    });

    expect(resultat.ecarts).toEqual([]);
  });

  it("refuse un logement sans fournisseur actif", async () => {
    await fournisseurs.basculerActivation(TENANT, LOGEMENT, false);
    await expect(
      useCase.executer({
        tenantId: TENANT,
        logementId: LOGEMENT,
        depuis: "2026-12-01",
        jusqua: "2026-12-31",
      }),
    ).rejects.toThrow(/Aucun fournisseur actif/);
  });

  it("refuse un fournisseur non configuré côté serveur", async () => {
    const sansCles = new ReconcilierCanal(
      fournisseurs,
      reservations,
      () => null,
    );
    await expect(
      sansCles.executer({
        tenantId: TENANT,
        logementId: LOGEMENT,
        depuis: "2026-12-01",
        jusqua: "2026-12-31",
      }),
    ).rejects.toThrow(/clés serveur/);
  });

  it("refuse un mapping sans propriété externe", async () => {
    await fournisseurs.affecter({
      tenantId: TENANT,
      logementId: LOGEMENT,
      fournisseurCode: "beds24",
      externalPropertyId: null,
      externalRoomTypeId: null,
      externalRatePlanId: null,
    });
    await expect(
      useCase.executer({
        tenantId: TENANT,
        logementId: LOGEMENT,
        depuis: "2026-12-01",
        jusqua: "2026-12-31",
      }),
    ).rejects.toThrow(/propriété externe/);
  });
});
