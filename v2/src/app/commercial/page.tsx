import Link from "next/link";
import { connection } from "next/server";
import type { StatutProspect } from "@/domain/prospect";
import { DrizzleOffreRepository } from "@/infrastructure/db/repositories/offre-repository";
import { DrizzleProspectRepository } from "@/infrastructure/db/repositories/prospect-repository";
import { requireRole, tenantIdDeSession } from "@/lib/session";
import { BoutonDeconnexion } from "@/components/bouton-deconnexion";
import { FormulaireProspect } from "./formulaire-prospect";

export const instant = false;

const COLONNES: { statut: StatutProspect; libelle: string }[] = [
  { statut: "nouveau", libelle: "Nouveau" },
  { statut: "qualifie", libelle: "Qualifié" },
  { statut: "visite", libelle: "Visite" },
  { statut: "offre", libelle: "Offre" },
  { statut: "gagne", libelle: "Gagné" },
  { statut: "perdu", libelle: "Perdu" },
];

export default async function PageCommercial() {
  await connection();

  const session = await requireRole(["commercial", "admin", "hote"]);
  const tenantId = tenantIdDeSession(session);

  const prospects = await new DrizzleProspectRepository().lister(tenantId);
  const offres = await new DrizzleOffreRepository().lister(tenantId);

  const gagnes = prospects.filter((p) => p.statut === "gagne").length;
  const enCours = prospects.filter(
    (p) => !["gagne", "perdu"].includes(p.statut),
  ).length;

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-6 py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-widest text-encre-faine">
            Espace commercial
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Pipeline commercial
          </h1>
          <p className="text-encre-douce">
            {prospects.length} prospect{prospects.length > 1 ? "s" : ""} ·{" "}
            {enCours} en cours · {gagnes} gagné{gagnes > 1 ? "s" : ""} ·{" "}
            {offres.length} offre{offres.length > 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link className="text-sm underline" href="/hote/securite">
            Sécurité / 2FA
          </Link>
          <BoutonDeconnexion />
          {session.user.role !== "commercial" ? (
            <Link className="text-sm underline" href="/hote">
              Espace hôte
            </Link>
          ) : null}
        </div>
      </header>

      <section className="rounded-2xl border border-bordure bg-surface p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Nouveau prospect</h2>
        <div className="mt-5">
          <FormulaireProspect />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {COLONNES.map((colonne) => {
          const items = prospects.filter((p) => p.statut === colonne.statut);
          return (
            <div
              className="rounded-2xl border border-bordure bg-surface p-4"
              key={colonne.statut}
            >
              <h2 className="flex items-center justify-between text-sm font-semibold uppercase tracking-wide text-encre-douce">
                <span>{colonne.libelle}</span>
                <span className="rounded-full bg-surface-2 px-2 py-1 text-xs">
                  {items.length}
                </span>
              </h2>
              <ul className="mt-3 space-y-2">
                {items.map((prospect) => (
                  <li key={prospect.id}>
                    <Link
                      className="block rounded-xl border border-bordure p-3 hover:bg-surface-2"
                      href={`/commercial/prospects/${prospect.id}`}
                    >
                      <p className="font-medium">{prospect.nom}</p>
                      <p className="text-xs text-encre-faine">
                        {prospect.source}
                        {prospect.email ? ` · ${prospect.email}` : ""}
                      </p>
                    </Link>
                  </li>
                ))}
                {items.length === 0 ? (
                  <li className="text-xs text-encre-faine">Aucun prospect.</li>
                ) : null}
              </ul>
            </div>
          );
        })}
      </section>

      <nav className="flex flex-wrap gap-4 text-sm">
        <Link className="underline" href="/support">
          Support
        </Link>
        <Link className="underline" href="/">
          Retour à l’accueil
        </Link>
      </nav>
    </main>
  );
}
