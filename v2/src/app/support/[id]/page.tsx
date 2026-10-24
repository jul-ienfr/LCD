import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import {
  TRANSITIONS_TICKET,
  type StatutTicket,
} from "@/domain/ticket";
import { DrizzleTicketRepository } from "@/infrastructure/db/repositories/ticket-repository";
import { requireSession, tenantIdDeSession } from "@/lib/session";
import { changerStatutTicketAction } from "../actions";
import { FormulaireReponse } from "../formulaire-reponse";

export const instant = false;

const LIBELLES: Record<StatutTicket, string> = {
  ouvert: "Réouvrir",
  en_cours: "Prendre en charge",
  resolu: "Marquer résolu",
  ferme: "Fermer",
};

export default async function PageTicket({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();

  const session = await requireSession();
  const tenantId = tenantIdDeSession(session);
  const { id } = await params;

  const repo = new DrizzleTicketRepository();
  const ticket = await repo.trouverParId(tenantId, id);
  if (!ticket) notFound();

  const estStaff = ["admin", "hote"].includes(session.user.role ?? "");
  if (!estStaff && ticket.createdByUserId !== session.user.id) {
    notFound();
  }

  const messages = await repo.listerMessages(tenantId, ticket.id);

  return (
    <main className="mx-auto max-w-3xl space-y-8 px-6 py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-widest text-stone-500">
            Ticket {ticket.ref}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            {ticket.sujet}
          </h1>
          <p className="text-stone-600">
            {ticket.statut} · priorité {ticket.priorite} ·{" "}
            {ticket.createdAt.toISOString().slice(0, 10)}
          </p>
        </div>
        <Link className="text-sm underline" href="/support">
          ← Support
        </Link>
      </header>

      {estStaff && TRANSITIONS_TICKET[ticket.statut].length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {TRANSITIONS_TICKET[ticket.statut].map((statut) => (
            <form action={changerStatutTicketAction} key={statut}>
              <input name="ticketId" type="hidden" value={ticket.id} />
              <input name="statut" type="hidden" value={statut} />
              <button
                className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium"
                type="submit"
              >
                {LIBELLES[statut]}
              </button>
            </form>
          ))}
        </div>
      ) : null}

      <section className="space-y-3">
        {messages.map((message) => (
          <article
            className="rounded-2xl border border-stone-200 bg-white p-4"
            key={message.id}
          >
            <header className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <p className="font-medium">{message.auteurLabel}</p>
              <p className="text-stone-500">
                {message.createdAt.toISOString().slice(0, 16).replace("T", " ")}
              </p>
            </header>
            <p className="mt-2 whitespace-pre-line text-stone-700">
              {message.contenu}
            </p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Répondre</h2>
        <div className="mt-4">
          <FormulaireReponse ticketId={ticket.id} />
        </div>
      </section>
    </main>
  );
}
