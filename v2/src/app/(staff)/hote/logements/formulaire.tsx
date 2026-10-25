"use client";

import { useActionState } from "react";
import {
  creerLogementAction,
  type EtatFormulaireLogement,
} from "./actions";

const etatInitial: EtatFormulaireLogement = { ok: false, message: "" };

export function FormulaireLogement() {
  const [etat, action, enCours] = useActionState(
    creerLogementAction,
    etatInitial,
  );

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1 text-sm font-medium">
          <span>Code</span>
          <input
            className="w-full rounded-xl border border-bordure p-3 text-base"
            name="code"
            placeholder="log-1"
            pattern="[a-z0-9][a-z0-9-]{0,30}[a-z0-9]"
            required
          />
          <span className="block text-xs font-normal text-encre-faine">
            minuscules, chiffres, tirets — stable dans les URLs
          </span>
        </label>

        <label className="block space-y-1 text-sm font-medium">
          <span>Nom</span>
          <input
            className="w-full rounded-xl border border-bordure p-3 text-base"
            name="nom"
            placeholder="Santa Severa"
            required
          />
        </label>
      </div>

      <label className="block space-y-1 text-sm font-medium">
        <span>Adresse (facultatif)</span>
        <input
          className="w-full rounded-xl border border-bordure p-3 text-base"
          name="adresse"
          placeholder="Saint-Laurent-du-Var"
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
        {enCours ? "Création…" : "Créer le logement"}
      </button>
    </form>
  );
}
