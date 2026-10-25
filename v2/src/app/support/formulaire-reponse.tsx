"use client";

import { useActionState } from "react";
import { repondreTicketAction, type EtatReponse } from "./actions";

const etatInitial: EtatReponse = { ok: false, message: "" };

export function FormulaireReponse({ ticketId }: { ticketId: string }) {
  const [etat, action, enCours] = useActionState(
    repondreTicketAction,
    etatInitial,
  );

  return (
    <form action={action} className="space-y-3">
      <input name="ticketId" type="hidden" value={ticketId} />
      <label className="block space-y-1 text-sm font-medium">
        <span>Répondre</span>
        <textarea
          className="min-h-24 w-full rounded-xl border border-bordure p-3 text-base"
          name="message"
          required
        />
      </label>
      {etat.message ? (
        <p
          className={
            etat.ok
              ? "rounded-xl border border-accent bg-accent-douce p-3 text-sm text-accent"
              : "rounded-xl border border-danger bg-danger-douce p-3 text-sm text-danger"
          }
        >
          {etat.message}
        </p>
      ) : null}
      <button
        className="rounded-full bg-encre px-5 py-3 text-sm font-medium text-fond disabled:opacity-50"
        type="submit"
        disabled={enCours}
      >
        {enCours ? "Envoi…" : "Envoyer la réponse"}
      </button>
    </form>
  );
}
