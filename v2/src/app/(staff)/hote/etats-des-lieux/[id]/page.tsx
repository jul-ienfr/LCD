import Link from "next/link";
import { connection } from "next/server";
import {
  analyserEtatDesLieux,
  type TypeEtatDesLieux,
} from "@/domain/etat-des-lieux";
import { LIBELLES_ETAT } from "@/domain/inventaire";
import { DrizzleEtatsDesLieuxRepository } from "@/infrastructure/db/repositories/etats-des-lieux-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { formaterEuros } from "@/lib/format";
import { requireRole, tenantIdDeSession } from "@/lib/session";

export const instant = false;

const LIBELLES_TYPE: Record<TypeEtatDesLieux, string> = {
  entree: "Entrée",
  sortie: "Sortie",
};

export default async function PageEtatDesLieux({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const session = await requireRole(["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const { id } = await params;

  const etat = await new DrizzleEtatsDesLieuxRepository().trouverParId(
    tenantId,
    id,
  );
  if (!etat) {
    return (
      <main className="mx-auto max-w-3xl space-y-6 px-6 py-12">
        <h1 className="text-3xl font-semibold tracking-tight">
          État des lieux introuvable
        </h1>
        <Link className="text-sm underline" href="/hote/etats-des-lieux">
          Retour à la liste
        </Link>
      </main>
    );
  }

  const logement = await new DrizzleLogementRepository().trouverParId(
    tenantId,
    etat.logementId,
  );
  const analyse = analyserEtatDesLieux(etat.lignes);

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-6 py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-widest text-encre-faine">
            État des lieux · {LIBELLES_TYPE[etat.type]}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            {logement?.nom ?? "Logement"}
          </h1>
          <p className="text-encre-douce">
            {etat.date} · <span className="font-mono text-sm">{etat.ref}</span>
            {etat.reservationId ? " · rattaché à un séjour" : ""}
          </p>
        </div>
        <Link className="text-sm underline" href="/hote/etats-des-lieux">
          Retour à la liste
        </Link>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-bordure bg-surface p-5 shadow-sm">
          <p className="text-sm text-encre-faine">Biens constatés</p>
          <p className="mt-1 text-3xl font-semibold">{etat.lignes.length}</p>
        </div>
        <div className="rounded-2xl border border-bordure bg-surface p-5 shadow-sm">
          <p className="text-sm text-encre-faine">Manquants / dégradés</p>
          <p className="mt-1 text-3xl font-semibold">
            {analyse.manquants.length}{" "}
            <span className="text-base font-normal text-encre-faine">
              / {analyse.degrades.length}
            </span>
          </p>
        </div>
        <div className="rounded-2xl border border-bordure bg-surface p-5 shadow-sm">
          <p className="text-sm text-encre-faine">Coût de remplacement</p>
          <p className="mt-1 text-3xl font-semibold">
            {formaterEuros(analyse.coutRemplacementCentimes)}
          </p>
        </div>
      </section>

      {etat.notes ? (
        <p className="rounded-2xl border border-bordure bg-surface-2 p-5 text-sm whitespace-pre-line text-encre-douce">
          {etat.notes}
        </p>
      ) : null}

      <section className="overflow-x-auto rounded-2xl border border-bordure bg-surface">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-bordure bg-surface-2 text-xs uppercase tracking-wide text-encre-faine">
            <tr>
              <th className="p-3">Bien</th>
              <th className="p-3">Référence</th>
              <th className="p-3">Constaté</th>
              <th className="p-3">Écart</th>
              <th className="p-3">Commentaire</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-bordure">
            {etat.lignes.map((ligne) => {
              const degrade =
                !ligne.manquant &&
                ligne.etatConstate !== null &&
                ligne.etatConstate < ligne.etatReference;
              return (
                <tr
                  className={ligne.manquant ? "bg-danger-douce/40" : undefined}
                  key={`${ligne.qr}-${ligne.libelle}`}
                >
                  <td className="p-3">
                    <p className="font-medium">{ligne.libelle}</p>
                    <p className="font-mono text-xs text-encre-faine">
                      {ligne.qr}
                    </p>
                  </td>
                  <td className="p-3">
                    {ligne.etatReference}/5 ·{" "}
                    {LIBELLES_ETAT[ligne.etatReference]}
                  </td>
                  <td className="p-3">
                    {ligne.manquant ? (
                      <span className="font-semibold text-danger">
                        Manquant
                      </span>
                    ) : (
                      <>
                        {ligne.etatConstate}/5 ·{" "}
                        {ligne.etatConstate !== null
                          ? LIBELLES_ETAT[ligne.etatConstate]
                          : "—"}
                      </>
                    )}
                  </td>
                  <td className="p-3">
                    {ligne.manquant
                      ? formaterEuros(ligne.prixReferenceCentimes ?? 0)
                      : degrade
                        ? "Dégradé"
                        : "—"}
                  </td>
                  <td className="p-3 text-encre-douce">
                    {ligne.commentaire || "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <nav className="flex flex-wrap gap-4 text-sm">
        <Link className="underline" href="/hote/etats-des-lieux">
          Tous les états des lieux
        </Link>
        <Link className="underline" href="/hote">
          Tableau de bord
        </Link>
      </nav>
    </main>
  );
}
