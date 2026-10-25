import Link from "next/link";
import { connection } from "next/server";
import { ListerLieuxTourisme } from "@/application/use-cases/tourisme";
import { DrizzleLieuxTourismeRepository } from "@/infrastructure/db/repositories/lieux-tourisme-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import {
  CATEGORIES_LIEU,
  LIBELLES_CATEGORIE,
} from "@/domain/tourisme";
import { requireRole, tenantIdDeSession } from "@/lib/session";
import {
  desactiverLieuAction,
  enregistrerLieuAction,
} from "./actions";

export const instant = false;

export default async function PageTourisme({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  await connection();
  const session = await requireRole(["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const params = await searchParams;

  const logements = await new DrizzleLogementRepository().listerParTenant(
    tenantId,
  );
  const logementId = logements[0]?.id ?? "";
  const lieux = logementId
    ? await new ListerLieuxTourisme(
        new DrizzleLieuxTourismeRepository(),
      ).executer(tenantId, logementId, { inclureInactifs: true })
    : [];

  const messageOk =
    params.ok === "enregistre"
      ? "Lieu enregistré."
      : params.ok === "desactive"
        ? "Lieu désactivé."
        : null;
  const messageErreur =
    params.erreur === "inattendu"
      ? "Erreur inattendue. Réessayez."
      : params.erreur;

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-6 py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-widest text-encre-faine">
            Espace hôte · Voyageur
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Office de tourisme
          </h1>
          <p className="text-encre-douce">
            Adresses et activités affichées dans l’espace voyageur, filtrables
            par catégorie. Aucun ajout automatique.
          </p>
        </div>
        <Link className="text-sm underline" href="/hote">
          Retour au tableau de bord
        </Link>
      </header>

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

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Lieux ({lieux.length})</h2>
        {lieux.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-bordure p-6 text-encre-douce">
            Aucun lieu. Ajoutez les bonnes adresses de la commune ci-dessous.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-bordure bg-surface">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="border-b border-bordure bg-surface-2 text-xs uppercase tracking-wide text-encre-faine">
                <tr>
                  <th className="p-3">Lieu</th>
                  <th className="p-3">Catégorie</th>
                  <th className="p-3">Commune</th>
                  <th className="p-3">Accès</th>
                  <th className="p-3">Prix</th>
                  <th className="p-3">Extra</th>
                  <th className="p-3">Statut</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bordure">
                {lieux.map((lieu) => (
                  <tr key={lieu.id}>
                    <td className="p-3">
                      <p className="font-medium">{lieu.nom}</p>
                      <p className="font-mono text-xs text-encre-faine">
                        {lieu.slug}
                      </p>
                      {lieu.lien ? (
                        <a
                          className="text-xs underline"
                          href={lieu.lien}
                          rel="noreferrer noopener"
                          target="_blank"
                        >
                          Site
                        </a>
                      ) : null}
                    </td>
                    <td className="p-3">
                      {LIBELLES_CATEGORIE[lieu.categorie]}
                    </td>
                    <td className="p-3">{lieu.commune ?? "—"}</td>
                    <td className="p-3">{lieu.acces ?? "—"}</td>
                    <td className="p-3">{lieu.prixIndicatif ?? "—"}</td>
                    <td className="p-3">{lieu.extraId ?? "—"}</td>
                    <td className="p-3">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          lieu.actif
                            ? "bg-accent-douce text-accent"
                            : "bg-surface-2 text-encre-faine"
                        }`}
                      >
                        {lieu.actif ? "Actif" : "Inactif"}
                      </span>
                    </td>
                    <td className="p-3">
                      {lieu.actif ? (
                        <form action={desactiverLieuAction}>
                          <input
                            type="hidden"
                            name="slug"
                            value={lieu.slug}
                          />
                          <button
                            className="rounded-full border border-bordure px-3 py-2 text-xs font-medium"
                            type="submit"
                          >
                            Désactiver
                          </button>
                        </form>
                      ) : (
                        <span className="text-xs text-encre-faine">
                          Réenregistrer pour activer
                        </span>
                      )}
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
          Ajouter ou mettre à jour un lieu
        </h2>
        <p className="mt-1 text-sm text-encre-douce">
          Un identifiant existant met à jour la fiche et la réactive.
        </p>
        <form action={enregistrerLieuAction} className="mt-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block space-y-1 text-sm font-medium">
              <span>Identifiant</span>
              <input
                className="w-full rounded-xl border border-bordure bg-surface p-3 font-mono text-sm"
                name="slug"
                placeholder="promenade-littoral"
                required
              />
            </label>
            <label className="block space-y-1 text-sm font-medium">
              <span>Nom</span>
              <input
                className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
                name="nom"
                required
              />
            </label>
            <label className="block space-y-1 text-sm font-medium">
              <span>Catégorie</span>
              <select
                className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
                defaultValue="visite"
                name="categorie"
              >
                {CATEGORIES_LIEU.map((categorie) => (
                  <option key={categorie} value={categorie}>
                    {LIBELLES_CATEGORIE[categorie]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1 text-sm font-medium">
              <span>Commune</span>
              <input
                className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
                name="commune"
              />
            </label>
            <label className="block space-y-1 text-sm font-medium">
              <span>Accès</span>
              <input
                className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
                name="acces"
                placeholder="10 min à pied"
              />
            </label>
            <label className="block space-y-1 text-sm font-medium">
              <span>Prix indicatif</span>
              <input
                className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
                name="prixIndicatif"
                placeholder="gratuit"
              />
            </label>
            <label className="block space-y-1 text-sm font-medium">
              <span>Lien (https)</span>
              <input
                className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
                name="lien"
                type="url"
              />
            </label>
            <label className="block space-y-1 text-sm font-medium">
              <span>Mode</span>
              <input
                className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
                name="mode"
                placeholder="affiliation_10_15"
              />
            </label>
            <label className="block space-y-1 text-sm font-medium">
              <span>Identifiant d’extra lié</span>
              <input
                className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
                name="extraId"
              />
            </label>
            <label className="block space-y-1 text-sm font-medium lg:col-span-2">
              <span>Logement (vide = tous)</span>
              <select
                className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
                defaultValue=""
                name="logementId"
              >
                <option value="">Tous les logements</option>
                {logements.map((logement) => (
                  <option key={logement.id} value={logement.id}>
                    {logement.nom}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button
            className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-fond"
            type="submit"
          >
            Enregistrer le lieu
          </button>
        </form>
      </section>

      <nav className="flex flex-wrap gap-4 text-sm">
        <Link className="underline" href="/voyageur">
          Voir l’espace voyageur
        </Link>
        <Link className="underline" href="/hote">
          Tableau de bord
        </Link>
      </nav>
    </main>
  );
}
