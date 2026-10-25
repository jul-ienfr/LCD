import Link from "next/link";
import { connection } from "next/server";
import { moyenneAvis } from "@/domain/avis";
import { DrizzleAvisRepository } from "@/infrastructure/db/repositories/avis-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { requireRole, tenantIdDeSession } from "@/lib/session";
import { modererAvisAction } from "./actions";

export const instant = false;

export default async function PageAvis({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  await connection();
  const session = await requireRole(["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const params = await searchParams;

  const avis = await new DrizzleAvisRepository().listerParTenant(tenantId);
  const logements = await new DrizzleLogementRepository().listerParTenant(
    tenantId,
  );
  const noms = new Map(logements.map((l) => [l.id, l.nom]));
  const publies = avis.filter((a) => a.statut === "publie");
  const moyenne = moyenneAvis(publies.map((a) => a.note));

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-6 py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-widest text-encre-faine">
            Espace hôte
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Avis voyageurs
          </h1>
          <p className="text-encre-douce">
            {avis.length} avis · {publies.length} publié
            {publies.length > 1 ? "s" : ""}
            {moyenne !== null ? ` · moyenne ${moyenne}/5` : ""}
          </p>
        </div>
        <Link className="text-sm underline" href="/hote">
          Retour au tableau de bord
        </Link>
      </header>

      {params.ok ? (
        <p className="rounded-xl border border-accent bg-accent-douce p-3 text-sm text-accent">
          Avis mis à jour.
        </p>
      ) : null}
      {params.erreur ? (
        <p className="rounded-xl border border-danger bg-danger-douce p-3 text-sm text-danger">
          Avis introuvable.
        </p>
      ) : null}

      {avis.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-bordure p-6 text-encre-douce">
          Aucun avis pour le moment. Les voyageurs peuvent en déposer depuis
          leur espace séjour.
        </p>
      ) : (
        <ul className="space-y-3">
          {avis.map((a) => (
            <li
              className="rounded-2xl border border-bordure bg-surface p-5 shadow-sm"
              key={a.id}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">
                    {a.nom} · {noms.get(a.logementId) ?? "Logement"}
                  </p>
                  <p className="text-sm">
                    {"★".repeat(a.note)}
                    <span className="text-encre-faine">
                      {"★".repeat(5 - a.note)}
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-encre-faine">
                    {a.createdAt.toISOString().slice(0, 10)} ·{" "}
                    {a.statut === "publie" ? "Publié" : "Masqué"}
                  </p>
                </div>
                <form action={modererAvisAction}>
                  <input name="id" type="hidden" value={a.id} />
                  <input
                    name="statut"
                    type="hidden"
                    value={a.statut === "publie" ? "masque" : "publie"}
                  />
                  <button
                    className="rounded-full border border-bordure px-4 py-2 text-sm"
                    type="submit"
                  >
                    {a.statut === "publie" ? "Masquer" : "Publier"}
                  </button>
                </form>
              </div>
              {a.commentaire ? (
                <p className="mt-3 whitespace-pre-line text-sm text-encre-douce">
                  {a.commentaire}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
