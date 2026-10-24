"use client";

import { useActionState } from "react";
import type { Logement } from "@/domain/logement";
import {
  definirPrixAction,
  type EtatFormulairePrix,
} from "./actions";

const etatInitial: EtatFormulairePrix = { ok: false, message: "" };

export function FormulairePrix({
  logements,
  logementId,
  dateDefaut,
}: {
  logements: Pick<Logement, "id" | "nom" | "code">[];
  logementId: string;
  dateDefaut: string;
}) {
  const [etat, action, enCours] = useActionState(
    definirPrixAction,
    etatInitial,
  );

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block space-y-1 text-sm font-medium">
          <span>Logement</span>
          <select
            className="w-full rounded-xl border border-stone-300 p-3 text-base"
            defaultValue={logementId}
            name="logementId"
            required
          >
            {logements.map((logement) => (
              <option key={logement.id} value={logement.id}>
                {logement.nom} ({logement.code})
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1 text-sm font-medium">
          <span>Date</span>
          <input
            className="w-full rounded-xl border border-stone-300 p-3 text-base"
            defaultValue={dateDefaut}
            name="date"
            type="date"
            required
          />
        </label>

        <label className="block space-y-1 text-sm font-medium">
          <span>Prix de la nuit (€)</span>
          <input
            className="w-full rounded-xl border border-stone-300 p-3 text-base"
            inputMode="decimal"
            name="prixEuros"
            placeholder="120,00"
            required
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
        {enCours ? "Enregistrement…" : "Enregistrer le prix"}
      </button>
    </form>
  );
}
