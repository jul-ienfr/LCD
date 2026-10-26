import Link from "next/link";
import { connection } from "next/server";
import {
  INTENTIONS_ASSISTANT,
  LIBELLES_INTENTION,
  LIBELLES_TON,
  TONS_ASSISTANT,
} from "@/domain/assistant";
import { ErreurMetier } from "@/domain/erreurs";
import { RedigerBrouillon, type BrouillonAssistant } from "@/application/use-cases/assistant";
import { GenerateurBrouillonLocal } from "@/infrastructure/adapters/generateur-brouillon-local";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { formaterEuros } from "@/lib/format";
import { requireRole, tenantIdDeSession } from "@/lib/session";
import { enregistrerBrouillonAction } from "./actions";

export const instant = false;

export default async function PageAssistant({
  searchParams,
}: {
  searchParams: Promise<{
    logement?: string;
    intention?: string;
    ton?: string;
    voyageur?: string;
    details?: string;
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

  let brouillon: BrouillonAssistant | null = null;
  let erreur: string | null = params.erreur ?? null;
  if (logement && params.intention && params.ton) {
    try {
      brouillon = await new RedigerBrouillon(
        new GenerateurBrouillonLocal(),
        new DrizzleLogementRepository(),
      ).executer({
        tenantId,
        logementId: logement.id,
        intention: params.intention,
        ton: params.ton,
        voyageur: params.voyageur,
        details: params.details,
      });
    } catch (error) {
      if (error instanceof ErreurMetier) {
        erreur = error.message;
      } else {
        throw error;
      }
    }
  }

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-6 py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-widest text-encre-faine">
            Espace hôte · Assistant
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Brouillons de messages
          </h1>
          <p className="text-encre-douce">
            Routage local ou standard selon l’intention, aperçu du prompt et
            brouillon sans donnée sensible.
          </p>
        </div>
        <Link className="text-sm underline" href="/hote">
          Retour au tableau de bord
        </Link>
      </header>

      {!logement ? (
        <p className="rounded-2xl border border-dashed border-bordure p-6 text-encre-douce">
          Créez d’abord un logement pour rédiger un brouillon.
        </p>
      ) : (
        <>
          {logements.length > 1 ? (
            <nav
              aria-label="Choisir un logement"
              className="flex flex-wrap gap-2"
            >
              {logements.map((l) => (
                <Link
                  key={l.id}
                  className={`rounded-full border px-4 py-2 text-sm ${
                    l.id === logement.id
                      ? "border-accent bg-accent-douce font-semibold text-accent"
                      : "border-bordure bg-surface"
                  }`}
                  href={`/hote/assistant?logement=${l.id}`}
                >
                  {l.nom}
                </Link>
              ))}
            </nav>
          ) : null}

          {erreur ? (
            <p
              className="rounded-xl border border-danger bg-danger-douce p-3 text-sm text-danger"
              role="alert"
            >
              {erreur}
            </p>
          ) : null}

          <form
            action="/hote/assistant"
            className="space-y-3 rounded-2xl border border-bordure bg-surface p-6 shadow-sm"
          >
            <input type="hidden" name="logement" value={logement.id} />
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1 text-sm font-medium">
                <span>Intention</span>
                <select
                  className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
                  defaultValue={params.intention ?? "arrivee"}
                  name="intention"
                >
                  {INTENTIONS_ASSISTANT.map((intention) => (
                    <option key={intention} value={intention}>
                      {LIBELLES_INTENTION[intention]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1 text-sm font-medium">
                <span>Ton</span>
                <select
                  className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
                  defaultValue={params.ton ?? "chaleureux"}
                  name="ton"
                >
                  {TONS_ASSISTANT.map((ton) => (
                    <option key={ton} value={ton}>
                      {LIBELLES_TON[ton]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="block space-y-1 text-sm font-medium">
              <span>Voyageur (optionnel)</span>
              <input
                className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
                defaultValue={params.voyageur ?? ""}
                maxLength={80}
                name="voyageur"
                placeholder="Camille"
              />
            </label>
            <label className="block space-y-1 text-sm font-medium">
              <span>Détails (optionnel)</span>
              <textarea
                className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
                defaultValue={params.details ?? ""}
                maxLength={400}
                name="details"
                placeholder="Arrivée possible dès 14 h, lit bébé installé."
                rows={3}
              />
            </label>
            <button
              className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-fond"
              type="submit"
            >
              Rédiger le brouillon
            </button>
          </form>

          {brouillon ? (
            <section className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-bordure bg-surface p-5 shadow-sm">
                  <p className="text-sm text-encre-faine">Modèle recommandé</p>
                  <p className="mt-1 text-xl font-semibold">
                    {brouillon.modele}
                  </p>
                  <p className="mt-1 text-xs text-encre-douce">
                    {brouillon.routage.raison}
                  </p>
                </div>
                <div className="rounded-2xl border border-bordure bg-surface p-5 shadow-sm">
                  <p className="text-sm text-encre-faine">Coût estimé</p>
                  <p className="mt-1 text-xl font-semibold">
                    {brouillon.coutEstimeCentimes === 0
                      ? "Gratuit (local)"
                      : formaterEuros(brouillon.coutEstimeCentimes)}
                  </p>
                </div>
                <div className="rounded-2xl border border-bordure bg-surface p-5 shadow-sm">
                  <p className="text-sm text-encre-faine">Niveau</p>
                  <p className="mt-1 text-xl font-semibold capitalize">
                    {brouillon.routage.niveau}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-accent bg-accent-douce p-6">
                <h2 className="text-lg font-semibold">Brouillon</h2>
                <p className="mt-2 whitespace-pre-line text-sm text-encre">
                  {brouillon.texte}
                </p>
                <form
                  action={enregistrerBrouillonAction}
                  className="mt-4 flex flex-wrap items-end gap-3 border-t border-accent/30 pt-4"
                >
                  <input
                    type="hidden"
                    name="logementId"
                    value={logement.id}
                  />
                  <input
                    type="hidden"
                    name="intention"
                    value={params.intention ?? "arrivee"}
                  />
                  <input type="hidden" name="ton" value={params.ton ?? "neutre"} />
                  <input
                    type="hidden"
                    name="voyageur"
                    value={params.voyageur ?? ""}
                  />
                  <input
                    type="hidden"
                    name="details"
                    value={params.details ?? ""}
                  />
                  <input type="hidden" name="texte" value={brouillon.texte} />
                  <label className="space-y-1 text-sm font-medium">
                    <span>Canal</span>
                    <select
                      className="rounded-xl border border-bordure bg-surface p-3 text-sm"
                      defaultValue="email"
                      name="canal"
                    >
                      <option value="email">E-mail</option>
                      <option value="sms">SMS</option>
                    </select>
                  </label>
                  <button
                    className="rounded-full bg-encre px-5 py-3 text-sm font-semibold text-fond"
                    type="submit"
                  >
                    Enregistrer dans les messages
                  </button>
                </form>
              </div>

              <details className="rounded-2xl border border-bordure bg-surface p-6 text-sm">
                <summary className="cursor-pointer font-medium">
                  Prompt envoyé au modèle
                </summary>
                <pre className="mt-3 whitespace-pre-wrap text-xs text-encre-douce">
                  {brouillon.invite}
                </pre>
              </details>
            </section>
          ) : null}
        </>
      )}

      <nav className="flex flex-wrap gap-4 text-sm">
        <Link className="underline" href="/hote/messages">
          Messages voyageurs
        </Link>
        <Link className="underline" href="/hote/phrases">
          Phrases types
        </Link>
        <Link className="underline" href="/hote">
          Tableau de bord
        </Link>
      </nav>
    </main>
  );
}
