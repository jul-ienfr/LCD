/**
 * Test de charge ARI >10 unités — priorité « Contrat channel manager ».
 *
 * Vérifie que SynchroniserFournisseur pousse les disponibilités, tarifs et
 * restrictions pour un parc de 12 logements vers un fournisseur fictif, et
 * que chaque logement reçoit un payload ARI complet.
 */
import { describe, expect, it } from "vitest";
import type { CodeFournisseur } from "@/domain/fournisseur";
import type { Tarif } from "@/domain/tarif";
import type {
  RestrictionSejour,
  ValeursRestrictionSejour,
} from "@/domain/restriction-sejour";
import type { Reservation } from "@/domain/reservation";
import type { Blocage } from "@/domain/blocage";
import type {
  FournisseurCanal,
  LogementExterne,
  ReservationExterne,
  DisponibiliteJour,
  RestrictionJour,
  ResultatTestFournisseur,
  EntreeWebhook,
  TarifJour,
} from "@/application/ports/fournisseur-canal";
import type {
  FournisseurRepository,
  ActivationFournisseur,
  LogementAvecFournisseur,
  AffecterFournisseurData,
  AffectationFournisseur,
  EtatSyncFournisseur,
} from "@/application/ports/fournisseur-repository";
import type { ReservationRepository } from "@/application/ports/reservation-repository";
import type { BlocageRepository } from "@/application/ports/blocage-repository";
import type {
  TarifRepository,
  DefinirTarifData,
} from "@/application/ports/tarif-repository";
import type { RestrictionSejourRepository } from "@/application/ports/restriction-sejour-repository";
import type { ReservationFournisseurRepository } from "@/application/ports/reservation-fournisseur-repository";
import type { LogementRepository } from "@/application/ports/logement-repository";
import type { PlanTarifaireRepository } from "@/application/ports/plan-tarifaire-repository";
import type { TenantRepository } from "@/application/ports/tenant-repository";
import { ImporterReservationsFournisseur } from "@/application/use-cases/importer-reservations-fournisseur";
import {
  SynchroniserFournisseur,
  type ResultatSyncFournisseur,
} from "@/application/use-cases/synchroniser-fournisseur";

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

const NOMBRE_LOGEMENTS = 12;
const TENANT_ID = "tenant-charge";
const FOURNISSEUR_CODE: CodeFournisseur = "beds24";
const MAINTENANT = "2026-06-15";
const HORIZON_JOURS = 30;

// ---------------------------------------------------------------------------
// Fakes
// ---------------------------------------------------------------------------

class FauxFournisseurCanal implements FournisseurCanal {
  readonly code = FOURNISSEUR_CODE;
  readonly mode = "complet" as const;
  readonly capacites = {
    ecritureDisponibilites: true,
    ecritureTarifs: true,
    ecritureRestrictions: true,
    lectureReservations: true,
    webhooks: false,
    marqueBlanche: false,
  };

  poussees: {
    disponibilites: { externalPropertyId: string; jours: number }[];
    tarifs: { externalPropertyId: string; jours: number }[];
    restrictions: { externalPropertyId: string; jours: number }[];
  } = { disponibilites: [], tarifs: [], restrictions: [] };

  async testerConnexion(): Promise<ResultatTestFournisseur> {
    return { ok: true, message: "Test" };
  }

  async listerLogements(): Promise<LogementExterne[]> {
    return [];
  }

  async recupererReservations(
    _depuis: string,
    _jusqua: string,
    _externalPropertyId?: string,
  ): Promise<ReservationExterne[]> {
    return [];
  }

  async pousserDisponibilites(
    changements: readonly DisponibiliteJour[],
  ): Promise<void> {
    const parPropriete = new Map<string, number>();
    for (const changement of changements) {
      parPropriete.set(
        changement.externalPropertyId,
        (parPropriete.get(changement.externalPropertyId) ?? 0) + 1,
      );
    }
    for (const [externalPropertyId, jours] of parPropriete) {
      this.poussees.disponibilites.push({ externalPropertyId, jours });
    }
  }

