import Link from "next/link";
import { connection } from "next/server";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { requireRole, tenantIdDeSession } from "@/lib/session";
import { FormulaireLogement } from "./formulaire";

// Route staff bloquante : auth + DB avant rendu. Pas de prerender statique.
export const instant = false;

export default async function PageLogements() {
  await connection();

  const session = await requireRole(["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const logements = await new DrizzleLogementRepository().listerParTenant(
    tenantId,
  );

  return (
    <main className="mx-auto max-w-4xl space-y-8 px-6 py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-widest text-encre-faine">
            Espace hôte
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Logements</h1>
          <p className="text-encre-douce">
            Tenant : <span className="font-medium">{tenantId}</span>
          </p>
        </div>
        <Link className="text-sm underline" href="/hote">
          Retour au tableau de bord
        </Link>
      </header>

      <section className="rounded-2xl border border-bordure bg-surface p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Ajouter un logement</h2>
        <p className="mt-1 text-sm text-encre-douce">
          Le code est stable et unique par tenant. Toute création est auditée.
        </p>
        <div className="mt-5">
          <FormulaireLogement />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          {logements.length} logement{logements.length > 1 ? "s" : ""}
        </h2>

        {logements.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-bordure p-6 text-encre-douce">
            Aucun logement pour ce tenant. Créez le premier ci-dessus.
          </p>
        ) : (
          <ul className="divide-y divide-bordure rounded-2xl border border-bordure bg-surface">
            {logements.map((logement) => (
              <li
                className="flex flex-wrap items-center justify-between gap-3 p-4"
                key={logement.id}
              >
                <div>
                  <p className="font-medium">{logement.nom}</p>
                  <p className="text-sm text-encre-faine">
                    {logement.code}
                    {logement.adresse ? ` — ${logement.adresse}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    className="text-sm underline"
                    href={`/hote/logements/${logement.id}`}
                  >
                    Guide
                  </Link>
                  <Link
                    className="text-sm underline"
                    href={`/hote/logements/${logement.id}#calendrier`}
                  >
                    Calendrier
                  </Link>
                  <span className="rounded-full bg-surface-2 px-3 py-1 text-xs font-medium text-encre-douce">
                    {logement.statut}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
