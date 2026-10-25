import Link from "next/link";
import { connection } from "next/server";
import { aujourdHuiIso } from "@/application/use-cases/inventaire";
import {
  compterParType,
  LIBELLES_TYPE_ENTRETIEN,
  TYPES_ENTRETIEN,
  totalEntretiens,
} from "@/domain/entretien";
import { DrizzleEntretiensRepository } from "@/infrastructure/db/repositories/entretiens-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { formaterEuros } from "@/lib/format";
import { requireRole, tenantIdDeSession } from "@/lib/session";
import { enregistrerEntretienAction } from "./actions";

export const instant = false;

export default async function PageEntretien({
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
  const entretiens = logement
    ? await new DrizzleEntretiensRepository().listerParLogement(
        tenantId,
        logement.id,
      )
    : [];

  if (!logement) {
    return (
      <main className="mx-auto max-w-3xl space-y-6 px-6 py-12">
        <h1 className="text-3xl font-semibold tracking-tight">
          Carnet d’entretien
        </h1>
        <p className="rounded-2xl border border-dashed border-bordure p-6 text-encre-douce">
          Créez d’abord un logement pour tenir son carnet d’entretien.
        </p>
        <Link className="text-sm underline" href="/hote/logements">
          Créer un logement
        </Link>
      </main>
    );
  }

  const total = totalEntretiens(entretiens);
  const comptes = compterParType(entretiens);

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-6 py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-widest text-encre-faine">
            Espace hôte · Exploitation
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Carnet d’entretien
          </h1>
          <p className="text-encre-douce">
            Interventions, prestataires et coûts réels par logement.
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
              href={`/hote/entretien?logement=${l.id}`}
            >
              {l.nom}
            </Link>
          ))}
        </nav>
      ) : null}

      {params.ok ? (
        <p
          className="rounded-xl border border-accent bg-accent-douce p-3 text-sm text-accent"
          role="status"
        >
          Entretien enregistré.
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

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-bordure bg-surface p-5 shadow-sm">
          <p className="text-sm text-encre-faine">Interventions</p>
          <p className="mt-1 text-3xl font-semibold">{entretiens.length}</p>
        </div>
        <div className="rounded-2xl border border-bordure bg-surface p-5 shadow-sm">
          <p className="text-sm text-encre-faine">Coût cumulé</p>
          <p className="mt-1 text-3xl font-semibold">{formaterEuros(total)}</p>
        </div>
        <div className="rounded-2xl border border-bordure bg-surface p-5 shadow-sm">
          <p className="text-sm text-encre-faine">Réparations</p>
          <p className="mt-1 text-3xl font-semibold">{comptes.reparation}</p>
        </div>
        <div className="rounded-2xl border border-bordure bg-surface p-5 shadow-sm">
          <p className="text-sm text-encre-faine">Contrôles</p>
          <p className="mt-1 text-3xl font-semibold">{comptes.controle}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-bordure bg-surface p-6 shadow-sm">
        <h2 className="text-lg font-semibold">
          Nouvelle intervention — {logement.nom}
        </h2>
        <form
          action={enregistrerEntretienAction}
          className="mt-4 space-y-3"
        >
          <input type="hidden" name="logementId" value={logement.id} />
          <input
            type="hidden"
            name="ref"
            value={`ent-${crypto.randomUUID()}`}
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block space-y-1 text-sm font-medium">
              <span>Type</span>
              <select
                className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
                defaultValue="entretien"
                name="type"
              >
                {TYPES_ENTRETIEN.map((type) => (
                  <option key={type} value={type}>
                    {LIBELLES_TYPE_ENTRETIEN[type]}
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
              <span>Prestataire</span>
              <input
                className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
                name="prestataire"
                placeholder="Optionnel"
              />
            </label>
            <label className="block space-y-1 text-sm font-medium">
              <span>Coût (€)</span>
              <input
                className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
                inputMode="decimal"
                name="cout"
                placeholder="0,00"
              />
            </label>
          </div>
          <label className="block space-y-1 text-sm font-medium">
            <span>Titre</span>
            <input
              className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
              name="titre"
              placeholder="Remplacement du mitigeur"
              required
            />
          </label>
          <label className="block space-y-1 text-sm font-medium">
            <span>Description</span>
            <textarea
              className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
              name="description"
              rows={2}
            />
          </label>
          <button
            className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-fond"
            type="submit"
          >
            Enregistrer l’intervention
          </button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Historique</h2>
        {entretiens.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-bordure p-6 text-encre-douce">
            Aucune intervention enregistrée pour ce logement.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-bordure bg-surface">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-bordure bg-surface-2 text-xs uppercase tracking-wide text-encre-faine">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Intervention</th>
                  <th className="p-3">Prestataire</th>
                  <th className="p-3">Coût</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bordure">
                {entretiens.map((entretien) => (
                  <tr key={entretien.id}>
                    <td className="p-3">{entretien.date}</td>
                    <td className="p-3">
                      {LIBELLES_TYPE_ENTRETIEN[entretien.type]}
                    </td>
                    <td className="p-3">
                      <p className="font-medium">{entretien.titre}</p>
                      {entretien.description ? (
                        <p className="mt-1 whitespace-pre-line text-xs text-encre-douce">
                          {entretien.description}
                        </p>
                      ) : null}
                    </td>
                    <td className="p-3">{entretien.prestataire ?? "—"}</td>
                    <td className="p-3">
                      {formaterEuros(entretien.coutCentimes)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <nav className="flex flex-wrap gap-4 text-sm">
        <Link
          className="underline"
          href={`/hote/etats-des-lieux?logement=${logement.id}`}
        >
          États des lieux
        </Link>
        <Link
          className="underline"
          href={`/hote/inventaire?logement=${logement.id}`}
        >
          Inventaire
        </Link>
        <Link className="underline" href="/hote">
          Tableau de bord
        </Link>
      </nav>
    </main>
  );
}
