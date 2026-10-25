import Link from "next/link";
import { connection } from "next/server";
import {
  LireTableauInventaire,
  aujourdHuiIso,
} from "@/application/use-cases/inventaire";
import { DrizzleBiensRepository } from "@/infrastructure/db/repositories/biens-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import {
  ETATS_BIEN,
  LIBELLES_ETAT,
  type EtatBien,
} from "@/domain/inventaire";
import { requireRole, tenantIdDeSession } from "@/lib/session";
import {
  changerEtatBienAction,
  enregistrerBienAction,
  utiliserBienAction,
} from "./actions";

export const instant = false;

function euros(centimes: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(centimes / 100);
}

const CLASSES_ETAT: Record<EtatBien, string> = {
  1: "bg-danger-douce text-danger",
  2: "bg-alerte-douce text-alerte",
  3: "bg-surface-2 text-encre-douce",
  4: "bg-accent-douce text-accent",
  5: "bg-accent-douce text-accent",
};

export default async function PageInventaire({
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
  const tableau = logement
    ? await new LireTableauInventaire(new DrizzleBiensRepository()).executer(
        tenantId,
        logement.id,
        aujourdHuiIso(),
      )
    : null;

  const messageOk =
    params.ok === "enregistre"
      ? "Bien enregistré."
      : params.ok === "utiliser"
        ? "Utilisation enregistrée."
        : params.ok === "etat"
          ? "État du bien mis à jour."
          : null;
  const messageErreur =
    params.erreur === "inattendu"
      ? "Erreur inattendue. Réessayez."
      : params.erreur;

  if (!logement || !tableau) {
    return (
      <main className="mx-auto max-w-3xl space-y-6 px-6 py-12">
        <h1 className="text-3xl font-semibold tracking-tight">Inventaire</h1>
        <p className="rounded-2xl border border-dashed border-bordure p-6 text-encre-douce">
          Créez d’abord un logement pour suivre son inventaire durable.
        </p>
        <Link className="text-sm underline" href="/hote/logements">
          Créer un logement
        </Link>
      </main>
    );
  }

  const { biens, alertes, stats } = tableau;

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-6 py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-widest text-encre-faine">
            Espace hôte · Exploitation
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Inventaire durable
          </h1>
          <p className="text-encre-douce">
            QR par bien, compteurs d’usage et de lavage, alertes d’usure,
            garantie et coût par séjour.
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
              href={`/hote/inventaire?logement=${l.id}`}
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

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-bordure bg-surface p-5 shadow-sm">
          <p className="text-sm text-encre-faine">Biens suivis</p>
          <p className="mt-1 text-3xl font-semibold">{stats.nbBiens}</p>
        </div>
        <div className="rounded-2xl border border-bordure bg-surface p-5 shadow-sm">
          <p className="text-sm text-encre-faine">Rotations cumulées</p>
          <p className="mt-1 text-3xl font-semibold">{stats.rotations}</p>
        </div>
        <div className="rounded-2xl border border-bordure bg-surface p-5 shadow-sm">
          <p className="text-sm text-encre-faine">Âge moyen</p>
          <p className="mt-1 text-3xl font-semibold">
            {stats.ageMoyenJours ?? "—"}
            {stats.ageMoyenJours !== null ? (
              <span className="text-base font-normal text-encre-douce"> j</span>
            ) : null}
          </p>
        </div>
        <div className="rounded-2xl border border-bordure bg-surface p-5 shadow-sm">
          <p className="text-sm text-encre-faine">Budget remplacement</p>
          <p className="mt-1 text-3xl font-semibold">
            {euros(stats.budgetPrevisionnelCentimes)}
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-bordure bg-surface p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-encre-faine">
            Dormants &gt; 90 jours
          </h2>
          {alertes.dormants.length === 0 ? (
            <p className="mt-2 text-sm text-encre-douce">Aucun.</p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm">
              {alertes.dormants.map(({ bien, inactiviteJours }) => (
                <li key={bien.id}>
                  {bien.label}{" "}
                  <span className="text-encre-faine">
                    ({inactiviteJours} j)
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-2xl border border-bordure bg-surface p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-encre-faine">
            À remplacer
          </h2>
          {alertes.remplacements.length === 0 ? (
            <p className="mt-2 text-sm text-encre-douce">Aucun.</p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm">
              {alertes.remplacements.map((bien) => (
                <li key={bien.id}>
                  {bien.label}{" "}
                  <span className="text-encre-faine">
                    (état {bien.etat}/5)
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-2xl border border-bordure bg-surface p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-encre-faine">
            Garanties &lt; 30 jours
          </h2>
          {alertes.garanties.length === 0 ? (
            <p className="mt-2 text-sm text-encre-douce">Aucune.</p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm">
              {alertes.garanties.map(({ bien, joursRestants }) => (
                <li key={bien.id}>
                  {bien.label}{" "}
                  <span className="text-encre-faine">
                    ({joursRestants} j)
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">
            Biens de {logement.nom}
          </h2>
          {stats.coutParSejour.length > 0 ? (
            <p className="text-sm text-encre-douce">
              Coût/séjour max :{" "}
              <strong>{euros(stats.coutParSejour[0]!.coutCentimes)}</strong>
            </p>
          ) : null}
        </div>

        {biens.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-bordure p-6 text-encre-douce">
            Aucun bien inventorié. Ajoutez le linge et l’équipement durable
            ci-dessous.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-bordure bg-surface">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-bordure bg-surface-2 text-xs uppercase tracking-wide text-encre-faine">
                <tr>
                  <th className="p-3">Bien</th>
                  <th className="p-3">État</th>
                  <th className="p-3">Usages</th>
                  <th className="p-3">Lavages</th>
                  <th className="p-3">Dernier usage</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bordure">
                {biens.map((bien) => (
                  <tr key={bien.id}>
                    <td className="p-3">
                      <p className="font-medium">{bien.label}</p>
                      <p className="text-xs text-encre-faine">
                        {bien.categorie} ·{" "}
                        <span className="font-mono">{bien.qr}</span>
                      </p>
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${CLASSES_ETAT[bien.etat]}`}
                      >
                        {bien.etat}/5 · {LIBELLES_ETAT[bien.etat]}
                      </span>
                    </td>
                    <td className="p-3">{bien.utilisationsNb}</td>
                    <td className="p-3">{bien.lavagesNb}</td>
                    <td className="p-3">
                      {bien.derniereUtilisation ?? "—"}
                    </td>
                    <td className="p-3">
                      <div className="space-y-2">
                        <form
                          action={utiliserBienAction}
                          className="flex flex-wrap gap-2"
                        >
                          <input type="hidden" name="logementId" value={logement.id} />
                          <input type="hidden" name="qr" value={bien.qr} />
                          <input
                            type="hidden"
                            name="ref"
                            value={crypto.randomUUID()}
                          />
                          <button
                            className="rounded-full border border-bordure px-3 py-2 text-xs font-medium"
                            name="laver"
                            type="submit"
                            value="0"
                          >
                            Utilisé
                          </button>
                          <button
                            className="rounded-full border border-bordure px-3 py-2 text-xs font-medium"
                            name="laver"
                            type="submit"
                            value="1"
                          >
                            Utilisé + lavé
                          </button>
                        </form>
                        <form
                          action={changerEtatBienAction}
                          className="flex flex-wrap items-center gap-2"
                        >
                          <input type="hidden" name="logementId" value={logement.id} />
                          <input type="hidden" name="qr" value={bien.qr} />
                          <input
                            type="hidden"
                            name="ref"
                            value={crypto.randomUUID()}
                          />
                          <select
                            aria-label={`Nouvel état de ${bien.label}`}
                            className="rounded-lg border border-bordure bg-surface p-2 text-xs"
                            defaultValue={bien.etat}
                            name="etat"
                          >
                            {ETATS_BIEN.map((etat) => (
                              <option key={etat} value={etat}>
                                {etat} · {LIBELLES_ETAT[etat]}
                              </option>
                            ))}
                          </select>
                          <input
                            aria-label={`Note d’état de ${bien.label}`}
                            className="min-w-0 flex-1 rounded-lg border border-bordure bg-surface p-2 text-xs"
                            name="note"
                            placeholder="Note (optionnel)"
                          />
                          <button
                            className="rounded-full border border-bordure px-3 py-2 text-xs font-medium"
                            type="submit"
                          >
                            État
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-bordure bg-surface p-6 shadow-sm">
        <h2 className="text-lg font-semibold">
          Ajouter ou mettre à jour un bien
        </h2>
        <p className="mt-1 text-sm text-encre-douce">
          Un QR existant met à jour la fiche sans toucher aux compteurs
          d’usage et de lavage.
        </p>
        <form action={enregistrerBienAction} className="mt-4 space-y-3">
          <input type="hidden" name="logementId" value={logement.id} />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block space-y-1 text-sm font-medium">
              <span>QR</span>
              <input
                className="w-full rounded-xl border border-bordure bg-surface p-3 font-mono text-sm"
                name="qr"
                placeholder="drap-160-01"
                required
              />
            </label>
            <label className="block space-y-1 text-sm font-medium">
              <span>Catégorie</span>
              <input
                className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
                name="categorie"
                placeholder="Linge"
                required
              />
            </label>
            <label className="block space-y-1 text-sm font-medium">
              <span>Libellé</span>
              <input
                className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
                name="label"
                placeholder="Drap 160 cm"
                required
              />
            </label>
            <label className="block space-y-1 text-sm font-medium">
              <span>Date d’achat</span>
              <input
                className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
                name="dateAchat"
                type="date"
              />
            </label>
            <label className="block space-y-1 text-sm font-medium">
              <span>Prix d’achat (€)</span>
              <input
                className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
                inputMode="decimal"
                name="prixAchat"
                placeholder="29,90"
              />
            </label>
            <label className="block space-y-1 text-sm font-medium">
              <span>Fin de garantie</span>
              <input
                className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
                name="garantieFin"
                type="date"
              />
            </label>
            <label className="block space-y-1 text-sm font-medium">
              <span>Fournisseur</span>
              <input
                className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
                name="fournisseur"
              />
            </label>
            <label className="block space-y-1 text-sm font-medium">
              <span>État initial</span>
              <select
                className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
                defaultValue={5}
                name="etat"
              >
                {ETATS_BIEN.map((etat) => (
                  <option key={etat} value={etat}>
                    {etat} · {LIBELLES_ETAT[etat]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1 text-sm font-medium">
              <span>Photo (URL)</span>
              <input
                className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
                name="photoUrl"
                type="url"
              />
            </label>
            <label className="block space-y-1 text-sm font-medium sm:col-span-2 lg:col-span-3">
              <span>Notes</span>
              <textarea
                className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
                name="notes"
                rows={2}
              />
            </label>
          </div>
          <button
            className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-fond"
            type="submit"
          >
            Enregistrer le bien
          </button>
        </form>
      </section>

      <nav className="flex flex-wrap gap-4 text-sm">
        <Link className="underline" href="/hote/stocks">
          Stocks
        </Link>
        <Link className="underline" href="/hote/missions">
          Missions
        </Link>
        <Link className="underline" href="/hote">
          Tableau de bord
        </Link>
      </nav>
    </main>
  );
}
