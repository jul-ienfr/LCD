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
            className="w-full rounded-xl border border-bordure p-3 text-base"
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
            className="w-full rounded-xl border border-bordure p-3 text-base"
            defaultValue={dateDefaut}
            name="date"
            type="date"
            required
          />
        </label>

        <label className="block space-y-1 text-sm font-medium">
          <span>Prix de la nuit (€)</span>
          <input
            className="w-full rounded-xl border border-bordure p-3 text-base"
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
        {enCours ? "Enregistrement…" : "Enregistrer le prix"}
      </button>
    </form>
  );
}
