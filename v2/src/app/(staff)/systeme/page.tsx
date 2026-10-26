import { connection } from "next/server";
import journal from "../../../../drizzle/meta/_journal.json";
import { NavSuperAdmin } from "@/components/nav-super-admin";
import { DrizzleSupervisionRepository } from "@/infrastructure/db/repositories/supervision-repository";
import { env } from "@/lib/env";
import { requireSuperAdmin } from "@/lib/session";
import { APP_VERSION } from "@/lib/version";

export const instant = false;

function duree(secondes: number): string {
  const jours = Math.floor(secondes / 86_400);
  const heures = Math.floor((secondes % 86_400) / 3_600);
  const minutes = Math.floor((secondes % 3_600) / 60);
  if (jours > 0) return `${jours} j ${heures} h`;
  if (heures > 0) return `${heures} h ${minutes} min`;
  return `${minutes} min`;
}

export default async function PageSysteme() {
  await connection();
  await requireSuperAdmin();
  const etat = await new DrizzleSupervisionRepository().etatSysteme();
  const attendues = journal.entries.length;
  const derniereAttendue = journal.entries[journal.entries.length - 1]?.tag;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-12">
      <NavSuperAdmin actif="/systeme" />

      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-widest text-encre-faine">
          Plateforme
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Système</h1>
        <p className="text-encre-douce">
          Versions, base, migrations et isolation RLS — lecture seule via la
          connexion owner.
        </p>
      </header>

      {!etat ? (
        <p className="rounded-2xl border border-alerte bg-alerte-douce p-6 text-sm text-alerte">
          <code>MIGRATION_DATABASE_URL</code> absent : diagnostic base
          indisponible. La page ne se rabat pas sur la connexion applicative.
        </p>
      ) : (
        <>
          <section className="rounded-2xl border border-bordure bg-surface p-6">
            <h2 className="text-lg font-semibold">Base de données</h2>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
              {[
                ["Version PostgreSQL", etat.versionBase],
                ["Connexion owner", etat.utilisateur],
                ["Superutilisateur PostgreSQL", etat.superutilisateur ? "oui" : "non"],
                ["Taille", etat.tailleBase],
                ["Tables publiques", `${etat.tables}`],
                ["Tables avec RLS", `${etat.tablesRls} / ${etat.tables}`],
              ].map(([libelle, valeur]) => (
                <div key={String(libelle)}>
                  <dt className="text-encre-faine">{libelle}</dt>
                  <dd className="font-medium">{valeur}</dd>
                </div>
              ))}
            </dl>
            {etat.tablesRls < etat.tables ? (
              <p className="mt-4 rounded-xl border border-alerte bg-alerte-douce p-3 text-sm text-alerte">
                {etat.tables - etat.tablesRls} table(s) publique(s) sans RLS :
                vérifier qu’elles sont globales (tenants, catalogue), pas
                métier.
              </p>
            ) : null}
          </section>

          <section className="rounded-2xl border border-bordure bg-surface p-6">
            <h2 className="text-lg font-semibold">Migrations</h2>
            <p className="mt-2 text-sm text-encre-douce">
              {etat.migrations} appliquée(s) sur {attendues} attendues
              {etat.derniereMigration
                ? ` · dernière le ${etat.derniereMigration}`
                : ""}
              {derniereAttendue ? ` · journal : ${derniereAttendue}` : ""}.
            </p>
            <p
              className={
                etat.migrations === attendues
                  ? "mt-2 text-sm font-medium text-accent"
                  : "mt-2 text-sm font-medium text-danger"
              }
            >
              {etat.migrations === attendues
                ? "Schéma à jour."
                : "Écart entre le journal Drizzle et la base : appliquer les migrations avant de servir."}
            </p>
          </section>

          <section className="rounded-2xl border border-bordure bg-surface p-6">
            <h2 className="text-lg font-semibold">Runtime</h2>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              {[
                ["Version applicative", APP_VERSION],
                ["Environnement", env.NODE_ENV],
                ["URL publique", env.APP_URL],
                ["Node.js", process.version],
                ["Plateforme", `${process.platform} ${process.arch}`],
                ["Uptime", duree(process.uptime())],
                ["Espaces", `${etat.tenants}`],
                ["2FA obligatoire", env.AUTH_2FA_REQUIRED ? "oui" : "non"],
              ].map(([libelle, valeur]) => (
                <div key={String(libelle)}>
                  <dt className="text-encre-faine">{libelle}</dt>
                  <dd className="font-medium">{valeur}</dd>
                </div>
              ))}
            </dl>
          </section>
        </>
      )}
    </main>
  );
}
