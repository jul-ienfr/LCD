"use client";

import { useActionState } from "react";
import {
  EVENEMENTS_WEBHOOK,
  LIBELLES_EVENEMENT_WEBHOOK,
} from "@/domain/webhook";
import { creerWebhookAction, type EtatWebhook } from "./actions";

const etatInitial: EtatWebhook = { ok: false, message: "" };

export function FormulaireWebhook({
  secretDefaut,
}: {
  secretDefaut: string;
}) {
  const [etat, action, enCours] = useActionState(
    creerWebhookAction,
    etatInitial,
  );

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1 text-sm font-medium">
          <span>Libellé</span>
          <input
            className="w-full rounded-xl border border-stone-300 p-3 text-base"
            name="libelle"
            placeholder="Home Assistant"
            required
          />
        </label>
        <label className="block space-y-1 text-sm font-medium">
          <span>URL HTTPS</span>
          <input
            className="w-full rounded-xl border border-stone-300 p-3 text-base"
            name="url"
            placeholder="https://ha.example.com/api/webhook/lcd"
            required
            type="url"
          />
        </label>
      </div>

      <label className="block space-y-1 text-sm font-medium">
        <span>Secret de signature</span>
        <input
          className="w-full rounded-xl border border-stone-300 p-3 font-mono text-xs"
          defaultValue={secretDefaut}
          minLength={16}
          name="secret"
          required
        />
        <span className="block text-xs font-normal text-stone-500">
          À recopier dans Home Assistant / Moli. Signature HMAC-SHA256 dans
          l’en-tête <code>X-LCD-Signature</code>.
        </span>
      </label>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Événements</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {EVENEMENTS_WEBHOOK.map((evenement, index) => (
            <label
              className="flex items-center gap-2 rounded-xl border border-stone-200 p-3 text-sm"
              key={evenement}
            >
              <input
                defaultChecked={index < 2}
                name="events"
                type="checkbox"
                value={evenement}
              />
              <span>{LIBELLES_EVENEMENT_WEBHOOK[evenement]}</span>
              <code className="ml-auto text-xs text-stone-400">
                {evenement}
              </code>
            </label>
          ))}
        </div>
      </fieldset>

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
        {enCours ? "Enregistrement…" : "Enregistrer le webhook"}
      </button>
    </form>
  );
}
