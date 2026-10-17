"use client";
// Formulaire 1-tap : <form action={serverAction}> = POST natif.
// Sans JS le navigateur soumet normalement ; avec JS, useActionState affiche
// le résultat sans recharger. Progressive enhancement, pas de fetch manuel.
import { useActionState } from "react";
import { executerAction } from "./actions";

export function FormulaireAction({
  actionId,
  libelle,
  champs,
  exemples,
  boxId,
  logementId,
  refBase,
  humains,
  envoyer,
  choisirQui,
  quiDefaut = "",
}: {
  actionId: string;
  libelle: string;
  champs: string[];
  exemples: Record<string, string>;
  boxId: string;
  logementId: string;
  refBase: string;
  humains: [string, string][];
  envoyer: string;
  choisirQui: string;
  quiDefaut?: string;
}) {
  const [etat, formAction, pending] = useActionState(executerAction, null);
  return (
    <details className="group rounded-xl border border-[var(--bordure)] bg-[var(--surface)]">
      <summary className="flex cursor-pointer list-none items-center gap-2 p-3.5 font-semibold [&::-webkit-details-marker]:hidden">
        <span
          aria-hidden
          className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-[var(--accent-douce)] text-sm text-[var(--accent-fonce)] transition-transform group-open:rotate-90"
        >
          ›
        </span>
        {libelle}
      </summary>
      <form action={formAction} className="flex flex-col gap-2.5 border-t border-[var(--bordure)] p-3.5">
        <input type="hidden" name="box_id" value={boxId} />
        <input type="hidden" name="logement_id" value={logementId} />
        <input type="hidden" name="action" value={actionId} />
        <input type="hidden" name="ref" value={`${refBase}-${actionId}`} />
        <label className="text-sm font-medium">
          {choisirQui}
          <select name="qui" required defaultValue={quiDefaut} className="champ mt-1">
            {quiDefaut ? null : <option value="">—</option>}
            {humains.map(([id, lib]) => (
              <option key={id} value={id}>{lib}</option>
            ))}
          </select>
        </label>
        {champs.map((c) => (
          <label key={c} className="text-sm font-medium">
            {c}
            <input name={c} defaultValue={exemples[c] ?? ""} className="champ mt-1" autoComplete="off" />
          </label>
        ))}
        <button type="submit" disabled={pending} className="bouton bouton-principal mt-1">
          {pending ? "…" : envoyer}
        </button>
        {etat && (
          <p
            role="status"
            className={`rounded-xl px-3 py-2 text-sm ${etat.ok ? "bg-[var(--ok-douce)] text-[var(--ok)]" : "bg-[var(--danger-douce)] text-[var(--danger)]"}`}
          >
            {etat.message}
          </p>
        )}
      </form>
    </details>
  );
}
