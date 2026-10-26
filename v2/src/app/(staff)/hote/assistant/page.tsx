import Link from "next/link";
import { connection } from "next/server";
import {
  INTENTIONS_ASSISTANT,
  LIBELLES_INTENTION,
  LIBELLES_TON,
  TONS_ASSISTANT,
  tonValide,
  type TonAssistant,
} from "@/domain/assistant";
import { ErreurMetier } from "@/domain/erreurs";
import {
  RedigerBrouillon,
  type BrouillonAssistant,
} from "@/application/use-cases/assistant";
import { GenerateurBrouillonLocal } from "@/infrastructure/adapters/generateur-brouillon-local";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { formaterEuros } from "@/lib/format";
import { requireRole, tenantIdDeSession } from "@/lib/session";
import { enregistrerBrouillonAction } from "./actions";

export const instant = false;

interface CarteBrouillonProps {
  logementId: string;
  intention: string;
  voyageur: string;
  details: string;
  ton: TonAssistant;
  brouillon: BrouillonAssistant;
  comparaison: boolean;
}

function coutLibelle(centimes: number): string {
  return centimes === 0 ? "Gratuit (local)" : formaterEuros(centimes);
}

function CarteBrouillon({
  logementId,
  intention,
  voyageur,
  details,
  ton,
  brouillon,
  comparaison,
}: CarteBrouillonProps) {
  return (
    <article className="space-y-3 rounded-2xl border border-accent bg-accent-douce p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">
          {comparaison ? `Variante — ${LIBELLES_TON[ton]}` : "Brouillon"}
        </h2>
        <span className="rounded-full bg-surface px-3 py-1 text-xs font-medium">
          {brouillon.modele} · {coutLibelle(brouillon.coutEstimeCentimes)}
        </span>
      </div>
      <p className="whitespace-pre-line text-sm text-encre">
        {brouillon.texte}
      </p>
      <form
        action={enregistrerBrouillonAction}
        className="flex flex-wrap items-end gap-3 border-t border-accent/30 pt-3"
      >
        <input type="hidden" name="logementId" value={logementId} />
        <input type="hidden" name="intention" value={intention} />
        <input type="hidden" name="ton" value={ton} />
        <input type="hidden" name="voyageur" value={voyageur} />
        <input type="hidden" name="details" value={details} />
        <input type="hidden" name="texte" value={brouillon.texte} />
        <label className="space-y-1 text-sm font-medium">
          <span>Canal</span>
          <select
            className="rounded-xl border border-bordure bg-surface p-2 text-sm"
            defaultValue="email"
            name="canal"
          >
            <option value="email">E-mail</option>
            <option value="sms">SMS</option>
          </select>
        </label>
        <button
          className="rounded-full bg-encre px-4 py-2 text-sm font-semibold text-fond"
          type="submit"
        >
          Enregistrer dans les messages
        </button>
      </form>
      <details className="text-sm">
        <summary className="cursor-pointer font-medium">
          Prompt envoyé au modèle
        </summary>
        <pre className="mt-2 whitespace-pre-wrap text-xs text-encre-douce">
          {brouillon.invite}
        </pre>
      </details>
    </article>
  );
}

export default async function PageAssistant({
  searchParams,
}: {
  searchParams: Promise<{
    logement?: string;
    intention?: string;
    ton?: string;
    voyageur?: string;
    details?: string;
    comparer?: string;
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

  let cartes: { ton: TonAssistant; brouillon: BrouillonAssistant }[] = [];
  let erreur: string | null = params.erreur ?? null;
  if (logement && params.intention && (params.ton || params.comparer)) {
    const comparaison = params.comparer === "1";
    const tons: TonAssistant[] = comparaison
      ? [...TONS_ASSISTANT]
      : params.ton && tonValide(params.ton)
        ? [params.ton]
        : [];
    try {
      for (const ton of tons) {
        const brouillon = await new RedigerBrouillon(
          new GenerateurBrouillonLocal(),
          new DrizzleLogementRepository(),
        ).executer({
          tenantId,
          logementId: logement.id,
          intention: params.intention,
          ton,
          voyageur: params.voyageur,
          details: params.details,
        });
        cartes.push({ ton, brouillon });
      }
    } catch (error) {
      if (error instanceof ErreurMetier) {
        erreur = error.message;
        cartes = [];
      } else {
        throw error;
      }
    }
  }
  const comparaison = cartes.length > 1;

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
            <div className="flex flex-wrap gap-3">
              <button
                className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-fond"
                type="submit"
              >
                Rédiger le brouillon
              </button>
              <button
                className="rounded-full border border-accent px-5 py-3 text-sm font-semibold text-accent"
                name="comparer"
                type="submit"
                value="1"
              >
                Comparer les 3 tons
              </button>
            </div>
          </form>

          {cartes.length > 0 ? (
            <section
              className={
                comparaison
                  ? "grid gap-4 lg:grid-cols-3"
                  : "space-y-4"
              }
            >
              {cartes.map(({ ton, brouillon }) => (
                <CarteBrouillon
                  key={ton}
                  brouillon={brouillon}
                  comparaison={comparaison}
                  details={params.details ?? ""}
                  intention={params.intention ?? "arrivee"}
                  logementId={logement.id}
                  ton={ton}
                  voyageur={params.voyageur ?? ""}
                />
              ))}
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
