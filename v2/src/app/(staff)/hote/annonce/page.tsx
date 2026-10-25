import Link from "next/link";
import { connection } from "next/server";
import {
  CLASSEMENTS_MEUBLE,
  conformiteAnnonce,
  ETIQUETTES_DPE,
  LIBELLES_CLASSEMENT,
  MENTIONS_ANNONCE,
  mentionsParDefaut,
} from "@/domain/annonce";
import { DrizzleAnnoncesConformiteRepository } from "@/infrastructure/db/repositories/annonces-conformite-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { requireRole, tenantIdDeSession } from "@/lib/session";
import { enregistrerAnnonceAction } from "./actions";

export const instant = false;

export default async function PageAnnonce({
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
  const conformite = logement
    ? await new DrizzleAnnoncesConformiteRepository().trouverParLogement(
        tenantId,
        logement.id,
      )
    : null;
  const mentions = conformite?.mentions ?? mentionsParDefaut();
  const resume = conformiteAnnonce({
    mentions,
    dpeClasse: conformite?.dpeClasse ?? null,
    gesClasse: conformite?.gesClasse ?? null,
  });

  if (!logement) {
    return (
      <main className="mx-auto max-w-3xl space-y-6 px-6 py-12">
        <h1 className="text-3xl font-semibold tracking-tight">
          Conformité de l’annonce
        </h1>
        <p className="rounded-2xl border border-dashed border-bordure p-6 text-encre-douce">
          Créez d’abord un logement pour vérifier son annonce.
        </p>
        <Link className="text-sm underline" href="/hote/logements">
          Créer un logement
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-6 py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-widest text-encre-faine">
            Espace hôte · Conformité
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Conformité de l’annonce
          </h1>
          <p className="text-encre-douce">
            Les neuf mentions obligatoires et les étiquettes DPE/GES.
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
              href={`/hote/annonce?logement=${l.id}`}
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
          Conformité enregistrée.
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Avancement</h2>
            <p className="mt-1 text-sm text-encre-douce">
              {resume.faites} / {resume.total} mentions · {resume.pourcentage} %
            </p>
          </div>
          {resume.conforme ? (
            <span className="rounded-full bg-accent-douce px-3 py-1 text-xs font-semibold text-accent">
              Conforme
            </span>
          ) : (
            <span className="rounded-full bg-alerte-douce px-3 py-1 text-xs font-semibold text-alerte">
              À compléter
            </span>
          )}
        </div>
        <div
          aria-hidden="true"
          className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface-2"
        >
          <div
            className="h-full rounded-full bg-accent"
            style={{ width: `${resume.pourcentage}%` }}
          />
        </div>
        {resume.manquantes.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {resume.manquantes.map((mention) => (
              <span
                className="rounded-full border border-bordure px-3 py-1 text-xs text-encre-douce"
                key={mention.code}
              >
                {mention.libelle}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-encre-douce">
            Toutes les mentions sont cochées.
            {!resume.conforme
              ? " Renseignez les étiquettes DPE et GES pour valider."
              : null}
          </p>
        )}
      </section>

      <form
        action={enregistrerAnnonceAction}
        className="space-y-6 rounded-2xl border border-bordure bg-surface p-6 shadow-sm"
      >
        <input type="hidden" name="logementId" value={logement.id} />
        <div>
          <h2 className="text-lg font-semibold">
            Mentions de {logement.nom}
          </h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {MENTIONS_ANNONCE.map((mention) => (
              <li key={mention.code}>
                <label className="flex cursor-pointer gap-3 rounded-xl border border-bordure p-3 text-sm">
                  <input
                    className="mt-1"
                    defaultChecked={mentions[mention.code] === true}
                    name={`mention-${mention.code}`}
                    type="checkbox"
                  />
                  <span>
                    <span className="font-medium">{mention.libelle}</span>
                    <span className="mt-0.5 block text-encre-douce">
                      {mention.detail}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block space-y-1 text-sm font-medium">
            <span>Étiquette DPE</span>
            <select
              className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
              defaultValue={conformite?.dpeClasse ?? ""}
              name="dpeClasse"
            >
              <option value="">Non renseigné</option>
              {ETIQUETTES_DPE.map((lettre) => (
                <option key={lettre} value={lettre}>
                  {lettre}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1 text-sm font-medium">
            <span>Étiquette GES</span>
            <select
              className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
              defaultValue={conformite?.gesClasse ?? ""}
              name="gesClasse"
            >
              <option value="">Non renseigné</option>
              {ETIQUETTES_DPE.map((lettre) => (
                <option key={lettre} value={lettre}>
                  {lettre}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1 text-sm font-medium">
            <span>Classement meublé</span>
            <select
              className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
              defaultValue={conformite?.classement ?? ""}
              name="classement"
            >
              <option value="">Non renseigné</option>
              {CLASSEMENTS_MEUBLE.map((classement) => (
                <option key={classement} value={classement}>
                  {LIBELLES_CLASSEMENT[classement]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1 text-sm font-medium">
            <span>Numéro d’enregistrement mairie</span>
            <input
              className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
              defaultValue={conformite?.numeroEnregistrement ?? ""}
              name="numeroEnregistrement"
              placeholder="ex. 06088202600012"
            />
          </label>
          <label className="block space-y-1 text-sm font-medium">
            <span>Numéro Cerfa</span>
            <input
              className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
              defaultValue={conformite?.numeroCerfa ?? ""}
              name="numeroCerfa"
              placeholder="ex. 14004*05"
            />
          </label>
        </div>

        <button
          className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-fond"
          type="submit"
        >
          Enregistrer la conformité
        </button>
      </form>

      <nav className="flex flex-wrap gap-4 text-sm">
        <Link className="underline" href={`/hote/tranquillite?logement=${logement.id}`}>
          Carnet de tranquillité
        </Link>
        <Link className="underline" href="/hote">
          Tableau de bord
        </Link>
      </nav>
    </main>
  );
}
