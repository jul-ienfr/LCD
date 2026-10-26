import Link from "next/link";
import { connection } from "next/server";
import { LireDesignSite } from "@/application/use-cases/design-site";
import { LireIdentiteSite } from "@/application/use-cases/identite-site";
import { DrizzleParametresSiteRepository } from "@/infrastructure/db/repositories/parametres-site-repository";
import { requireRole } from "@/lib/session";
import { DESIGNS, designParId } from "@/lib/themes";
import { choisirDesignAction, enregistrerIdentiteAction } from "./actions";

export const instant = false;

export default async function PageDesign({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; identite?: string; erreur?: string }>;
}) {
  await connection();
  await requireRole(["admin"]);
  const params = await searchParams;
  const repo = new DrizzleParametresSiteRepository();
  const design = await new LireDesignSite(repo).executer();
  const identite = await new LireIdentiteSite(repo).executer();
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
        {params.identite ? (
          <p
            className="mt-4 rounded-xl border border-accent bg-accent-douce p-3 text-sm text-accent"
            role="status"
          >
            Identité de marque enregistrée.
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

      <section className="rounded-2xl border border-bordure bg-surface p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Identité de marque</h2>
        <p className="mt-1 max-w-2xl text-sm text-encre-douce">
          Nom affiché, logo, couleur d’accent et contacts publics (vitrine,
          mentions légales, pied de page). La couleur doit rester lisible avec
          du texte clair et sombre ; à défaut, le thème actif s’applique.
        </p>
        {identite.logoUrl ? (
          <p className="mt-4 flex items-center gap-3 text-sm text-encre-douce">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt={`Logo ${identite.nom}`}
              className="h-10 w-auto rounded"
              src={identite.logoUrl}
            />
            Logo actuel
          </p>
        ) : null}
        <form action={enregistrerIdentiteAction} className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="font-medium">Nom de marque</span>
              <input
                className="w-full rounded-xl border border-bordure bg-fond px-3 py-2"
                defaultValue={identite.nom}
                maxLength={60}
                name="nom"
              />
              <span className="block text-xs text-encre-faine">
                Vide = nom par défaut de l’environnement.
              </span>
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium">Logo (URL ou chemin /…)</span>
              <input
                className="w-full rounded-xl border border-bordure bg-fond px-3 py-2"
                defaultValue={identite.logoUrl ?? ""}
                name="logoUrl"
                placeholder="/logo.svg ou https://…"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium">E-mail de contact</span>
              <input
                className="w-full rounded-xl border border-bordure bg-fond px-3 py-2"
                defaultValue={identite.emailContact ?? ""}
                name="emailContact"
                type="email"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium">Téléphone de contact</span>
              <input
                className="w-full rounded-xl border border-bordure bg-fond px-3 py-2"
                defaultValue={identite.telephoneContact ?? ""}
                name="telephoneContact"
                type="tel"
              />
            </label>
            <label className="space-y-1 text-sm sm:col-span-2">
              <span className="font-medium">Adresse de contact</span>
              <input
                className="w-full rounded-xl border border-bordure bg-fond px-3 py-2"
                defaultValue={identite.adresseContact ?? ""}
                maxLength={200}
                name="adresseContact"
              />
            </label>
            <div className="space-y-2 text-sm sm:col-span-2">
              <label className="flex items-center gap-3">
                <input
                  defaultChecked={Boolean(identite.accent)}
                  name="accentActif"
                  type="checkbox"
                />
                <span className="font-medium">
                  Utiliser une couleur d’accent personnalisée
                </span>
              </label>
              <input
                className="h-10 w-24 cursor-pointer rounded border border-bordure bg-fond"
                defaultValue={identite.accent ?? "#0e7c6b"}
                name="accent"
                type="color"
              />
            </div>
          </div>
          <button
            className="rounded-full bg-encre px-5 py-3 text-sm font-semibold text-fond"
            type="submit"
          >
            Enregistrer l’identité
          </button>
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
