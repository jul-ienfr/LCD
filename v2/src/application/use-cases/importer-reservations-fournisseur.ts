import { dateIsoValide } from "@/domain/calendrier";
import type { CodeFournisseur } from "@/domain/fournisseur";
import { sejourValide } from "@/domain/planning";
import type { Reservation } from "@/domain/reservation";
import type { BlocageRepository } from "../ports/blocage-repository";
import type { ReservationFournisseurRepository } from "../ports/reservation-fournisseur-repository";
import type {
  ReservationExterne,
  StatutReservationExterne,
} from "../ports/fournisseur-canal";
import { referenceReservationFournisseur } from "./reference-fournisseur";

export type ResultatLigneReservationFournisseur =
  | "cree"
  | "mis_a_jour"
  | "annule"
  | "deja"
  | "conflit"
  | "ignore";

export interface LigneReservationFournisseur {
  ref: string;
  resultat: ResultatLigneReservationFournisseur;
  message?: string;
}

export interface ResultatImportReservationsFournisseur {
  total: number;
  crees: number;
  misAJour: number;
  annules: number;
  deja: number;
  conflits: number;
  ignores: number;
  details: LigneReservationFournisseur[];
}

export interface ImporterReservationsFournisseurInput {
  tenantId: string;
  logementId: string;
  fournisseurCode: CodeFournisseur;
  externalPropertyId: string;
  externalRoomTypeId?: string | null;
  reservations: readonly ReservationExterne[];
}

function statutLocal(
  statut: StatutReservationExterne,
): Reservation["statut"] {
  if (statut === "annulee") return "annulee";
  if (statut === "en_attente") return "brouillon";
  return "confirmee";
}

export class ImporterReservationsFournisseur {
  constructor(
    private readonly reservations: ReservationFournisseurRepository,
    private readonly blocages: BlocageRepository,
  ) {}

