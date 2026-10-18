"use client";
// Étape 7 : création du logement via POST /parc/logements (useActionState).
// Sans JS : POST natif vers la Server Action, re-rendu avec le résultat.
import { useActionState } from "react";
import { onboardingCreer, type ResultatAction } from "@/app/actions";

export function CarteCreation({
  quiDefaut,
  envoyer,
}: {
  quiDefaut: string;
  envoyer: string;
}) {
  const [etat, formAction, pending] = useActionState<ResultatAction | null, FormData>(
    onboardingCreer,
    null,
  );
  const QUI: [string, string][] = [
    ["personne_01", "personne_01 (super_admin)"],
    ["personne_02", "personne_02 (admin)"],
  ];
  return (
    <form action={formAction} className="mt-4 flex flex-col gap-3">
      <label className="text-sm font-medium">
        Logement ID (a-z0-9, vide = auto)
        <input name="logement_id" className="champ mt-1" placeholder="log9" autoComplete="off" />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium">
          Nom du logement *
          <input name="nom" required className="champ mt-1" placeholder="Villa Studio Nice" autoComplete="off" />
        </label>
        <label className="text-sm font-medium">
          Commune *
          <input name="commune" required className="champ mt-1" placeholder="Nice" autoComplete="off" />
        </label>
        <label className="text-sm font-medium">
          Capacité (voyageurs) *
          <input name="capacite" required type="number" min="1" max="16" className="champ mt-1" defaultValue="4" />
        </label>
        <label className="text-sm font-medium">
          Surface m²
          <input name="surface_m2" type="number" min="0" className="champ mt-1" defaultValue="45" />
        </label>
        <label className="text-sm font-medium">
          Prix de base (nuit, €)
          <input name="prix_base" type="number" min="10" max="290" className="champ mt-1" defaultValue="110" />
        </label>
        <label className="text-sm font-medium">
          Opérateur (qui, journalisé)
          <select name="qui" className="champ mt-1" defaultValue={quiDefaut || "personne_01"}>
            {QUI.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="smart_lock" /> Serrure connectée (Nuki/Matter)
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="voix" /> Voix satellite (S3-BOX/Atom)
        </label>
      </div>
      <button type="submit" disabled={pending} className="bouton bouton-principal self-start">
        {pending ? "…" : envoyer}
      </button>
      {etat && (
        <p
          role="status"
          className={`rounded-xl px-3 py-2 text-sm ${etat.ok ? "bg-(--ok-douce) text-(--ok)" : "bg-(--danger-douce) text-(--danger)"}`}
        >
          {etat.message}
        </p>
      )}
    </form>
  );
}
