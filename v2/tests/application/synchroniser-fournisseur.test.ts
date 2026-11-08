import { beforeEach, describe, expect, it } from "vitest";
import { ImporterReservationsFournisseur } from "@/application/use-cases/importer-reservations-fournisseur";
import { SynchroniserFournisseur } from "@/application/use-cases/synchroniser-fournisseur";
import type {
  DisponibiliteJour,
  EntreeWebhook,
  FournisseurCanal,
  ReservationExterne,
  RestrictionJour,
  TarifJour,
} from "@/application/ports/fournisseur-canal";
import type { PlanTarifaireRepository } from "@/application/ports/plan-tarifaire-repository";
import {
  ficheFournisseur,
  type CodeFournisseur,
} from "@/domain/fournisseur";
import { BlocageRepositoryMemoire } from "../helpers/blocage-repository-memoire";
import { FournisseurRepositoryMemoire } from "../helpers/fournisseur-repository-memoire";
import { ReservationRepositoryMemoire } from "../helpers/reservation-repository-memoire";
import { RestrictionSejourRepositoryMemoire } from "../helpers/restriction-sejour-repository-memoire";
import { TarifRepositoryMemoire } from "../helpers/tarif-repository-memoire";
import { TenantRepositoryMemoire } from "../helpers/tenant-repository-memoire";

const TENANT = "11111111-1111-4111-8111-111111111111";
const LOGEMENT = "22222222-2222-4222-8222-222222222222";

class FournisseurEspion implements FournisseurCanal {
  readonly code: CodeFournisseur;
  readonly mode;
  readonly capacites;
  readonly disponibilites: DisponibiliteJour[][] = [];
  readonly tarifs: TarifJour[][] = [];
  readonly restrictions: RestrictionJour[][] = [];
  reservations: ReservationExterne[] = [];
  lectureErreur: Error | null = null;

  constructor(code: CodeFournisseur) {
    const fiche = ficheFournisseur(code);
    if (!fiche) throw new Error("Fournisseur de test inconnu.");
    this.code = code;
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
    if (this.lectureErreur) throw this.lectureErreur;
    return this.reservations;
  }

  async pousserDisponibilites(changements: readonly DisponibiliteJour[]) {
    this.disponibilites.push([...changements]);
  }

  async pousserTarifs(tarifs: readonly TarifJour[]) {
    this.tarifs.push([...tarifs]);
  }

  async pousserRestrictions(restrictions: readonly RestrictionJour[]) {
    this.restrictions.push([...restrictions]);
  }

  async verifierWebhook(_entree: EntreeWebhook) {
    return true;
  }
}

