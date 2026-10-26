import Link from "next/link";
import { connection } from "next/server";
import {
  RECHERCHE_MAX,
  RECHERCHE_MIN,
  RechercherRefs,
  requeteRechercheValide,
} from "@/application/use-cases/recherche";
import type { CategorieRecherche } from "@/application/ports/recherche-repository";
import { DrizzleRechercheRepository } from "@/infrastructure/db/repositories/recherche-repository";
import { requireRole, tenantIdDeSession } from "@/lib/session";

export const instant = false;

const LIBELLES: Record<CategorieRecherche, string> = {
  logement: "Logements",
  reservation: "Réservations",
  facture: "Factures",
  paiement: "Paiements",
  mission: "Missions",
  menage: "Ménages",
  "etat-des-lieux": "États des lieux",
  ticket: "Support",
  sinistre: "Sinistres",
  "objet-trouve": "Objets trouvés",
  "commande-extra": "Extras",
};

const ORDRE: CategorieRecherche[] = [
  "logement",
  "reservation",
  "facture",
  "paiement",
  "mission",
  "menage",
  "etat-des-lieux",
  "ticket",
  "sinistre",
  "objet-trouve",
  "commande-extra",
];

export default async function PageRecherche({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await connection();

  const session = await requireRole(["admin", "hote", "comptable", "operateur"]);
  const tenantId = tenantIdDeSession(session);
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const resultats = q
    ? await new RechercherRefs(new DrizzleRechercheRepository()).executer(
        tenantId,
        q,
      )
    : [];
  const groupes = ORDRE.map((categorie) => ({
    categorie,
    items: resultats.filter((item) => item.categorie === categorie),
  })).filter((groupe) => groupe.items.length > 0);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12">
      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-widest text-encre-faine">
          Pilotage
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Recherche globale
        </h1>
        <p className="text-encre-douce">
          Référence de séjour, facture, paiement, mission, ménage, état des
          lieux, ticket, sinistre ou objet trouvé. Recherche limitée à votre
          espace.
        </p>
      </header>

      <form className="flex flex-wrap items-end gap-3" method="get">
        <label className="block flex-1 space-y-1 text-sm">
          <span className="font-medium">Référence ou nom</span>
          <input
            className="w-full rounded-lg border border-bordure p-3"
            defaultValue={q}
            maxLength={RECHERCHE_MAX}
            minLength={RECHERCHE_MIN}
            name="q"
            placeholder="RESA-2026-001, FAC-2026-0042, MEN-…"
            required
            type="search"
          />
        </label>
        <button
          className="rounded-full bg-encre px-6 py-3 text-sm font-semibold text-fond"
          type="submit"
        >
          Rechercher
        </button>
      </form>

      {q && !requeteRechercheValide(q) ? (
        <p className="rounded-xl border border-alerte bg-alerte-douce p-4 text-sm text-alerte">
          Saisissez au moins {RECHERCHE_MIN} caractères.
        </p>
      ) : null}

      {q && requeteRechercheValide(q) ? (
        <p className="text-sm text-encre-douce">
          {resultats.length} résultat(s) pour « {q} ».
        </p>
      ) : null}

      {q && requeteRechercheValide(q) && resultats.length === 0 ? (
        <p className="rounded-2xl border border-bordure bg-surface p-6 text-sm text-encre-douce">
          Aucun résultat. Vérifiez la référence ou essayez un nom de client.
        </p>
      ) : null}

      {groupes.map((groupe) => (
        <section
          className="rounded-2xl border border-bordure bg-surface p-6 shadow-sm"
          key={groupe.categorie}
        >
          <h2 className="text-lg font-semibold">
            {LIBELLES[groupe.categorie]}
          </h2>
          <ul className="mt-3 divide-y divide-bordure" role="list">
            {groupe.items.map((item) => (
              <li className="py-3" key={`${item.categorie}-${item.id}`}>
                <Link className="font-medium underline" href={item.href}>
                  {item.ref}
                </Link>{" "}
                <span className="text-sm text-encre-douce">
                  {item.titre}
                  {item.detail ? ` · ${item.detail}` : ""}
                  {item.date ? ` · ${item.date}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <div className="flex flex-wrap gap-4 text-sm">
        <Link className="underline" href="/hote">
          ← Pilotage
        </Link>
        <Link className="underline" href="/hote/audit">
          Journal d’audit
        </Link>
      </div>
    </main>
  );
}
