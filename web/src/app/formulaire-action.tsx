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
}) {
  const [etat, formAction, pending] = useActionState(executerAction, null);
  return (
    <details className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-700">
      <summary className="cursor-pointer font-medium">{libelle}</summary>
      <form action={formAction} className="mt-2 flex flex-col gap-2">
        <input type="hidden" name="box_id" value={boxId} />
        <input type="hidden" name="logement_id" value={logementId} />
        <input type="hidden" name="action" value={actionId} />
        <input type="hidden" name="ref" value={`${refBase}-${actionId}`} />
        <label className="text-sm">
          {choisirQui} :{" "}
          <select name="qui" required defaultValue="" className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-2 py-1.5 dark:border-zinc-600 dark:bg-zinc-800">
            <option value="">—</option>
            {humains.map(([id, lib]) => (
              <option key={id} value={id}>{lib}</option>
            ))}
          </select>
        </label>
        {champs.map((c) => (
          <label key={c} className="text-sm">
            {c} :{" "}
            <input name={c} defaultValue={exemples[c] ?? ""} className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-2 py-1.5 dark:border-zinc-600 dark:bg-zinc-800" />
          </label>
        ))}
        <button type="submit" disabled={pending} className="rounded-full bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50">
          {pending ? "…" : envoyer}
        </button>
        {etat && (
          <p role="status" className={`text-sm ${etat.ok ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}>
            {etat.message}
          </p>
        )}
      </form>
    </details>
  );
}
