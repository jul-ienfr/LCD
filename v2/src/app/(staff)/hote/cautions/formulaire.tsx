"use client";

import { useActionState } from "react";
import { creerCautionAction, type EtatCaution } from "./actions";

const etatInitial: EtatCaution = { ok: false, message: "" };

export function FormulaireCaution({
  reservations,
  mois,
}: {
  reservations: { id: string; ref: string; debut: string; fin: string }[];
  mois: string;
}) {
  const [etat, action, enCours] = useActionState(
    creerCautionAction,
    etatInitial,
  );

  return (
    <form action={action} className="space-y-4">
      <input name="mois" type="hidden" value={mois} />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1 text-sm font-medium">
          <span>Réservation</span>
          <select
            className="w-full rounded-xl border border-bordure p-3 text-base"
            name="reservationId"
            required
          >
            {reservations.map((reservation) => (
              <option key={reservation.id} value={reservation.id}>
                {reservation.ref} · {reservation.debut} → {reservation.fin}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1 text-sm font-medium">
          <span>Montant (€)</span>
          <input
            className="w-full rounded-xl border border-bordure p-3 text-base"
            inputMode="decimal"
            name="montantEuros"
            placeholder="500"
            required
          />
        </label>
      </div>

      <label className="block space-y-1 text-sm font-medium">
        <span>Notes (facultatif)</span>
        <textarea
          className="min-h-16 w-full rounded-xl border border-bordure p-3 text-base"
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
        {enCours ? "Création…" : "Créer la caution"}
      </button>
    </form>
  );
}
