"use client";
// Pages commercial : pipeline (SSR via props) + formulaires prospect/simulateur.
// Sans JS : POST natif vers les Server Actions.
import { useActionState } from "react";
import { creerProspect, calculerSimulateur } from "../actions";

export function FormProspect({ envoyer }: { envoyer: string }) {
  const [etat, formAction, pending] = useActionState(creerProspect, null);
  const inp = "mt-1 w-full rounded-lg border border-zinc-300 bg-white px-2 py-1.5 dark:border-zinc-600 dark:bg-zinc-800";
  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="qui" value="commercial_01" />
      {(["prospect_id", "nom", "bien", "source", "contact_ref"] as const).map((k) => (
        <label key={k} className="text-sm">{k} : <input name={k} required={k === "prospect_id"} className={inp} /></label>
      ))}
      <button type="submit" disabled={pending} className="rounded-full bg-teal-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{pending ? "…" : envoyer}</button>
      {etat && <p role="status" className={`text-sm ${etat.ok ? "text-emerald-700" : "text-red-700"}`}>{etat.message}</p>}
    </form>
  );
}

export function FormSimulateur({ envoyer }: { envoyer: string }) {
  const [etat, formAction, pending] = useActionState(calculerSimulateur, null);
  const inp = "mt-1 w-full rounded-lg border border-zinc-300 bg-white px-2 py-1.5 dark:border-zinc-600 dark:bg-zinc-800";
  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="qui" value="commercial_01" />
      {(["entite_id", "adr", "occupation_pct", "nuits_an", "commission_pct", "plateforme_pct"] as const).map((k) => (
        <label key={k} className="text-sm">{k} : <input name={k} required={k === "entite_id"} className={inp} /></label>
      ))}
      <button type="submit" disabled={pending} className="rounded-full bg-teal-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{pending ? "…" : envoyer}</button>
      {etat && <p role="status" className={`text-sm ${etat.ok ? "text-emerald-700" : "text-red-700"}`}>{etat.message}</p>}
    </form>
  );
}