describe("SynchroniserFournisseur", () => {
  let fournisseurs: FournisseurRepositoryMemoire;
  let reservations: ReservationRepositoryMemoire;
  let blocages: BlocageRepositoryMemoire;
  let tarifs: TarifRepositoryMemoire;
  let restrictions: RestrictionSejourRepositoryMemoire;
  let tenants: TenantRepositoryMemoire;
  let fournisseur: FournisseurEspion;
  let synchroniser: SynchroniserFournisseur;

  beforeEach(async () => {
    fournisseurs = new FournisseurRepositoryMemoire();
    for (const code of [
      "beds24",
      "channex",
      "smoobu",
      "hostport",
      "nobeds",
    ] as const) {
      await fournisseurs.definirActivation(code, true, "test");
    }
    reservations = new ReservationRepositoryMemoire();
    blocages = new BlocageRepositoryMemoire();
    tarifs = new TarifRepositoryMemoire();
    restrictions = new RestrictionSejourRepositoryMemoire();
    tenants = new TenantRepositoryMemoire();
    tenants.ajouter({
      id: TENANT,
      slug: "lcd",
      nom: "LCD Parc",
      nature: "nom_propre",
      regime: "micro_bic_non_classe",
      tva: "non",
      siren: null,
      adresse: null,
      mentionsLegales: null,
      statut: "actif",
      ventesSuspendues: false,
      ventesSuspenduesMotif: null,
      ventesSuspenduesLe: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    fournisseur = new FournisseurEspion("beds24");
    await fournisseurs.affecter({
      tenantId: TENANT,
      logementId: LOGEMENT,
      fournisseurCode: "beds24",
      externalPropertyId: "prop-1",
      externalRoomTypeId: "123",
      externalRatePlanId: null,
    });
    await tarifs.definir({
      tenantId: TENANT,
      logementId: LOGEMENT,
      date: "2027-01-01",
      prixCentimes: 10000,
    });
    await tarifs.definir({
      tenantId: TENANT,
      logementId: LOGEMENT,
      date: "2027-01-02",
      prixCentimes: 12000,
    });
    fournisseur.reservations = [
      {
        externalId: "ext-1",
        externalPropertyId: "prop-1",
        reference: "ABC123",
        arrivee: "2027-01-02",
        depart: "2027-01-04",
        statut: "confirmee",
        clientNom: "Alice",
        clientEmail: null,
        montantCentimes: 24000,
        devise: "EUR",
      },
    ];
    synchroniser = new SynchroniserFournisseur(
      fournisseurs,
      reservations,
      blocages,
      tarifs,
      restrictions,
      new ImporterReservationsFournisseur(reservations, blocages),
      () => fournisseur,
      undefined,
      undefined,
      tenants,
    );
  });

  const executer = (force = false) =>
    synchroniser.executer({
      tenantId: TENANT,
      logementId: LOGEMENT,
      maintenant: "2027-01-01",
      horizonJours: 3,
      force,
    });

  it("ferme les disponibilités OTA quand les ventes sont suspendues", async () => {
    await tenants.suspendreVentes(TENANT, true, "Inspection");
    const resultat = await executer(true);

    expect(resultat.statut).toBe("ok");
    const dernier = fournisseur.disponibilites.at(-1) ?? [];
    expect(dernier.length).toBeGreaterThan(0);
    expect(dernier.every((jour) => jour.disponible === false)).toBe(true);
  });

  it("pousse les tarifs du plan Channex avec son rate_plan_id", async () => {
    await fournisseurs.affecter({
      tenantId: TENANT,
      logementId: LOGEMENT,
      fournisseurCode: "channex",
      externalPropertyId: "prop-1",
      externalRoomTypeId: "123",
      externalRatePlanId: null,
    });
    const fournisseurChannex = new FournisseurEspion("channex");
    fournisseurChannex.reservations = [];
    const plan = {
      id: "plan-1",
      tenantId: TENANT,
      logementId: LOGEMENT,
      nom: "Non remboursable",
      code: "non-remboursable",
      externalRatePlanId: "rate-1",
      mode: "independant" as const,
      ajustementPourcentage: 0,
      heriteRestrictions: false,
      priorite: 1,
      actif: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await tarifs.definir({
      tenantId: TENANT,
      logementId: LOGEMENT,
      planTarifaireId: plan.id,
      date: "2027-01-01",
      prixCentimes: 9000,
    });
    const plans = {
      listerParLogement: async () => [plan],
    } as unknown as PlanTarifaireRepository;
    const avecPlan = new SynchroniserFournisseur(
      fournisseurs,
      reservations,
      blocages,
      tarifs,
      restrictions,
      new ImporterReservationsFournisseur(reservations, blocages),
      () => fournisseurChannex,
      undefined,
      plans,
    );
    const resultat = await avecPlan.executer({
      tenantId: TENANT,
      logementId: LOGEMENT,
      maintenant: "2027-01-01",
      horizonJours: 3,
      force: true,
    });
    expect(resultat.statut).toBe("ok");
    expect(fournisseurChannex.tarifs).toHaveLength(1);
    const planTarifs = fournisseurChannex.tarifs.find((lot) =>
      lot.some((tarif) => tarif.externalRatePlanId === "rate-1"),
    );
    expect(planTarifs?.[0]?.prixCentimes).toBe(9000);
    expect(resultat.tarifs).toBe(1);
  });

  it("dérive les prix et hérite des règles du plan de base", async () => {
    await fournisseurs.affecter({
      tenantId: TENANT,
      logementId: LOGEMENT,
      fournisseurCode: "channex",
      externalPropertyId: "prop-1",
      externalRoomTypeId: "123",
      externalRatePlanId: null,
    });
    await restrictions.enregistrer(TENANT, LOGEMENT, {
      date: "2027-01-01",
      sejourMin: 2,
      sejourMax: null,
      arriveeAutorisee: null,
      departAutorisee: null,
      stopSell: null,
    });
    const fournisseurChannex = new FournisseurEspion("channex");
    fournisseurChannex.reservations = [];
    const plan = {
      id: "plan-derive",
      tenantId: TENANT,
      logementId: LOGEMENT,
      nom: "Non remboursable",
      code: "non-remboursable",
      externalRatePlanId: "rate-derive",
      mode: "derive" as const,
      ajustementPourcentage: -10,
      heriteRestrictions: true,
      priorite: 1,
      actif: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const plans = {
      listerParLogement: async () => [plan],
    } as unknown as PlanTarifaireRepository;
    const avecPlan = new SynchroniserFournisseur(
      fournisseurs,
      reservations,
      blocages,
      tarifs,
      restrictions,
      new ImporterReservationsFournisseur(reservations, blocages),
      () => fournisseurChannex,
      undefined,
      plans,
    );
    const resultat = await avecPlan.executer({
      tenantId: TENANT,
      logementId: LOGEMENT,
      maintenant: "2027-01-01",
      horizonJours: 3,
      force: true,
    });
    expect(resultat.statut).toBe("ok");
    const planTarifs = fournisseurChannex.tarifs.find((lot) =>
      lot.some((tarif) => tarif.externalRatePlanId === "rate-derive"),
    );
    expect(planTarifs?.map((tarif) => tarif.prixCentimes)).toEqual([
      9000, 10800,
    ]);
    const planRestrictions = fournisseurChannex.restrictions.find((lot) =>
      lot.some((restriction) => restriction.externalRatePlanId === "rate-derive"),
    );
    expect(planRestrictions?.[0]?.sejourMin).toBe(2);
  });

  it("ferme la nuit de préparation après un départ", async () => {
    const resultat = await synchroniser.executer({
      tenantId: TENANT,
      logementId: LOGEMENT,
      maintenant: "2027-01-01",
      horizonJours: 5,
      bufferJours: 1,
    });
    expect(resultat.statut).toBe("ok");
    const dispos = fournisseur.disponibilites[0] ?? [];
    expect(dispos.map((jour) => jour.disponible)).toEqual([
      true,
      false,
      false,
      false,
      true,
    ]);
  });

  it("pousse le cut-off comme indisponibilité", async () => {
    fournisseur.reservations = [];
    const resultat = await synchroniser.executer({
      tenantId: TENANT,
      logementId: LOGEMENT,
      maintenant: "2027-01-01",
      horizonJours: 4,
      cutoffJours: 2,
    });
    expect(resultat.statut).toBe("ok");
    const dispos = fournisseur.disponibilites[0] ?? [];
    expect(dispos.map((jour) => jour.disponible)).toEqual([
      false,
      false,
      true,
      true,
    ]);
  });

  it("importe les réservations puis pousse disponibilités et tarifs", async () => {
    const resultat = await executer();
    expect(resultat.statut).toBe("ok");
    expect(resultat.import.crees).toBe(1);
    expect(fournisseur.disponibilites).toHaveLength(1);
    expect(fournisseur.tarifs).toHaveLength(1);
    const dispos = fournisseur.disponibilites[0] ?? [];
    expect(dispos).toHaveLength(3);
    expect(dispos[0]?.disponible).toBe(true);
    expect(dispos[1]?.disponible).toBe(false);
    expect(dispos[2]?.disponible).toBe(false);
    expect(fournisseur.tarifs[0]).toHaveLength(2);
  });

  it("pousse les règles de séjour locales", async () => {
    await restrictions.enregistrer(TENANT, LOGEMENT, {
      date: "2027-01-02",
      sejourMin: 2,
      sejourMax: 5,
      arriveeAutorisee: false,
      departAutorisee: null,
      stopSell: true,
    });

    const resultat = await executer();

    expect(resultat.statut).toBe("ok");
    expect(resultat.restrictions).toBe(1);
    expect(fournisseur.restrictions).toHaveLength(1);
    expect(fournisseur.restrictions[0]?.[0]).toMatchObject({
      externalPropertyId: "prop-1",
      externalRoomTypeId: "123",
      date: "2027-01-02",
      sejourMin: 2,
      sejourMax: 5,
      arriveeAutorisee: false,
      stopSell: true,
    });
  });

  it("ne pousse pas les CTA/CTD à Smoobu", async () => {
    fournisseur = new FournisseurEspion("smoobu");
    fournisseur.reservations = [];
    await fournisseurs.affecter({
      tenantId: TENANT,
      logementId: LOGEMENT,
      fournisseurCode: "smoobu",
      externalPropertyId: "12345",
      externalRoomTypeId: null,
      externalRatePlanId: null,
    });
    await restrictions.enregistrer(TENANT, LOGEMENT, {
      date: "2027-01-02",
      sejourMin: 2,
      sejourMax: null,
      arriveeAutorisee: false,
      departAutorisee: null,
      stopSell: true,
    });
    synchroniser = new SynchroniserFournisseur(
      fournisseurs,
      reservations,
      blocages,
      tarifs,
      restrictions,
      new ImporterReservationsFournisseur(reservations, blocages),
      () => fournisseur,
    );

    const resultat = await executer();

    expect(resultat.statut).toBe("partiel");
    expect(resultat.message).toContain("CTA/CTD");
    expect(resultat.message).toContain("stop-sell");
    expect(fournisseur.restrictions[0]?.[0]).toMatchObject({
      date: "2027-01-02",
      sejourMin: 2,
    });
    expect(fournisseur.restrictions[0]?.[0]?.arriveeAutorisee).toBeUndefined();
    expect(fournisseur.restrictions[0]?.[0]?.stopSell).toBeUndefined();
  });

  it("ne repousse pas un ARI identique", async () => {
    await executer();
    const resultat = await executer();
    expect(resultat.statut).toBe("inchange");
    expect(fournisseur.disponibilites).toHaveLength(1);
    expect(fournisseur.tarifs).toHaveLength(1);
  });

  it("repousse avec force", async () => {
    await executer();
    await executer(true);
    expect(fournisseur.disponibilites).toHaveLength(2);
    expect(fournisseur.tarifs).toHaveLength(2);
  });

  it("refuse un fournisseur désactivé par le super-admin", async () => {
    await fournisseurs.definirActivation("beds24", false, "test");
    await expect(executer()).rejects.toThrow("désactivé");
  });

  it("signale un identifiant de chambre manquant", async () => {
    await fournisseurs.affecter({
      tenantId: TENANT,
      logementId: LOGEMENT,
      fournisseurCode: "beds24",
      externalPropertyId: "prop-1",
      externalRoomTypeId: null,
      externalRatePlanId: null,
    });
    const resultat = await executer();
    expect(resultat.statut).toBe("configuration_incomplete");
    expect(resultat.import.crees).toBe(0);
    expect(fournisseur.disponibilites).toHaveLength(0);
  });

  it("ne pousse pas l’ARI quand la lecture des réservations échoue", async () => {
    fournisseur.lectureErreur = new Error("API indisponible");
    const resultat = await executer();
    expect(resultat.statut).toBe("partiel");
    expect(resultat.message).toContain("API indisponible");
    expect(resultat.disponibilites).toBe(0);
    expect(fournisseur.disponibilites).toHaveLength(0);
  });

  it("pousse les tarifs Channex seulement avec un plan tarifaire", async () => {
    fournisseur = new FournisseurEspion("channex");
    fournisseur.reservations = [];
    await fournisseurs.affecter({
      tenantId: TENANT,
      logementId: LOGEMENT,
      fournisseurCode: "channex",
      externalPropertyId: "prop-1",
      externalRoomTypeId: "room-1",
      externalRatePlanId: null,
    });
    synchroniser = new SynchroniserFournisseur(
      fournisseurs,
      reservations,
      blocages,
      tarifs,
      restrictions,
      new ImporterReservationsFournisseur(reservations, blocages),
      () => fournisseur,
    );
    await restrictions.enregistrer(TENANT, LOGEMENT, {
      date: "2027-01-02",
      sejourMin: 2,
      sejourMax: null,
      arriveeAutorisee: null,
      departAutorisee: null,
      stopSell: null,
    });
    const resultat = await executer();
    expect(resultat.statut).toBe("partiel");
    expect(fournisseur.disponibilites).toHaveLength(1);
    expect(fournisseur.tarifs).toHaveLength(0);
    expect(fournisseur.restrictions).toHaveLength(0);
    expect(resultat.message).toContain("restrictions non poussées");
  });

  it("ne pousse aucun ARI en lecture seule mais importe", async () => {
    fournisseur = new FournisseurEspion("hostport");
    fournisseur.reservations = [
      {
        externalId: "hp-1",
        externalPropertyId: "prop-1",
        reference: "HP123",
        arrivee: "2027-01-02",
        depart: "2027-01-04",
        statut: "confirmee",
        clientNom: "Bob",
        clientEmail: null,
        montantCentimes: 20000,
        devise: "EUR",
      },
    ];
    await fournisseurs.affecter({
      tenantId: TENANT,
      logementId: LOGEMENT,
      fournisseurCode: "hostport",
      externalPropertyId: "prop-1",
      externalRoomTypeId: null,
      externalRatePlanId: null,
    });
    synchroniser = new SynchroniserFournisseur(
      fournisseurs,
      reservations,
      blocages,
      tarifs,
      restrictions,
      new ImporterReservationsFournisseur(reservations, blocages),
      () => fournisseur,
    );
    const resultat = await executer();
    expect(resultat.statut).toBe("lecture_seule");
    expect(resultat.import.crees).toBe(1);
    expect(fournisseur.disponibilites).toHaveLength(0);
  });

  it("refuse Nobeds sans tarif sur chaque jour", async () => {
    fournisseur = new FournisseurEspion("nobeds");
    fournisseur.reservations = [];
    await fournisseurs.affecter({
      tenantId: TENANT,
      logementId: LOGEMENT,
      fournisseurCode: "nobeds",
      externalPropertyId: "prop-1",
      externalRoomTypeId: "9",
      externalRatePlanId: null,
    });
    synchroniser = new SynchroniserFournisseur(
      fournisseurs,
      reservations,
      blocages,
      tarifs,
      restrictions,
      new ImporterReservationsFournisseur(reservations, blocages),
      () => fournisseur,
    );
    const resultat = await executer();
    expect(resultat.statut).toBe("configuration_incomplete");
    expect(fournisseur.disponibilites).toHaveLength(0);
  });
});
