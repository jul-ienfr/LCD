"use client";

import { useActionState } from "react";
import {
  relancerFacturesEchuesAction,
  type EtatRelancesFactures,
} from "./relances-actions";

const etatInitial: EtatRelancesFactures = { ok: false, message: "" };

export function FormulaireRelances({ nombre }: { nombre: number }) {
  const [etat, action, enCours] = useActionState(
    relancerFacturesEchuesAction,
    etatInitial,
  );

  return (
    <form
      action={action}
      className="space-y-3 rounded-2xl border border-alerte bg-alerte-douce p-5"
    >
      <p className="text-sm text-alerte">
        {nombre > 0
          ? `${nombre} facture${nombre > 1 ? "s" : ""} émise${nombre > 1 ? "s" : ""} échue${nombre > 1 ? "s" : ""} restent à relancer aujourd’hui.`
          : "Toutes les factures échues ont déjà été relancées aujourd’hui."}
      </p>
      <p className="text-xs text-encre-douce">
        Un seul email par facture et par jour, même si vous cliquez plusieurs
        fois. Les factures soldées et sans email valide sont ignorées.
      </p>
      <button
        className="rounded-full border border-alerte px-4 py-2 text-sm font-medium text-alerte disabled:opacity-50"
        disabled={enCours || nombre === 0}
        type="submit"
      >
        {enCours ? "Relances en cours…" : "Relancer les factures échues"}
      </button>
      {etat.message ? (
        <p
          className={
            etat.ok ? "text-sm text-accent" : "text-sm text-danger"
          }
        >
          {etat.message}
        </p>
      ) : null}
    </form>
  );
}
