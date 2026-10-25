import Link from "next/link";
import { connection } from "next/server";
import {
  CalculerCourses,
  ListerConsommables,
} from "@/application/use-cases/stocks";
import { DrizzleConsommablesRepository } from "@/infrastructure/db/repositories/consommables-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { statutConsommable } from "@/domain/stocks";
import { requireRole, tenantIdDeSession } from "@/lib/session";
import {
  consommerRotationAction,
  enregistrerConsommableAction,
  reassortirAction,
} from "./actions";

export const instant = false;

const LIBELLES_STATUT = {
  rupture: "Rupture",
  bas: "Stock bas",
  ok: "OK",
} as const;

const CLASSES_STATUT = {
  rupture: "bg-danger-douce text-danger",
  bas: "bg-alerte-douce text-alerte",
  ok: "bg-accent-douce text-accent",
} as const;

export default async function PageStocks({
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
  const repo = new DrizzleConsommablesRepository();
  const items = logement
    ? await new ListerConsommables(repo).executer(tenantId, logement.id)
    : [];
  const courses = logement
    ? await new CalculerCourses(repo).executer(tenantId, logement.id)
    : { ruptures: [], bas: [], totalArticles: 0 };

  const messageOk =
    params.ok === "enregistre"
      ? "Consommable enregistré."
      : params.ok === "consommer"
        ? "Rotation consommée : stocks décrémentés."
        : params.ok === "reassort"
          ? "Réassort enregistré : stocks remis à la cible."
          : null;
  const messageErreur =
    params.erreur === "inattendu"
      ? "Erreur inattendue. Réessayez."
      : params.erreur;

  if (!logement) {
    return (
      <main className="mx-auto max-w-3xl space-y-6 px-6 py-12">
        <h1 className="text-3xl font-semibold tracking-tight">Stocks</h1>
        <p className="rounded-2xl border border-dashed border-bordure p-6 text-encre-douce">
          Créez d’abord un logement pour suivre ses consommables.
        </p>
        <Link className="text-sm underline" href="/hote/logements">
          Créer un logement
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-6 py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-widest text-encre-faine">
            Espace hôte · Exploitation
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Consommables & courses
          </h1>
          <p className="text-encre-douce">
            Seuils par logement, décrément à chaque rotation, liste de courses
            automatique.
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
              href={`/hote/stocks?logement=${l.id}`}
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
      {messageErreur ? (
        <p
          className="rounded-xl border border-danger bg-danger-douce p-3 text-sm text-danger"
          role="alert"
        >
          {messageErreur}
        </p>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-bordure bg-surface p-5 shadow-sm">
          <p className="text-sm text-encre-faine">Références</p>
          <p className="mt-1 text-3xl font-semibold">{items.length}</p>
        </div>
        <div className="rounded-2xl border border-bordure bg-surface p-5 shadow-sm">
          <p className="text-sm text-encre-faine">Ruptures</p>
          <p className="mt-1 text-3xl font-semibold text-danger">
            {courses.ruptures.length}
          </p>
        </div>
        <div className="rounded-2xl border border-bordure bg-surface p-5 shadow-sm">
          <p className="text-sm text-encre-faine">Articles à acheter</p>
          <p className="mt-1 text-3xl font-semibold">
            {courses.totalArticles}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-bordure bg-surface p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Rotation de ménage</h2>
            <p className="mt-1 text-sm text-encre-douce">
              Décrémente chaque consommable de sa consommation par rotation
              (bornée à zéro).
            </p>
          </div>
          <form action={consommerRotationAction}>
            <input type="hidden" name="logementId" value={logement.id} />
            <input type="hidden" name="ref" value={crypto.randomUUID()} />
            <button
              className="rounded-full bg-encre px-5 py-3 text-sm font-semibold text-fond"
              type="submit"
            >
              Consommer la rotation
            </button>
          </form>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Consommables de {logement.nom}</h2>
        {items.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-bordure p-6 text-encre-douce">
            Aucun consommable suivi. Ajoutez le socle de rotation ci-dessous.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-bordure bg-surface">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-bordure bg-surface-2 text-xs uppercase tracking-wide text-encre-faine">
                <tr>
                  <th className="p-3">Consommable</th>
                  <th className="p-3">Stock</th>
                  <th className="p-3">Seuil</th>
                  <th className="p-3">Cible</th>
                  <th className="p-3">Conso/rotation</th>
                  <th className="p-3">Statut</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bordure">
                {items.map((item) => {
                  const statut = statutConsommable(item);
                  return (
                    <tr key={item.id}>
                      <td className="p-3">
                        <p className="font-medium">{item.label}</p>
                        <p className="font-mono text-xs text-encre-faine">
                          {item.code}
                        </p>
                      </td>
                      <td className="p-3">
                        {item.stock} {item.unite}
                      </td>
                      <td className="p-3">{item.seuil}</td>
                      <td className="p-3">{item.cible}</td>
                      <td className="p-3">{item.consoRotation}</td>
                      <td className="p-3">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${CLASSES_STATUT[statut]}`}
                        >
                          {LIBELLES_STATUT[statut]}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-2">
                          <form action={consommerRotationAction}>
                            <input
                              type="hidden"
                              name="logementId"
                              value={logement.id}
                            />
                            <input type="hidden" name="code" value={item.code} />
                            <input
                              type="hidden"
                              name="ref"
                              value={crypto.randomUUID()}
                            />
                            <button
                              className="rounded-full border border-bordure px-3 py-2 text-xs font-medium"
                              type="submit"
                            >
                              Consommer
                            </button>
                          </form>
                          <form action={reassortirAction}>
                            <input
                              type="hidden"
                              name="logementId"
                              value={logement.id}
                            />
                            <input type="hidden" name="code" value={item.code} />
                            <input
                              type="hidden"
                              name="ref"
                              value={crypto.randomUUID()}
                            />
                            <button
                              className="rounded-full border border-bordure px-3 py-2 text-xs font-medium"
                              type="submit"
                            >
                              Réassort
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-bordure bg-surface p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Liste de courses</h2>
          {courses.ruptures.length === 0 && courses.bas.length === 0 ? (
            <p className="mt-3 text-sm text-encre-douce">
              Aucun achat nécessaire : tous les stocks sont au-dessus du seuil.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              {courses.ruptures.length > 0 ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-danger">
                    Ruptures
                  </p>
                  <ul className="mt-2 space-y-1 text-sm">
                    {courses.ruptures.map(({ consommable, quantite }) => (
                      <li key={consommable.id}>
                        {quantite} × {consommable.label}{" "}
                        <span className="text-encre-faine">
                          ({consommable.unite})
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {courses.bas.length > 0 ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-alerte">
                    Stocks bas
                  </p>
                  <ul className="mt-2 space-y-1 text-sm">
                    {courses.bas.map(({ consommable, quantite }) => (
                      <li key={consommable.id}>
                        {quantite} × {consommable.label}{" "}
                        <span className="text-encre-faine">
                          ({consommable.unite})
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-bordure bg-surface p-6 shadow-sm">
          <h2 className="text-lg font-semibold">
            Ajouter ou mettre à jour un consommable
          </h2>
          <p className="mt-1 text-sm text-encre-douce">
            Un code existant met à jour la fiche (le stock saisi remplace le
            stock actuel).
          </p>
          <form action={enregistrerConsommableAction} className="mt-4 space-y-3">
            <input type="hidden" name="logementId" value={logement.id} />
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1 text-sm font-medium">
                <span>Code</span>
                <input
                  className="w-full rounded-xl border border-bordure bg-surface p-3 font-mono text-sm"
                  name="code"
                  placeholder="papier-wc"
                  required
                />
              </label>
              <label className="block space-y-1 text-sm font-medium">
                <span>Libellé</span>
                <input
                  className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
                  name="label"
                  placeholder="Papier toilette"
                  required
                />
              </label>
              <label className="block space-y-1 text-sm font-medium">
                <span>Stock actuel</span>
                <input
                  className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
                  defaultValue={0}
                  min={0}
                  name="stock"
                  type="number"
                  required
                />
              </label>
              <label className="block space-y-1 text-sm font-medium">
                <span>Unité</span>
                <input
                  className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
                  defaultValue="unité"
                  name="unite"
                />
              </label>
              <label className="block space-y-1 text-sm font-medium">
                <span>Seuil d’alerte</span>
                <input
                  className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
                  defaultValue={1}
                  min={0}
                  name="seuil"
                  type="number"
                  required
                />
              </label>
              <label className="block space-y-1 text-sm font-medium">
                <span>Cible de réassort</span>
                <input
                  className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
                  defaultValue={6}
                  min={0}
                  name="cible"
                  type="number"
                  required
                />
              </label>
              <label className="block space-y-1 text-sm font-medium sm:col-span-2">
                <span>Consommation par rotation</span>
                <input
                  className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
                  defaultValue={1}
                  min={0}
                  name="consoRotation"
                  type="number"
                  required
                />
              </label>
            </div>
            <button
              className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-fond"
              type="submit"
            >
              Enregistrer
            </button>
          </form>
        </div>
      </section>

      <nav className="flex flex-wrap gap-4 text-sm">
        <Link className="underline" href="/hote/missions">
          Missions
        </Link>
        <Link className="underline" href="/hote/extras">
          Extras
        </Link>
        <Link className="underline" href="/hote">
          Tableau de bord
        </Link>
      </nav>
    </main>
  );
}
