"use client";

import { useActionState } from "react";
import {
  assignerProprietaireAction,
  type EtatAssignation,
} from "./actions";

const etatInitial: EtatAssignation = { ok: false, message: "" };

export function FormulaireAssignation({
  proprietaires,
  logements,
}: {
  proprietaires: { id: string; name: string; email: string }[];
  logements: { id: string; nom: string; code: string }[];
}) {
  const [etat, action, enCours] = useActionState(
    assignerProprietaireAction,
    etatInitial,
  );

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1 text-sm font-medium">
          <span>Propriétaire</span>
          <select
            className="w-full rounded-xl border border-stone-300 p-3 text-base"
            name="userId"
            required
          >
            {proprietaires.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.email})
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1 text-sm font-medium">
          <span>Logement</span>
          <select
            className="w-full rounded-xl border border-stone-300 p-3 text-base"
            name="logementId"
            required
          >
            {logements.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nom} ({l.code})
              </option>
            ))}
          </select>
        </label>
      </div>

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
        {enCours ? "Rattachement…" : "Rattacher le propriétaire"}
      </button>
    </form>
  );
}
