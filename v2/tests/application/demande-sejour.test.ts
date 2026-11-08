import { describe, expect, it } from "vitest";
import { ErreurMetier } from "@/domain/erreurs";
import type { BlocageRepository } from "@/application/ports/blocage-repository";
import type { LogementRepository } from "@/application/ports/logement-repository";
import type { ReservationRepository } from "@/application/ports/reservation-repository";
import type { TarifRepository } from "@/application/ports/tarif-repository";
import type { Reservation } from "@/domain/reservation";
import { DemanderReservationDirecte } from "@/application/use-cases/reservation-directe";
import { CreerDemandeSejour } from "@/application/use-cases/creer-demande-sejour";
import { QualifierDemande } from "@/application/use-cases/qualifier-demande";
import { ConvertirDemandeEnReservation } from "@/application/use-cases/convertir-demande";
import { DemandeSejourRepositoryMemoire } from "../helpers/demande-sejour-repository-memoire";
import { RestrictionSejourRepositoryMemoire } from "../helpers/restriction-sejour-repository-memoire";

const TENANT = "t1";
const LOGEMENT = "l1";

const TARIFS = [
  { date: "2027-03-01", prixCentimes: 10_000 },
  { date: "2027-03-02", prixCentimes: 10_000 },
  { date: "2027-03-03", prixCentimes: 10_000 },
];

