"use client";

import { useEffect, useState } from "react";
import type { Langue, Traductions } from "@/lib/i18n";
import {
  ajouterIncident,
  compterIncidents,
  rejouerIncidents,
} from "@/lib/outbox";
import { declarerIncidentAction } from "./actions";

type Statut =
  | "idle"
  | "sending"
  | "queued"
  | "sent"
  | "error";

export function FormulaireIncident({
  token,
  refInitial,
  langue,
  traductions,
}: {
  token: string;
  refInitial: string;
  langue: Langue;
  traductions: Traductions;
}) {
  const [message, setMessage] = useState("");
  const [statut, setStatut] = useState<Statut>("idle");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enAttente, setEnAttente] = useState(0);

  useEffect(() => {
    let actif = true;

    async function rafraichir() {
      const restants = await compterIncidents();
      if (actif) setEnAttente(restants);
    }

    async function rejouer() {
      const resultat = await rejouerIncidents();
      if (!actif) return;
      setEnAttente(resultat.restants);
      if (resultat.envoyes > 0) setStatut("sent");
    }

    void rafraichir();
    void rejouer();

    const onOnline = () => void rejouer();
    window.addEventListener("online", onOnline);
    return () => {
      actif = false;
      window.removeEventListener("online", onOnline);
    };
  }, []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErreur(null);

    const texte = message.trim();
    if (texte.length < 5) {
      setErreur(traductions.decrivezProbleme);
      setStatut("error");
      return;
    }

    const entree = {
      ref: refInitial,
      token,
      message: texte,
      createdAt: new Date().toISOString(),
    };

    if (!navigator.onLine) {
      await ajouterIncident(entree);
      setEnAttente(await compterIncidents());
      setStatut("queued");
      return;
    }

    setStatut("sending");
    try {
      const response = await fetch("/api/voyageur/incident", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          token,
          ref: refInitial,
          message: texte,
        }),
      });

      if (response.ok) {
        setStatut("sent");
        setMessage("");
        return;
      }

      if (response.status >= 400 && response.status < 500) {
        const data = (await response.json().catch(() => null)) as {
          erreur?: string;
        } | null;
        setErreur(data?.erreur ?? traductions.signalementRefuse);
        setStatut("error");
        return;
      }

      throw new Error(`HTTP ${response.status}`);
    } catch {
      await ajouterIncident(entree);
      setEnAttente(await compterIncidents());
      setStatut("queued");
    }
  }

  return (
    <form action={declarerIncidentAction} onSubmit={onSubmit} className="space-y-4">
      <input name="token" type="hidden" value={token} />
      <input name="langue" type="hidden" value={langue} />
      <input name="ref" type="hidden" value={refInitial} />

      <label className="block space-y-1 text-sm font-medium" htmlFor="message">
        {traductions.queSestIlPasse}
      </label>
      <textarea
        className="min-h-32 w-full rounded-xl border border-stone-300 p-3 text-base"
        id="message"
        name="message"
        onChange={(e) => setMessage(e.target.value)}
        placeholder={traductions.placeholderIncident}
        required
        value={message}
      />

      {erreur ? (
        <p className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          {erreur}
        </p>
      ) : null}

      {statut === "queued" ? (
        <p className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          {traductions.horsLigne}
          {enAttente > 0
            ? ` ${traductions.enAttente.replace("{n}", String(enAttente))}`
            : ""}
        </p>
      ) : null}

      {statut === "sent" ? (
        <p className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900">
          {traductions.signalementEnvoye}
        </p>
      ) : null}

      <button
        className="rounded-full bg-stone-900 px-5 py-3 text-sm font-medium text-white disabled:opacity-50"
        disabled={statut === "sending"}
        type="submit"
      >
        {statut === "sending" ? traductions.envoi : traductions.envoyer}
      </button>
    </form>
  );
}
