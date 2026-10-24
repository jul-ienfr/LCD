"use client";

import { useActionState } from "react";
import {
  changerMotDePasseAction,
  type EtatMotDePasse,
} from "./mot-de-passe-actions";

const etatInitial: EtatMotDePasse = { ok: false, message: "" };

export function FormulaireMotDePasse() {
  const [etat, action, enCours] = useActionState(
    changerMotDePasseAction,
    etatInitial,
  );

  return (
    <form action={action} className="space-y-4">
      <label className="block space-y-1 text-sm font-medium">
        <span>Mot de passe actuel</span>
        <input
          autoComplete="current-password"
          className="w-full rounded-xl border border-stone-300 p-3 text-base"
          name="motDePasseActuel"
          required
          type="password"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1 text-sm font-medium">
          <span>Nouveau mot de passe</span>
          <input
            autoComplete="new-password"
            className="w-full rounded-xl border border-stone-300 p-3 text-base"
            minLength={12}
            name="nouveauMotDePasse"
            required
            type="password"
          />
          <span className="block text-xs font-normal text-stone-500">
            12 caractères minimum.
          </span>
        </label>
        <label className="block space-y-1 text-sm font-medium">
          <span>Confirmation</span>
          <input
            autoComplete="new-password"
            className="w-full rounded-xl border border-stone-300 p-3 text-base"
            minLength={12}
            name="confirmation"
            required
            type="password"
          />
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
        {enCours ? "Modification…" : "Changer le mot de passe"}
      </button>
    </form>
  );
}
