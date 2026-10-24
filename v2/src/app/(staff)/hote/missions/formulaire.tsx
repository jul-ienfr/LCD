"use client";

import { useActionState } from "react";
import type { Logement } from "@/domain/logement";
import {
  TYPES_MISSION,
  type TypeMission,
} from "@/domain/mission";
import type { Reservation } from "@/domain/reservation";
import {
  creerMissionAction,
  type EtatFormulaireMission,
} from "./actions";

const etatInitial: EtatFormulaireMission = { ok: false, message: "" };

const LIBELLES_TYPE: Record<TypeMission, string> = {
  menage: "Ménage",
  maintenance: "Maintenance",
  accueil: "Accueil",
  autre: "Autre",
};

export function FormulaireMission({
  logements,
  prestataires,
  reservations,
  dateDefaut,
  refDefaut,
}: {
  logements: Pick<Logement, "id" | "nom" | "code">[];
  prestataires: { id: string; name: string; email: string }[];
  reservations: Pick<
    Reservation,
    "id" | "ref" | "debut" | "fin" | "logementId"
  >[];
  dateDefaut: string;
  refDefaut: string;
}) {
  const [etat, action, enCours] = useActionState(
    creerMissionAction,
    etatInitial,
  );

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1 text-sm font-medium">
          <span>Logement</span>
          <select
            className="w-full rounded-xl border border-stone-300 p-3 text-base"
            name="logementId"
            required
          >
            {logements.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nom} ({l.code})
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1 text-sm font-medium">
          <span>Prestataire</span>
          <select
            className="w-full rounded-xl border border-stone-300 p-3 text-base"
            name="assignedUserId"
            required
          >
            {prestataires.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.email})
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1 text-sm font-medium">
          <span>Référence</span>
          <input
            className="w-full rounded-xl border border-stone-300 p-3 font-mono text-base"
            defaultValue={refDefaut}
            name="ref"
            required
          />
        </label>

        <label className="block space-y-1 text-sm font-medium">
          <span>Type</span>
          <select
            className="w-full rounded-xl border border-stone-300 p-3 text-base"
            defaultValue="menage"
            name="type"
          >
            {TYPES_MISSION.map((type) => (
              <option key={type} value={type}>
                {LIBELLES_TYPE[type]}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1 text-sm font-medium">
          <span>Date</span>
          <input
            className="w-full rounded-xl border border-stone-300 p-3 text-base"
            defaultValue={dateDefaut}
            name="date"
            type="date"
            required
          />
        </label>

        <label className="block space-y-1 text-sm font-medium">
          <span>Heure (facultatif)</span>
          <input
            className="w-full rounded-xl border border-stone-300 p-3 text-base"
            defaultValue="10:00"
            name="heure"
            type="time"
          />
        </label>

        <label className="block space-y-1 text-sm font-medium sm:col-span-2">
          <span>Réservation liée (facultatif)</span>
          <select
            className="w-full rounded-xl border border-stone-300 p-3 text-base"
            name="reservationId"
          >
            <option value="">Aucune</option>
            {reservations.map((r) => (
              <option key={r.id} value={r.id}>
                {r.ref} — {r.debut} → {r.fin}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block space-y-1 text-sm font-medium">
        <span>Notes (facultatif)</span>
        <textarea
          className="min-h-20 w-full rounded-xl border border-stone-300 p-3 text-base"
          name="notes"
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
        {enCours ? "Création…" : "Créer la mission"}
      </button>
    </form>
  );
}
