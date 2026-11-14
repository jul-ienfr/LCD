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
import type { SanteConnexion } from "@/domain/canal";
import { santeConnexionInitiale } from "@/domain/canal";
import { CATALOGUE_FOURNISSEURS } from "@/domain/fournisseur";
import { ErreurMetier } from "@/domain/erreurs";
import { env } from "@/lib/env";
import { creerRateLimiter, type RateLimiter } from "@/lib/server/rate-limit";
import {
  centimes,
  exigerCle,
  requeteFournisseur,
  texteOuNull,
  urlAvecParametres,
} from "./http";

interface ProprieteBeds24 {
  id?: number;
  name?: string;
  roomTypes?: { id?: number; name?: string; qty?: number }[];
}

interface ReservationBeds24 {
  id?: number;
  propertyId?: number;
  roomId?: number;
  status?: string;
  arrival?: string;
  departure?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  price?: number;
  currency?: string;
  apiReference?: string;
  channel?: string;
}

interface ReponseBeds24<T> {
  success?: boolean;
  data?: T[];
  pages?: { nextPageExists?: boolean };
  error?: string;
}

function fiche() {
  const entree = CATALOGUE_FOURNISSEURS.find(
    (fournisseur) => fournisseur.code === "beds24",
  );
  if (!entree) throw new Error("Fiche Beds24 absente.");
  return entree;
}

function base(): string {
  return env.BEDS24_API_BASE;
}

let jetonCache: { valeur: string; expireLe: number } | null = null;
let jetonEnCours: Promise<string> | null = null;

async function rafraichirJeton(): Promise<string> {
  const donnees = await requeteFournisseur<{
    token?: string;
    expiresIn?: number;
  }>({
    url: urlAvecParametres(base(), "authentication/token", {}),
    entetes: {
      refreshToken: exigerCle(env.BEDS24_REFRESH_TOKEN, "BEDS24_REFRESH_TOKEN"),
    },
    timeoutMs: env.FOURNISSEUR_HTTP_TIMEOUT_MS,
  });
  if (!donnees.token) {
    throw new ErreurMetier(
      "FOURNISSEUR_INDISPONIBLE",
      "Beds24 n’a pas retourné de jeton.",
    );
  }
  jetonCache = {
    valeur: donnees.token,
    expireLe: Date.now() + Math.max(60, donnees.expiresIn ?? 3600) * 1_000,
  };
  return donnees.token;
}

async function jeton(): Promise<string> {
  if (!env.BEDS24_REFRESH_TOKEN) {
    return exigerCle(env.BEDS24_API_TOKEN, "BEDS24_API_TOKEN");
  }
  if (jetonCache && jetonCache.expireLe > Date.now() + 60_000) {
    return jetonCache.valeur;
  }
  // Deux synchronisations concurrentes ne doivent pas consommer le refresh
  // token en parallèle : un seul appel rafraîchit, l'autre attend le résultat.
  jetonEnCours ??= rafraichirJeton();
  try {
    return await jetonEnCours;
  } finally {
    jetonEnCours = null;
  }
}

// Protection anti-burst : un emballement local ne doit pas saturer l'API
// Beds24 ni déclencher un bannissement côté fournisseur. Le plafond est très
// large (600 appels/min) ; au-delà, on refuse localement avec une erreur
// explicite plutôt que de envoyer des requêtes qui seront rejetées.
const limiteur: RateLimiter = creerRateLimiter({
  max: 600,
  fenetreMs: 60_000,
});

async function appel<T>(
  chemin: string,
  options: {
    methode?: "GET" | "POST" | "DELETE";
    parametres?: Record<string, string | number | boolean | undefined>;
    corps?: unknown;
  } = {},
): Promise<T> {
  if (!limiteur.autoriser("beds24")) {
    throw new ErreurMetier(
      "FOURNISSEUR_RATE_LIMIT",
      "Limite locale d'appels Beds24 atteinte (protection anti-burst).",
    );
  }
  return requeteFournisseur<T>({
    url: urlAvecParametres(base(), chemin, options.parametres ?? {}),
    methode: options.methode ?? "GET",
    entetes: { token: await jeton() },
    ...(options.corps === undefined ? {} : { corps: options.corps }),
    timeoutMs: env.FOURNISSEUR_HTTP_TIMEOUT_MS,
    // Erreurs transitoires (429, 5xx, timeout) : deux tentatives de plus,
    // backoff exponentiel. Un 409 (conflit métier) n'est jamais rejoué.
    reessais: 2,
  });
}

