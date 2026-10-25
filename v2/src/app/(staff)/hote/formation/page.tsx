import Link from "next/link";
import { connection } from "next/server";
import {
  avancementFormation,
  avancementGlobal,
  MODULES_FORMATION,
} from "@/domain/formation";
import { DrizzleFormationsRepository } from "@/infrastructure/db/repositories/formations-repository";
import { requireRole, tenantIdDeSession } from "@/lib/session";
import { enregistrerFormationAction } from "./actions";

export const instant = false;

export default async function PageFormation({
  searchParams,
}: {
  searchParams: Promise<{
    ok?: string;
    module?: string;
    p?: string;
    erreur?: string;
  }>;
}) {
  await connection();
  const session = await requireRole(["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const params = await searchParams;

  const progressions = await new DrizzleFormationsRepository()
    .listerParUtilisateur(tenantId, session.user.id);
  const globale = avancementGlobal(progressions);

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-6 py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-widest text-encre-faine">
            Espace hôte · Équipe
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Formation de l’équipe
          </h1>
          <p className="text-encre-douce">
            Parcours guidés pour accueillir, entretenir et facturer sans
            erreur.
          </p>
        </div>
        <Link className="text-sm underline" href="/hote">
          Retour au tableau de bord
        </Link>
      </header>

      <section className="rounded-2xl border border-bordure bg-surface p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Ma progression</h2>
          <p className="text-sm font-medium" aria-live="polite">
            {globale.faites} / {globale.total} étapes · {globale.pourcentage} %
          </p>
        </div>
        <div
          aria-hidden="true"
          className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface-2"
        >
          <div
            className="h-full rounded-full bg-accent"
            style={{ width: `${globale.pourcentage}%` }}
          />
        </div>
        {globale.total > 0 && globale.faites === globale.total ? (
          <p className="mt-3 text-sm font-medium text-accent">
            Parcours complet. Bravo !
          </p>
        ) : (
          <p className="mt-3 text-sm text-encre-douce">
            Cochez les étapes réalisées, module par module. Votre progression
            est enregistrée à chaque envoi.
          </p>
        )}
      </section>

      {params.ok ? (
        <p
          className="rounded-xl border border-accent bg-accent-douce p-3 text-sm text-accent"
          role="status"
        >
          Progression enregistrée{params.module ? ` (${params.module})` : ""}
          {params.p ? ` · ${params.p} %` : ""}.
        </p>
      ) : null}
      {params.erreur ? (
        <p
          className="rounded-xl border border-danger bg-danger-douce p-3 text-sm text-danger"
          role="alert"
        >
          {params.erreur === "inattendu"
            ? "Erreur inattendue. Réessayez."
            : params.erreur}
        </p>
      ) : null}

      <div className="grid gap-6">
        {MODULES_FORMATION.map((module) => {
          const progression = progressions.find(
            (p) => p.moduleCode === module.code,
          );
          const avancement = avancementFormation(
            module,
            progression?.etapesFaites ?? [],
          );
          return (
            <section
              className="rounded-2xl border border-bordure bg-surface p-6 shadow-sm"
              key={module.code}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{module.titre}</h2>
                  <p className="mt-1 max-w-2xl text-sm text-encre-douce">
                    {module.description}
                  </p>
                </div>
                {avancement.termine ? (
                  <span className="rounded-full bg-accent-douce px-3 py-1 text-xs font-semibold text-accent">
                    Terminé
                  </span>
                ) : (
                  <span className="rounded-full bg-surface-2 px-3 py-1 text-xs font-medium text-encre-faine">
                    {avancement.faites} / {avancement.total}
                  </span>
                )}
              </div>

              <div
                aria-hidden="true"
                className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-surface-2"
              >
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${avancement.pourcentage}%` }}
                />
              </div>

              <form action={enregistrerFormationAction} className="mt-4">
                <input type="hidden" name="moduleCode" value={module.code} />
                <ul className="grid gap-2 sm:grid-cols-2">
                  {module.etapes.map((etape) => (
                    <li key={etape.code}>
                      <label className="flex cursor-pointer gap-3 rounded-xl border border-bordure p-3 text-sm">
                        <input
                          className="mt-1"
                          defaultChecked={progression?.etapesFaites.includes(
                            etape.code,
                          )}
                          name={`etape-${etape.code}`}
                          type="checkbox"
                        />
                        <span>
                          <span className="font-medium">{etape.titre}</span>
                          <span className="mt-0.5 block text-encre-douce">
                            {etape.detail}
                          </span>
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-encre-faine">
                    {avancement.pourcentage} % du module
                  </p>
                  <button
                    className="rounded-full border border-bordure px-4 py-2 text-sm font-medium"
                    type="submit"
                  >
                    Enregistrer ma progression
                  </button>
                </div>
              </form>
            </section>
          );
        })}
      </div>

      <nav className="flex flex-wrap gap-4 text-sm">
        <Link className="underline" href="/hote/phrases">
          Phrases types
        </Link>
        <Link className="underline" href="/hote">
          Tableau de bord
        </Link>
      </nav>
    </main>
  );
}
