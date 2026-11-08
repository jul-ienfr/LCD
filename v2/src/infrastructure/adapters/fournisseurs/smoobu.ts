import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";
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

interface AppartementSmoobu {
  id?: number | string;
  name?: string;
}

interface ReservationSmoobu {
  id?: number | string;
  "reference-id"?: string | number | null;
  type?: string;
  arrival?: string;
  departure?: string;
  apartment?: { id?: number | string; name?: string };
  "guest-name"?: string;
  email?: string;
  price?: number | string;
  "is-blocked-booking"?: boolean;
}

function fiche() {
  const entree = CATALOGUE_FOURNISSEURS.find(
    (fournisseur) => fournisseur.code === "smoobu",
  );
  if (!entree) throw new Error("Fiche Smoobu absente.");
  return entree;
}

function base(): string {
  return env.SMOOBU_API_BASE;
}

function signature(
  methode: string,
  url: string,
  corps: string,
): Record<string, string> {
  const cle = exigerCle(env.SMOOBU_API_KEY, "SMOOBU_API_KEY");
  const secret = exigerCle(env.SMOOBU_API_SECRET, "SMOOBU_API_SECRET");
  const cible = new URL(url);
  const requete = [...cible.searchParams.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(
      ([nom, valeur]) =>
        `${encodeURIComponent(nom)}=${encodeURIComponent(valeur)}`,
    )
    .join("&");
  const horodatage = new Date()
    .toISOString()
    .replace(/\.\d{3}Z$/u, "Z");
  const nonce = randomUUID();
  const empreinte = createHash("sha256").update(corps, "utf8").digest("hex");
  const canonique = [
    methode.toUpperCase(),
    cible.pathname,
    requete,
    horodatage,
    nonce,
    empreinte,
    cle,
  ].join("\n");
  const valeur = createHmac("sha256", secret)
    .update(canonique, "utf8")
    .digest("base64");
  return {
    "X-API-Key": cle,
    "X-Timestamp": horodatage,
    "X-Nonce": nonce,
    "X-Signature": valeur,
  };
}

async function appel<T>(
  url: string,
  methode: "GET" | "POST" | "DELETE" = "GET",
  corps?: unknown,
): Promise<T> {
  const corpsBrut = corps === undefined ? "" : JSON.stringify(corps);
  return requeteFournisseur<T>({
    url,
    methode,
    entetes: signature(methode, url, corpsBrut),
    ...(corps === undefined ? {} : { corpsBrut }),
    timeoutMs: env.FOURNISSEUR_HTTP_TIMEOUT_MS,
  });
}

function statutReservation(
  reservation: ReservationSmoobu,
): ReservationExterne["statut"] {
  const type = reservation.type?.toLowerCase() ?? "";
  if (type.includes("cancel")) return "annulee";
  if (reservation["is-blocked-booking"]) return "en_attente";
  return "confirmee";
}

export class SmoobuFournisseur implements FournisseurCanal {
  readonly code = "smoobu" as const;
  readonly mode = fiche().mode;
  readonly capacites = fiche().capacites;

  async testerConnexion(): Promise<ResultatTestFournisseur> {
    const profil = await appel<{ id?: number; email?: string }>(
      urlAvecParametres(base(), "me", {}),
    );
    return {
      ok: true,
      message: `Smoobu joignable (compte ${profil.id ?? "?"}).`,
      details: { email: profil.email ?? null },
    };
  }

  async listerLogements(): Promise<LogementExterne[]> {
    const donnees = await appel<{ apartments?: AppartementSmoobu[] }>(
      urlAvecParametres(base(), "apartments", {}),
    );
    return (donnees.apartments ?? []).flatMap((appartement) => {
      if (appartement.id === undefined) return [];
      return [
        {
          externalId: String(appartement.id),
          nom: appartement.name ?? String(appartement.id),
          externalRoomTypeId: null,
        },
      ];
    });
  }

  async recupererReservations(
    depuis: string,
    jusqua: string,
    filtrePropriete?: string,
  ): Promise<ReservationExterne[]> {
    const reservations: ReservationExterne[] = [];
    for (let page = 1; page <= 20; page += 1) {
      const donnees = await appel<{
        bookings?: ReservationSmoobu[];
        page_count?: number;
        total_items?: number;
      }>(
        urlAvecParametres(base(), "reservations", {
          page,
          pageSize: 100,
          arrivalFrom: depuis,
          arrivalTo: jusqua,
          showCancellation: true,
          excludeBlocked: false,
        }),
      );
      const lignes = donnees.bookings ?? [];
      for (const ligne of lignes) {
        const externalPropertyId = ligne.apartment?.id;
        if (
          externalPropertyId === undefined ||
          !ligne.arrival ||
          !ligne.departure ||
          (filtrePropriete && String(externalPropertyId) !== filtrePropriete)
        ) {
          continue;
        }
        reservations.push({
          externalId: String(ligne.id ?? ""),
          externalPropertyId: String(externalPropertyId),
          reference: String(ligne["reference-id"] ?? ligne.id ?? ""),
          arrivee: ligne.arrival,
          depart: ligne.departure,
          statut: statutReservation(ligne),
          clientNom: texteOuNull(ligne["guest-name"]),
          clientEmail: texteOuNull(ligne.email),
          montantCentimes: centimes(ligne.price),
          devise: null,
        });
      }
      const total = donnees.total_items ?? 0;
      if (lignes.length < 100 || page * 100 >= total) break;
    }
    return reservations;
  }

  async pousserDisponibilites(
    _changements: readonly DisponibiliteJour[],
  ): Promise<void> {
    throw new ErreurMetier(
      "FOURNISSEUR_NON_SUPPORTE",
      "Smoobu ne documente pas l’écriture des disponibilités dans son API publique.",
    );
  }

  async pousserTarifs(tarifs: readonly TarifJour[]): Promise<void> {
    if (tarifs.length === 0) return;
    const appartements = [
      ...new Set(tarifs.map((tarif) => Number(tarif.externalPropertyId))),
    ];
    if (appartements.some((id) => !Number.isFinite(id))) {
      throw new ErreurMetier(
        "FOURNISSEUR_INVALIDE",
        "Smoobu attend un identifiant d’appartement numérique.",
      );
    }
    const operations = tarifs.map((tarif) => ({
      dates: [tarif.date],
      daily_price: Math.round(tarif.prixCentimes) / 100,
    }));
    for (let index = 0; index < operations.length; index += 100) {
      await appel<unknown>(urlAvecParametres(base(), "rates", {}), "POST", {
        apartments: appartements,
        operations: operations.slice(index, index + 100),
      });
    }
  }

  async pousserRestrictions(
    restrictions: readonly RestrictionJour[],
  ): Promise<void> {
    const operations: Record<string, unknown>[] = [];
    const appartements = new Set<number>();
    for (const restriction of restrictions) {
      const appartement = Number(restriction.externalPropertyId);
      if (!Number.isInteger(appartement) || appartement <= 0) {
        throw new ErreurMetier(
          "FOURNISSEUR_INVALIDE",
          "Smoobu attend un identifiant d’appartement numérique.",
        );
      }
      if (
        restriction.arriveeAutorisee === false ||
        restriction.departAutorisee === false
      ) {
        throw new ErreurMetier(
          "FOURNISSEUR_NON_SUPPORTE",
          "Smoobu ne documente pas les CTA/CTD dans son API publique.",
        );
      }
      if (
        restriction.sejourMin === undefined &&
        restriction.sejourMax === undefined
      ) {
        continue;
      }
      appartements.add(appartement);
      operations.push({
        dates: [restriction.date],
        ...(restriction.sejourMin === undefined
          ? {}
          : { min_length_of_stay: Math.max(1, restriction.sejourMin) }),
        ...(restriction.sejourMax === undefined
          ? {}
          : { max_length_of_stay: Math.max(1, restriction.sejourMax) }),
      });
    }
    if (operations.length === 0) return;
    await appel<unknown>(urlAvecParametres(base(), "rates", {}), "POST", {
      apartments: [...appartements],
      operations,
    });
  }

  async verifierWebhook(entree: EntreeWebhook): Promise<boolean> {
    const secret = env.SMOOBU_WEBHOOK_SECRET?.trim();
    if (!secret) return false;
    const recu = entree.headers.get("x-webhook-secret");
    if (!recu || recu.length !== secret.length) return false;
    return timingSafeEqual(Buffer.from(recu), Buffer.from(secret));
  }
}
