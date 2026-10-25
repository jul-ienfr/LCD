import Link from "next/link";
import { connection } from "next/server";
import {
  LIBELLES_STATUT_SINISTRE,
  LIBELLES_TYPE_SINISTRE,
  montantAttendu,
  resumeSinistres,
  statutSuivant,
  TYPES_SINISTRE,
} from "@/domain/sinistre";
import { aujourdHuiIso } from "@/domain/objet-trouve";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleSinistresRepository } from "@/infrastructure/db/repositories/sinistres-repository";
import { formaterEuros } from "@/lib/format";
import { requireRole, tenantIdDeSession } from "@/lib/session";
import { avancerSinistreAction, declarerSinistreAction } from "./actions";

export const instant = false;

const CLASSES_STATUT: Record<string, string> = {
  declare: "bg-alerte-douce text-alerte",
  expertise: "bg-surface-2 text-encre-douce",
  indemnise: "bg-accent-douce text-accent",
  clos: "bg-surface-2 text-encre-faine",
};

export default async function PageSinistres({
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
  const sinistres = logement
    ? await new DrizzleSinistresRepository().listerParLogement(
        tenantId,
        logement.id,
      )
    : [];
  const resume = resumeSinistres(sinistres);

  if (!logement) {
    return (
      <main className="mx-auto max-w-3xl space-y-6 px-6 py-12">
        <h1 className="text-3xl font-semibold tracking-tight">
          Dossiers sinistres
        </h1>
        <p className="rounded-2xl border border-dashed border-bordure p-6 text-encre-douce">
          Créez d’abord un logement pour déclarer un sinistre.
        </p>
        <Link className="text-sm underline" href="/hote/logements">
          Créer un logement
        </Link>
      </main>
    );
  }

  const messageOk =
    params.ok === "declare"
      ? "Sinistre déclaré."
      : params.ok === "statut"
        ? "Statut mis à jour."
        : null;

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-6 py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-widest text-encre-faine">
            Espace hôte · Assurance
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Dossiers sinistres
          </h1>
          <p className="text-encre-douce">
            Déclaration, expertise, indemnisation et clôture par logement.
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
              href={`/hote/sinistres?logement=${l.id}`}
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
          <p className="text-sm text-encre-faine">Dossiers ouverts</p>
          <p className="mt-1 text-3xl font-semibold">{resume.ouverts}</p>
        </div>
        <div className="rounded-2xl border border-bordure bg-surface p-5 shadow-sm">
          <p className="text-sm text-encre-faine">Montant estimé</p>
          <p className="mt-1 text-2xl font-semibold">
            {formaterEuros(resume.totalEstimeCentimes)}
          </p>
        </div>
        <div className="rounded-2xl border border-bordure bg-surface p-5 shadow-sm">
          <p className="text-sm text-encre-faine">Déjà indemnisé</p>
          <p className="mt-1 text-2xl font-semibold">
            {formaterEuros(resume.totalIndemniseCentimes)}
          </p>
        </div>
        <div className="rounded-2xl border border-bordure bg-surface p-5 shadow-sm">
          <p className="text-sm text-encre-faine">Reste attendu</p>
          <p className="mt-1 text-2xl font-semibold">
            {formaterEuros(resume.resteAttenduCentimes)}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-bordure bg-surface p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Déclarer un sinistre</h2>
        <form action={declarerSinistreAction} className="mt-4 space-y-3">
          <input type="hidden" name="logementId" value={logement.id} />
          <input
            type="hidden"
            name="ref"
            value={`sinistre-${crypto.randomUUID()}`}
          />
          <div className="grid gap-3 sm:grid-cols-4">
            <label className="block space-y-1 text-sm font-medium">
              <span>Type</span>
              <select
                className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
                defaultValue="degat_eaux"
                name="type"
              >
                {TYPES_SINISTRE.map((type) => (
                  <option key={type} value={type}>
                    {LIBELLES_TYPE_SINISTRE[type]}
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
              <span>Montant estimé (€)</span>
              <input
                className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
                min={0}
                name="montantEstime"
                placeholder="1200"
                required
                step="0.01"
                type="number"
              />
            </label>
            <label className="block space-y-1 text-sm font-medium">
              <span>Franchise (€)</span>
              <input
                className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
                min={0}
                name="franchise"
                placeholder="150"
                step="0.01"
                type="number"
              />
            </label>
          </div>
          <label className="block space-y-1 text-sm font-medium">
            <span>Description</span>
            <textarea
              className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
              name="description"
              placeholder="Fuite sous l’évier, constatée au départ du voyageur le 12/10."
              required
              rows={3}
            />
          </label>
          <label className="block space-y-1 text-sm font-medium">
            <span>Numéro de déclaration assurance</span>
            <input
              className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
              name="numeroDeclaration"
              placeholder="SIN-2026-0042"
            />
          </label>
          <button
            className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-fond"
            type="submit"
          >
            Déclarer le sinistre
          </button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          Dossiers de {logement.nom} ({sinistres.length})
        </h2>
        {sinistres.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-bordure p-6 text-encre-douce">
            Aucun sinistre déclaré pour ce logement.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-bordure bg-surface">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead className="border-b border-bordure bg-surface-2 text-xs uppercase tracking-wide text-encre-faine">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Statut</th>
                  <th className="p-3">Estimé</th>
                  <th className="p-3">Franchise</th>
                  <th className="p-3">Attendu</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">Étape</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bordure">
                {sinistres.map((sinistre) => {
                  const suivant = statutSuivant(sinistre.statut);
                  return (
                    <tr key={sinistre.id}>
                      <td className="p-3">{sinistre.date}</td>
                      <td className="p-3">
                        {LIBELLES_TYPE_SINISTRE[sinistre.type]}
                      </td>
                      <td className="p-3">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-semibold ${CLASSES_STATUT[sinistre.statut]}`}
                        >
                          {LIBELLES_STATUT_SINISTRE[sinistre.statut]}
                        </span>
                      </td>
                      <td className="p-3">
                        {formaterEuros(sinistre.montantEstimeCentimes)}
                      </td>
                      <td className="p-3">
                        {formaterEuros(sinistre.franchiseCentimes)}
                      </td>
                      <td className="p-3 font-medium">
                        {formaterEuros(montantAttendu(sinistre))}
                      </td>
                      <td className="p-3">
                        <p className="max-w-xs whitespace-pre-line text-encre-douce">
                          {sinistre.description}
                        </p>
                        {sinistre.numeroDeclaration ? (
                          <p className="mt-1 text-xs text-encre-faine">
                            Déclaration {sinistre.numeroDeclaration}
                          </p>
                        ) : null}
                      </td>
                      <td className="p-3">
                        {suivant ? (
                          <form
                            action={avancerSinistreAction}
                            className="space-y-2"
                          >
                            <input
                              type="hidden"
                              name="logementId"
                              value={logement.id}
                            />
                            <input type="hidden" name="id" value={sinistre.id} />
                            {suivant === "indemnise" ? (
                              <label className="block space-y-1 text-xs font-medium">
                                <span>Indemnisé (€)</span>
                                <input
                                  className="w-28 rounded-lg border border-bordure bg-surface p-2 text-sm"
                                  min={0}
                                  name="montantIndemnise"
                                  placeholder="900"
                                  required
                                  step="0.01"
                                  type="number"
                                />
                              </label>
                            ) : null}
                            <button
                              className="rounded-full border border-bordure px-3 py-1 text-xs font-medium"
                              type="submit"
                            >
                              {suivant === "indemnise"
                                ? "Indemniser"
                                : suivant === "clos"
                                  ? "Clôturer"
                                  : "Passer en expertise"}
                            </button>
                          </form>
                        ) : (
                          <span className="text-xs text-encre-faine">
                            Dossier clos
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <nav className="flex flex-wrap gap-4 text-sm">
        <Link className="underline" href="/hote/audit">
          Journal d’audit
        </Link>
        <Link className="underline" href="/hote/logements">
          Logements
        </Link>
        <Link className="underline" href="/hote">
          Tableau de bord
        </Link>
      </nav>
    </main>
  );
}
