"use client";

import { useActionState } from "react";
import { creerProspectAction, type EtatProspect } from "./actions";

const etatInitial: EtatProspect = { ok: false, message: "" };

export function FormulaireProspect() {
  const [etat, action, enCours] = useActionState(
    creerProspectAction,
    etatInitial,
  );

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1 text-sm font-medium">
          <span>Nom</span>
          <input
            className="w-full rounded-xl border border-bordure p-3 text-base"
            name="nom"
            required
          />
        </label>
        <label className="block space-y-1 text-sm font-medium">
          <span>Email (facultatif)</span>
          <input
            className="w-full rounded-xl border border-bordure p-3 text-base"
            name="email"
            type="email"
          />
        </label>
        <label className="block space-y-1 text-sm font-medium">
          <span>Téléphone (facultatif)</span>
          <input
            className="w-full rounded-xl border border-bordure p-3 text-base"
            name="telephone"
          />
        </label>
        <label className="block space-y-1 text-sm font-medium">
          <span>Source</span>
          <select
            className="w-full rounded-xl border border-bordure p-3 text-base"
            defaultValue="site"
            name="source"
          >
            <option value="site">Site</option>
            <option value="recommandation">Recommandation</option>
            <option value="salon">Salon</option>
            <option value="manuel">Manuel</option>
            <option value="autre">Autre</option>
          </select>
        </label>
      </div>

      <label className="block space-y-1 text-sm font-medium">
        <span>Notes (facultatif)</span>
        <textarea
          className="min-h-20 w-full rounded-xl border border-bordure p-3 text-base"
          name="notes"
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
        {enCours ? "Création…" : "Créer le prospect"}
      </button>
    </form>
  );
}