function statutReservation(statut: string | undefined): ReservationExterne["statut"] {
  if (statut === "cancelled" || statut === "inquiry") return "annulee";
  if (statut === "confirmed") return "confirmee";
  // "black" est un blocage, "new"/"request" ne sont pas encore confirmés :
  // ils bloquent prudemment les dates au lieu d'être ignorés.
  return "en_attente";
}

function roomId(changement: {
  externalRoomTypeId?: string | null;
}): number {
  const id = Number(changement.externalRoomTypeId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ErreurMetier(
      "FOURNISSEUR_INVALIDE",
      "Beds24 exige l’identifiant numérique de chambre (roomId).",
    );
  }
  return id;
}

interface LigneCalendrierBeds24 {
  roomId?: number;
  date?: string;
  numAvail?: number;
  price1?: number;
  minStay?: number;
  maxStay?: number;
  override?: string;
}

async function ecrireCalendrier(
  chambres: {
    roomId: number;
    calendar: Record<string, unknown>[];
  }[],
): Promise<void> {
  if (chambres.length === 0) return;
  for (const chambre of chambres) {
    for (let index = 0; index < chambre.calendar.length; index += 100) {
      await appel<unknown>("inventory/rooms/calendar", {
        methode: "POST",
        corps: [
          {
            roomId: chambre.roomId,
            calendar: chambre.calendar.slice(index, index + 100),
          },
        ],
      });
    }
  }
}

export class Beds24Fournisseur implements FournisseurCanal {
  readonly code = "beds24" as const;
  readonly mode = fiche().mode;
  readonly capacites = fiche().capacites;

  private async lireCalendrier(
    debut: string,
    fin: string,
    externalPropertyId?: string,
  ): Promise<LigneCalendrierBeds24[]> {
    const donnees = await appel<ReponseBeds24<LigneCalendrierBeds24>>(
      "inventory/rooms/calendar",
      {
        parametres: {
          startDate: debut,
          endDate: fin,
          includePrices: true,
          ...(externalPropertyId ? { propertyId: externalPropertyId } : {}),
        },
      },
    );
    return (donnees.data ?? []).filter(
      (ligne) =>
        typeof ligne.roomId === "number" &&
        typeof ligne.date === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(ligne.date),
    );
  }

  async lireDisponibilites(
    debut: string,
    fin: string,
    externalPropertyId?: string,
  ): Promise<DisponibiliteJour[]> {
    const lignes = await this.lireCalendrier(debut, fin, externalPropertyId);
    return lignes.map((ligne) => ({
      externalPropertyId: externalPropertyId ?? "",
      externalRoomTypeId: String(ligne.roomId),
      date: ligne.date!,
      disponible: ligne.numAvail !== 0,
    }));
  }

  async lireTarifs(
    debut: string,
    fin: string,
    externalPropertyId?: string,
  ): Promise<TarifJour[]> {
    const lignes = await this.lireCalendrier(debut, fin, externalPropertyId);
    return lignes
      .filter(
        (ligne) =>
          typeof ligne.price1 === "number" &&
          Number.isFinite(ligne.price1) &&
          ligne.price1 > 0,
      )
      .map((ligne) => ({
        externalPropertyId: externalPropertyId ?? "",
        externalRoomTypeId: String(ligne.roomId),
        date: ligne.date!,
        prixCentimes: Math.round(ligne.price1! * 100),
        devise: "EUR",
      }));
  }

