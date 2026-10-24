"use client";

import { useActionState } from "react";
import type { Logement } from "@/domain/logement";
import {
  creerReservationAction,
  type EtatFormulaireReservation,
} from "./actions";

const etatInitial: EtatFormulaireReservation = { ok: false, message: "" };

export function FormulaireReservation({
  logements,
  logementId,
  debutDefaut,
  finDefaut,
}: {
  logements: Pick<Logement, "id" | "nom" | "code">[];
  logementId: string;
  debutDefaut: string;
  finDefaut: string;
}) {
  const [etat, action, enCours] = useActionState(
    creerReservationAction,
    etatInitial,
  );

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
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
          <span>Référence</span>
          <input
            className="w-full rounded-xl border border-stone-300 p-3 text-base"
            name="ref"
            placeholder="resa-2026-001"
            required
          />
        </label>

        <label className="block space-y-1 text-sm font-medium">
          <span>Client (facultatif)</span>
          <input
            className="w-full rounded-xl border border-stone-300 p-3 text-base"
            name="clientNom"
            placeholder="Nom du voyageur"
          />
        </label>

        <label className="block space-y-1 text-sm font-medium">
          <span>Voyageurs</span>
          <input
            className="w-full rounded-xl border border-stone-300 p-3 text-base"
            defaultValue={2}
            max={20}
            min={1}
            name="voyageurs"
            type="number"
          />
        </label>

        <label className="block space-y-1 text-sm font-medium">
          <span>Début</span>
          <input
            className="w-full rounded-xl border border-stone-300 p-3 text-base"
            defaultValue={debutDefaut}
            name="debut"
            type="date"
            required
          />
        </label>

        <label className="block space-y-1 text-sm font-medium">
          <span>Fin (exclusive)</span>
          <input
            className="w-full rounded-xl border border-stone-300 p-3 text-base"
            defaultValue={finDefaut}
            name="fin"
            type="date"
            required
          />
        </label>

        <label className="block space-y-1 text-sm font-medium">
          <span>Montant (€)</span>
          <input
            className="w-full rounded-xl border border-stone-300 p-3 text-base"
            defaultValue="0"
            inputMode="decimal"
            name="montantEuros"
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
        {enCours ? "Création…" : "Créer la réservation"}
      </button>
    </form>
  );
}
