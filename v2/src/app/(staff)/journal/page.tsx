import { connection } from "next/server";
import { NavSuperAdmin } from "@/components/nav-super-admin";
import { DrizzleSupervisionRepository } from "@/infrastructure/db/repositories/supervision-repository";
import { requireSuperAdmin } from "@/lib/session";

export const instant = false;

export default async function PageJournal({
  searchParams,
}: {
  searchParams: Promise<{ tenant?: string; action?: string }>;
}) {
  await connection();
  await requireSuperAdmin();
  const params = await searchParams;
  const repo = new DrizzleSupervisionRepository();
  const tenants = await repo.listerTenants();
  const entrees = await repo.journal({
    tenantId: params.tenant || undefined,
    action: params.action?.trim() || undefined,
    limite: 200,
  });

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-12">
      <NavSuperAdmin actif="/journal" />

      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-widest text-encre-faine">
          Plateforme
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Journal global
        </h1>
        <p className="text-encre-douce">
          200 dernières actions, tous espaces confondus. Lecture seule sur la
          connexion owner ; les payloads restent repliés et jamais interprétés
          comme du HTML.
        </p>
      </header>

      {!entrees || !tenants ? (
        <p className="rounded-2xl border border-alerte bg-alerte-douce p-6 text-sm text-alerte">
          Connexion owner absente : journal cross-tenant indisponible.
        </p>
      ) : (
        <>
          <form
            className="flex flex-wrap items-end gap-3 rounded-2xl border border-bordure bg-surface p-4"
            method="get"
          >
            <label className="block space-y-1 text-sm">
              <span className="font-medium">Espace</span>
              <select
                className="rounded-lg border border-bordure p-2"
                defaultValue={params.tenant ?? ""}
                name="tenant"
              >
                <option value="">Tous</option>
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.nom} ({tenant.slug})
                  </option>
                ))}
              </select>
            </label>
            <label className="block flex-1 space-y-1 text-sm">
              <span className="font-medium">Action contient</span>
              <input
                className="w-full rounded-lg border border-bordure p-2"
                defaultValue={params.action ?? ""}
                maxLength={80}
                name="action"
                placeholder="reservation, facture, auth…"
              />
            </label>
            <button
              className="rounded-full bg-encre px-5 py-2 text-sm font-semibold text-fond"
              type="submit"
            >
              Filtrer
            </button>
          </form>

          <p className="text-sm text-encre-douce">
            {entrees.length} entrée(s) affichée(s).
          </p>

          <div className="overflow-x-auto rounded-2xl border border-bordure bg-surface">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-bordure text-xs uppercase tracking-wide text-encre-faine">
                <tr>
                  <th className="p-3">Date (UTC)</th>
                  <th className="p-3">Espace</th>
                  <th className="p-3">Auteur</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Cible / réf.</th>
                  <th className="p-3">Payload</th>
                </tr>
              </thead>
              <tbody>
                {entrees.map((entree) => (
                  <tr
                    className="border-b border-bordure align-top last:border-0"
                    key={entree.id}
                  >
                    <td className="p-3 whitespace-nowrap tabular-nums">
                      {entree.createdAt.toISOString().slice(0, 16).replace("T", " ")}
                    </td>
                    <td className="p-3">
                      {entree.tenantNom ?? "—"}
                      <br />
                      <span className="text-xs text-encre-faine">
                        {entree.tenantSlug ?? ""}
                      </span>
                    </td>
                    <td className="p-3">{entree.qui}</td>
                    <td className="p-3 font-mono text-xs">{entree.action}</td>
                    <td className="p-3 text-xs">
                      {entree.cible ?? "—"}
                      {entree.ref ? ` · ${entree.ref}` : ""}
                    </td>
                    <td className="p-3 text-xs">
                      {Object.keys(entree.payload).length === 0 ? (
                        "—"
                      ) : (
                        <details>
                          <summary className="cursor-pointer text-encre-douce">
                            Voir
                          </summary>
                          <pre className="mt-2 max-w-md overflow-x-auto whitespace-pre-wrap break-all rounded-lg bg-fond p-2">
                            {JSON.stringify(entree.payload, null, 2)}
                          </pre>
                        </details>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  );
}