  async executer(
    input: ImporterReservationsFournisseurInput,
  ): Promise<ResultatImportReservationsFournisseur> {
    const resultat: ResultatImportReservationsFournisseur = {
      total: input.reservations.length,
      crees: 0,
      misAJour: 0,
      annules: 0,
      deja: 0,
      conflits: 0,
      ignores: 0,
      details: [],
    };

    for (const externe of input.reservations) {
      if (
        externe.externalPropertyId !== input.externalPropertyId ||
        (input.externalRoomTypeId &&
          externe.externalRoomTypeId &&
          externe.externalRoomTypeId !== input.externalRoomTypeId)
      ) {
        resultat.ignores += 1;
        continue;
      }
      if (
        !externe.externalId ||
        !dateIsoValide(externe.arrivee) ||
        !dateIsoValide(externe.depart) ||
        !sejourValide(externe.arrivee, externe.depart)
      ) {
        resultat.ignores += 1;
        resultat.details.push({
          ref: externe.externalId || externe.reference,
          resultat: "ignore",
          message: "Séjour invalide ou identifiant externe absent.",
        });
        continue;
      }

      const ref = referenceReservationFournisseur(
        input.fournisseurCode,
        externe.externalId,
      );
      const source = `fournisseur:${input.fournisseurCode}`;
      const statut = statutLocal(externe.statut);
      const existante = await this.reservations.trouverParRef(
        input.tenantId,
        ref,
      );

      if (existante) {
        if (existante.source !== source || existante.logementId !== input.logementId) {
          resultat.conflits += 1;
          resultat.details.push({
            ref,
            resultat: "conflit",
            message: "Référence déjà utilisée par une autre source.",
          });
          continue;
        }
        if (existante.statut === "annulee" && statut !== "annulee") {
          resultat.deja += 1;
          resultat.details.push({
            ref,
            resultat: "deja",
            message: "Annulation locale conservée.",
          });
          continue;
        }
        if (statut !== "annulee") {
          const chevauchements = (
            await this.reservations.listerChevauchements(
              input.tenantId,
              input.logementId,
              externe.arrivee,
              externe.depart,
            )
          ).filter(
            (reservation) =>
              reservation.id !== existante.id && reservation.ref !== ref,
          );
          if (chevauchements.length > 0) {
            resultat.conflits += 1;
            resultat.details.push({
              ref,
              resultat: "conflit",
              message: `Déplacement refusé : chevauche ${chevauchements
                .map((reservation) => reservation.ref)
                .join(", ")}.`,
            });
            continue;
          }
          if (
            await this.blocages.chevauche(
              input.tenantId,
              input.logementId,
              externe.arrivee,
              externe.depart,
            )
          ) {
            resultat.conflits += 1;
            resultat.details.push({
              ref,
              resultat: "conflit",
              message: "Déplacement refusé : chevauche un blocage local.",
            });
            continue;
          }
        }

        // Ne jamais effacer un nom saisi localement avec un payload incomplet.
        const clientNom = externe.clientNom ?? existante.clientNom;
        const clientEmail = externe.clientEmail ?? existante.clientEmail;
        const montantCentimes = Math.max(
          0,
          externe.montantCentimes ?? existante.montantCentimes,
        );
        const contenuIdentique =
          existante.debut === externe.arrivee &&
          existante.fin === externe.depart &&
          (existante.clientNom ?? null) === clientNom &&
          (existante.clientEmail ?? null) === clientEmail &&
          existante.montantCentimes === montantCentimes &&
          existante.statut === statut;
        if (contenuIdentique) {
          resultat.deja += 1;
          resultat.details.push({ ref, resultat: "deja" });
          continue;
        }
        await this.reservations.mettreAJour(input.tenantId, existante.id, {
          debut: externe.arrivee,
          fin: externe.depart,
          clientNom,
          clientEmail,
          montantCentimes,
          statut,
        });
        if (statut === "annulee") {
          resultat.annules += 1;
        } else {
          resultat.misAJour += 1;
        }
        resultat.details.push({
          ref,
          resultat: statut === "annulee" ? "annule" : "mis_a_jour",
        });
        continue;
      }

      if (statut === "annulee") {
        resultat.ignores += 1;
        resultat.details.push({
          ref,
          resultat: "ignore",
          message: "Annulation d’une réservation jamais importée.",
        });
        continue;
      }

      if (externe.reference) {
        const doublon = await this.reservations.trouverParReference(
          input.tenantId,
          input.logementId,
          externe.reference,
        );
        if (doublon) {
          resultat.deja += 1;
          resultat.details.push({
            ref,
            resultat: "deja",
            message: `Déjà présent sous la référence ${doublon.ref} (${doublon.source}).`,
          });
          continue;
        }
      }

      const chevauchements = (
        await this.reservations.listerChevauchements(
          input.tenantId,
          input.logementId,
          externe.arrivee,
          externe.depart,
        )
      ).filter((reservation) => reservation.ref !== ref);
      if (chevauchements.length > 0) {
        resultat.conflits += 1;
        resultat.details.push({
          ref,
          resultat: "conflit",
          message: `Chevauche ${chevauchements
            .map((reservation) => reservation.ref)
            .join(", ")}.`,
        });
        continue;
      }
      if (
        await this.blocages.chevauche(
          input.tenantId,
          input.logementId,
          externe.arrivee,
          externe.depart,
        )
      ) {
        resultat.conflits += 1;
        resultat.details.push({
          ref,
          resultat: "conflit",
          message: "Chevauche un blocage local.",
        });
        continue;
      }

      try {
        await this.reservations.creer({
          tenantId: input.tenantId,
          logementId: input.logementId,
          ref,
          clientNom: externe.clientNom ?? "Réservation OTA",
          clientEmail: externe.clientEmail ?? undefined,
          voyageurs: 1,
          debut: externe.arrivee,
          fin: externe.depart,
          montantCentimes: Math.max(0, externe.montantCentimes ?? 0),
          source,
          statut,
        });
        resultat.crees += 1;
        resultat.details.push({ ref, resultat: "cree" });
      } catch (erreur) {
        const conflitUnique =
          typeof erreur === "object" &&
          erreur !== null &&
          "code" in erreur &&
          erreur.code === "23505";
        if (!conflitUnique) throw erreur;
        resultat.deja += 1;
        resultat.details.push({
          ref,
          resultat: "deja",
          message: "Créée par une synchronisation concurrente.",
        });
      }
    }

    return resultat;
  }
}
