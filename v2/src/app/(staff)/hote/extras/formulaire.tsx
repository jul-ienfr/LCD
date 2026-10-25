"use client";

import { useActionState } from "react";
import { creerExtraAction, type EtatExtra } from "./actions";

const etatInitial: EtatExtra = { ok: false, message: "" };

export function FormulaireExtra({
  logements,
}: {
  logements: { id: string; nom: string; code: string }[];
}) {
  const [etat, action, enCours] = useActionState(
    creerExtraAction,
    etatInitial,
  );

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1 text-sm font-medium">
          <span>Code</span>
          <input
            className="w-full rounded-xl border border-bordure p-3 font-mono text-base"
            name="code"
            placeholder="petit-dej"
            required
          />
        </label>
        <label className="block space-y-1 text-sm font-medium">
          <span>Nom</span>
          <input
            className="w-full rounded-xl border border-bordure p-3 text-base"
            name="nom"
            placeholder="Petit déjeuner"
            required
          />
        </label>
        <label className="block space-y-1 text-sm font-medium">
          <span>Prix (€)</span>
          <input
            className="w-full rounded-xl border border-bordure p-3 text-base"
            inputMode="decimal"
            name="prixEuros"
            placeholder="12"
            required
          />
        </label>
        <label className="block space-y-1 text-sm font-medium">
          <span>Logement (facultatif)</span>
          <select
            className="w-full rounded-xl border border-bordure p-3 text-base"
            name="logementId"
          >
            <option value="">Tous les logements</option>
            {logements.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nom} ({l.code})
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block space-y-1 text-sm font-medium">
        <span>Description (facultatif)</span>
        <textarea
          className="min-h-20 w-full rounded-xl border border-bordure p-3 text-base"
          name="description"
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
        {enCours ? "Création…" : "Créer l’extra"}
      </button>
    </form>
  );
}
