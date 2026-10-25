import Link from "next/link";
import { connection } from "next/server";
import {
  appliquerVariables,
  CATEGORIES_PHRASE,
  LIBELLES_CATEGORIE_PHRASE,
  PHRASES_DEFAUT,
  type VariablesPhrase,
} from "@/domain/phrase";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzlePhrasesRepository } from "@/infrastructure/db/repositories/phrases-repository";
import { requireRole, tenantIdDeSession } from "@/lib/session";
import {
  enregistrerPhraseAction,
  installerPhrasesDefautAction,
  supprimerPhraseAction,
} from "./actions";

export const instant = false;

const EXEMPLE: VariablesPhrase = {
  voyageur: "Camille",
  logement: "le logement",
  debut: "01/12/2026",
  fin: "05/12/2026",
  heure: "15:00",
};

const CLASSES_CATEGORIE: Record<string, string> = {
  arrivee: "bg-accent-douce text-accent",
  depart: "bg-surface-2 text-encre-douce",
  urgence: "bg-danger-douce text-danger",
  general: "bg-alerte-douce text-alerte",
};

export default async function PagePhrases({
  searchParams,
}: {
  searchParams: Promise<{
    logement?: string;
    phrase?: string;
    ok?: string;
    erreur?: string;
  }>;
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
  const phrases = logement
    ? await new DrizzlePhrasesRepository().listerParLogement(
        tenantId,
        logement.id,
      )
    : [];

  if (!logement) {
    return (
      <main className="mx-auto max-w-3xl space-y-6 px-6 py-12">
        <h1 className="text-3xl font-semibold tracking-tight">Phrases types</h1>
        <p className="rounded-2xl border border-dashed border-bordure p-6 text-encre-douce">
          Créez d’abord un logement pour préparer ses messages.
        </p>
        <Link className="text-sm underline" href="/hote/logements">
          Créer un logement
        </Link>
      </main>
    );
  }

  const enEdition = params.phrase
    ? phrases.find((p) => p.id === params.phrase)
    : undefined;
  const exemple: VariablesPhrase = { ...EXEMPLE, logement: logement.nom };

  const messageOk =
    params.ok === "enregistre"
      ? "Phrase enregistrée."
      : params.ok === "supprime"
        ? "Phrase supprimée."
        : params.ok === "modeles"
          ? "Modèles installés."
          : null;

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-6 py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-widest text-encre-faine">
            Espace hôte · Relation voyageur
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Phrases types
          </h1>
          <p className="text-encre-douce">
            Messages prêts à copier pour l’arrivée, le départ, l’urgence.
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
              href={`/hote/phrases?logement=${l.id}`}
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

      <section className="rounded-2xl border border-bordure bg-surface p-6 shadow-sm">
        <h2 className="text-lg font-semibold">
          {enEdition
            ? `Modifier « ${enEdition.titre} »`
            : "Nouvelle phrase type"}
        </h2>
        <form action={enregistrerPhraseAction} className="mt-4 space-y-3">
          <input type="hidden" name="logementId" value={logement.id} />
          {enEdition ? (
            <input type="hidden" name="id" value={enEdition.id} />
          ) : null}
          <input
            type="hidden"
            name="ref"
            value={enEdition?.ref ?? `phrase-${crypto.randomUUID()}`}
          />
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block space-y-1 text-sm font-medium">
              <span>Catégorie</span>
              <select
                className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
                defaultValue={enEdition?.categorie ?? "general"}
                name="categorie"
              >
                {CATEGORIES_PHRASE.map((categorie) => (
                  <option key={categorie} value={categorie}>
                    {LIBELLES_CATEGORIE_PHRASE[categorie]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1 text-sm font-medium sm:col-span-2">
              <span>Titre</span>
              <input
                className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
                defaultValue={enEdition?.titre ?? ""}
                name="titre"
                placeholder="Message d’arrivée"
                required
              />
            </label>
          </div>
          <label className="block space-y-1 text-sm font-medium">
            <span>Message</span>
            <textarea
              className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
              defaultValue={enEdition?.contenu ?? ""}
              name="contenu"
              placeholder="Bonjour {voyageur}, votre séjour au {logement}…"
              required
              rows={4}
            />
          </label>
          <p className="text-xs text-encre-douce">
            Variables disponibles :{" "}
            <code>{"{voyageur}"}</code>, <code>{"{logement}"}</code>,{" "}
            <code>{"{debut}"}</code>, <code>{"{fin}"}</code>,{" "}
            <code>{"{heure}"}</code>.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-fond"
              type="submit"
            >
              Enregistrer la phrase
            </button>
            {enEdition ? (
              <Link
                className="rounded-full border border-bordure px-5 py-3 text-sm font-medium"
                href={`/hote/phrases?logement=${logement.id}`}
              >
                Annuler
              </Link>
            ) : null}
          </div>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Phrases de {logement.nom}</h2>
        {phrases.length === 0 ? (
          <div className="space-y-4 rounded-2xl border border-dashed border-bordure p-6">
            <p className="text-encre-douce">
              Aucune phrase pour ce logement. Installez les modèles pour
              démarrer :
            </p>
            <ul className="grid gap-3 sm:grid-cols-2">
              {PHRASES_DEFAUT.map((modele) => (
                <li
                  className="rounded-xl border border-bordure bg-surface p-4 text-sm"
                  key={modele.code}
                >
                  <p className="font-medium">{modele.titre}</p>
                  <p className="mt-1 text-encre-douce">
                    {appliquerVariables(modele.contenu, exemple)}
                  </p>
                </li>
              ))}
            </ul>
            <form action={installerPhrasesDefautAction}>
              <input type="hidden" name="logementId" value={logement.id} />
              <button
                className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-fond"
                type="submit"
              >
                Installer les modèles
              </button>
            </form>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {phrases.map((phrase) => (
              <li
                className="space-y-3 rounded-2xl border border-bordure bg-surface p-5 shadow-sm"
                key={phrase.id}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${CLASSES_CATEGORIE[phrase.categorie]}`}
                  >
                    {LIBELLES_CATEGORIE_PHRASE[phrase.categorie]}
                  </span>
                  <div className="flex gap-3 text-sm">
                    <Link
                      className="underline"
                      href={`/hote/phrases?logement=${logement.id}&phrase=${phrase.id}`}
                    >
                      Modifier
                    </Link>
                    <form action={supprimerPhraseAction}>
                      <input
                        type="hidden"
                        name="logementId"
                        value={logement.id}
                      />
                      <input type="hidden" name="id" value={phrase.id} />
                      <button className="text-danger underline" type="submit">
                        Supprimer
                      </button>
                    </form>
                  </div>
                </div>
                <p className="font-medium">{phrase.titre}</p>
                <p className="whitespace-pre-line text-sm text-encre-douce">
                  {appliquerVariables(phrase.contenu, exemple)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <nav className="flex flex-wrap gap-4 text-sm">
        <Link className="underline" href={`/hote/questionnaires?logement=${logement.id}`}>
          Questionnaires
        </Link>
        <Link className="underline" href="/hote">
          Tableau de bord
        </Link>
      </nav>
    </main>
  );
}
