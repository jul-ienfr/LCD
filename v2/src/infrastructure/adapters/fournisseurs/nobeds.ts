import { timingSafeEqual } from "node:crypto";
import type {
  DisponibiliteJour,
  EntreeWebhook,
  FournisseurCanal,
  LogementExterne,
  ReservationExterne,
  RestrictionJour,
  ResultatTestFournisseur,
  TarifJour,
} from "@/application/ports/fournisseur-canal";
import { CATALOGUE_FOURNISSEURS } from "@/domain/fournisseur";
import { ErreurMetier } from "@/domain/erreurs";
import { env } from "@/lib/env";
import {
  centimes,
  exigerCle,
  requeteFournisseur,
  texteOuNull,
  urlAvecParametres,
} from "./http";

interface ReservationNobeds {
  order_id?: number;
  hotel_id?: number;
  room_id?: number;
  name?: string;
  email?: string;
  checkin?: string;
  checkout?: string;
  price?: number;
  referral_order_id?: string;
  status?: string;
}

interface LocationNobeds {
  room_id?: number;
  hotel_id?: number;
  name?: string;
  capacity?: number;
  price?: number;
}

function fiche() {
  const entree = CATALOGUE_FOURNISSEURS.find(
    (fournisseur) => fournisseur.code === "nobeds",
  );
  if (!entree) throw new Error("Fiche Nobeds absente.");
  return entree;
}

function base(): string {
  return env.NOBEDS_API_BASE;
}

function chemin(ressource: string): string {
  const jeton = encodeURIComponent(
    exigerCle(env.NOBEDS_API_TOKEN, "NOBEDS_API_TOKEN"),
  );
  return `${ressource}/${jeton}`;
}

function statutReservation(statut: string | undefined): ReservationExterne["statut"] {
  if (statut === "cancelled" || statut === "canceled") return "annulee";
  if (statut === "pending") return "en_attente";
  return "confirmee";
}

function dateSeule(valeur: string | undefined): string | null {
  if (!valeur) return null;
  return valeur.slice(0, 10);
}

function roomId(changement: {
  externalRoomTypeId?: string | null;
}): number {
  const id = Number(changement.externalRoomTypeId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ErreurMetier(
      "FOURNISSEUR_INVALIDE",
      "Nobeds exige l’identifiant numérique de chambre (room_id).",
    );
  }
  return id;
}

async function ecrireDisponibilite(valeurs: {
  room_id: number;
  date: string;
  available: number;
  price: number;
  min_stay?: number;
}): Promise<void> {
  await requeteFournisseur<unknown>({
    url: urlAvecParametres(base(), chemin("api/availability"), {}),
    methode: "POST",
    corps: valeurs,
    timeoutMs: env.FOURNISSEUR_HTTP_TIMEOUT_MS,
  });
}

function prixObligatoire(valeur: number | null | undefined): number {
  if (valeur === null || valeur === undefined || valeur <= 0) {
    throw new ErreurMetier(
      "FOURNISSEUR_INVALIDE",
      "Nobeds exige un prix pour modifier une disponibilité ou un minimum de séjour.",
    );
  }
  return Math.round(valeur) / 100;
}

export class NobedsFournisseur implements FournisseurCanal {
  readonly code = "nobeds" as const;
  readonly mode = fiche().mode;
  readonly capacites = fiche().capacites;

  async testerConnexion(): Promise<ResultatTestFournisseur> {
    const profil = await requeteFournisseur<{
      hotel_id?: number;
      name?: string;
      currency?: string;
    }>({
      url: urlAvecParametres(base(), chemin("api/hotels"), {}),
      timeoutMs: env.FOURNISSEUR_HTTP_TIMEOUT_MS,
    });
    return {
      ok: true,
      message: `Nobeds joignable (${profil.name ?? `hôtel ${profil.hotel_id ?? "?"}`}).`,
      details: { devise: profil.currency ?? null },
    };
  }

  async listerLogements(): Promise<LogementExterne[]> {
    const locations = await requeteFournisseur<LocationNobeds[]>({
      url: urlAvecParametres(base(), chemin("api/rentals"), {}),
      timeoutMs: env.FOURNISSEUR_HTTP_TIMEOUT_MS,
    });
    return (locations ?? []).flatMap((location) => {
      if (location.room_id === undefined) return [];
      return [
        {
          externalId: String(location.hotel_id ?? location.room_id),
          nom: location.name ?? String(location.room_id),
          externalRoomTypeId: String(location.room_id),
        },
      ];
    });
  }

  async recupererReservations(
    depuis: string,
    jusqua: string,
    filtrePropriete?: string,
  ): Promise<ReservationExterne[]> {
    const lignes = await requeteFournisseur<ReservationNobeds[]>({
      url: urlAvecParametres(base(), chemin("api/bookings"), {
        fromdate: depuis,
        todate: jusqua,
      }),
      timeoutMs: env.FOURNISSEUR_HTTP_TIMEOUT_MS,
    });
    return (lignes ?? []).flatMap((ligne) => {
      const arrivee = dateSeule(ligne.checkin);
      const depart = dateSeule(ligne.checkout);
      if (
        !arrivee ||
        !depart ||
        ligne.order_id === undefined ||
        (filtrePropriete &&
          ligne.hotel_id !== undefined &&
          String(ligne.hotel_id) !== filtrePropriete)
      ) {
        return [];
      }
      return [
        {
          externalId: String(ligne.order_id),
          externalPropertyId: String(ligne.hotel_id ?? ligne.room_id ?? ""),
          externalRoomTypeId:
            ligne.room_id === undefined ? null : String(ligne.room_id),
          reference: ligne.referral_order_id ?? String(ligne.order_id),
          arrivee,
          depart,
          statut: statutReservation(ligne.status),
          clientNom: texteOuNull(ligne.name),
          clientEmail: texteOuNull(ligne.email),
          montantCentimes: centimes(ligne.price),
          devise: null,
        },
      ];
    });
  }

  async pousserDisponibilites(
    changements: readonly DisponibiliteJour[],
  ): Promise<void> {
    for (const changement of changements) {
      await ecrireDisponibilite({
        room_id: roomId(changement),
        date: changement.date,
        available: changement.disponible ? 1 : 0,
        price: prixObligatoire(changement.prixCentimes),
      });
    }
  }

  async pousserTarifs(tarifs: readonly TarifJour[]): Promise<void> {
    for (const tarif of tarifs) {
      await ecrireDisponibilite({
        room_id: roomId(tarif),
        date: tarif.date,
        available: 1,
        price: prixObligatoire(tarif.prixCentimes),
      });
    }
  }

  async pousserRestrictions(
    _restrictions: readonly RestrictionJour[],
  ): Promise<void> {
    throw new ErreurMetier(
      "FOURNISSEUR_NON_SUPPORTE",
      "Nobeds expose le min stay via /availability, qui réécrit aussi la disponibilité et le prix ; la V2 refuse cette écriture sans contexte.",
    );
  }

  async verifierWebhook(entree: EntreeWebhook): Promise<boolean> {
    const secret = env.NOBEDS_WEBHOOK_SECRET?.trim();
    if (!secret) return false;
    const recu = entree.headers.get("x-webhook-secret");
    if (!recu || recu.length !== secret.length) return false;
    return timingSafeEqual(Buffer.from(recu), Buffer.from(secret));
  }
}