  async lireRestrictions(
    debut: string,
    fin: string,
    externalPropertyId?: string,
  ): Promise<RestrictionJour[]> {
    const lignes = await this.lireCalendrier(debut, fin, externalPropertyId);
    return lignes.map((ligne) => {
      const restriction: RestrictionJour = {
        externalPropertyId: externalPropertyId ?? "",
        externalRoomTypeId: String(ligne.roomId),
        date: ligne.date!,
      };
      if (typeof ligne.minStay === "number") restriction.sejourMin = ligne.minStay;
      if (typeof ligne.maxStay === "number") restriction.sejourMax = ligne.maxStay;
      if (ligne.override === "noCheckIn" || ligne.override === "noCheckInOrCheckOut") {
        restriction.arriveeAutorisee = false;
      }
      if (ligne.override === "noCheckOut" || ligne.override === "noCheckInOrCheckOut") {
        restriction.departAutorisee = false;
      }
      return restriction;
    });
  }

  async testerConnexion(): Promise<ResultatTestFournisseur> {
    const donnees = await appel<{
      validToken?: boolean;
      token?: { ownerId?: number; scopes?: string[] };
    }>("authentication/details");
    if (!donnees.validToken) {
      return {
        ok: false,
        message: "Beds24 refuse le jeton (invalide ou expiré).",
        details: { scopes: donnees.token?.scopes ?? [] },
      };
    }
    return {
      ok: true,
      message: `Beds24 joignable (compte ${donnees.token?.ownerId ?? "?"}).`,
      details: { scopes: donnees.token?.scopes ?? [] },
    };
  }

  /**
   * Santé de connexion côté fournisseur (T112). Sonde légère sans effet de
   * bord : `authentication/details`. Retourne toujours une santé (jamais
   * d'exception) pour que l'appelant puisse l'enregistrer et alerter.
   *
   * Le messaging OTA n'est PAS implémenté ici : `capacites.messaging` est
   * faux tant que le compte sandbox n'a pas prouvé le contraire (ADR-01).
   */
  async lireSante(
    _externalPropertyId?: string,
  ): Promise<SanteConnexion | null> {
    const debut = Date.now();
    try {
      const donnees = await appel<{ validToken?: boolean }>(
        "authentication/details",
      );
      const neutre = santeConnexionInitiale();
      if (donnees.validToken) {
        return {
          ...neutre,
          statut: "ok",
          dernierPullAt: new Date().toISOString(),
          latenceMs: Date.now() - debut,
        };
      }
      return {
        ...neutre,
        statut: "erreur",
        derniereErreur: "Beds24 refuse le jeton (invalide ou expiré).",
        erreursConsecutives: 1,
        latenceMs: Date.now() - debut,
      };
    } catch (erreur) {
      return {
        ...santeConnexionInitiale(),
        statut: "erreur",
        derniereErreur:
          erreur instanceof Error ? erreur.message : String(erreur),
        erreursConsecutives: 1,
        latenceMs: Date.now() - debut,
      };
    }
  }

  async listerLogements(): Promise<LogementExterne[]> {
    const donnees = await appel<ReponseBeds24<ProprieteBeds24>>("properties", {
      parametres: { includeAllRooms: true, page: 1 },
    });
    return (donnees.data ?? []).flatMap<LogementExterne>((propriete) => {
      if (propriete.id === undefined) return [];
      const chambres = propriete.roomTypes ?? [];
      if (chambres.length === 0) {
        return [
          {
            externalId: String(propriete.id),
            nom: propriete.name ?? String(propriete.id),
            externalRoomTypeId: null,
          },
        ];
      }
      return chambres.flatMap((chambre) => {
        if (chambre.id === undefined) return [];
        return [
          {
            externalId: String(propriete.id),
            nom: `${propriete.name ?? propriete.id} / ${chambre.name ?? chambre.id}`,
            externalRoomTypeId: String(chambre.id),
          },
        ];
      });
    });
  }

