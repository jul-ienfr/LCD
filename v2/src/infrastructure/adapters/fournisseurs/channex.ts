import { createHmac, timingSafeEqual } from "node:crypto";
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

interface ProprieteChannex {
  id?: string;
  attributes?: {
    id?: string;
    title?: string;
    name?: string;
  };
}

interface ReservationChannex {
  id?: string;
  attributes?: {
    id?: string;
    property_id?: string;
    unique_id?: string;
    ota_reservation_code?: string;
    status?: string;
    customer?: {
      name?: string;
      surname?: string;
      mail?: string;
      email?: string;
    };
    rooms?: {
      room_type_id?: string;
      checkin_date?: string;
      checkout_date?: string;
      amount?: string | number;
    }[];
    amount?: string | number;
    currency?: string;
  };
}

function fiche() {
  const entree = CATALOGUE_FOURNISSEURS.find(
    (fournisseur) => fournisseur.code === "channex",
  );
  if (!entree) throw new Error("Fiche Channex absente.");
  return entree;
}

function base(): string {
  return env.CHANNEX_API_BASE;
}

function entetes(): Record<string, string> {
  return {
    "user-api-key": exigerCle(env.CHANNEX_API_KEY, "CHANNEX_API_KEY"),
  };
}

function statutReservation(statut: string | undefined): ReservationExterne["statut"] {
  if (statut === "cancelled" || statut === "canceled") return "annulee";
  if (statut === "pending" || statut === "new") return "en_attente";
  return "confirmee";
}

export class ChannexFournisseur implements FournisseurCanal {
  readonly code = "channex" as const;
  readonly mode = fiche().mode;
  readonly capacites = fiche().capacites;

  async testerConnexion(): Promise<ResultatTestFournisseur> {
    const donnees = await requeteFournisseur<{
      data?: ProprieteChannex[];
      meta?: { total?: number };
    }>({
      url: urlAvecParametres(base(), "properties", {
        "pagination[limit]": 1,
      }),
      entetes: entetes(),
      timeoutMs: env.FOURNISSEUR_HTTP_TIMEOUT_MS,
    });
    const total = donnees.meta?.total ?? donnees.data?.length ?? 0;
    return {
      ok: true,
      message: `Channex joignable (${total} propriété${total > 1 ? "s" : ""}).`,
      details: { proprietes: total },
    };
  }

  async listerLogements(): Promise<LogementExterne[]> {
    const donnees = await requeteFournisseur<{
      data?: ProprieteChannex[];
    }>({
      url: urlAvecParametres(base(), "properties", {
        "pagination[limit]": 100,
      }),
      entetes: entetes(),
      timeoutMs: env.FOURNISSEUR_HTTP_TIMEOUT_MS,
    });
    return (donnees.data ?? []).flatMap((propriete) => {
      const id = propriete.id ?? propriete.attributes?.id;
      if (!id) return [];
      return [
        {
          externalId: id,
          nom: propriete.attributes?.title ?? propriete.attributes?.name ?? id,
          externalRoomTypeId: null,
        },
      ];
    });
  }

  async recupererReservations(
    depuis: string,
    jusqua: string,
    externalPropertyId?: string,
  ): Promise<ReservationExterne[]> {
    const reservations: ReservationExterne[] = [];
    for (let page = 1; page <= 10; page += 1) {
      const donnees = await requeteFournisseur<{
        data?: ReservationChannex[];
        meta?: { total?: number; page?: number; limit?: number };
      }>({
        url: urlAvecParametres(base(), "bookings", {
          "filter[arrival_date][gte]": depuis,
          "filter[arrival_date][lte]": jusqua,
          ...(externalPropertyId
            ? { "filter[property_id]": externalPropertyId }
            : {}),
          "pagination[page]": page,
          "pagination[limit]": 100,
        }),
        entetes: entetes(),
        timeoutMs: env.FOURNISSEUR_HTTP_TIMEOUT_MS,
      });
      const lignes = donnees.data ?? [];
      for (const ligne of lignes) {
        const attributes = ligne.attributes;
        const sejour = attributes?.rooms?.[0];
        const externalPropertyId = attributes?.property_id;
        if (!externalPropertyId || !sejour?.checkin_date || !sejour.checkout_date) {
          continue;
        }
        const nom = [attributes.customer?.name, attributes.customer?.surname]
          .filter(Boolean)
          .join(" ")
          .trim();
        reservations.push({
          externalId: attributes.id ?? ligne.id ?? "",
          externalPropertyId,
          externalRoomTypeId: sejour.room_type_id ?? null,
          reference:
            attributes.ota_reservation_code ??
            attributes.unique_id ??
            attributes.id ??
            "",
          arrivee: sejour.checkin_date,
          depart: sejour.checkout_date,
          statut: statutReservation(attributes.status),
          clientNom: nom || null,
          clientEmail: texteOuNull(
            attributes.customer?.mail ?? attributes.customer?.email,
          ),
          montantCentimes: centimes(sejour.amount ?? attributes.amount),
          devise: texteOuNull(attributes.currency),
        });
      }
      const total = donnees.meta?.total ?? 0;
      if (lignes.length < 100 || page * 100 >= total) break;
    }
    return reservations;
  }

