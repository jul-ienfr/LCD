"use client";

import { useActionState } from "react";
import {
  LIBELLES_NATURE,
  LIBELLES_REGIME,
  LIBELLES_TVA,
  NATURES_ENTITE,
  REGIMES_ENTITE,
  TVA_ENTITE,
} from "@/domain/entite";
import type { Tenant } from "@/domain/tenant";
import { mettreAJourEntiteAction, type EtatEntite } from "./actions";

const etatInitial: EtatEntite = { ok: false, message: "" };

export function FormulaireEntite({ tenant }: { tenant: Tenant }) {
  const [etat, action, enCours] = useActionState(
    mettreAJourEntiteAction,
    etatInitial,
  );

  return (
    <form action={action} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1 text-sm font-medium">
          <span>Nom de l’entité</span>
          <input
            className="w-full rounded-xl border border-stone-300 p-3 text-base"
            defaultValue={tenant.nom}
            maxLength={120}
            minLength={2}
            name="nom"
            required
          />
        </label>
        <label className="block space-y-1 text-sm font-medium">
          <span>SIREN (facultatif)</span>
          <input
            className="w-full rounded-xl border border-stone-300 p-3 font-mono text-base"
            defaultValue={tenant.siren ?? ""}
            inputMode="numeric"
            maxLength={9}
            name="siren"
            pattern="[0-9]{9}"
            placeholder="123456789"
          />
        </label>
        <label className="block space-y-1 text-sm font-medium">
          <span>Nature juridique</span>
          <select
            className="w-full rounded-xl border border-stone-300 p-3 text-base"
            defaultValue={tenant.nature}
            name="nature"
          >
            {NATURES_ENTITE.map((nature) => (
              <option key={nature} value={nature}>
                {LIBELLES_NATURE[nature]}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1 text-sm font-medium">
          <span>Régime fiscal</span>
          <select
            className="w-full rounded-xl border border-stone-300 p-3 text-base"
            defaultValue={tenant.regime}
            name="regime"
          >
            {REGIMES_ENTITE.map((regime) => (
              <option key={regime} value={regime}>
                {LIBELLES_REGIME[regime]}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1 text-sm font-medium">
          <span>TVA</span>
          <select
            className="w-full rounded-xl border border-stone-300 p-3 text-base"
            defaultValue={tenant.tva}
            name="tva"
          >
            {TVA_ENTITE.map((tva) => (
              <option key={tva} value={tva}>
                {LIBELLES_TVA[tva]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block space-y-1 text-sm font-medium">
        <span>Adresse de facturation (facultatif)</span>
        <textarea
          className="min-h-20 w-full rounded-xl border border-stone-300 p-3 text-base"
          defaultValue={tenant.adresse ?? ""}
          maxLength={500}
          name="adresse"
        />
      </label>

      <label className="block space-y-1 text-sm font-medium">
        <span>Mentions légales de facture (facultatif)</span>
        <textarea
          className="min-h-20 w-full rounded-xl border border-stone-300 p-3 text-base"
          defaultValue={tenant.mentionsLegales ?? ""}
          maxLength={2_000}
          name="mentionsLegales"
        />
        <span className="block text-xs font-normal text-stone-500">
          Ex. « TVA non applicable, art. 293 B du CGI ». Les paramètres fiscaux
          restent prioritaires si une mention y est déjà définie.
        </span>
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
        disabled={enCours}
        type="submit"
      >
        {enCours ? "Enregistrement…" : "Enregistrer l’entité"}
      </button>
    </form>
  );
}
