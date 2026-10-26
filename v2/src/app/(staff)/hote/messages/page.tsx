import Link from "next/link";
import { connection } from "next/server";
import {
  CANAUX_MESSAGE,
  CONTENU_MESSAGE_MAX,
  DESTINATAIRE_MAX,
  LIBELLES_CANAL,
  LIBELLES_TYPE_MESSAGE,
  TYPES_MESSAGE_VOYAGEUR,
} from "@/domain/message-voyageur";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleMessagesVoyageurRepository } from "@/infrastructure/db/repositories/messages-voyageur-repository";
import { smsConfigured } from "@/infrastructure/adapters/sms-brevo";
import { env } from "@/lib/env";
import { requireRole, tenantIdDeSession } from "@/lib/session";
import { envoyerMessageAction, preparerMessageAction } from "./actions";

export const instant = false;

const CLASSES_STATUT: Record<string, string> = {
  brouillon: "bg-alerte-douce text-alerte",
  envoye: "bg-accent-douce text-accent",
};

const LIBELLES_STATUT: Record<string, string> = {
  brouillon: "Brouillon",
  envoye: "Envoyé",
};

function formaterDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export default async function PageMessages({
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
  const messages = logement
    ? await new DrizzleMessagesVoyageurRepository().listerParLogement(
        tenantId,
        logement.id,
      )
    : [];
  const brouillons = messages.filter((m) => m.statut === "brouillon").length;
  const envoyes = messages.filter((m) => m.statut === "envoye").length;

  if (!logement) {
    return (
      <main className="mx-auto max-w-3xl space-y-6 px-6 py-12">
        <h1 className="text-3xl font-semibold tracking-tight">
          Messages voyageurs
        </h1>
        <p className="rounded-2xl border border-dashed border-bordure p-6 text-encre-douce">
          Créez d’abord un logement pour préparer un message.
        </p>
        <Link className="text-sm underline" href="/hote/logements">
          Créer un logement
        </Link>
      </main>
    );
  }

  const messageOk =
    params.ok === "prepare"
      ? "Message préparé."
      : params.ok === "envoi"
        ? "Message envoyé."
        : null;
  const smsDisponible = smsConfigured();

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-6 py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-widest text-encre-faine">
            Espace hôte · Voyageurs
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Messages voyageurs
          </h1>
          <p className="text-encre-douce">
            Messages J-1, arrivée et départ — sans jamais transmettre de code
            d’accès.
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
              href={`/hote/messages?logement=${l.id}`}
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

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-bordure bg-surface p-5 shadow-sm">
          <p className="text-sm text-encre-faine">Brouillons</p>
          <p className="mt-1 text-3xl font-semibold">{brouillons}</p>
        </div>
        <div className="rounded-2xl border border-bordure bg-surface p-5 shadow-sm">
          <p className="text-sm text-encre-faine">Envoyés</p>
          <p className="mt-1 text-3xl font-semibold">{envoyes}</p>
        </div>
        <div className="rounded-2xl border border-bordure bg-surface p-5 shadow-sm">
          <p className="text-sm text-encre-faine">Logement</p>
          <p className="mt-1 text-lg font-semibold">{logement.nom}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-bordure bg-surface p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Préparer un message</h2>
        <form action={preparerMessageAction} className="mt-4 space-y-3">
          <input type="hidden" name="logementId" value={logement.id} />
          <input
            type="hidden"
            name="ref"
            value={`MSG-${crypto.randomUUID()}`}
          />
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block space-y-1 text-sm font-medium">
              <span>Canal</span>
              <select
                className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
                defaultValue="email"
                name="canal"
              >
                {CANAUX_MESSAGE.map((canal) => (
                  <option key={canal} value={canal}>
                    {LIBELLES_CANAL[canal]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1 text-sm font-medium">
              <span>Type</span>
              <select
                className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
                defaultValue="j1"
                name="type"
              >
                {TYPES_MESSAGE_VOYAGEUR.map((type) => (
                  <option key={type} value={type}>
                    {LIBELLES_TYPE_MESSAGE[type]}
                  </option>
                ))}
              </select>
            </label>
            <div className="rounded-xl border border-alerte bg-alerte-douce p-3 text-xs text-alerte">
              Le code d’accès n’est jamais inclus : communiquez-le par un canal
              vérifié.
            </div>
          </div>
          <label className="block space-y-1 text-sm font-medium">
            <span>E-mail du voyageur</span>
            <input
              className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
              maxLength={DESTINATAIRE_MAX}
              name="destinataire"
              placeholder="camille@example.com"
              type="text"
              inputMode="email"
              autoComplete="email"
            />
            <span className="block text-xs text-encre-faine">
              Requis pour un envoi réel par e-mail ; laissez vide pour un envoi
              manuel.
            </span>
          </label>
          <label className="block space-y-1 text-sm font-medium">
            <span>Téléphone du voyageur</span>
            <input
              className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
              inputMode="tel"
              maxLength={20}
              name="telephone"
              placeholder="06 12 34 56 78"
              type="tel"
            />
            <span className="block text-xs text-encre-faine">
              Utilisé uniquement pour le canal SMS.
            </span>
          </label>
          <label className="block space-y-1 text-sm font-medium">
            <span>Contenu</span>
            <textarea
              className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
              maxLength={CONTENU_MESSAGE_MAX}
              name="contenu"
              placeholder="Bonjour, votre séjour approche. L’arrivée est possible à partir de 15 h, le logement sera prêt."
              required
              rows={4}
            />
          </label>
          <button
            className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-fond"
            type="submit"
          >
            Préparer le message
          </button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          Messages de {logement.nom} ({messages.length})
        </h2>
        {messages.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-bordure p-6 text-encre-douce">
            Aucun message préparé pour ce logement.
          </p>
        ) : (
          <ul className="space-y-3">
            {messages.map((message) => (
              <li
                className="rounded-2xl border border-bordure bg-surface p-4 shadow-sm"
                key={message.id}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">
                    {LIBELLES_TYPE_MESSAGE[message.type]} ·{" "}
                    {LIBELLES_CANAL[message.canal]}
                    {message.destinataire
                      ? ` · ${message.destinataire}`
                      : ""}
                  </p>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${CLASSES_STATUT[message.statut]}`}
                  >
                    {LIBELLES_STATUT[message.statut]}
                  </span>
                </div>
                <p className="mt-2 whitespace-pre-line text-sm text-encre-douce">
                  {message.contenu}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <span className="text-xs text-encre-faine">
                    {message.envoyeAt
                      ? `Envoyé le ${formaterDate(message.envoyeAt)}`
                      : `Préparé le ${formaterDate(message.createdAt)}`}
                  </span>
                  {message.statut === "brouillon" ? (
                    <form action={envoyerMessageAction}>
                      <input
                        type="hidden"
                        name="logementId"
                        value={logement.id}
                      />
                      <input type="hidden" name="id" value={message.id} />
                      <button
                        className="rounded-full border border-bordure px-3 py-1 text-xs font-medium"
                        type="submit"
                      >
                        {message.canal === "sms"
                          ? smsDisponible
                            ? "Envoyer par SMS"
                            : "Marquer envoyé"
                          : env.EMAIL_ENABLED
                            ? "Envoyer par e-mail"
                            : "Marquer envoyé"}
                      </button>
                    </form>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <nav className="flex flex-wrap gap-4 text-sm">
        <Link className="underline" href="/hote/phrases">
          Phrases types
        </Link>
        <Link className="underline" href="/hote/audit">
          Journal d’audit
        </Link>
        <Link className="underline" href="/hote">
          Tableau de bord
        </Link>
      </nav>
    </main>
  );
}
