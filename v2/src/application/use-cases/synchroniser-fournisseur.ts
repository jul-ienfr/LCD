import { createHash } from "node:crypto";
import { ajouterJours, dateIsoValide } from "@/domain/calendrier";
import { sejourValide } from "@/domain/planning";
import { ErreurMetier } from "@/domain/erreurs";
import type { CodeFournisseur } from "@/domain/fournisseur";
import {
  fusionnerRestrictionsPlan,
  fusionnerTarifsPlan,
} from "@/domain/plan-tarifaire";
import {
  construireCalendrierAri,
  construireRestrictionsAri,
} from "@/domain/synchronisation-fournisseur";
import type { BlocageRepository } from "../ports/blocage-repository";
import type {
  DisponibiliteJour,
  FournisseurCanal,
  ReservationExterne,
  RestrictionJour,
  TarifJour,
} from "../ports/fournisseur-canal";
import type { FournisseurRepository } from "../ports/fournisseur-repository";
import type { LogementRepository } from "../ports/logement-repository";
import type { PlanTarifaireRepository } from "../ports/plan-tarifaire-repository";
import type { ReservationRepository } from "../ports/reservation-repository";
import type { RestrictionSejourRepository } from "../ports/restriction-sejour-repository";
import type { TarifRepository } from "../ports/tarif-repository";
import type { TenantRepository } from "../ports/tenant-repository";
import {
  ImporterReservationsFournisseur,
  type ResultatImportReservationsFournisseur,
} from "./importer-reservations-fournisseur";

export interface SynchroniserFournisseurInput {
  tenantId: string;
  logementId: string;
  /** Date de départ AAAA-MM-JJ ; injectée pour rendre le cas d'usage testable. */
  maintenant: string;
  horizonJours?: number;
  joursPasse?: number;
  cutoffJours?: number;
  bufferJours?: number;
  force?: boolean;
}

export type StatutSyncFournisseur =
  | "ok"
  | "partiel"
  | "inchange"
  | "configuration_incomplete"
  | "lecture_seule";

export interface ResultatSyncFournisseur {
  statut: StatutSyncFournisseur;
  message: string | null;
  disponibilites: number;
  tarifs: number;
  restrictions: number;
  import: ResultatImportReservationsFournisseur;
  empreinte: string;
}

const importVide = (): ResultatImportReservationsFournisseur => ({
  total: 0,
  crees: 0,
  misAJour: 0,
  annules: 0,
  deja: 0,
  conflits: 0,
  ignores: 0,
  details: [],
});

function messageErreur(erreur: unknown): string {
  if (erreur instanceof ErreurMetier) return erreur.message;
  if (erreur instanceof Error) return erreur.message;
  return "Erreur fournisseur inconnue.";
}

export class SynchroniserFournisseur {
  constructor(
    private readonly fournisseurs: FournisseurRepository,
    private readonly reservations: ReservationRepository,
    private readonly blocages: BlocageRepository,
    private readonly tarifs: TarifRepository,
    private readonly restrictions: RestrictionSejourRepository,
    private readonly importer: ImporterReservationsFournisseur,
    private readonly creerFournisseur: (
      code: CodeFournisseur,
    ) => FournisseurCanal | null,
    private readonly logements?: LogementRepository,
    private readonly plans?: PlanTarifaireRepository,
    private readonly tenants?: TenantRepository,
  ) {}