function creerDemandes() {
  const tarifs = {
    listerParMois: async () =>
      TARIFS.map((t) => ({
        ...t,
        prixParPersonneCentimes: null,
        personnesIncluses: 2,
      })),
  } as unknown as TarifRepository;

  const items: Reservation[] = [];
  const reservations = {
    chevauche: async () =>
      items.some((r) => r.debut < "2027-03-03" && "2027-03-01" < r.fin),
    trouverParRef: async (_t: string, ref: string) =>
      items.find((r) => r.ref === ref) ?? null,
    creer: async (data: {
      tenantId: string;
      logementId: string;
      ref: string;
      clientNom: string | null;
      clientEmail: string | null;
      voyageurs: number;
      debut: string;
      fin: string;
      montantCentimes: number;
      source: string;
    }) => {
      const reservation: Reservation = {
        id: `r-${items.length + 1}`,
        tenantId: data.tenantId,
        logementId: data.logementId,
        ref: data.ref,
        clientNom: data.clientNom,
        clientEmail: data.clientEmail,
        voyageurs: data.voyageurs,
        debut: data.debut,
        fin: data.fin,
        statut: "brouillon",
        montantCentimes: data.montantCentimes,
        source: data.source,
        fluxIcsId: null,
        departConfirmeLe: null,
        departNote: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      items.push(reservation);
      return reservation;
    },
  } as unknown as ReservationRepository;

  const blocages = {
    chevauche: async () => false,
  } as unknown as BlocageRepository;

  const logements = {
    trouverParId: async (_t: string, id: string) =>
      id === LOGEMENT
        ? {
            id: LOGEMENT,
            tenantId: TENANT,
            code: "LCD-1",
            nom: "Villa test",
            statut: "actif",
            cutoffJours: 0,
            bufferJours: 0,
          }
        : null,
  } as unknown as LogementRepository;

  const demandes = new DemandeSejourRepositoryMemoire();
  const demander = new DemanderReservationDirecte(
    tarifs,
    reservations,
    blocages,
    logements,
    new RestrictionSejourRepositoryMemoire(),
  );

  return {
    demandes,
    items,
    creer: new CreerDemandeSejour(demandes),
    qualifier: new QualifierDemande(demandes),
    convertir: new ConvertirDemandeEnReservation(demandes, demander),
  };
}

const BASE = {
  tenantId: TENANT,
  ref: "DEM-0001",
  nom: "Camille Durand",
  email: "Camille.Durand@Example.FR",
  telephone: "+33 6 12 34 56 78",
  arrivee: "2027-03-01",
  depart: "2027-03-03",
  voyageurs: 3,
  message: "Avez-vous un lit bébé ?",
  logementId: LOGEMENT,
  source: "site",
};

describe("demande de séjour", () => {
  it("enregistre la demande en normalisant l'email", async () => {
    const cas = creerDemandes();
    const { demande, dejaEnregistree } = await cas.creer.executer(BASE);

    expect(dejaEnregistree).toBe(false);
    expect(demande.email).toBe("camille.durand@example.fr");
    expect(demande.statut).toBe("nouvelle");
    expect(demande.voyageurs).toBe(3);
    expect(cas.demandes.rows).toHaveLength(1);
  });

  it("rejoue un formulaire sans créer de doublon", async () => {
    const cas = creerDemandes();
    await cas.creer.executer(BASE);
    const second = await cas.creer.executer(BASE);

    expect(second.dejaEnregistree).toBe(true);
    expect(cas.demandes.rows).toHaveLength(1);
  });

  it("refuse un email invalide, une date orpheline et trop de voyageurs", async () => {
    const cas = creerDemandes();
    await expect(
      cas.creer.executer({ ...BASE, email: "pas-un-email" }),
    ).rejects.toBeInstanceOf(ErreurMetier);
    await expect(
      cas.creer.executer({ ...BASE, depart: null }),
    ).rejects.toBeInstanceOf(ErreurMetier);
    await expect(
      cas.creer.executer({ ...BASE, voyageurs: 21 }),
    ).rejects.toBeInstanceOf(ErreurMetier);
    await expect(
      cas.creer.executer({ ...BASE, ref: "x" }),
    ).rejects.toBeInstanceOf(ErreurMetier);
    expect(cas.demandes.rows).toHaveLength(0);
  });

  it("qualifie puis refuse avec motif, et interdit une transition terminale", async () => {
    const cas = creerDemandes();
    const { demande } = await cas.creer.executer(BASE);

    const qualifiee = await cas.qualifier.executer({
      tenantId: TENANT,
      demandeId: demande.id,
      statut: "qualifiee",
    });
    expect(qualifiee.statut).toBe("qualifiee");

    await expect(
      cas.qualifier.executer({
        tenantId: TENANT,
        demandeId: demande.id,
        statut: "refusee",
      }),
    ).rejects.toBeInstanceOf(ErreurMetier);

    const refusee = await cas.qualifier.executer({
      tenantId: TENANT,
      demandeId: demande.id,
      statut: "refusee",
      motifRefus: "Dates déjà prises",
    });
    expect(refusee.statut).toBe("refusee");
    expect(refusee.motifRefus).toBe("Dates déjà prises");

    await expect(
      cas.qualifier.executer({
        tenantId: TENANT,
        demandeId: demande.id,
        statut: "qualifiee",
      }),
    ).rejects.toBeInstanceOf(ErreurMetier);
  });

  it("convertit la demande en réservation sans ressaisie", async () => {
    const cas = creerDemandes();
    const { demande } = await cas.creer.executer(BASE);
    await cas.qualifier.executer({
      tenantId: TENANT,
      demandeId: demande.id,
      statut: "qualifiee",
    });

    const resultat = await cas.convertir.executer({
      tenantId: TENANT,
      demandeId: demande.id,
      aujourdhui: "2027-01-01",
    });

    expect(resultat.dejaConvertie).toBe(false);
    expect(cas.items).toHaveLength(1);
    const reservation = cas.items[0]!;
    expect(reservation.clientNom).toBe("Camille Durand");
    expect(reservation.clientEmail).toBe("camille.durand@example.fr");
    expect(reservation.debut).toBe("2027-03-01");
    expect(reservation.fin).toBe("2027-03-03");
    expect(reservation.voyageurs).toBe(3);
    expect(reservation.source).toBe("demande:dem-0001");
    expect(resultat.demande.statut).toBe("convertie");
    expect(resultat.demande.reservationId).toBe(reservation.id);
  });

  it("conserve une source UTM d'origine lors de la conversion", async () => {
    const cas = creerDemandes();
    const { demande } = await cas.creer.executer({
      ...BASE,
      source: "utm:instagram/cpc/ete",
    });
    await cas.convertir.executer({
      tenantId: TENANT,
      demandeId: demande.id,
      aujourdhui: "2027-01-01",
    });
    expect(cas.items[0]!.source).toBe("utm:instagram/cpc/ete");
  });

  it("refuse la conversion sans dates ou sans logement", async () => {
    const cas = creerDemandes();
    const { demande } = await cas.creer.executer({
      ...BASE,
      arrivee: null,
      depart: null,
    });
    await expect(
      cas.convertir.executer({ tenantId: TENANT, demandeId: demande.id }),
    ).rejects.toBeInstanceOf(ErreurMetier);

    const cas2 = creerDemandes();
    const sansLogement = await cas2.creer.executer({
      ...BASE,
      logementId: null,
    });
    await expect(
      cas2.convertir.executer({
        tenantId: TENANT,
        demandeId: sansLogement.demande.id,
      }),
    ).rejects.toBeInstanceOf(ErreurMetier);
    expect(cas2.items).toHaveLength(0);
  });

  it("ne reconvertit pas une demande déjà convertie", async () => {
    const cas = creerDemandes();
    const { demande } = await cas.creer.executer(BASE);
    const premier = await cas.convertir.executer({
      tenantId: TENANT,
      demandeId: demande.id,
      aujourdhui: "2027-01-01",
    });
    const second = await cas.convertir.executer({
      tenantId: TENANT,
      demandeId: demande.id,
      aujourdhui: "2027-01-01",
    });

    expect(second.dejaConvertie).toBe(true);
    expect(second.reservationId).toBe(premier.reservationId);
    expect(cas.items).toHaveLength(1);
  });
});
