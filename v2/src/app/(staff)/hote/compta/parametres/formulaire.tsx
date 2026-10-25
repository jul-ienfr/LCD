"use client";

import { useActionState } from "react";
import type { ParametresFiscaux } from "@/domain/fiscal";
import {
  enregistrerParametresFiscauxAction,
  type EtatParametresFiscaux,
} from "./actions";

const etatInitial: EtatParametresFiscaux = { ok: false, message: "" };

function euros(centimes: number | null): string {
  if (centimes === null) return "";
  return (centimes / 100).toFixed(2).replace(".", ",");
}

export function FormulaireParametresFiscaux({
  parametres,
}: {
  parametres: ParametresFiscaux;
}) {
  const [etat, action, enCours] = useActionState(
    enregistrerParametresFiscauxAction,
    etatInitial,
  );

  return (
    <form action={action} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1 text-sm font-medium">
          <span>Taux de TVA (%)</span>
          <input
            className="w-full rounded-xl border border-bordure p-3 text-base"
            defaultValue={(parametres.tauxTvaBp / 100)
              .toString()
              .replace(".", ",")}
            inputMode="decimal"
            name="tauxTva"
            placeholder="10"
            required
          />
          <span className="block text-xs font-normal text-encre-faine">
            Taux appliqué par défaut lors de la création d’une facture.
          </span>
        </label>

        <label className="block space-y-1 text-sm font-medium">
          <span>Préfixe des factures</span>
          <input
            className="w-full rounded-xl border border-bordure p-3 font-mono text-base uppercase"
            defaultValue={parametres.prefixeFacture}
            maxLength={8}
            name="prefixeFacture"
            placeholder="FAC"
            required
          />
          <span className="block text-xs font-normal text-encre-faine">
            2 à 8 caractères A-Z ou 0-9. Numérotation : PREFIXE-AAAA-0001.
          </span>
        </label>

        <label className="block space-y-1 text-sm font-medium">
          <span>Taxe de séjour (€ / nuit / personne)</span>
          <input
            className="w-full rounded-xl border border-bordure p-3 text-base"
            defaultValue={euros(
              parametres.taxeSejourNuitPersonneCentimes,
            )}
            inputMode="decimal"
            name="taxeNuitEuros"
            placeholder="0"
          />
          <span className="block text-xs font-normal text-encre-faine">
            Montant appliqué par nuit et par voyageur. 0 si non applicable.
          </span>
        </label>

        <label className="block space-y-1 text-sm font-medium">
          <span>Plafond (€ / nuit / personne, facultatif)</span>
          <input
            className="w-full rounded-xl border border-bordure p-3 text-base"
            defaultValue={euros(parametres.taxeSejourPlafondCentimes)}
            inputMode="decimal"
            name="plafondEuros"
            placeholder="Ex. 4,20"
          />
          <span className="block text-xs font-normal text-encre-faine">
            Laisser vide si aucun plafond.
          </span>
        </label>
      </div>

      <label className="block space-y-1 text-sm font-medium">
        <span>Mentions légales (facultatif)</span>
        <textarea
          className="min-h-24 w-full rounded-xl border border-bordure p-3 text-base"
          defaultValue={parametres.mentionsLegales ?? ""}
          maxLength={2000}
          name="mentionsLegales"
          placeholder="Ex. TVA non applicable, art. 293 B du CGI…"
        />
      </label>

      {etat.message ? (
        <p
          className={
            etat.ok
              ? "rounded-xl border border-accent bg-accent-douce p-3 text-sm text-accent"
              : "rounded-xl border border-danger bg-danger-douce p-3 text-sm text-danger"
          }
        >
          {etat.message}
        </p>
      ) : null}

      <button
        className="rounded-full bg-encre px-5 py-3 text-sm font-medium text-fond disabled:opacity-50"
        type="submit"
        disabled={enCours}
      >
        {enCours ? "Enregistrement…" : "Enregistrer les paramètres"}
      </button>
    </form>
  );
}
