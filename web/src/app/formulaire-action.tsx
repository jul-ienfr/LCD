"use client";
// Formulaire 1-tap : <form action={serverAction}> = POST natif.
// Sans JS le navigateur soumet normalement ; avec JS, useActionState affiche
// le résultat sans recharger. Progressive enhancement, pas de fetch manuel.
import { useActionState, useEffect, useState } from "react";
import { executerAction } from "./actions";
import { EVENEMENT_OUTBOX, outboxNavigateur, signalerOutbox } from "@/lib/outbox";

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
  horsLigne = false,
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
  // F4 §F8 : file d'attente hors-ligne (dash voyageur/presta uniquement).
  horsLigne?: boolean;
}) {
  const [etat, formAction, pending] = useActionState(executerAction, null);
  const [misEnAttente, setMisEnAttente] = useState("");

  // Quand la file se vide (rejeu au retour reseau), le message s'efface.
  useEffect(() => {
    if (!misEnAttente) return;
    const vider = async () => {
      const ref = misEnAttente.split("|")[0];
      if (!(await outboxNavigateur().contient(ref))) setMisEnAttente("");
    };
    window.addEventListener(EVENEMENT_OUTBOX, vider);
    return () => window.removeEventListener(EVENEMENT_OUTBOX, vider);
  }, [misEnAttente]);

  const refFormulaire = `${refBase}-${actionId}`;
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
      <form
        action={formAction}
        className="flex flex-col gap-2.5 border-t border-[var(--bordure)] p-3.5"
        onSubmit={(e) => {
          // Offline + opt-in : la soumission devient une entree d'outbox
          // (ref idempotente, rejeu MPA identique au natif au retour reseau).
          if (!horsLigne || typeof navigator === "undefined" || navigator.onLine) return;
          e.preventDefault();
          const form = e.currentTarget;
          const fd = new FormData(form);
          const ref = String(fd.get("ref") || refFormulaire);
          outboxNavigateur()
            .ajouter({
              ref,
              url: window.location.pathname + window.location.search,
              champs: Array.from(fd.entries()).map(([k, v]) => [k, String(v)]),
              ts: Date.now(),
            })
            .then(() => {
              signalerOutbox();
              setMisEnAttente(`${ref}|${libelle}`);
            });
        }}
      >
        <input type="hidden" name="box_id" value={boxId} />
        <input type="hidden" name="logement_id" value={logementId} />
        <input type="hidden" name="action" value={actionId} />
        <input type="hidden" name="ref" value={refFormulaire} />
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
        {misEnAttente && (
          <p
            role="status"
            className="rounded-xl bg-[var(--alerte-douce)] px-3 py-2 text-sm font-semibold text-[var(--alerte)]"
          >
            Hors ligne : écriture mise en attente (ref {misEnAttente.split("|")[0]}) — envoi
            automatique au retour du réseau.
          </p>
        )}
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
