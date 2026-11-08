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

interface LigneHostPort {
  booking_id?: string;
  property_id?: string;
  property_name?: string;
  status?: string;
  channel?: string;
  check_in?: string;
  check_out?: string;
  guest_name?: string;
  guest_email?: string;
  total_amount?: string | number;
  currency?: string;
}

interface ReponseHostPort<T> {
  dataset?: string;
  rows?: T[];
  has_more?: boolean;
  page?: number;
}

function fiche() {
  const entree = CATALOGUE_FOURNISSEURS.find(
    (fournisseur) => fournisseur.code === "hostport",
  );
  if (!entree) throw new Error("Fiche Host Port absente.");
  return entree;
}

function base(): string {
  return env.HOSTPORT_API_BASE;
}

function entetes(): Record<string, string> {
  return {
    Authorization: `Bearer ${exigerCle(env.HOSTPORT_API_KEY, "HOSTPORT_API_KEY")}`,
  };
}

async function lire<T>(
  jeu: "bookings" | "calendar",
  depuis: string,
  jusqua: string,
  page = 1,
  propriete?: string,
): Promise<ReponseHostPort<T>> {
  return requeteFournisseur<ReponseHostPort<T>>({
    url: urlAvecParametres(base(), jeu, {
      from: depuis,
      to: jusqua,
      page,
      page_size: 1000,
      ...(propriete ? { property_id: propriete } : {}),
    }),
    entetes: entetes(),
    timeoutMs: env.FOURNISSEUR_HTTP_TIMEOUT_MS,
  });
}

function statutReservation(statut: string | undefined): ReservationExterne["statut"] {
  if (statut === "cancelled" || statut === "canceled") return "annulee";
  if (statut === "pending") return "en_attente";
  return "confirmee";
}

function interdireEcriture(): never {
  throw new ErreurMetier(
    "FOURNISSEUR_LECTURE_SEULE",
    "Host Port expose une API de lecture seule : la V2 ne peut pas pousser d’ARI.",
  );
}

export class HostPortFournisseur implements FournisseurCanal {
  readonly code = "hostport" as const;
  readonly mode = fiche().mode;
  readonly capacites = fiche().capacites;

  async testerConnexion(): Promise<ResultatTestFournisseur> {
    const aujourdHui = new Date().toISOString().slice(0, 10);
    const demain = new Date(Date.now() + 86_400_000)
      .toISOString()
      .slice(0, 10);
    const donnees = await lire<LigneHostPort>("bookings", aujourdHui, demain, 1);
    return {
      ok: true,
      message: "Host Port joignable (API de lecture).",
      details: { lignes: donnees.rows?.length ?? 0, lectureSeule: true },
    };
  }

  async listerLogements(): Promise<LogementExterne[]> {
    const aujourdHui = new Date().toISOString().slice(0, 10);
    const demain = new Date(Date.now() + 86_400_000)
      .toISOString()
      .slice(0, 10);
    const donnees = await lire<{
      property_id?: string;
      property_name?: string;
    }>("calendar", aujourdHui, demain, 1);
    const uniques = new Map<string, LogementExterne>();
    for (const ligne of donnees.rows ?? []) {
      if (!ligne.property_id) continue;
      uniques.set(ligne.property_id, {
        externalId: ligne.property_id,
        nom: ligne.property_name ?? ligne.property_id,
        externalRoomTypeId: null,
      });
    }
    return [...uniques.values()];
  }

  async recupererReservations(
    depuis: string,
    jusqua: string,
    filtrePropriete?: string,
  ): Promise<ReservationExterne[]> {
    const reservations: ReservationExterne[] = [];
    for (let page = 1; page <= 20; page += 1) {
      const donnees = await lire<LigneHostPort>(
        "bookings",
        depuis,
        jusqua,
        page,
        filtrePropriete,
      );
      const lignes = donnees.rows ?? [];
      for (const ligne of lignes) {
        if (!ligne.booking_id || !ligne.check_in || !ligne.check_out) continue;
        reservations.push({
          externalId: ligne.booking_id,
          externalPropertyId: ligne.property_id ?? "",
          reference: ligne.booking_id,
          arrivee: ligne.check_in,
          depart: ligne.check_out,
          statut: statutReservation(ligne.status),
          clientNom: texteOuNull(ligne.guest_name),
          clientEmail: texteOuNull(ligne.guest_email),
          montantCentimes: centimes(ligne.total_amount),
          devise: texteOuNull(ligne.currency),
        });
      }
      if (!donnees.has_more || lignes.length === 0) break;
    }
    return reservations;
  }

  async pousserDisponibilites(
    _changements: readonly DisponibiliteJour[],
  ): Promise<void> {
    interdireEcriture();
  }

  async pousserTarifs(_tarifs: readonly TarifJour[]): Promise<void> {
    interdireEcriture();
  }

  async pousserRestrictions(
    _restrictions: readonly RestrictionJour[],
  ): Promise<void> {
    interdireEcriture();
  }

  async verifierWebhook(entree: EntreeWebhook): Promise<boolean> {
    const secret = env.HOSTPORT_WEBHOOK_SECRET?.trim();
    if (!secret) return false;
    const horodatage = entree.headers.get("x-hostport-timestamp");
    const signature = entree.headers.get("x-hostport-signature");
    if (!horodatage || !signature) return false;
    const age = Math.abs(Math.floor(Date.now() / 1000) - Number(horodatage));
    if (!Number.isFinite(age) || age > 300) return false;
    const attendu = `sha256=${createHmac("sha256", secret)
      .update(`${horodatage}.${entree.corps}`)
      .digest("hex")}`;
    if (signature.length !== attendu.length) return false;
    return timingSafeEqual(Buffer.from(signature), Buffer.from(attendu));
  }
}