  private async envoyerParPaquets(
    chemin: string,
    values: Record<string, unknown>[],
  ): Promise<void> {
    for (let index = 0; index < values.length; index += 100) {
      await requeteFournisseur<unknown>({
        url: `${base().replace(/\/+$/u, "")}/${chemin}`,
        methode: "POST",
        entetes: entetes(),
        corps: { values: values.slice(index, index + 100) },
        timeoutMs: env.FOURNISSEUR_HTTP_TIMEOUT_MS,
      });
    }
  }

  async pousserDisponibilites(
    changements: readonly DisponibiliteJour[],
  ): Promise<void> {
    const values = changements.map((changement) => {
      if (!changement.externalRoomTypeId) {
        throw new ErreurMetier(
          "FOURNISSEUR_INVALIDE",
          "Channex exige l’identifiant de type de chambre (room_type_id).",
        );
      }
      return {
        property_id: changement.externalPropertyId,
        room_type_id: changement.externalRoomTypeId,
        date: changement.date,
        availability: changement.disponible ? 1 : 0,
      };
    });
    await this.envoyerParPaquets("availability", values);
  }

  async pousserTarifs(tarifs: readonly TarifJour[]): Promise<void> {
    const values = tarifs.map((tarif) => {
      if (!tarif.externalRatePlanId) {
        throw new ErreurMetier(
          "FOURNISSEUR_INVALIDE",
          "Channex exige le plan tarifaire (rate_plan_id) pour les tarifs.",
        );
      }
      return {
        property_id: tarif.externalPropertyId,
        rate_plan_id: tarif.externalRatePlanId,
        date: tarif.date,
        rate: Math.max(1, Math.round(tarif.prixCentimes)),
      };
    });
    await this.envoyerParPaquets("rates", values);
  }

  async pousserRestrictions(
    restrictions: readonly RestrictionJour[],
  ): Promise<void> {
    const values = restrictions.flatMap((restriction) => {
      if (!restriction.externalRatePlanId) {
        throw new ErreurMetier(
          "FOURNISSEUR_INVALIDE",
          "Channex exige le plan tarifaire (rate_plan_id) pour les restrictions.",
        );
      }
      const valeur: Record<string, unknown> = {
        property_id: restriction.externalPropertyId,
        rate_plan_id: restriction.externalRatePlanId,
        date: restriction.date,
      };
      if (restriction.sejourMin !== undefined) {
        valeur.min_stay_arrival = restriction.sejourMin;
      }
      if (restriction.sejourMax !== undefined) valeur.max_stay = restriction.sejourMax;
      if (restriction.arriveeAutorisee !== undefined) {
        valeur.closed_to_arrival = !restriction.arriveeAutorisee;
      }
      if (restriction.departAutorisee !== undefined) {
        valeur.closed_to_departure = !restriction.departAutorisee;
      }
      if (restriction.stopSell !== undefined) {
        valeur.stop_sell = restriction.stopSell;
      }
      return Object.keys(valeur).length > 3 ? [valeur] : [];
    });
    await this.envoyerParPaquets("restrictions", values);
  }

  async verifierWebhook(entree: EntreeWebhook): Promise<boolean> {
    const secret = env.CHANNEX_WEBHOOK_SECRET?.trim();
    if (!secret) return false;
    const horodatage = entree.headers.get("x-hmac-timestamp");
    const signatures = entree.headers.get("x-hmac-signature-256");
    if (!horodatage || !signatures) return false;
    const age = Math.abs(Math.floor(Date.now() / 1000) - Number(horodatage));
    if (!Number.isFinite(age) || age > 300) return false;
    const attendu = createHmac("sha256", secret)
      .update(`${horodatage}.${entree.corps}`)
      .digest("hex");
    return signatures.split(",").some((signature) => {
      const valeur = signature.trim().toLowerCase();
      if (valeur.length !== attendu.length) return false;
      return timingSafeEqual(Buffer.from(valeur), Buffer.from(attendu));
    });
  }
}
