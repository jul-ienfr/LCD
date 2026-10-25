import Link from "next/link";
import { connection } from "next/server";
import {
  TRANSITIONS_COMMANDE_EXTRA,
  type StatutCommandeExtra,
} from "@/domain/extra";
import { DrizzleCommandeExtraRepository } from "@/infrastructure/db/repositories/commande-extra-repository";
import { DrizzleExtraRepository } from "@/infrastructure/db/repositories/extra-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleReservationRepository } from "@/infrastructure/db/repositories/reservation-repository";
import { formaterEuros } from "@/lib/format";
import { requireRole, tenantIdDeSession } from "@/lib/session";
import { changerStatutCommandeExtraAction } from "./actions";
import { FormulaireExtra } from "./formulaire";

export const instant = false;

const LIBELLES: Record<StatutCommandeExtra, string> = {
  demandee: "Demandée",
  confirmee: "Confirmer",
  refusee: "Refuser",
  livree: "Livrée",
};

export default async function PageExtras() {
  await connection();

  const session = await requireRole(["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);

  const extras = await new DrizzleExtraRepository().listerTous(tenantId);
  const logements = await new DrizzleLogementRepository().listerParTenant(
    tenantId,
  );
  const commandes =
    await new DrizzleCommandeExtraRepository().listerParTenant(tenantId);
  const reservations =
    await new DrizzleReservationRepository().listerTous(tenantId);

  const parExtra = new Map(extras.map((e) => [e.id, e]));
  const parLogement = new Map(logements.map((l) => [l.id, l]));
  const parReservation = new Map(reservations.map((r) => [r.id, r]));

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-6 py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-widest text-encre-faine">
            Espace hôte
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Extras voyageur
          </h1>
          <p className="text-encre-douce">
            {extras.length} extra{extras.length > 1 ? "s" : ""} ·{" "}
            {commandes.length} commande{commandes.length > 1 ? "s" : ""}
          </p>
        </div>
        <Link className="text-sm underline" href="/hote">
          Retour au tableau de bord
        </Link>
      </header>

      <section className="rounded-2xl border border-bordure bg-surface p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Créer un extra</h2>
        <p className="mt-1 text-sm text-encre-douce">
          Un extra global est proposé à tous les logements ; un extra lié à un
          logement n’apparaît que pour ce logement.
        </p>
        <div className="mt-5">
          <FormulaireExtra
            logements={logements.map((l) => ({
              id: l.id,
              nom: l.nom,
              code: l.code,
            }))}
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Catalogue</h2>
        {extras.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-bordure p-6 text-encre-douce">
            Aucun extra au catalogue.
          </p>
        ) : (
          <ul className="divide-y divide-bordure rounded-2xl border border-bordure bg-surface">
            {extras.map((extra) => (
              <li
                className="flex flex-wrap items-center justify-between gap-3 p-4"
                key={extra.id}
              >
                <div>
                  <p className="font-medium">
                    {extra.nom}{" "}
                    <span className="font-mono text-xs text-encre-faine">
                      {extra.code}
                    </span>
                  </p>
                  <p className="text-sm text-encre-douce">
                    {extra.description ?? ""}
                  </p>
                  <p className="text-xs text-encre-faine">
                    {extra.logementId
                      ? parLogement.get(extra.logementId)?.nom ??
                        extra.logementId
                      : "Tous les logements"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    {formaterEuros(extra.prixCentimes)}
                  </p>
                  <p className="text-xs text-encre-faine">
                    {extra.actif ? "actif" : "inactif"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Commandes</h2>
        {commandes.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-bordure p-6 text-encre-douce">
            Aucune commande pour le moment.
          </p>
        ) : (
          <ul className="divide-y divide-bordure rounded-2xl border border-bordure bg-surface">
            {commandes.map((commande) => (
              <li className="p-4" key={commande.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">
                    {parExtra.get(commande.extraId)?.nom ?? commande.extraId} ×{" "}
                    {commande.quantite}
                  </p>
                  <span className="rounded-full bg-surface-2 px-3 py-1 text-xs font-medium">
                    {commande.statut}
                  </span>
                </div>
                <p className="mt-1 text-sm text-encre-douce">
                  {commande.ref} ·{" "}
                  {parReservation.get(commande.reservationId)?.ref ??
                    commande.reservationId}{" "}
                  · {formaterEuros(commande.totalCentimes)}
                </p>
                {TRANSITIONS_COMMANDE_EXTRA[commande.statut].length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {TRANSITIONS_COMMANDE_EXTRA[commande.statut].map(
                      (statut) => (
                        <form
                          action={changerStatutCommandeExtraAction}
                          key={statut}
                        >
                          <input
                            name="commandeId"
                            type="hidden"
                            value={commande.id}
                          />
                          <input name="statut" type="hidden" value={statut} />
                          <button
                            className="rounded-full border border-bordure px-4 py-2 text-xs font-medium"
                            type="submit"
                          >
                            {LIBELLES[statut]}
                          </button>
                        </form>
                      ),
                    )}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <nav className="flex flex-wrap gap-4 text-sm">
        <Link className="underline" href="/hote/logements">
          Logements / guides
        </Link>
        <Link className="underline" href="/hote">
          Tableau de bord
        </Link>
      </nav>
    </main>
  );
}
