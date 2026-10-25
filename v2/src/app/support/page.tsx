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
          <p className="text-sm font-medium uppercase tracking-widest text-encre-faine">
            Support
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            {estStaff ? "Tickets support" : "Mes demandes"}
          </h1>
          <p className="text-encre-douce">
            {tickets.length} ticket{tickets.length > 1 ? "s" : ""} ·{" "}
            {session.user.email}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link className="text-sm underline" href="/hote/securite">
            Sécurité / 2FA
          </Link>
          <BoutonDeconnexion />
        </div>
      </header>

      <section className="rounded-2xl border border-bordure bg-surface p-6 shadow-sm">
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
          <p className="rounded-2xl border border-dashed border-bordure p-6 text-encre-douce">
            Aucun ticket pour le moment.
          </p>
        ) : (
          <ul className="divide-y divide-bordure rounded-2xl border border-bordure bg-surface">
            {tickets.map((ticket) => (
              <li className="p-4" key={ticket.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link
                    className="font-medium underline"
                    href={`/support/${ticket.id}`}
                  >
                    {ticket.sujet}
                  </Link>
                  <span className="rounded-full bg-surface-2 px-3 py-1 text-xs font-medium">
                    {ticket.statut} · {ticket.priorite}
                  </span>
                </div>
                <p className="mt-1 text-sm text-encre-faine">
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
