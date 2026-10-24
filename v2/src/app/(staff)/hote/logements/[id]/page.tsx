import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { requireRole, tenantIdDeSession } from "@/lib/session";
import { FormulaireGuide } from "./formulaire-guide";

export const instant = false;

export default async function PageGuideLogement({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();

  const session = await requireRole(["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const { id } = await params;

  const logement = await new DrizzleLogementRepository().trouverParId(
    tenantId,
    id,
  );
  if (!logement) notFound();

  return (
    <main className="mx-auto max-w-2xl space-y-8 px-6 py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-widest text-stone-500">
            Logement {logement.code}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Guide — {logement.nom}
          </h1>
          <p className="text-stone-600">
            Ces informations apparaissent dans l’espace voyageur signé.
          </p>
        </div>
        <Link className="text-sm underline" href="/hote/logements">
          ← Logements
        </Link>
      </header>

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <FormulaireGuide logement={logement} />
      </section>

      <Link className="text-sm underline" href="/hote">
        Retour au tableau de bord
      </Link>
    </main>
  );
}