  async pousserTarifs(tarifs: readonly TarifJour[]): Promise<void> {
    const parPropriete = new Map<string, number>();
    for (const tarif of tarifs) {
      parPropriete.set(
        tarif.externalPropertyId,
        (parPropriete.get(tarif.externalPropertyId) ?? 0) + 1,
      );
    }
    for (const [externalPropertyId, jours] of parPropriete) {
      this.poussees.tarifs.push({ externalPropertyId, jours });
    }
  }

  async pousserRestrictions(
    restrictions: readonly RestrictionJour[],
  ): Promise<void> {
    const parPropriete = new Map<string, number>();
    for (const restriction of restrictions) {
      parPropriete.set(
        restriction.externalPropertyId,
        (parPropriete.get(restriction.externalPropertyId) ?? 0) + 1,
      );
    }
    for (const [externalPropertyId, jours] of parPropriete) {
      this.poussees.restrictions.push({ externalPropertyId, jours });
    }
  }

  async verifierWebhook(_entree: EntreeWebhook): Promise<boolean> {
    return false;
  }
}

class FauxFournisseurRepository implements FournisseurRepository {
  private affectations: AffectationFournisseur[] = [];

  constructor() {
    for (let i = 1; i <= NOMBRE_LOGEMENTS; i++) {
      this.affectations.push({
        id: `aff-${i}`,
        tenantId: TENANT_ID,
        logementId: `log-${i}`,
        fournisseurCode: FOURNISSEUR_CODE,
        externalPropertyId: `prop-${i}`,
        externalRoomTypeId: `room-${i}`,
        externalRatePlanId: `plan-${i}`,
        actif: true,
        derniereSync: null,
        dernierStatut: null,
        dernierMessage: null,
        derniereEmpreinte: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  async listerActivations(): Promise<ActivationFournisseur[] | null> {
    return [
      {
        code: FOURNISSEUR_CODE,
        actif: true,
        ordre: 1,
        updatedAt: new Date(),
        updatedBy: "test",
      },
    ];
  }

  async listerLogementsAvecFournisseur(): Promise<
    LogementAvecFournisseur[] | null
  > {
    return [];
  }

  async definirActivation(): Promise<void> {}

  async affecter(
    _data: AffecterFournisseurData,
  ): Promise<AffectationFournisseur> {
    throw new Error("Non implémenté");
  }

  async basculerActivation(): Promise<AffectationFournisseur | null> {
    return null;
  }

  async retirer(): Promise<void> {}

  async trouverAffectation(
    tenantId: string,
    logementId: string,
  ): Promise<AffectationFournisseur | null> {
    return (
      this.affectations.find(
        (a) => a.tenantId === tenantId && a.logementId === logementId && a.actif,
      ) ?? null
    );
  }

  async listerAffectationsActives(): Promise<AffectationFournisseur[] | null> {
    return this.affectations.filter((a) => a.actif);
  }

  async trouverParProprieteExterne(): Promise<AffectationFournisseur | null> {
    return null;
  }

  async enregistrerSync(
    _tenantId: string,
    _logementId: string,
    _etat: EtatSyncFournisseur,
  ): Promise<void> {}
}

class FauxReservationRepository implements ReservationRepository {
  async creer(): Promise<Reservation> {
    throw new Error("Non implémenté");
  }
  async listerParMois(): Promise<Reservation[]> {
    return [];
  }
  async chevauche(): Promise<boolean> {
    return false;
  }
  async trouverParId(): Promise<Reservation | null> {
    return null;
  }
  async trouverParRef(): Promise<Reservation | null> {
    return null;
  }
  async listerTous(): Promise<Reservation[]> {
    return [];
  }
  async confirmerDepart(): Promise<Reservation | null> {
    return null;
  }
  async annuler(): Promise<Reservation | null> {
    return null;
  }
}

class FauxReservationFournisseurRepository
  implements ReservationFournisseurRepository
{
  async trouverParRef(): Promise<Reservation | null> {
    return null;
  }
  async trouverParReference(): Promise<Reservation | null> {
    return null;
  }
  async listerChevauchements(): Promise<Reservation[]> {
    return [];
  }
  async creer(): Promise<Reservation> {
    throw new Error("Non implémenté");
  }
  async mettreAJour(): Promise<Reservation> {
    throw new Error("Non implémenté");
  }
}

class FauxBlocageRepository implements BlocageRepository {
  async creer(): Promise<{ blocage: Blocage; cree: boolean }> {
    throw new Error("Non implémenté");
  }
  async trouverParRef(): Promise<Blocage | null> {
    return null;
  }
  async chevauche(): Promise<boolean> {
    return false;
  }
  async listerParMois(): Promise<Blocage[]> {
    return [];
  }
  async listerTous(): Promise<Blocage[]> {
    return [];
  }
}

class FauxTarifRepository implements TarifRepository {
  async definir(_data: DefinirTarifData): Promise<Tarif> {
    throw new Error("Non implémenté");
  }
  async definirPlusieurs(_data: readonly DefinirTarifData[]): Promise<Tarif[]> {
    throw new Error("Non implémenté");
  }
  async trouver(): Promise<Tarif | null> {
    return null;
  }
  async listerParMois(
    _tenantId: string,
    logementId: string,
    debut: string,
    fin: string,
    _planTarifaireId?: string | null,
  ): Promise<Tarif[]> {
    // Génère un tarif pour chaque jour de la période
    const tarifs: Tarif[] = [];
    const courant = new Date(debut);
    const finDate = new Date(fin);
    const numeroLogement = Number(logementId.replace("log-", "")) || 1;
    const prixCentimes = 10000 + numeroLogement * 1000;
    while (courant <= finDate) {
      tarifs.push({
        id: `tarif-${logementId}-${courant.toISOString().slice(0, 10)}`,
        tenantId: TENANT_ID,
        logementId,
        planTarifaireId: null,
        date: courant.toISOString().slice(0, 10),
        prixCentimes,
        prixParPersonneCentimes: null,
        personnesIncluses: 2,
        source: "manuel",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      courant.setDate(courant.getDate() + 1);
    }
    return tarifs;
  }
}

class FauxRestrictionSejourRepository implements RestrictionSejourRepository {
  async listerParPeriode(
    _tenantId: string,
    logementId: string,
    debut: string,
    _fin: string,
    _planTarifaireId?: string | null,
  ): Promise<RestrictionSejour[]> {
    // Génère une restriction de séjour minimum sur le premier jour de la période
    const numeroLogement = Number(logementId.replace("log-", "")) || 1;
    return [
      {
        id: `restrict-${numeroLogement}`,
        tenantId: TENANT_ID,
        logementId,
        planTarifaireId: null,
        date: debut,
        sejourMin: 2,
        sejourMax: null,
        arriveeAutorisee: null,
        departAutorisee: null,
        stopSell: null,
        updatedAt: new Date(),
      },
    ];
  }
  async enregistrer(
    _tenantId: string,
    _logementId: string,
    _valeurs: ValeursRestrictionSejour,
    _planTarifaireId?: string | null,
  ): Promise<RestrictionSejour> {
    throw new Error("Non implémenté");
  }
  async enregistrerPlusieurs(): Promise<RestrictionSejour[]> {
    throw new Error("Non implémenté");
  }
  async supprimer(): Promise<void> {}
  async supprimerPlusieurs(): Promise<void> {}
}

const fauxLogementRepository = {
  trouverParId: async () => null,
} as unknown as LogementRepository;

const fauxPlanTarifaireRepository = {
  listerParLogement: async () => [],
} as unknown as PlanTarifaireRepository;

const fauxTenantRepository = {
  trouver: async () => ({
    id: TENANT_ID,
    nom: "Test Charge",
    slug: "test-charge",
    ventesSuspendues: false,
  }),
} as unknown as TenantRepository;

// ---------------------------------------------------------------------------
// Test
// ---------------------------------------------------------------------------

describe("Charge ARI >10 unités", () => {
  it("pousse disponibilités, tarifs et restrictions pour 12 logements", async () => {
    const fournisseurCanal = new FauxFournisseurCanal();
    const fournisseurRepo = new FauxFournisseurRepository();
    const reservationRepo = new FauxReservationRepository();
    const reservationFournisseurRepo =
      new FauxReservationFournisseurRepository();
    const blocageRepo = new FauxBlocageRepository();
    const tarifRepo = new FauxTarifRepository();
    const restrictionRepo = new FauxRestrictionSejourRepository();

    const importer = new ImporterReservationsFournisseur(
      reservationFournisseurRepo,
      blocageRepo,
    );

    const synchroniseur = new SynchroniserFournisseur(
      fournisseurRepo,
      reservationRepo,
      blocageRepo,
      tarifRepo,
      restrictionRepo,
      importer,
      (_code: CodeFournisseur) => fournisseurCanal,
      fauxLogementRepository,
      fauxPlanTarifaireRepository,
      fauxTenantRepository,
    );

    const resultats: ResultatSyncFournisseur[] = [];
    for (let i = 1; i <= NOMBRE_LOGEMENTS; i++) {
      const resultat = await synchroniseur.executer({
        tenantId: TENANT_ID,
        logementId: `log-${i}`,
        maintenant: MAINTENANT,
        horizonJours: HORIZON_JOURS,
      });
      resultats.push(resultat);
    }

    // Vérifie que tous les logements ont un statut "ok"
    for (const resultat of resultats) {
      expect(resultat.statut).toBe("ok");
    }

    // Vérifie que chaque logement a reçu des disponibilités
    expect(fournisseurCanal.poussees.disponibilites.length).toBe(
      NOMBRE_LOGEMENTS,
    );
    for (const poussee of fournisseurCanal.poussees.disponibilites) {
      expect(poussee.jours).toBe(HORIZON_JOURS);
    }

    // Vérifie que chaque logement a reçu des tarifs
    expect(fournisseurCanal.poussees.tarifs.length).toBe(NOMBRE_LOGEMENTS);
    for (const poussee of fournisseurCanal.poussees.tarifs) {
      expect(poussee.jours).toBe(HORIZON_JOURS);
    }

    // Vérifie que chaque logement a reçu des restrictions
    expect(fournisseurCanal.poussees.restrictions.length).toBe(
      NOMBRE_LOGEMENTS,
    );
    for (const poussee of fournisseurCanal.poussees.restrictions) {
      expect(poussee.jours).toBeGreaterThanOrEqual(1);
    }
  });

  it("détecte un logement sans room_id (configuration incomplète pour beds24)", async () => {
    const fournisseurCanal = new FauxFournisseurCanal();
    const reservationFournisseurRepo =
      new FauxReservationFournisseurRepository();
    const blocageRepo = new FauxBlocageRepository();

    // Repository avec un logement sans externalRoomTypeId
    const repoIncomplet: FournisseurRepository = {
      async listerActivations() {
        return [
          {
            code: FOURNISSEUR_CODE,
            actif: true,
            ordre: 1,
            updatedAt: new Date(),
            updatedBy: "test",
          },
        ];
      },
      async listerLogementsAvecFournisseur() {
        return [];
      },
      async definirActivation() {},
      async affecter(_data: AffecterFournisseurData) {
        throw new Error("Non implémenté");
      },
      async basculerActivation() {
        return null;
      },
      async retirer() {},
      async trouverAffectation(_tenantId: string, logementId: string) {
        return {
          id: "aff-incomplet",
          tenantId: TENANT_ID,
          logementId,
          fournisseurCode: FOURNISSEUR_CODE,
          externalPropertyId: "prop-incomplet",
          externalRoomTypeId: null,
          externalRatePlanId: null,
          actif: true,
          derniereSync: null,
          dernierStatut: null,
          dernierMessage: null,
          derniereEmpreinte: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      },
      async listerAffectationsActives() {
        return [];
      },
      async trouverParProprieteExterne() {
        return null;
      },
      async enregistrerSync() {},
    };

    const importer = new ImporterReservationsFournisseur(
      reservationFournisseurRepo,
      blocageRepo,
    );

    const synchroniseur = new SynchroniserFournisseur(
      repoIncomplet,
      new FauxReservationRepository(),
      blocageRepo,
      new FauxTarifRepository(),
      new FauxRestrictionSejourRepository(),
      importer,
      (_code: CodeFournisseur) => fournisseurCanal,
      fauxLogementRepository,
      fauxPlanTarifaireRepository,
      fauxTenantRepository,
    );

    const resultat = await synchroniseur.executer({
      tenantId: TENANT_ID,
      logementId: "log-incomplet",
      maintenant: MAINTENANT,
      horizonJours: HORIZON_JOURS,
      force: true,
    });

    expect(resultat.statut).toBe("configuration_incomplete");
    expect(resultat.disponibilites).toBe(0);
    expect(resultat.tarifs).toBe(0);
    expect(resultat.restrictions).toBe(0);
  });
});
