import Link from "next/link";
import { connection } from "next/server";
import {
  CRITERES_QUESTIONNAIRE,
  LIBELLES_CRITERE,
  moyenneGlobale,
  moyenneQuestionnaire,
  moyennesParCritere,
} from "@/domain/questionnaire";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleQuestionnairesRepository } from "@/infrastructure/db/repositories/questionnaires-repository";
import { requireRole, tenantIdDeSession } from "@/lib/session";

export const instant = false;

function dateCourte(date: Date): string {
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default async function PageQuestionnaires({
  searchParams,
}: {
  searchParams: Promise<{ logement?: string }>;
}) {
  await connection();
  const session = await requireRole(["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const params = await searchParams;

  const logements = await new DrizzleLogementRepository().listerParTenant(
    tenantId,
  );
  const logement =
    logements.find((l) => l.id === params.logement) ?? logements[0];
  const questionnaires = logement
    ? await new DrizzleQuestionnairesRepository().listerParLogement(
        tenantId,
        logement.id,
      )
    : [];

  if (!logement) {
    return (
      <main className="mx-auto max-w-3xl space-y-6 px-6 py-12">
        <h1 className="text-3xl font-semibold tracking-tight">
          Questionnaires de séjour
        </h1>
        <p className="rounded-2xl border border-dashed border-bordure p-6 text-encre-douce">
          Créez d’abord un logement pour suivre les retours voyageurs.
        </p>
        <Link className="text-sm underline" href="/hote/logements">
          Créer un logement
        </Link>
      </main>
    );
  }

  const globale = moyenneGlobale(questionnaires);
  const parCritere = moyennesParCritere(questionnaires);

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-6 py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-widest text-encre-faine">
            Espace hôte · Relation voyageur
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Questionnaires de séjour
          </h1>
          <p className="text-encre-douce">
            Satisfaction détaillée par critère, après le départ.
          </p>
        </div>
        <Link className="text-sm underline" href="/hote">
          Retour au tableau de bord
        </Link>
      </header>

      {logements.length > 1 ? (
        <nav className="flex flex-wrap gap-2" aria-label="Choisir un logement">
          {logements.map((l) => (
            <Link
              key={l.id}
              className={`rounded-full border px-4 py-2 text-sm ${
                l.id === logement.id
                  ? "border-accent bg-accent-douce font-semibold text-accent"
                  : "border-bordure bg-surface"
              }`}
              href={`/hote/questionnaires?logement=${l.id}`}
            >
              {l.nom}
            </Link>
          ))}
        </nav>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-bordure bg-surface p-5 shadow-sm">
          <p className="text-sm text-encre-faine">Réponses</p>
          <p className="mt-1 text-3xl font-semibold">{questionnaires.length}</p>
        </div>
        <div className="rounded-2xl border border-bordure bg-surface p-5 shadow-sm">
          <p className="text-sm text-encre-faine">Moyenne globale</p>
          <p className="mt-1 text-3xl font-semibold">
            {globale === null ? "—" : `${globale.toFixed(1)} / 5`}
          </p>
        </div>
        <div className="rounded-2xl border border-bordure bg-surface p-5 shadow-sm">
          <p className="text-sm text-encre-faine">Dernière réponse</p>
          <p className="mt-1 text-xl font-semibold">
            {questionnaires[0]
              ? dateCourte(questionnaires[0].createdAt)
              : "—"}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-bordure bg-surface p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Moyennes par critère</h2>
        <dl className="mt-4 grid gap-3 sm:grid-cols-5">
          {CRITERES_QUESTIONNAIRE.map((critere) => (
            <div
              className="rounded-xl border border-bordure p-4 text-sm"
              key={critere}
            >
              <dt className="text-encre-faine">{LIBELLES_CRITERE[critere]}</dt>
              <dd className="mt-1 text-2xl font-semibold">
                {parCritere[critere] === null
                  ? "—"
                  : parCritere[critere]?.toFixed(1)}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Réponses</h2>
        {questionnaires.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-bordure p-6 text-encre-douce">
            Aucun questionnaire pour ce logement. Envoyez le lien voyageur
            après le séjour.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-bordure bg-surface">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="border-b border-bordure bg-surface-2 text-xs uppercase tracking-wide text-encre-faine">
                <tr>
                  <th className="p-3">Date</th>
                  {CRITERES_QUESTIONNAIRE.map((critere) => (
                    <th className="p-3" key={critere}>
                      {LIBELLES_CRITERE[critere]}
                    </th>
                  ))}
                  <th className="p-3">Moyenne</th>
                  <th className="p-3">Commentaire</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bordure">
                {questionnaires.map((questionnaire) => (
                  <tr key={questionnaire.id}>
                    <td className="p-3">
                      {dateCourte(questionnaire.createdAt)}
                    </td>
                    {CRITERES_QUESTIONNAIRE.map((critere) => (
                      <td className="p-3" key={critere}>
                        {questionnaire.notes[critere]}
                      </td>
                    ))}
                    <td className="p-3 font-medium">
                      {moyenneQuestionnaire(questionnaire).toFixed(1)}
                    </td>
                    <td className="p-3">
                      {questionnaire.commentaire ? (
                        <p className="max-w-xs whitespace-pre-line text-encre-douce">
                          {questionnaire.commentaire}
                        </p>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <nav className="flex flex-wrap gap-4 text-sm">
        <Link className="underline" href={`/hote/avis?logement=${logement.id}`}>
          Avis publics
        </Link>
        <Link className="underline" href="/hote">
          Tableau de bord
        </Link>
      </nav>
    </main>
  );
}
