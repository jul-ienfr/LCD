"use client";

import { useActionState, useState } from "react";
import {
  LIBELLES_MODE_PAIEMENT,
  MODES_PAIEMENT,
} from "@/domain/paiement";
import { formaterEuros } from "@/lib/format";
import {
  enregistrerPaiementAction,
  type EtatPaiement,
} from "./paiement-actions";

const etatInitial: EtatPaiement = { ok: false, message: "" };

export function FormulairePaiement({
  factureId,
  resteCentimes,
  dateDefaut,
}: {
  factureId: string;
  resteCentimes: number;
  dateDefaut: string;
}) {
  const [etat, action, enCours] = useActionState(
    enregistrerPaiementAction,
    etatInitial,
  );
  const [ref] = useState(() => crypto.randomUUID());
  const [montant, setMontant] = useState(
    (resteCentimes / 100).toFixed(2).replace(".", ","),
  );

  return (
    <form action={action} className="space-y-4">
      <input name="factureId" type="hidden" value={factureId} />
      <input name="ref" type="hidden" value={ref} />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1 text-sm font-medium">
          <span>Montant (€)</span>
          <input
            className="w-full rounded-xl border border-stone-300 p-3 text-base"
            inputMode="decimal"
            name="montantEuros"
            value={montant}
            onChange={(e) => setMontant(e.target.value)}
            required
          />
          <span className="block text-xs font-normal text-stone-500">
            Reste à payer : {formaterEuros(resteCentimes)}
          </span>
        </label>
        <label className="block space-y-1 text-sm font-medium">
          <span>Date</span>
          <input
            className="w-full rounded-xl border border-stone-300 p-3 text-base"
            defaultValue={dateDefaut}
            name="datePaiement"
            type="date"
            required
          />
        </label>
        <label className="block space-y-1 text-sm font-medium">
          <span>Mode</span>
          <select
            className="w-full rounded-xl border border-stone-300 p-3 text-base"
            defaultValue="virement"
            name="mode"
          >
            {MODES_PAIEMENT.map((mode) => (
              <option key={mode} value={mode}>
                {LIBELLES_MODE_PAIEMENT[mode]}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1 text-sm font-medium">
          <span>Référence (facultatif)</span>
          <input
            className="w-full rounded-xl border border-stone-300 p-3 text-base"
            name="reference"
            placeholder="VIR-2026-11"
          />
        </label>
      </div>

      <label className="block space-y-1 text-sm font-medium">
        <span>Notes (facultatif)</span>
        <textarea
          className="min-h-16 w-full rounded-xl border border-stone-300 p-3 text-base"
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
        {enCours ? "Enregistrement…" : "Enregistrer le paiement"}
      </button>
    </form>
  );
}