  async executer(
    input: SynchroniserFournisseurInput,
  ): Promise<ResultatSyncFournisseur> {
    const affectation = await this.fournisseurs.trouverAffectation(
      input.tenantId,
      input.logementId,
    );
    if (!affectation || !affectation.actif) {
      throw new ErreurMetier(
        "FOURNISSEUR_INVALIDE",
        "Aucun fournisseur actif n’est affecté à ce logement.",
      );
    }

    const logement = this.logements
      ? await this.logements.trouverParId(input.tenantId, input.logementId)
      : null;
    const tenant = this.tenants
      ? await this.tenants.trouver(input.tenantId)
      : null;
    const ventesSuspendues = tenant?.ventesSuspendues ?? false;
    const cutoffJours = input.cutoffJours ?? logement?.cutoffJours ?? 0;
    const bufferJours = input.bufferJours ?? logement?.bufferJours ?? 0;
    const code = affectation.fournisseurCode;
    const plansTarifaires =
      code === "channex" && this.plans
        ? await this.plans.listerParLogement(
            input.tenantId,
            input.logementId,
            true,
          )
        : [];
    const activations = await this.fournisseurs.listerActivations();
    if (activations && !activations.some((a) => a.code === code && a.actif)) {
      throw new ErreurMetier(
        "FOURNISSEUR_INVALIDE",
        `Le fournisseur ${code} est désactivé par le super-admin.`,
      );
    }
    const fournisseur = this.creerFournisseur(code);
    if (!fournisseur) {
      await this.fournisseurs.enregistrerSync(input.tenantId, input.logementId, {
        statut: "erreur",
        message: "Fournisseur non configuré côté serveur (clé absente).",
        empreinte: null,
      });
      throw new ErreurMetier(
        "FOURNISSEUR_INDISPONIBLE",
        `Les clés serveur de ${code} sont absentes.`,
      );
    }

    const externalPropertyId = affectation.externalPropertyId?.trim();
    if (!externalPropertyId) {
      const message =
        "Identifiant de propriété externe manquant : synchronisation impossible.";
      await this.fournisseurs.enregistrerSync(input.tenantId, input.logementId, {
        statut: "configuration_incomplete",
        message,
        empreinte: null,
      });
      return {
        statut: "configuration_incomplete",
        message,
        disponibilites: 0,
        tarifs: 0,
        restrictions: 0,
        import: importVide(),
        empreinte: "",
      };
    }

    if (
      (code === "beds24" || code === "channex" || code === "nobeds") &&
      !affectation.externalRoomTypeId
    ) {
      const message = `${code} exige l’identifiant de chambre (room_id) avant toute synchronisation.`;
      await this.fournisseurs.enregistrerSync(input.tenantId, input.logementId, {
        statut: "configuration_incomplete",
        message,
        empreinte: null,
      });
      return {
        statut: "configuration_incomplete",
        message,
        disponibilites: 0,
        tarifs: 0,
        restrictions: 0,
        import: importVide(),
        empreinte: "",
      };
    }

    // Nobeds expose une écriture jour par jour : on borne l'horizon pour
    // éviter des centaines d'appels par cycle. Les autres API sont batchées.
    const horizonMax = code === "nobeds" ? 90 : 730;
    const horizon = Math.max(
      1,
      Math.min(horizonMax, input.horizonJours ?? 365),
    );
    const fin = ajouterJours(input.maintenant, horizon);
    const passe = ajouterJours(
      input.maintenant,
      -Math.max(1, Math.min(730, input.joursPasse ?? 365)),
    );

    let resultatImport = importVide();
    let erreurLecture: string | null = null;
    let erreurImport: string | null = null;
    // Même si l'import local échoue ou entre en conflit, ces séjours OTA
    // doivent bloquer l'ARI : sinon on rouvrirait des dates déjà vendues.
    let externesAri: readonly ReservationExterne[] = [];
    let externes: readonly ReservationExterne[] | null = null;
    try {
      externes = await fournisseur.recupererReservations(
        passe,
        fin,
        externalPropertyId,
      );
      externesAri = externes.filter(
        (externe) =>
          externe.externalPropertyId === externalPropertyId &&
          (!affectation.externalRoomTypeId ||
            !externe.externalRoomTypeId ||
            externe.externalRoomTypeId === affectation.externalRoomTypeId) &&
          externe.statut !== "annulee" &&
          dateIsoValide(externe.arrivee) &&
          dateIsoValide(externe.depart) &&
          sejourValide(externe.arrivee, externe.depart),
      );
    } catch (erreur) {
      erreurLecture = messageErreur(erreur);
    }
    if (externes) {
      try {
        resultatImport = await this.importer.executer({
          tenantId: input.tenantId,
          logementId: input.logementId,
          fournisseurCode: code,
          externalPropertyId,
          externalRoomTypeId: affectation.externalRoomTypeId,
          reservations: externes,
        });
      } catch (erreur) {
        erreurImport = messageErreur(erreur);
      }
    }

    if (erreurLecture) {
      const message = `Lecture des réservations impossible : ${erreurLecture}. ARI non poussé pour éviter d’ouvrir des dates vendues.`;
      await this.fournisseurs.enregistrerSync(input.tenantId, input.logementId, {
        statut: "partiel",
        message,
        empreinte: null,
      });
      return {
        statut: "partiel",
        message,
        disponibilites: 0,
        tarifs: 0,
        restrictions: 0,
        import: resultatImport,
        empreinte: "",
      };
    }

    const [reservations, blocages, tarifs, restrictions] = await Promise.all([
      this.reservations.listerParMois(input.tenantId, input.maintenant, fin),
      this.blocages.listerParMois(input.tenantId, input.maintenant, fin),
      this.tarifs.listerParMois(
        input.tenantId,
        input.logementId,
        input.maintenant,
        ajouterJours(fin, -1),
      ),
      this.restrictions.listerParPeriode(
        input.tenantId,
        input.logementId,
        input.maintenant,
        ajouterJours(fin, -1),
      ),
    ]);

    const occupations = [
      // Un arrêt commercial global doit fermer aussi les canaux : sinon une
      // réservation OTA peut encore arriver pendant la suspension.
      ...(ventesSuspendues
        ? [{ debut: input.maintenant, fin }]
        : []),
      ...externesAri.map((externe) => ({
        debut: externe.arrivee,
        fin: externe.depart,
      })),
      ...reservations
        .filter(
          (reservation) =>
            reservation.logementId === input.logementId &&
            reservation.statut !== "annulee",
        )
        .map((reservation) => ({
          debut: reservation.debut,
          fin: reservation.fin,
        })),
      ...blocages
        .filter((blocage) => blocage.logementId === input.logementId)
        .map((blocage) => ({ debut: blocage.debut, fin: blocage.fin })),
    ];

    const calendrier = construireCalendrierAri({
      debut: input.maintenant,
      fin,
      occupations,
      tarifs: tarifs.map((tarif) => ({
        date: tarif.date,
        prixCentimes: tarif.prixCentimes,
      })),
      cutoffJours,
      bufferJours,
    });

    const restrictionsAri = construireRestrictionsAri({
      debut: input.maintenant,
      fin,
      restrictions,
      externalPropertyId,
      externalRoomTypeId: affectation.externalRoomTypeId,
      externalRatePlanId: affectation.externalRatePlanId,
    });

    const jeuxPlans: {
      planId: string;
      externalRatePlanId: string;
      tarifs: ReturnType<typeof construireCalendrierAri>["tarifs"];
      restrictions: ReturnType<typeof construireRestrictionsAri>;
    }[] = [];
    for (const plan of plansTarifaires) {
      if (!plan.externalRatePlanId) continue;
      const [tarifsPlan, restrictionsPlan] = await Promise.all([
        this.tarifs.listerParMois(
          input.tenantId,
          input.logementId,
          input.maintenant,
          ajouterJours(fin, -1),
          plan.id,
        ),
        this.restrictions.listerParPeriode(
          input.tenantId,
          input.logementId,
          input.maintenant,
          ajouterJours(fin, -1),
          plan.id,
        ),
      ]);
      const tarifsEffectifs = fusionnerTarifsPlan(
        tarifs.map((tarif) => ({
          date: tarif.date,
          prixCentimes: tarif.prixCentimes,
        })),
        tarifsPlan.map((tarif) => ({
          date: tarif.date,
          prixCentimes: tarif.prixCentimes,
        })),
        plan.mode,
        plan.ajustementPourcentage,
      );
      const restrictionsEffectives = fusionnerRestrictionsPlan(
        restrictions,
        restrictionsPlan,
        plan.mode === "derive" && plan.heriteRestrictions,
      );
      const calendrierPlan = construireCalendrierAri({
        debut: input.maintenant,
        fin,
        occupations: [],
        tarifs: tarifsEffectifs,
      });
      jeuxPlans.push({
        planId: plan.id,
        externalRatePlanId: plan.externalRatePlanId,
        tarifs: calendrierPlan.tarifs,
        restrictions: construireRestrictionsAri({
          debut: input.maintenant,
          fin,
          restrictions: restrictionsEffectives,
          externalPropertyId,
          externalRoomTypeId: affectation.externalRoomTypeId,
          externalRatePlanId: plan.externalRatePlanId,
        }),
      });
    }

    const empreinte = createHash("sha256")
      .update(
        JSON.stringify({
          code,
          externalPropertyId,
          externalRoomTypeId: affectation.externalRoomTypeId,
          externalRatePlanId: affectation.externalRatePlanId,
          disponibilites: calendrier.disponibilites,
          tarifs: calendrier.tarifs,
          restrictions: restrictionsAri,
          plans: jeuxPlans,
          plansSansMapping: plansTarifaires
            .filter((plan) => !plan.externalRatePlanId)
            .map((plan) => plan.id),
        }),
      )
      .digest("hex");

    if (
      !input.force &&
      !erreurLecture &&
      !erreurImport &&
      affectation.dernierStatut === "ok" &&
      affectation.derniereEmpreinte === empreinte
    ) {
      await this.fournisseurs.enregistrerSync(input.tenantId, input.logementId, {
        statut: "ok",
        message: "Aucun changement ARI.",
        empreinte,
      });
      return {
        statut: "inchange",
        message: "Aucun changement ARI.",
        disponibilites: 0,
        tarifs: 0,
        restrictions: 0,
        import: resultatImport,
        empreinte,
      };
    }

    try {
      const disponibilites: DisponibiliteJour[] =
        calendrier.disponibilites.map((jour) => ({
          externalPropertyId,
          externalRoomTypeId: affectation.externalRoomTypeId,
          date: jour.date,
          disponible: jour.disponible,
          prixCentimes: code === "nobeds" ? jour.prixCentimes : null,
        }));

      const tarifsAri: TarifJour[] = calendrier.tarifs.map((tarif) => ({
        externalPropertyId,
        externalRoomTypeId: affectation.externalRoomTypeId,
        externalRatePlanId: affectation.externalRatePlanId,
        date: tarif.date,
        prixCentimes: tarif.prixCentimes,
        devise: "EUR",
      }));

      let statut: StatutSyncFournisseur = "ok";
      let disponibilitesPoussees = 0;
      let tarifsPousses = 0;
      let restrictionsPoussees = 0;
      const notes: string[] = [];
      if (erreurImport) {
        statut = "partiel";
        notes.push(`Import local des réservations incomplet : ${erreurImport}`);
      }
      if (resultatImport.conflits > 0) {
        statut = statut === "ok" ? "partiel" : statut;
        notes.push(
          `${resultatImport.conflits} réservation(s) OTA en conflit : dates bloquées mais import local à arbitrer.`,
        );
      }

      if (fournisseur.mode === "lecture_seule") {
        statut = statut === "ok" ? "lecture_seule" : statut;
        notes.push("Fournisseur en lecture seule : aucun ARI poussé.");
      } else {
        if (fournisseur.capacites.ecritureDisponibilites) {
          if (code === "nobeds") {
            const manquants = calendrier.disponibilites.filter(
              (jour) => jour.prixCentimes === null,
            ).length;
            if (manquants > 0) {
              statut = "configuration_incomplete";
              notes.push(
                `${manquants} jour(s) sans tarif : Nobeds exige un prix pour écrire la disponibilité.`,
              );
            } else {
              await fournisseur.pousserDisponibilites(disponibilites);
              disponibilitesPoussees = disponibilites.length;
            }
          } else {
            await fournisseur.pousserDisponibilites(disponibilites);
            disponibilitesPoussees = disponibilites.length;
          }
        }

        const tarifsPoussables =
          (code === "channex" && !affectation.externalRatePlanId) ||
          code === "nobeds"
            ? []
            : tarifsAri;
        if (
          fournisseur.capacites.ecritureTarifs &&
          tarifsPoussables.length > 0 &&
          statut !== "configuration_incomplete"
        ) {
          await fournisseur.pousserTarifs(tarifsPoussables);
          tarifsPousses = tarifsPoussables.length;
        } else if (
          fournisseur.capacites.ecritureTarifs &&
          code === "channex" &&
          !affectation.externalRatePlanId &&
          tarifsAri.length > 0 &&
          jeuxPlans.length === 0
        ) {
          statut = statut === "ok" ? "partiel" : statut;
          notes.push(
            "Plan tarifaire Channex (rate_plan_id) manquant : tarifs non poussés.",
          );
        }

        let restrictionsPoussables: RestrictionJour[] = restrictionsAri;
        if (code === "smoobu") {
          const ctaIgnorees = restrictionsAri.some(
            (restriction) =>
              restriction.arriveeAutorisee !== undefined ||
              restriction.departAutorisee !== undefined,
          );
          const stopSellIgnore = restrictionsAri.some(
            (restriction) => restriction.stopSell !== undefined,
          );
          if (ctaIgnorees || stopSellIgnore) {
            restrictionsPoussables = restrictionsAri
              .map((restriction) => {
                const copie = { ...restriction };
                delete copie.arriveeAutorisee;
                delete copie.departAutorisee;
                delete copie.stopSell;
                return copie;
              })
              .filter(
                (restriction) =>
                  restriction.sejourMin !== undefined ||
                  restriction.sejourMax !== undefined,
              );
            statut = statut === "ok" ? "partiel" : statut;
            const ignorees = [
              ctaIgnorees ? "CTA/CTD" : null,
              stopSellIgnore ? "stop-sell" : null,
            ].filter(Boolean);
            notes.push(
              `Smoobu ne documente pas ${ignorees.join(" ni ")} : seules les durées de séjour sont poussées.`,
            );
          }
        }

        if (
          code === "channex" &&
          !affectation.externalRatePlanId &&
          restrictionsAri.length > 0 &&
          jeuxPlans.length === 0
        ) {
          statut = statut === "ok" ? "partiel" : statut;
          notes.push(
            "Plan tarifaire Channex (rate_plan_id) manquant : restrictions non poussées.",
          );
          restrictionsPoussables = [];
        }

        if (
          fournisseur.capacites.ecritureRestrictions &&
          restrictionsPoussables.length > 0 &&
          statut !== "configuration_incomplete"
        ) {
          await fournisseur.pousserRestrictions(restrictionsPoussables);
          restrictionsPoussees = restrictionsPoussables.length;
        } else if (
          restrictionsAri.length > 0 &&
          !fournisseur.capacites.ecritureRestrictions
        ) {
          statut = statut === "ok" ? "partiel" : statut;
          notes.push(
            "Ce fournisseur n’accepte pas les restrictions : règles de séjour non poussées.",
          );
        }

        const plansSansMapping = plansTarifaires.filter(
          (plan) => !plan.externalRatePlanId,
        );
        if (plansSansMapping.length > 0) {
          statut = statut === "ok" ? "partiel" : statut;
          notes.push(
            `${plansSansMapping.length} plan(s) tarifaire(s) sans rate_plan_id : ARI non poussé pour ces plans.`,
          );
        }

        for (const jeu of jeuxPlans) {
          const tarifsJour: TarifJour[] = jeu.tarifs.map((tarif) => ({
            externalPropertyId,
            externalRoomTypeId: affectation.externalRoomTypeId,
            externalRatePlanId: jeu.externalRatePlanId,
            date: tarif.date,
            prixCentimes: tarif.prixCentimes,
            devise: "EUR",
          }));
          if (
            fournisseur.capacites.ecritureTarifs &&
            tarifsJour.length > 0 &&
            statut !== "configuration_incomplete"
          ) {
            await fournisseur.pousserTarifs(tarifsJour);
            tarifsPousses += tarifsJour.length;
          }
          if (
            fournisseur.capacites.ecritureRestrictions &&
            jeu.restrictions.length > 0 &&
            statut !== "configuration_incomplete"
          ) {
            await fournisseur.pousserRestrictions(jeu.restrictions);
            restrictionsPoussees += jeu.restrictions.length;
          }
        }

        if (!fournisseur.capacites.ecritureDisponibilites) {
          statut = statut === "ok" ? "partiel" : statut;
          notes.push("Ce fournisseur n’accepte pas l’écriture des disponibilités.");
        }
        if (!fournisseur.capacites.ecritureTarifs) {
          statut = statut === "ok" ? "partiel" : statut;
          notes.push("Ce fournisseur n’accepte pas l’écriture des tarifs.");
        }
      }

      const message = notes.length > 0 ? notes.join(" ") : null;
      await this.fournisseurs.enregistrerSync(input.tenantId, input.logementId, {
        statut,
        message,
        empreinte: statut === "ok" ? empreinte : null,
      });
      return {
        statut,
        message,
        disponibilites: disponibilitesPoussees,
        tarifs: tarifsPousses,
        restrictions: restrictionsPoussees,
        import: resultatImport,
        empreinte,
      };
    } catch (erreur) {
      const message = messageErreur(erreur);
      await this.fournisseurs.enregistrerSync(input.tenantId, input.logementId, {
        statut: "erreur",
        message,
        empreinte: null,
      });
      throw erreur;
    }
  }
}
