import Link from "next/link";
import { connection } from "next/server";
import { formaterCommissionBp } from "@/domain/commission";
import { DrizzleLogementProprietaireRepository } from "@/infrastructure/db/repositories/logement-proprietaire-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleUserRepository } from "@/infrastructure/db/repositories/user-repository";
import { requireRole, tenantIdDeSession } from "@/lib/session";
import { FormulaireAssignation } from "./formulaire";
import { retirerProprietaireAction } from "./actions";

export const instant = false;

export default async function PageProprietaires() {
  await connection();

  const session = await requireRole(["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);

  const proprietaires = await new DrizzleUserRepository().listerParRole(
    tenantId,
    "proprietaire",
  );
  const logements = await new DrizzleLogementRepository().listerParTenant(
    tenantId,
  );
  const assignations =
    await new DrizzleLogementProprietaireRepository().listerAssignations(
      tenantId,
    );

  const parUser = new Map(proprietaires.map((p) => [p.id, p]));
  const parLogement = new Map(logements.map((l) => [l.id, l]));

  return (
    <main className="mx-auto max-w-4xl space-y-8 px-6 py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-widest text-stone-500">
            Espace hôte
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Propriétaires
          </h1>
          <p className="text-stone-600">
            Rattachement des propriétaires aux logements. Lecture seule côté
            propriétaire.
          </p>
        </div>
        <Link className="text-sm underline" href="/hote">
          Retour au tableau de bord
        </Link>
      </header>

      {proprietaires.length === 0 ? (
        <p className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          Aucun propriétaire actif. Lancez le seed ou créez un utilisateur de
          rôle <code>proprietaire</code>.
        </p>
      ) : (
        <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Rattacher un propriétaire</h2>
          <p className="mt-1 text-sm text-stone-600">
            Le propriétaire verra uniquement les logements rattachés.
          </p>
          <div className="mt-5">
            <FormulaireAssignation
              logements={logements.map((l) => ({
                id: l.id,
                nom: l.nom,
                code: l.code,
              }))}
              proprietaires={proprietaires.map((p) => ({
                id: p.id,
                name: p.name,
                email: p.email,
              }))}
            />
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          {assignations.length} rattachement
          {assignations.length > 1 ? "s" : ""}
        </h2>
        {assignations.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-stone-300 p-6 text-stone-600">
            Aucun logement rattaché à un propriétaire.
          </p>
        ) : (
          <ul className="divide-y divide-stone-200 rounded-2xl border border-stone-200 bg-white">
            {assignations.map((a) => (
              <li
                className="flex flex-wrap items-center justify-between gap-3 p-4"
                key={`${a.logementId}-${a.userId}`}
              >
                <div>
                  <p className="font-medium">
                    {parLogement.get(a.logementId)?.nom ?? a.logementId}
                  </p>
                  <p className="text-sm text-stone-600">
                    {parUser.get(a.userId)?.name ?? a.userId} ·{" "}
                    {parUser.get(a.userId)?.email ?? ""}
                  </p>
                  <p className="text-xs text-stone-500">
                    Commission {formaterCommissionBp(a.commissionBp)}
                  </p>
                </div>
                <form action={retirerProprietaireAction}>
                  <input name="logementId" type="hidden" value={a.logementId} />
                  <input name="userId" type="hidden" value={a.userId} />
                  <button
                    className="rounded-full border border-red-300 px-4 py-2 text-sm font-medium text-red-800"
                    type="submit"
                  >
                    Retirer
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <nav className="flex flex-wrap gap-4 text-sm">
        <Link className="underline" href="/proprio">
          Espace propriétaire
        </Link>
        <Link className="underline" href="/hote">
          Tableau de bord
        </Link>
      </nav>
    </main>
  );
}
