import Link from "next/link";
import { connection } from "next/server";
import {
  aujourdHuiIso,
  dateIsoValide,
} from "@/domain/objet-trouve";
import {
  dansLesDouzeMois,
  depassement,
  lettreTranquillite,
  LIBELLES_TYPE_PREUVE,
  resumeCarnet,
  SEUIL_DB_JOUR,
  SEUIL_DB_NUIT,
  seuilDb,
  TYPES_PREUVE,
} from "@/domain/preuve-tranquillite";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzlePreuvesTranquilliteRepository } from "@/infrastructure/db/repositories/preuves-tranquillite-repository";
import { requireRole, tenantIdDeSession } from "@/lib/session";
import { enregistrerPreuveAction, supprimerPreuveAction } from "./actions";

export const instant = false;

const CLASSES_TYPE: Record<string, string> = {
  db: "bg-alerte-douce text-alerte",
  attestation: "bg-surface-2 text-encre-douce",
  intervention: "bg-accent-douce text-accent",
};

export default async function PageTranquillite({
  searchParams,
}: {
  searchParams: Promise<{ logement?: string; ok?: string; erreur?: string }>;
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
  const preuves = logement
    ? await new DrizzlePreuvesTranquilliteRepository().listerParLogement(
        tenantId,
        logement.id,
      )
    : [];
  const recentes = preuves.filter((p) => dansLesDouzeMois(p.date));
  const resume = resumeCarnet(preuves);
  const lettre = logement
    ? lettreTranquillite({
        logement: logement.nom,
        adresse: logement.adresse,
        preuves,
      })
    : "";

  if (!logement) {
    return (
      <main className="mx-auto max-w-3xl space-y-6 px-6 py-12">
        <h1 className="text-3xl font-semibold tracking-tight">
          Carnet de tranquillité
        </h1>
        <p className="rounded-2xl border border-dashed border-bordure p-6 text-encre-douce">
          Créez d’abord un logement pour tenir son carnet de preuves.
        </p>
        <Link className="text-sm underline" href="/hote/logements">
          Créer un logement
        </Link>
      </main>
    );
  }

  const messageOk =
    params.ok === "preuve"
      ? "Preuve enregistrée."
      : params.ok === "supprime"
        ? "Preuve supprimée."
        : null;

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-6 py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-widest text-encre-faine">
            Espace hôte · Conformité
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Carnet de tranquillité
          </h1>
          <p className="text-encre-douce">
            Mesures de bruit et interventions, sur douze mois glissants.
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
              href={`/hote/tranquillite?logement=${l.id}`}
            >
              {l.nom}
            </Link>
          ))}
        </nav>
      ) : null}

      {messageOk ? (
        <p
          className="rounded-xl border border-accent bg-accent-douce p-3 text-sm text-accent"
          role="status"
        >
          {messageOk}
        </p>
      ) : null}
      {params.erreur ? (
        <p
          className="rounded-xl border border-danger bg-danger-douce p-3 text-sm text-danger"
          role="alert"
        >
          {params.erreur === "inattendu"
            ? "Erreur inattendue. Réessayez."
            : params.erreur}
        </p>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-bordure bg-surface p-5 shadow-sm">
          <p className="text-sm text-encre-faine">Événements (12 mois)</p>
          <p className="mt-1 text-3xl font-semibold">{resume.total}</p>
        </div>
        <div className="rounded-2xl border border-bordure bg-surface p-5 shadow-sm">
          <p className="text-sm text-encre-faine">Mesures de bruit</p>
          <p className="mt-1 text-3xl font-semibold">{resume.mesures}</p>
        </div>
        <div className="rounded-2xl border border-bordure bg-surface p-5 shadow-sm">
          <p className="text-sm text-encre-faine">Dépassements</p>
          <p className="mt-1 text-3xl font-semibold">{resume.depassements}</p>
        </div>
        <div className="rounded-2xl border border-bordure bg-surface p-5 shadow-sm">
          <p className="text-sm text-encre-faine">Maximum relevé</p>
          <p className="mt-1 text-3xl font-semibold">
            {resume.maxDb === null ? "—" : `${resume.maxDb} dB`}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-bordure bg-surface p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Ajouter une preuve</h2>
        <form action={enregistrerPreuveAction} className="mt-4 space-y-3">
          <input type="hidden" name="logementId" value={logement.id} />
          <input
            type="hidden"
            name="ref"
            value={`preuve-${crypto.randomUUID()}`}
          />
          <div className="grid gap-3 sm:grid-cols-4">
            <label className="block space-y-1 text-sm font-medium">
              <span>Type</span>
              <select
                className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
                defaultValue="db"
                name="type"
              >
                {TYPES_PREUVE.map((type) => (
                  <option key={type} value={type}>
                    {LIBELLES_TYPE_PREUVE[type]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1 text-sm font-medium">
              <span>Date</span>
              <input
                className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
                defaultValue={aujourdHuiIso()}
                name="date"
                required
                type="date"
              />
            </label>
            <label className="block space-y-1 text-sm font-medium">
              <span>Moment (bruit)</span>
              <select
                className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
                defaultValue="nuit"
                name="moment"
              >
                <option value="jour">Jour</option>
                <option value="nuit">Nuit</option>
              </select>
            </label>
            <label className="block space-y-1 text-sm font-medium">
              <span>Mesure (dB, bruit)</span>
              <input
                className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
                max={120}
                min={1}
                name="valeurDb"
                placeholder="62"
                type="number"
              />
            </label>
          </div>
          <label className="block space-y-1 text-sm font-medium">
            <span>Note / contexte</span>
            <textarea
              className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
              name="note"
              placeholder="Fête voisine jusqu’à 2 h, constat à 1 h 15."
              rows={3}
            />
          </label>
          <p className="text-xs text-encre-douce">
            Seuils de référence : {SEUIL_DB_JOUR} dB le jour, {SEUIL_DB_NUIT}{" "}
            dB la nuit. Les attestations et interventions exigent une note.
          </p>
          <button
            className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-fond"
            type="submit"
          >
            Enregistrer la preuve
          </button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          Carnet de {logement.nom} ({recentes.length} sur 12 mois)
        </h2>
        {preuves.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-bordure p-6 text-encre-douce">
            Aucune preuve enregistrée. Les événements apparaîtront ici et
            alimenteront la lettre au syndic.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-bordure bg-surface">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-bordure bg-surface-2 text-xs uppercase tracking-wide text-encre-faine">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Mesure</th>
                  <th className="p-3">Note / contexte</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bordure">
                {preuves.map((preuve) => (
                  <tr key={preuve.id}>
                    <td className="p-3">
                      {dateIsoValide(preuve.date) ? preuve.date : "—"}
                    </td>
                    <td className="p-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${CLASSES_TYPE[preuve.type]}`}
                      >
                        {LIBELLES_TYPE_PREUVE[preuve.type]}
                      </span>
                    </td>
                    <td className="p-3">
                      {preuve.type === "db" ? (
                        <span
                          className={
                            depassement(preuve)
                              ? "font-semibold text-danger"
                              : ""
                          }
                        >
                          {preuve.valeurDb} dB ({preuve.moment} · seuil{" "}
                          {seuilDb(preuve.moment ?? "jour")} dB)
                          {depassement(preuve) ? " — dépassement" : ""}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="p-3">
                      {preuve.note ? (
                        <p className="max-w-md whitespace-pre-line text-encre-douce">
                          {preuve.note}
                        </p>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="p-3">
                      <form action={supprimerPreuveAction}>
                        <input
                          type="hidden"
                          name="logementId"
                          value={logement.id}
                        />
                        <input type="hidden" name="id" value={preuve.id} />
                        <button className="text-danger underline" type="submit">
                          Supprimer
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <details className="rounded-2xl border border-bordure bg-surface p-6 shadow-sm">
        <summary className="cursor-pointer text-lg font-semibold">
          Lettre au syndic (brouillon)
        </summary>
        <p className="mt-3 text-sm text-encre-douce">
          Texte généré à partir du carnet. Copiez-le dans votre messagerie
          tracée, puis signez.
        </p>
        <label className="mt-3 block space-y-1 text-sm font-medium">
          <span>Brouillon</span>
          <textarea
            className="h-80 w-full rounded-xl border border-bordure bg-surface-2 p-3 font-mono text-xs"
            readOnly
            value={lettre}
          />
        </label>
      </details>

      <nav className="flex flex-wrap gap-4 text-sm">
        <Link className="underline" href={`/hote/audit`}>
          Journal d’audit
        </Link>
        <Link className="underline" href="/hote">
          Tableau de bord
        </Link>
      </nav>
    </main>
  );
}
