"use client";

import { useActionState } from "react";
import {
  envoyerFactureAction,
  type EtatEnvoiFacture,
} from "./envoyer-actions";

const etatInitial: EtatEnvoiFacture = { ok: false, message: "" };

export function FormulaireEnvoiFacture({
  factureId,
  emailDefaut,
}: {
  factureId: string;
  emailDefaut: string;
}) {
  const [etat, action, enCours] = useActionState(
    envoyerFactureAction,
    etatInitial,
  );

  return (
    <form action={action} className="space-y-3">
      <input name="factureId" type="hidden" value={factureId} />
      <label className="block space-y-1 text-sm font-medium">
        <span>Email du client</span>
        <input
          className="w-full rounded-xl border border-bordure p-3 text-base"
          defaultValue={emailDefaut}
          name="email"
          placeholder="client@example.com"
          required
          type="email"
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
        className="rounded-full border border-bordure px-4 py-2 text-sm font-medium disabled:opacity-50"
        type="submit"
        disabled={enCours}
      >
        {enCours ? "Envoi…" : "Envoyer la facture"}
      </button>
    </form>
  );
}
