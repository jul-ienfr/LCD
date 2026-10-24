"use client";

import { useActionState } from "react";
import { creerOffreAction, type EtatOffre } from "./actions";

const etatInitial: EtatOffre = { ok: false, message: "" };

export function FormulaireOffre({
  prospectId,
  logements,
}: {
  prospectId: string;
  logements: { id: string; nom: string; code: string }[];
}) {
  const [etat, action, enCours] = useActionState(
    creerOffreAction,
    etatInitial,
  );

  return (
    <form action={action} className="space-y-4">
      <input name="prospectId" type="hidden" value={prospectId} />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1 text-sm font-medium">
          <span>Titre</span>
          <input
            className="w-full rounded-xl border border-stone-300 p-3 text-base"
            name="titre"
            placeholder="Forfait FULL"
            required
          />
        </label>
        <label className="block space-y-1 text-sm font-medium">
          <span>Montant (€)</span>
          <input
            className="w-full rounded-xl border border-stone-300 p-3 text-base"
            inputMode="decimal"
            name="montantEuros"
            placeholder="149"
            required
          />
        </label>
        <label className="block space-y-1 text-sm font-medium sm:col-span-2">
          <span>Logement concerné (facultatif)</span>
          <select
            className="w-full rounded-xl border border-stone-300 p-3 text-base"
            name="logementId"
          >
            <option value="">Aucun</option>
            {logements.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nom} ({l.code})
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block space-y-1 text-sm font-medium">
        <span>Notes (facultatif)</span>
        <textarea
          className="min-h-20 w-full rounded-xl border border-stone-300 p-3 text-base"
          name="notes"
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
        {enCours ? "Création…" : "Créer l’offre"}
      </button>
    </form>
  );
}
