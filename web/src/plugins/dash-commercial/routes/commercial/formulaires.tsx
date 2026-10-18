"use client";
// Pages commercial : formulaires prospect/simulateur (scope §14.5).
// Sans JS : POST natif vers les Server Actions.
import { useActionState } from "react";
import { creerProspect, calculerSimulateur, offreGenerer } from "@/app/actions";

const FORFAITS = ["kit", "pilotage", "full_service"] as const;

export function FormProspect({ envoyer }: { envoyer: string }) {
  const [etat, formAction, pending] = useActionState(creerProspect, null);
  return (
    <form action={formAction} className="flex flex-col gap-2.5">
      <input type="hidden" name="qui" value="commercial_01" />
      {(["prospect_id", "nom", "bien", "source", "contact_ref"] as const).map((k) => (
        <label key={k} className="text-sm font-medium">{k}{k === "prospect_id" ? " *" : ""}
          <input name={k} required={k === "prospect_id"} className="champ mt-1" autoComplete="off" />
        </label>
      ))}
      <button type="submit" disabled={pending} className="bouton bouton-principal mt-1">{pending ? "…" : envoyer}</button>
      {etat && (
        <p role="status" className={`rounded-xl px-3 py-2 text-sm ${etat.ok ? "bg-[var(--ok-douce)] text-[var(--ok)]" : "bg-[var(--danger-douce)] text-[var(--danger)]"}`}>
          {etat.message}
        </p>
      )}
    </form>
  );
}

export function FormSimulateur({ envoyer }: { envoyer: string }) {
  const [etat, formAction, pending] = useActionState(calculerSimulateur, null);
  return (
    <form action={formAction} className="flex flex-col gap-2.5">
      <input type="hidden" name="qui" value="commercial_01" />
      {(["entite_id", "adr", "occupation_pct", "nuits_an", "commission_pct", "plateforme_pct"] as const).map((k) => (
        <label key={k} className="text-sm font-medium">{k}{k === "entite_id" ? " *" : ""}
          <input name={k} required={k === "entite_id"} inputMode="decimal" className="champ mt-1" autoComplete="off" />
        </label>
      ))}
      <label className="text-sm font-medium">forfait
        <select name="forfait" defaultValue="full_service" className="champ mt-1">
          {FORFAITS.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </label>
      <button type="submit" disabled={pending} className="bouton bouton-principal mt-1">{pending ? "…" : envoyer}</button>
      {etat && (
        <p role="status" className={`rounded-xl px-3 py-2 text-sm ${etat.ok ? "bg-[var(--ok-douce)] text-[var(--ok)]" : "bg-[var(--danger-douce)] text-[var(--danger)]"}`}>
          {etat.message}
        </p>
      )}
    </form>
  );
}

// Génération de l'offre (§14.5) : textuel, marque posée par crm.py
// (indicatif everywhere, mention fiscale incluse). Sans JS : POST natif.
export function FormOffre({ envoyer }: { envoyer: string }) {
  const [etat, formAction, pending] = useActionState(offreGenerer, null);
  return (
    <form action={formAction} className="flex flex-col gap-2.5">
      <label className="text-sm font-medium">prospect_id *
        <input name="prospect_id" required className="champ mt-1" placeholder="pr01" autoComplete="off" />
      </label>
      <label className="text-sm font-medium">
        simulation (JSON optionnel)
        <textarea
          name="simulation"
          rows={3}
          className="champ mt-1 font-mono text-xs"
          placeholder={'{"adr":110,"net_avant_fisc":9000,"commission_pct":25}'}
        />
      </label>
      <button type="submit" disabled={pending} className="bouton bouton-principal mt-1">{pending ? "…" : envoyer}</button>
      {etat && (
        <pre
          role="status"
          className={`whitespace-pre-wrap rounded-xl px-3 py-2 text-xs ${etat.ok ? "bg-[var(--surface-2)] text-[var(--encre)]" : "bg-[var(--danger-douce)] text-[var(--danger)]"}`}
        >
          {etat.message}
        </pre>
      )}
    </form>
  );
}
