"use client";
// Trancher un conflit split-brain (§16.2) : QUELLE version devient la vérité.
// Sans JS : POST natif vers la Server Action (qui + motif tracés, ref TRANCHE-*).
import { useActionState } from "react";
import { trancherConflit, type ResultatAction } from "../actions";

export function CarteTrancher({
  boxId,
  logementId,
  date,
  prixBox,
  prixCentrale,
  envoyer,
}: {
  boxId: string;
  logementId: string;
  date: string;
  prixBox: string;
  prixCentrale: string;
  envoyer: string;
}) {
  const [etat, formAction, pending] = useActionState<ResultatAction | null, FormData>(
    trancherConflit,
    null,
  );
  return (
    <form action={formAction} className="mt-2 flex flex-col gap-2 text-sm">
      <input type="hidden" name="box_id" value={boxId} />
      <input type="hidden" name="logement_id" value={logementId} />
      <input type="hidden" name="date" value={date} />
      <p className="rounded-xl bg-(--surface-2) px-3 py-2 font-mono text-xs">
        box = {prixBox} € &nbsp;·&nbsp; centrale = {prixCentrale} €
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="font-medium">
          La vérité est
          <select name="choix" required className="champ mt-1">
            <option value="box">box ({prixBox} €)</option>
            <option value="centrale">centrale ({prixCentrale} €)</option>
          </select>
        </label>
        <label className="font-medium">
          Qui (tracé, journalisé)
          <select name="qui" required className="champ mt-1" defaultValue="personne_01">
            {["personne_01", "personne_02", "personne_03"].map((q) => (
              <option key={q} value={q}>{q}</option>
            ))}
          </select>
        </label>
      </div>
      <label className="font-medium">
        Motif *
        <input name="motif" required className="champ mt-1" placeholder="pourquoi ce prix" autoComplete="off" />
      </label>
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
