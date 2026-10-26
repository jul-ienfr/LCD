import Link from "next/link";
import { connection } from "next/server";
import { DrizzleFichesPoliceRepository } from "@/infrastructure/db/repositories/fiches-police-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleReservationRepository } from "@/infrastructure/db/repositories/reservation-repository";
import { requireRole, tenantIdDeSession } from "@/lib/session";

export const instant = false;

export default async function PagePoliceStaff() {
  await connection();

  const session = await requireRole(["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const fiches = await new DrizzleFichesPoliceRepository().lister(tenantId, 200);
  const logements = await new DrizzleLogementRepository().listerParTenant(
    tenantId,
  );
  const reservations =
    await new DrizzleReservationRepository().listerTous(tenantId);
  const nomLogement = new Map(logements.map((l) => [l.id, l.nom]));
  const refSejour = new Map(reservations.map((r) => [r.id, r.ref]));

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-12">
      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-widest text-encre-faine">
          Conformité
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Fiches de police
        </h1>
        <p className="text-encre-douce">
          Une fiche par personne hébergée, déposée par le voyageur via son lien
          de séjour. Conservation 6 mois puis purge automatique. Aucune pièce
          d’identité n’est demandée ni stockée.
        </p>
      </header>

      <section className="rounded-2xl border border-bordure bg-surface p-6 shadow-sm">
        <h2 className="text-lg font-semibold">
          {fiches.length} fiche(s) conservée(s)
        </h2>
        {fiches.length === 0 ? (
          <p className="mt-3 text-sm text-encre-douce">
            Aucune fiche reçue. Les voyageurs la remplissent depuis leur espace
            de séjour, avant l’arrivée.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-bordure text-xs uppercase tracking-wide text-encre-faine">
                <tr>
                  <th className="py-2 pr-3">Séjour</th>
                  <th className="py-2 pr-3">Logement</th>
                  <th className="py-2 pr-3">Personne</th>
                  <th className="py-2 pr-3">Naissance</th>
                  <th className="py-2 pr-3">Contact</th>
                  <th className="py-2 pr-3">Reçue</th>
                  <th className="py-2">Purge</th>
                </tr>
              </thead>
              <tbody>
                {fiches.map((fiche) => (
                  <tr
                    className="border-b border-bordure last:border-0"
                    key={fiche.id}
                  >
                    <td className="py-2 pr-3 font-mono text-xs">
                      {refSejour.get(fiche.reservationId) ?? "—"}
                    </td>
                    <td className="py-2 pr-3">
                      {nomLogement.get(fiche.logementId) ?? "—"}
                    </td>
                    <td className="py-2 pr-3">
                      <span className="font-medium">
                        {fiche.prenoms} {fiche.nom}
                      </span>
                      <br />
                      <span className="text-xs text-encre-faine">
                        {fiche.nationalite}
                      </span>
                    </td>
                    <td className="py-2 pr-3 tabular-nums">
                      {fiche.dateNaissance}
                      <br />
                      <span className="text-xs text-encre-faine">
                        {fiche.lieuNaissance}
                      </span>
                    </td>
                    <td className="py-2 pr-3">
                      {fiche.telephone}
                      <br />
                      <span className="text-xs text-encre-faine">
                        {fiche.domicile}
                      </span>
                    </td>
                    <td className="py-2 pr-3 tabular-nums text-xs">
                      {fiche.createdAt.toISOString().slice(0, 10)}
                    </td>
                    <td className="py-2 tabular-nums text-xs">
                      {fiche.purgeAt.toISOString().slice(0, 10)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-4 text-xs text-encre-faine">
          Données personnelles : accès limité aux rôles admin et hôte. Export
          interdit hors réquisition légale ; la purge est assurée par le cron
          <code className="mx-1">/api/cron/purge-police</code>.
        </p>
      </section>

      <Link className="text-sm underline" href="/hote">
        ← Retour au pilotage
      </Link>
    </main>
  );
}
