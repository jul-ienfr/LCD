import Link from "next/link";
import { connection } from "next/server";
import {
  ajouterJours,
  decalerMois,
  joursDuMois,
  moisCourant,
  moisEnFrancais,
  moisValide,
} from "@/domain/calendrier";
import {
  LIBELLES_STATUT_CAUTION,
  type StatutCaution,
} from "@/domain/caution";
import { DrizzleCautionRepository } from "@/infrastructure/db/repositories/caution-repository";
import { DrizzleReservationRepository } from "@/infrastructure/db/repositories/reservation-repository";
import { formaterEuros } from "@/lib/format";
import { requireRole, tenantIdDeSession } from "@/lib/session";
import { changerStatutCautionAction } from "./actions";
import { FormulaireCaution } from "./formulaire";

export const instant = false;

const COULEURS_STATUT: Record<StatutCaution, string> = {
  attendue: "bg-alerte-douce text-alerte",
  recue: "bg-accent-douce text-accent",
  restituee: "bg-surface-2 text-encre-douce",
  retenue: "bg-danger-douce text-danger",
};

export default async function PageCautions({
  searchParams,
}: {
  searchParams: Promise<{ mois?: string; caution?: string }>;
}) {
  await connection();

  const session = await requireRole(["admin", "hote", "comptable"]);
  const tenantId = tenantIdDeSession(session);
  const params = await searchParams;
  const mois =
    params.mois && moisValide(params.mois) ? params.mois : moisCourant();

  const jours = joursDuMois(mois);
  const premier = jours[0];
  const dernier = jours[jours.length - 1];
  if (!premier || !dernier) throw new Error("Mois invalide.");
  const finMois = ajouterJours(dernier, 1);

  const reservations = await new DrizzleReservationRepository().listerParMois(
    tenantId,
    premier,
    finMois,
  );
  const toutesCautions =
    await new DrizzleCautionRepository().listerParTenant(tenantId);
  const idsReservations = new Set(reservations.map((r) => r.id));
  const cautions = toutesCautions.filter((caution) =>
    idsReservations.has(caution.reservationId),
  );
  const parReservation = new Map(
    cautions.map((caution) => [caution.reservationId, caution]),
  );
  const sansCaution = reservations.filter(
    (reservation) => !parReservation.has(reservation.id),
  );

  const totalCaution = cautions.reduce((t, c) => t + c.montantCentimes, 0);
  const totalRetenu = cautions.reduce(
    (t, c) => t + c.montantRetenuCentimes,
    0,
  );

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-6 py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-widest text-encre-faine">
            Espace hôte
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Cautions — {moisEnFrancais(mois)}
          </h1>
          <p className="text-encre-douce">
            Dépôts de garantie des réservations du mois.
          </p>
        </div>
        <Link className="text-sm underline" href="/hote">
          Retour au tableau de bord
        </Link>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <Link
          className="rounded-full border border-bordure px-4 py-2 text-sm"
          href={`/hote/cautions?mois=${decalerMois(mois, -1)}`}
        >
          ← Mois précédent
        </Link>
        <Link
          className="rounded-full border border-bordure px-4 py-2 text-sm"
          href={`/hote/cautions?mois=${moisCourant()}`}
        >
          Mois courant
        </Link>
        <Link
          className="rounded-full border border-bordure px-4 py-2 text-sm"
          href={`/hote/cautions?mois=${decalerMois(mois, 1)}`}
        >
          Mois suivant →
        </Link>
        <Link className="text-sm underline" href={`/hote/planning?mois=${mois}`}>
          Planning
        </Link>
      </div>

      {params.caution === "creee" ? (
        <p className="rounded-xl border border-accent bg-accent-douce p-3 text-sm text-accent">
          Caution créée.
        </p>
      ) : null}
      {params.caution === "ok" ? (
        <p className="rounded-xl border border-accent bg-accent-douce p-3 text-sm text-accent">
          Caution mise à jour.
        </p>
      ) : null}
      {params.caution === "erreur" ? (
        <p className="rounded-xl border border-danger bg-danger-douce p-3 text-sm text-danger">
          Mise à jour refusée : vérifiez le montant retenu et le motif.
        </p>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-bordure bg-surface p-5 shadow-sm">
          <p className="text-sm text-encre-faine">Cautions du mois</p>
          <p className="mt-1 text-2xl font-semibold">{cautions.length}</p>
        </div>
        <div className="rounded-2xl border border-bordure bg-surface p-5 shadow-sm">
          <p className="text-sm text-encre-faine">Montant total</p>
          <p className="mt-1 text-2xl font-semibold">
            {formaterEuros(totalCaution)}
          </p>
        </div>
        <div className="rounded-2xl border border-bordure bg-surface p-5 shadow-sm">
          <p className="text-sm text-encre-faine">Retenu</p>
          <p className="mt-1 text-2xl font-semibold">
            {formaterEuros(totalRetenu)}
          </p>
        </div>
      </section>

      {sansCaution.length > 0 ? (
        <section className="rounded-2xl border border-bordure bg-surface p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Créer une caution</h2>
          <p className="mt-1 text-sm text-encre-douce">
            Une seule caution par réservation.
          </p>
          <div className="mt-5">
            <FormulaireCaution
              mois={mois}
              reservations={sansCaution.map((reservation) => ({
                id: reservation.id,
                ref: reservation.ref,
                debut: reservation.debut,
                fin: reservation.fin,
              }))}
            />
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Cautions et réservations</h2>
        {reservations.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-bordure p-6 text-encre-douce">
            Aucune réservation sur ce mois.
          </p>
        ) : (
          <ul className="divide-y divide-bordure rounded-2xl border border-bordure bg-surface">
            {reservations.map((reservation) => {
              const caution = parReservation.get(reservation.id);
              return (
                <li className="p-4" key={reservation.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">
                        {reservation.ref}
                        {reservation.clientNom
                          ? ` — ${reservation.clientNom}`
                          : ""}
                      </p>
                      <p className="text-sm text-encre-douce">
                        {reservation.debut} → {reservation.fin}
                        {caution
                          ? ` · caution ${formaterEuros(caution.montantCentimes)}`
                          : " · aucune caution"}
                      </p>
                      {caution ? (
                        <p className="mt-1 text-xs text-encre-faine">
                          {caution.dateReception
                            ? `Reçue le ${caution.dateReception} · `
                            : ""}
                          {caution.dateRestitution
                            ? `Clôturée le ${caution.dateRestitution} · `
                            : ""}
                          {caution.montantRetenuCentimes > 0
                            ? `Retenu : ${formaterEuros(caution.montantRetenuCentimes)} · `
                            : ""}
                          {caution.motifRetenue
                            ? `Motif : ${caution.motifRetenue}`
                            : ""}
                        </p>
                      ) : null}
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        caution
                          ? COULEURS_STATUT[caution.statut]
                          : "bg-surface-2 text-encre-douce"
                      }`}
                    >
                      {caution
                        ? LIBELLES_STATUT_CAUTION[caution.statut]
                        : "à créer"}
                    </span>
                  </div>

                  {caution?.statut === "attendue" ? (
                    <form
                      action={changerStatutCautionAction}
                      className="mt-3"
                    >
                      <input name="cautionId" type="hidden" value={caution.id} />
                      <input name="statut" type="hidden" value="recue" />
                      <input name="mois" type="hidden" value={mois} />
                      <button
                        className="rounded-full border border-bordure px-4 py-2 text-xs font-medium"
                        type="submit"
                      >
                        Marquer reçue
                      </button>
                    </form>
                  ) : null}

                  {caution?.statut === "recue" ? (
                    <div className="mt-3 flex flex-wrap items-end gap-3">
                      <form action={changerStatutCautionAction}>
                        <input
                          name="cautionId"
                          type="hidden"
                          value={caution.id}
                        />
                        <input name="statut" type="hidden" value="restituee" />
                        <input name="mois" type="hidden" value={mois} />
                        <button
                          className="rounded-full border border-bordure px-4 py-2 text-xs font-medium"
                          type="submit"
                        >
                          Restituer intégralement
                        </button>
                      </form>
                      <form
                        action={changerStatutCautionAction}
                        className="flex flex-wrap items-end gap-2"
                      >
                        <input
                          name="cautionId"
                          type="hidden"
                          value={caution.id}
                        />
                        <input name="statut" type="hidden" value="retenue" />
                        <input name="mois" type="hidden" value={mois} />
                        <label className="text-xs text-encre-douce">
                          Retenue (€)
                          <input
                            className="ml-2 w-24 rounded-lg border border-bordure p-2 text-sm"
                            inputMode="decimal"
                            name="montantRetenuEuros"
                            placeholder="100"
                            required
                          />
                        </label>
                        <label className="text-xs text-encre-douce">
                          Motif
                          <input
                            className="ml-2 rounded-lg border border-bordure p-2 text-sm"
                            name="motifRetenue"
                            placeholder="Dégât"
                            required
                          />
                        </label>
                        <button
                          className="rounded-full border border-danger px-4 py-2 text-xs font-medium text-danger"
                          type="submit"
                        >
                          Retenir
                        </button>
                      </form>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <nav className="flex flex-wrap gap-4 text-sm">
        <Link className="underline" href={`/hote/planning?mois=${mois}`}>
          Planning
        </Link>
        <Link className="underline" href="/hote/compta">
          Compta
        </Link>
        <Link className="underline" href="/hote">
          Tableau de bord
        </Link>
      </nav>
    </main>
  );
}
