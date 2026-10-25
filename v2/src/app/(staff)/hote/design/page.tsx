import Link from "next/link";
import { connection } from "next/server";
import { LireDesignSite } from "@/application/use-cases/design-site";
import { DrizzleParametresSiteRepository } from "@/infrastructure/db/repositories/parametres-site-repository";
import { requireRole } from "@/lib/session";
import { DESIGNS, designParId } from "@/lib/themes";
import { choisirDesignAction } from "./actions";

export const instant = false;

export default async function PageDesign({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  await connection();
  await requireRole(["admin"]);
  const params = await searchParams;
  const design = await new LireDesignSite(
    new DrizzleParametresSiteRepository(),
  ).executer();
  const ok = params.ok ? designParId(params.ok) : undefined;
  const erreur =
    params.erreur === "inattendu"
      ? "Enregistrement impossible. Réessayez."
      : params.erreur;

  return (
    <main className="mx-auto max-w-3xl space-y-8 px-6 py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-widest text-encre-faine">
            Espace hôte · Administration
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Design du site
          </h1>
          <p className="text-encre-douce">
            Change l&apos;apparence de tout le site en quelques secondes, sans
            rebuild ni redémarrage. Chaque thème est vérifié pour le contraste
            WCAG 2.2 AA.
          </p>
        </div>
        <Link className="text-sm underline" href="/hote">
          ← Tableau de bord
        </Link>
      </header>

      <section className="rounded-2xl border border-bordure bg-surface p-6 shadow-sm">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold">Thème actif</h2>
          <span className="rounded-full bg-accent-douce px-3 py-1 text-xs font-semibold text-accent">
            {design.nom}
          </span>
        </div>

        {ok ? (
          <p
            className="mt-4 rounded-xl border border-accent bg-accent-douce p-3 text-sm text-accent"
            role="status"
          >
            Design appliqué : {ok.nom}.
          </p>
        ) : null}
        {erreur ? (
          <p
            className="mt-4 rounded-xl border border-danger bg-danger-douce p-3 text-sm text-danger"
            role="alert"
          >
            {erreur}
          </p>
        ) : null}

        <form action={choisirDesignAction} className="mt-5">
          <fieldset className="min-w-0">
            <legend className="sr-only">Choisir un design</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {DESIGNS.map((d) => (
                <label
                  key={d.id}
                  className="flex cursor-pointer items-center gap-3 rounded-2xl border border-bordure bg-surface p-3 has-[:checked]:border-accent has-[:checked]:ring-2 has-[:checked]:ring-accent"
                >
                  <input
                    type="radio"
                    name="design"
                    value={d.id}
                    defaultChecked={d.id === design.id}
                    className="h-4 w-4 accent-[var(--accent)]"
                  />
                  <span className="flex flex-none gap-1" aria-hidden>
                    {[
                      d.clair.accent,
                      d.clair.fond,
                      d.clair.surface,
                      d.sombre.fond,
                      d.sombre.accent,
                    ].map((couleur, index) => (
                      <span
                        key={index}
                        className="h-6 w-4 rounded-sm border border-bordure"
                        style={{ background: couleur }}
                      />
                    ))}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{d.nom}</span>
                    <span className="block text-xs text-encre-faine">
                      {d.description}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-fond"
            >
              Appliquer ce design
            </button>
            <p className="text-xs text-encre-faine">
              Réservé à l&apos;administrateur.
            </p>
          </div>
        </form>
      </section>

      <nav className="flex flex-wrap gap-4 text-sm">
        <Link className="underline" href="/hote/utilisateurs">
          Utilisateurs
        </Link>
        <Link className="underline" href="/hote/audit">
          Journal d&apos;audit
        </Link>
        <Link className="underline" href="/hote">
          Tableau de bord
        </Link>
      </nav>
    </main>
  );
}
