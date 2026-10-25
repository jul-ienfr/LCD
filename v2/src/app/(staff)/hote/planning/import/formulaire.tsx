"use client";

import { useActionState, useState } from "react";
import {
  importerIcsAction,
  type EtatImportIcs,
} from "./actions";

const etatInitial: EtatImportIcs = { ok: false, message: "" };

const LIBELLES_RESULTAT = {
  cree: "créé",
  deja: "déjà présent",
  conflit: "conflit",
  ignore: "ignoré",
} as const;

export function FormulaireImportIcs({
  logements,
  logementDefaut,
}: {
  logements: { id: string; nom: string; code: string }[];
  logementDefaut: string;
}) {
  const [etat, action, enCours] = useActionState(
    importerIcsAction,
    etatInitial,
  );
  const [logementId, setLogementId] = useState(logementDefaut);

  return (
    <div className="space-y-5">
      <form
        action={action}
        className="space-y-4"
        encType="multipart/form-data"
      >
        <label className="block space-y-1 text-sm font-medium">
          <span>Logement</span>
          <select
            className="w-full rounded-xl border border-stone-300 p-3 text-base"
            name="logementId"
            onChange={(event) => setLogementId(event.target.value)}
            required
            value={logementId}
          >
            {logements.map((logement) => (
              <option key={logement.id} value={logement.id}>
                {logement.nom} ({logement.code})
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1 text-sm font-medium">
          <span>Fichier .ics (facultatif)</span>
          <input
            accept=".ics,text/calendar"
            className="w-full rounded-xl border border-stone-300 p-3 text-base"
            name="fichier"
            type="file"
          />
        </label>

        <label className="block space-y-1 text-sm font-medium">
          <span>Ou collez le contenu ICS</span>
          <textarea
            className="min-h-48 w-full rounded-xl border border-stone-300 p-3 font-mono text-xs"
            name="ics"
            placeholder="BEGIN:VCALENDAR&#10;VERSION:2.0&#10;..."
          />
        </label>

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
          className="rounded-full bg-stone-900 px-5 py-3 text-sm font-medium text-white disabled:opacity-50"
          type="submit"
          disabled={enCours}
        >
          {enCours ? "Import…" : "Importer le calendrier"}
        </button>
      </form>

      {etat.resultat ? (
        <section className="space-y-3 rounded-2xl border border-stone-200 bg-white p-4">
          <h3 className="font-semibold">Détail de l’import</h3>
          <ul className="divide-y divide-stone-100 text-sm">
            {etat.resultat.lignes.map((ligne, index) => (
              <li
                className="flex flex-wrap items-center justify-between gap-2 py-2"
                key={`${ligne.ref}-${index}`}
              >
                <div>
                  <p className="font-medium">
                    {ligne.type === "blocage" ? "Blocage" : "Réservation"}{" "}
                    {ligne.debut} → {ligne.fin}
                  </p>
                  <p className="font-mono text-xs text-stone-500">
                    {ligne.ref}
                  </p>
                  {ligne.message ? (
                    <p className="text-xs text-stone-500">{ligne.message}</p>
                  ) : null}
                </div>
                <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium">
                  {LIBELLES_RESULTAT[ligne.resultat]}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
