import Link from "next/link";
import { connection } from "next/server";
import { DrizzleTenantRepository } from "@/infrastructure/db/repositories/tenant-repository";
import { requireRole, tenantIdDeSession } from "@/lib/session";
import { FormulaireEntite } from "./formulaire";

export const instant = false;

export default async function PageEntite() {
  await connection();

  const session = await requireRole(["admin"]);
  const tenantId = tenantIdDeSession(session);
  const tenant = await new DrizzleTenantRepository().trouver(tenantId);
  if (!tenant) {
    return (
      <main className="mx-auto max-w-2xl space-y-4 px-6 py-12">
        <h1 className="text-2xl font-semibold">Entité introuvable</h1>
        <Link className="text-sm underline" href="/hote">
          Retour au tableau de bord
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl space-y-8 px-6 py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-widest text-encre-faine">
            Espace hôte
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Entité juridique
          </h1>
          <p className="text-encre-douce">
            Identité utilisée sur les factures et les exports comptables.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link className="text-sm underline" href="/hote/proprietaires">
            Propriétaires et mandats
          </Link>
          <Link className="text-sm underline" href="/hote">
            Retour au tableau de bord
          </Link>
        </div>
      </header>

      <section className="rounded-2xl border border-bordure bg-surface p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Identité de facturation</h2>
        <p className="mt-1 text-sm text-encre-douce">
          Une seule entité juridique par organisation en beta. Le multi-entités
          est un chantier post-beta.
        </p>
        <div className="mt-5">
          <FormulaireEntite tenant={tenant} />
        </div>
      </section>

      <section className="rounded-2xl border border-bordure bg-surface p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Résumé</h2>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-encre-faine">Nom</dt>
            <dd className="font-medium">{tenant.nom}</dd>
          </div>
          <div>
            <dt className="text-encre-faine">SIREN</dt>
            <dd className="font-mono">{tenant.siren ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-encre-faine">Adresse</dt>
            <dd className="whitespace-pre-line">
              {tenant.adresse ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-encre-faine">Mentions</dt>
            <dd className="whitespace-pre-line">
              {tenant.mentionsLegales ?? "—"}
            </dd>
          </div>
        </dl>
      </section>

      <Link className="text-sm underline" href="/hote">
        Tableau de bord
      </Link>
    </main>
  );
}
