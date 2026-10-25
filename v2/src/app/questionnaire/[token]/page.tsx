import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import {
  CRITERES_QUESTIONNAIRE,
  LIBELLES_CRITERE,
  moyenneQuestionnaire,
} from "@/domain/questionnaire";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleQuestionnairesRepository } from "@/infrastructure/db/repositories/questionnaires-repository";
import { DrizzleReservationRepository } from "@/infrastructure/db/repositories/reservation-repository";
import { verifierTokenVoyageur } from "@/lib/voyageur-token";
import { deposerQuestionnaireAction } from "./actions";

export const instant = false;

export const metadata: Metadata = {
  title: "Questionnaire de séjour",
  robots: { index: false, follow: false },
};

const LIBELLES_NOTE: Record<number, string> = {
  5: "5 — Excellent",
  4: "4 — Très bien",
  3: "3 — Bien",
  2: "2 — Moyen",
  1: "1 — À améliorer",
};

function Message({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-md space-y-4 px-4 py-16 text-center">
      <p className="text-sm font-medium uppercase tracking-widest text-encre-faine">
        LCD Parc
      </p>
      <h1 className="text-2xl font-semibold tracking-tight">
        Lien indisponible
      </h1>
      <p className="text-encre-douce">{children}</p>
      <Link className="text-sm underline" href="/">
        Retour à l&apos;accueil
      </Link>
    </main>
  );
}

function Etoiles({ note }: { note: number }) {
  const arrondi = Math.round(note);
  return (
    <span aria-label={`${note.toFixed(1)} sur 5`}>
      {"★".repeat(arrondi)}
      <span className="text-encre-faine">{"★".repeat(5 - arrondi)}</span>
    </span>
  );
}

export default async function PageQuestionnaire({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ ok?: string; deja?: string; erreur?: string }>;
}) {
  await connection();
  const { token } = await params;
  const query = await searchParams;
  const payload = verifierTokenVoyageur(token);
  if (!payload) {
    return (
      <Message>
        Ce lien est invalide ou expiré. Demandez un nouveau lien à votre hôte.
      </Message>
    );
  }

  const reservation = await new DrizzleReservationRepository().trouverParId(
    payload.tenantId,
    payload.reservationId,
  );
  if (!reservation || reservation.logementId !== payload.logementId) {
    return (
      <Message>
        Ce séjour n&apos;est plus disponible. Contactez votre hôte.
      </Message>
    );
  }

  const [logement, existant] = await Promise.all([
    new DrizzleLogementRepository().trouverParId(
      payload.tenantId,
      reservation.logementId,
    ),
    new DrizzleQuestionnairesRepository().trouverParReservation(
      payload.tenantId,
      reservation.id,
    ),
  ]);

  const moyenne = existant ? moyenneQuestionnaire(existant) : null;

  return (
    <main className="mx-auto max-w-2xl space-y-8 px-6 py-12">
      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-widest text-encre-faine">
          Questionnaire de séjour
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          {logement?.nom ?? "Votre séjour"}
        </h1>
        <p className="text-encre-douce">
          Du {reservation.debut} au {reservation.fin} ·{" "}
          {reservation.voyageurs} voyageur
          {reservation.voyageurs > 1 ? "s" : ""}
        </p>
      </header>

      {query.ok ? (
        <p
          className="rounded-xl border border-accent bg-accent-douce p-3 text-sm text-accent"
          role="status"
        >
          Merci, vos réponses sont enregistrées.
        </p>
      ) : null}
      {query.deja ? (
        <p
          className="rounded-xl border border-bordure bg-surface-2 p-3 text-sm"
          role="status"
        >
          Vous avez déjà répondu à ce questionnaire.
        </p>
      ) : null}
      {query.erreur ? (
        <p
          className="rounded-xl border border-danger bg-danger-douce p-3 text-sm text-danger"
          role="alert"
        >
          {query.erreur === "inattendu"
            ? "Erreur inattendue. Réessayez."
            : query.erreur}
        </p>
      ) : null}

      {existant ? (
        <section className="space-y-4 rounded-2xl border border-bordure bg-surface p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Vos réponses</h2>
          <p className="text-sm text-encre-douce">
            Moyenne : {moyenne?.toFixed(1)} / 5 · <Etoiles note={moyenne ?? 0} />
          </p>
          <dl className="grid gap-3 sm:grid-cols-2">
            {CRITERES_QUESTIONNAIRE.map((critere) => (
              <div
                className="flex items-center justify-between rounded-xl border border-bordure p-3 text-sm"
                key={critere}
              >
                <dt>{LIBELLES_CRITERE[critere]}</dt>
                <dd className="font-medium">
                  {existant.notes[critere]} / 5
                </dd>
              </div>
            ))}
          </dl>
          {existant.commentaire ? (
            <p className="whitespace-pre-line rounded-xl border border-bordure bg-surface-2 p-3 text-sm">
              {existant.commentaire}
            </p>
          ) : null}
        </section>
      ) : (
        <form
          action={deposerQuestionnaireAction}
          className="space-y-4 rounded-2xl border border-bordure bg-surface p-6 shadow-sm"
        >
          <input name="token" type="hidden" value={token} />
          <input name="ref" type="hidden" value={crypto.randomUUID()} />
          <p className="text-sm text-encre-douce">
            Notez chaque critère de 1 à 5. Une seule réponse par séjour.
          </p>
          {CRITERES_QUESTIONNAIRE.map((critere) => (
            <label
              className="block space-y-1 text-sm font-medium"
              key={critere}
            >
              <span>{LIBELLES_CRITERE[critere]}</span>
              <select
                className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
                defaultValue="5"
                name={`note-${critere}`}
                required
              >
                {[5, 4, 3, 2, 1].map((note) => (
                  <option key={note} value={note}>
                    {LIBELLES_NOTE[note]}
                  </option>
                ))}
              </select>
            </label>
          ))}
          <label className="block space-y-1 text-sm font-medium">
            <span>Commentaire</span>
            <textarea
              className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
              maxLength={1000}
              name="commentaire"
              rows={4}
            />
          </label>
          <button
            className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-fond"
            type="submit"
          >
            Envoyer mes réponses
          </button>
        </form>
      )}
    </main>
  );
}
