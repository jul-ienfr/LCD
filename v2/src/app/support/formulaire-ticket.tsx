"use client";

import { useActionState } from "react";
import { creerTicketAction, type EtatTicket } from "./actions";

const etatInitial: EtatTicket = { ok: false, message: "" };

export function FormulaireTicket() {
  const [etat, action, enCours] = useActionState(
    creerTicketAction,
    etatInitial,
  );

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
        <label className="block space-y-1 text-sm font-medium">
          <span>Sujet</span>
          <input
            className="w-full rounded-xl border border-bordure p-3 text-base"
            name="sujet"
            placeholder="Problème WiFi"
            required
          />
        </label>
        <label className="block space-y-1 text-sm font-medium">
          <span>Priorité</span>
          <select
            className="w-full rounded-xl border border-bordure p-3 text-base"
            defaultValue="normale"
            name="priorite"
          >
            <option value="basse">Basse</option>
            <option value="normale">Normale</option>
            <option value="haute">Haute</option>
            <option value="urgente">Urgente</option>
          </select>
        </label>
      </div>

      <label className="block space-y-1 text-sm font-medium">
        <span>Message</span>
        <textarea
          className="min-h-28 w-full rounded-xl border border-bordure p-3 text-base"
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
        {enCours ? "Envoi…" : "Ouvrir le ticket"}
      </button>
    </form>
  );
}
