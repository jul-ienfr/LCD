import Link from "next/link";
import { connection } from "next/server";
import { NavSuperAdmin } from "@/components/nav-super-admin";
import { DrizzleSupervisionRepository } from "@/infrastructure/db/repositories/supervision-repository";
import { requireSuperAdmin } from "@/lib/session";

export const instant = false;

export default async function PageSupervision() {
  await connection();
  await requireSuperAdmin();
  const situation = await new DrizzleSupervisionRepository().situation();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-12">
      <NavSuperAdmin actif="/supervision" />

      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-widest text-encre-faine">
          Plateforme
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Supervision</h1>
        <p className="text-encre-douce">
          Vue agrégée, lecture seule, de tous les espaces. Réservée aux
          super-administrateurs et à l’allowlist d’exploitation.
        </p>
      </header>

      {!situation ? (
        <p className="rounded-2xl border border-alerte bg-alerte-douce p-6 text-sm text-alerte">
          Connexion owner absente : renseignez <code>MIGRATION_DATABASE_URL</code>{" "}
          pour activer la supervision cross-tenant. La connexion applicative
          (RLS) n’est jamais utilisée pour ces agrégats.
        </p>
      ) : (
        <>
          <dl className="grid gap-3 sm:grid-cols-5">
            {[
              ["Espaces", situation.totals.tenants],
              ["Logements", situation.totals.logements],
              ["Réservations", situation.totals.reservations],
              ["Comptes actifs", situation.totals.utilisateurs],
              ["Audits 24 h", situation.totals.audits24h],
            ].map(([libelle, valeur]) => (
              <div
                className="rounded-2xl border border-bordure bg-surface p-4"
                key={String(libelle)}
              >
                <dt className="text-xs uppercase tracking-wide text-encre-faine">
                  {libelle}
                </dt>
                <dd className="text-2xl font-semibold tabular-nums">
                  {valeur}
                </dd>
              </div>
            ))}
          </dl>

          <div className="overflow-x-auto rounded-2xl border border-bordure bg-surface">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-bordure text-xs uppercase tracking-wide text-encre-faine">
                <tr>
                  <th className="p-4">Espace</th>
                  <th className="p-4">Statut</th>
                  <th className="p-4 text-right">Logements</th>
                  <th className="p-4 text-right">Réservations</th>
                  <th className="p-4 text-right">Comptes</th>
                  <th className="p-4 text-right">Audits 24 h</th>
                  <th className="p-4">Journal</th>
                </tr>
              </thead>
              <tbody>
                {situation.lignes.map((ligne) => (
                  <tr className="border-b border-bordure last:border-0" key={ligne.tenantId}>
                    <td className="p-4">
                      <span className="font-medium">{ligne.nom}</span>
                      <br />
                      <span className="text-xs text-encre-faine">
                        {ligne.slug}
                      </span>
                    </td>
                    <td className="p-4">{ligne.statut}</td>
                    <td className="p-4 text-right tabular-nums">
                      {ligne.logements}
                    </td>
                    <td className="p-4 text-right tabular-nums">
                      {ligne.reservations}
                    </td>
                    <td className="p-4 text-right tabular-nums">
                      {ligne.utilisateurs}
                    </td>
                    <td className="p-4 text-right tabular-nums">
                      {ligne.audits24h}
                    </td>
                    <td className="p-4">
                      <Link
                        className="underline"
                        href={`/journal?tenant=${ligne.tenantId}`}
                      >
                        Consulter
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <p className="text-xs text-encre-faine">
        Les données restent isolées par RLS pour l’application ; cette vue
        n’ouvre aucun droit d’écriture et n’expose aucun secret.
      </p>
    </main>
  );
}
