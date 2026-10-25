"use client";

import { useActionState, useState } from "react";
import {
  enregistrerFluxAction,
  type EtatFluxIcs,
} from "./flux-actions";

const etatInitial: EtatFluxIcs = { ok: false, message: "" };

export function FormulaireFluxIcs({
  logementId,
}: {
  logementId: string;
}) {
  const [etat, action, enCours] = useActionState(
    enregistrerFluxAction,
    etatInitial,
  );
  const [libelle, setLibelle] = useState("");
  const [url, setUrl] = useState("");

  return (
    <form action={action} className="space-y-3">
      <input name="logementId" type="hidden" value={logementId} />
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block space-y-1 text-sm font-medium">
          <span>Libellé</span>
          <input
            className="w-full rounded-xl border border-stone-300 p-3 text-base"
            name="libelle"
            onChange={(event) => setLibelle(event.target.value)}
            placeholder="Airbnb"
            required
            value={libelle}
          />
        </label>
        <label className="block space-y-1 text-sm font-medium sm:col-span-2">
          <span>URL du flux ICS</span>
          <input
            className="w-full rounded-xl border border-stone-300 p-3 text-base"
            name="url"
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://www.airbnb.fr/calendar/ical/..."
            required
            type="url"
            value={url}
          />
        </label>
      </div>

      {etat.message ? (
        <p
          className={
            etat.ok
              ? "rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900"
              : "rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-800"
          }
        >
          {etat.message}
        </p>
      ) : null}

      <button
        className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium disabled:opacity-50"
        type="submit"
        disabled={enCours}
      >
        {enCours ? "Enregistrement…" : "Enregistrer le flux"}
      </button>
    </form>
  );
}
