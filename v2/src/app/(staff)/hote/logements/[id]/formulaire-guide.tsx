"use client";

import { useActionState } from "react";
import type { Logement } from "@/domain/logement";
import { modifierGuideAction, type EtatGuide } from "../guide-actions";

const etatInitial: EtatGuide = { ok: false, message: "" };

export function FormulaireGuide({ logement }: { logement: Logement }) {
  const [etat, action, enCours] = useActionState(
    modifierGuideAction,
    etatInitial,
  );

  return (
    <form action={action} className="space-y-4">
      <input name="logementId" type="hidden" value={logement.id} />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1 text-sm font-medium">
          <span>Heure de check-in</span>
          <input
            className="w-full rounded-xl border border-bordure p-3 text-base"
            defaultValue={logement.checkinHeure ?? ""}
            name="checkinHeure"
            placeholder="15:00"
          />
        </label>
        <label className="block space-y-1 text-sm font-medium">
          <span>Téléphone d’urgence</span>
          <input
            className="w-full rounded-xl border border-bordure p-3 text-base"
            defaultValue={logement.urgenceTel ?? ""}
            name="urgenceTel"
          />
        </label>
        <label className="block space-y-1 text-sm font-medium">
          <span>WiFi — réseau</span>
          <input
            className="w-full rounded-xl border border-bordure p-3 text-base"
            defaultValue={logement.wifiSsid ?? ""}
            name="wifiSsid"
          />
        </label>
        <label className="block space-y-1 text-sm font-medium">
          <span>WiFi — mot de passe</span>
          <input
            className="w-full rounded-xl border border-bordure p-3 text-base"
            defaultValue={logement.wifiPassword ?? ""}
            name="wifiPassword"
          />
        </label>
      </div>

      <label className="block space-y-1 text-sm font-medium">
        <span>Consignes d’arrivée</span>
        <textarea
          className="min-h-24 w-full rounded-xl border border-bordure p-3 text-base"
          defaultValue={logement.checkinInstructions ?? ""}
          name="checkinInstructions"
        />
      </label>

      <label className="block space-y-1 text-sm font-medium">
        <span>Règles du logement</span>
        <textarea
          className="min-h-24 w-full rounded-xl border border-bordure p-3 text-base"
          defaultValue={logement.regles ?? ""}
          name="regles"
        />
      </label>

      <label className="block space-y-1 text-sm font-medium">
        <span>Guide / bonnes adresses</span>
        <textarea
          className="min-h-32 w-full rounded-xl border border-bordure p-3 text-base"
          defaultValue={logement.guideTexte ?? ""}
          name="guideTexte"
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
        {enCours ? "Enregistrement…" : "Enregistrer le guide"}
      </button>
    </form>
  );
}
