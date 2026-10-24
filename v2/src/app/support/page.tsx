import Link from "next/link";
import { connection } from "next/server";
import { DrizzleTicketRepository } from "@/infrastructure/db/repositories/ticket-repository";
import { requireSession, tenantIdDeSession } from "@/lib/session";
import { BoutonDeconnexion } from "@/components/bouton-deconnexion";
import { FormulaireTicket } from "./formulaire-ticket";

export const instant = false;

export default async function PageSupport() {
  await connection();

  const session = await requireSession();
  const tenantId = tenantIdDeSession(session);
  const estStaff = ["admin", "hote"].includes(session.user.role ?? "");

  const tickets = await new DrizzleTicketRepository().lister(
    tenantId,
    estStaff ? undefined : { createdByUserId: session.user.id },
  );

  return (
    <main className="mx-auto max-w-4xl space-y-8 px-6 py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-widest text-stone-500">
            Support
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            {estStaff ? "Tickets support" : "Mes demandes"}
          </h1>
          <p className="text-stone-600">
            {tickets.length} ticket{tickets.length > 1 ? "s" : ""} ·{" "}
            {session.user.email}
          </p>
        </div>
        <BoutonDeconnexion />
      </header>

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Ouvrir un ticket</h2>
        <div className="mt-5">
          <FormulaireTicket />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          {estStaff ? "Tous les tickets" : "Mes tickets"}
        </h2>
        {tickets.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-stone-300 p-6 text-stone-600">
            Aucun ticket pour le moment.
          </p>
        ) : (
          <ul className="divide-y divide-stone-200 rounded-2xl border border-stone-200 bg-white">
            {tickets.map((ticket) => (
              <li className="p-4" key={ticket.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link
                    className="font-medium underline"
                    href={`/support/${ticket.id}`}
                  >
                    {ticket.sujet}
                  </Link>
                  <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium">
                    {ticket.statut} · {ticket.priorite}
                  </span>
                </div>
                <p className="mt-1 text-sm text-stone-500">
                  {ticket.ref} · {ticket.createdAt.toISOString().slice(0, 10)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Link className="text-sm underline" href="/">
        Retour à l’accueil
      </Link>
    </main>
  );
}
