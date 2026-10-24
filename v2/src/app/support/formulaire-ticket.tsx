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
            className="w-full rounded-xl border border-stone-300 p-3 text-base"
            name="sujet"
            placeholder="Problème WiFi"
            required
          />
        </label>
        <label className="block space-y-1 text-sm font-medium">
          <span>Priorité</span>
          <select
            className="w-full rounded-xl border border-stone-300 p-3 text-base"
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
          className="min-h-28 w-full rounded-xl border border-stone-300 p-3 text-base"
          name="message"
          required
        />
      </label>

      {etat.message ? (
        <p
          className={
            etat.ok
              ? "rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900"
              : "rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-800"
          }
        >
          {etat.message}
        </p>
      ) : null}

      <button
        className="rounded-full bg-stone-900 px-5 py-3 text-sm font-medium text-white disabled:opacity-50"
        type="submit"
        disabled={enCours}
      >
        {enCours ? "Envoi…" : "Ouvrir le ticket"}
      </button>
    </form>
  );
}