  async recupererReservations(
    depuis: string,
    jusqua: string,
    externalPropertyId?: string,
  ): Promise<ReservationExterne[]> {
    const reservations: ReservationExterne[] = [];
    for (let page = 1; page <= 20; page += 1) {
      const url = new URL(
        urlAvecParametres(base(), "bookings", {
          arrivalFrom: depuis,
          arrivalTo: jusqua,
          page,
          ...(externalPropertyId ? { propertyId: externalPropertyId } : {}),
        }),
      );
      for (const statut of [
        "confirmed",
        "request",
        "new",
        "cancelled",
        "black",
        "inquiry",
      ]) {
        url.searchParams.append("status[]", statut);
      }
      const donnees = await requeteFournisseur<
        ReponseBeds24<ReservationBeds24>
      >({
        url: url.toString(),
        entetes: { token: await jeton() },
        timeoutMs: env.FOURNISSEUR_HTTP_TIMEOUT_MS,
      });
      const lignes = donnees.data ?? [];
      for (const ligne of lignes) {
        if (!ligne.arrival || !ligne.departure || ligne.roomId === undefined) {
          continue;
        }
        reservations.push({
          externalId: String(ligne.id ?? ""),
          externalPropertyId: String(ligne.propertyId ?? ligne.roomId),
          externalRoomTypeId: String(ligne.roomId),
          reference: String(ligne.apiReference ?? ligne.id ?? ""),
          arrivee: ligne.arrival,
          depart: ligne.departure,
          statut: statutReservation(ligne.status),
          clientNom:
            [ligne.firstName, ligne.lastName].filter(Boolean).join(" ").trim() ||
            null,
          clientEmail: texteOuNull(ligne.email),
          montantCentimes: centimes(ligne.price),
          devise: texteOuNull(ligne.currency),
        });
      }
      if (!donnees.pages?.nextPageExists || lignes.length === 0) break;
    }
    return reservations;
  }

  async pousserDisponibilites(
    changements: readonly DisponibiliteJour[],
  ): Promise<void> {
    const chambres = new Map<number, Record<string, unknown>[]>();
    for (const changement of changements) {
      const id = roomId(changement);
      const liste = chambres.get(id) ?? [];
      liste.push({
        from: changement.date,
        to: changement.date,
        numAvail: changement.disponible ? 1 : 0,
      });
      chambres.set(id, liste);
    }
    await ecrireCalendrier(
      [...chambres.entries()].map(([id, calendar]) => ({
        roomId: id,
        calendar,
      })),
    );
  }

  async pousserTarifs(tarifs: readonly TarifJour[]): Promise<void> {
    const chambres = new Map<number, Record<string, unknown>[]>();
    for (const tarif of tarifs) {
      const id = roomId(tarif);
      const liste = chambres.get(id) ?? [];
      liste.push({
        from: tarif.date,
        to: tarif.date,
        price1: Math.round(tarif.prixCentimes) / 100,
      });
      chambres.set(id, liste);
    }
    await ecrireCalendrier(
      [...chambres.entries()].map(([id, calendar]) => ({
        roomId: id,
        calendar,
      })),
    );
  }

  async pousserRestrictions(
    restrictions: readonly RestrictionJour[],
  ): Promise<void> {
    const chambres = new Map<number, Record<string, unknown>[]>();
    for (const restriction of restrictions) {
      const id = roomId(restriction);
      const valeur: Record<string, unknown> = {
        from: restriction.date,
        to: restriction.date,
      };
      if (restriction.sejourMin !== undefined) {
        valeur.minStay = Math.max(1, Math.min(365, restriction.sejourMin));
      }
      if (restriction.sejourMax !== undefined) {
        valeur.maxStay = Math.max(1, Math.min(364, restriction.sejourMax));
      }
      const arrivee = restriction.arriveeAutorisee;
      const depart = restriction.departAutorisee;
      if (arrivee === false && depart === false) {
        valeur.override = "noCheckInOrCheckOut";
      } else if (arrivee === false) {
        valeur.override = "noCheckIn";
      } else if (depart === false) {
        valeur.override = "noCheckOut";
      }
      if (restriction.stopSell === true) {
        valeur.numAvail = 0;
      }
      if (Object.keys(valeur).length <= 2) continue;
      const liste = chambres.get(id) ?? [];
      liste.push(valeur);
      chambres.set(id, liste);
    }
    await ecrireCalendrier(
      [...chambres.entries()].map(([id, calendar]) => ({
        roomId: id,
        calendar,
      })),
    );
  }

  async verifierWebhook(entree: EntreeWebhook): Promise<boolean> {
    const secret = env.BEDS24_WEBHOOK_SECRET?.trim();
    if (!secret) return false;
    const recu = entree.headers.get("x-lcd-webhook-secret");
    if (!recu || recu.length !== secret.length) return false;
    return timingSafeEqual(Buffer.from(recu), Buffer.from(secret));
  }
}
