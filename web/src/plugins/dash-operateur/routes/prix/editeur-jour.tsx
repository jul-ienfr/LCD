"use client";
// Éditeur de prix : 1 ligne = 1 jour, POST natif prix 1-tap (pricing).
// La passerelle re-vérifie `qui` + bornes (prix_min/prix_max du registre).
import { useActionState } from "react";
import { executerAction, type ResultatAction } from "@/app/actions";

export function PrixJour({
  date,
  actuel,
  boxId,
  logementId,
}: {
  date: string;
  actuel: number | null;
  boxId: string;
  logementId: string;
}) {
  const [etat, formAction, pending] = useActionState<ResultatAction | null, FormData>(
    executerAction,
    null,
  );
  return (
    <form action={formAction} className="flex flex-wrap items-center gap-1.5">
      <input type="hidden" name="box_id" value={boxId} />
      <input type="hidden" name="logement_id" value={logementId} />
      <input type="hidden" name="action" value="prix" />
      <input type="hidden" name="ref" value={`WEB-PRIX-${logementId}-${date}`} />
      <input type="hidden" name="date" value={date} />
      <input
        name="qui"
        required
        list="qui-prix"
        defaultValue="personne_03"
        className="champ w-36 px-2 py-1 text-xs"
        aria-label={`qui pour ${date}`}
      />
      <span className="text-xs tabular-nums text-(--encre-faine)">{date.slice(5)}</span>
      <input
        name="prix"
        inputMode="numeric"
        defaultValue={actuel ?? ""}
        placeholder="—"
        className="champ w-20 px-2 py-1 text-right text-sm tabular-nums"
        aria-label={`prix ${date}`}
      />
      <span className="text-xs text-(--encre-faine)">€</span>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg border border-[var(--bordure)] px-2 py-1 text-xs font-semibold hover:bg-(--surface-2)"
      >
        {pending ? "…" : "↵"}
      </button>
      {etat && (
        <span
          className={`w-full text-xs ${etat.ok ? "text-(--ok)" : "text-(--danger)"}`}
          role="status"
        >
          {etat.message}
        </span>
      )}
    </form>
  );
}

export function QuiListe({ ids }: { ids: string[] }) {
  return (
    <datalist id="qui-prix">
      {ids.map((q) => (
        <option key={q} value={q} />
      ))}
    </datalist>
  );
}
