"use client";

import { useActionState } from "react";
import {
  changerActifUtilisateurAction,
  reinitialiserMotDePasseAction,
  type EtatUtilisateur,
} from "./actions";

const etatInitial: EtatUtilisateur = { ok: false, message: "" };

function MessageEtat({ etat }: { etat: EtatUtilisateur }) {
  if (!etat.message) return null;
  return (
    <p
      className={
        etat.ok
          ? "rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900"
          : "rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-800"
      }
    >
      {etat.message}
    </p>
  );
}

export function FormulaireActivation({
  userId,
  actif,
}: {
  userId: string;
  actif: boolean;
}) {
  const [etat, action, enCours] = useActionState(
    changerActifUtilisateurAction,
    etatInitial,
  );

  return (
    <form action={action} className="space-y-2">
      <input name="userId" type="hidden" value={userId} />
      <input name="actif" type="hidden" value={actif ? "false" : "true"} />
      <button
        className={
          actif
            ? "rounded-full border border-red-300 px-4 py-2 text-xs font-medium text-red-700 disabled:opacity-50"
            : "rounded-full border border-emerald-300 px-4 py-2 text-xs font-medium text-emerald-800 disabled:opacity-50"
        }
        disabled={enCours}
        type="submit"
      >
        {enCours
          ? "Mise à jour…"
          : actif
            ? "Désactiver le compte"
            : "Réactiver le compte"}
      </button>
      <MessageEtat etat={etat} />
    </form>
  );
}

export function FormulaireMotDePasse({ userId }: { userId: string }) {
  const [etat, action, enCours] = useActionState(
    reinitialiserMotDePasseAction,
    etatInitial,
  );

  return (
    <form action={action} className="space-y-3">
      <input name="userId" type="hidden" value={userId} />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1 text-xs font-medium text-stone-600">
          <span>Nouveau mot de passe</span>
          <input
            autoComplete="new-password"
            className="w-full rounded-lg border border-stone-300 p-2 text-sm"
            maxLength={128}
            minLength={12}
            name="password"
            required
            type="password"
          />
        </label>
        <label className="block space-y-1 text-xs font-medium text-stone-600">
          <span>Confirmation</span>
          <input
            autoComplete="new-password"
            className="w-full rounded-lg border border-stone-300 p-2 text-sm"
            maxLength={128}
            minLength={12}
            name="confirmation"
            required
            type="password"
          />
        </label>
      </div>
      <button
        className="rounded-full border border-stone-300 px-4 py-2 text-xs font-medium disabled:opacity-50"
        disabled={enCours}
        type="submit"
      >
        {enCours ? "Réinitialisation…" : "Réinitialiser le mot de passe"}
      </button>
      <MessageEtat etat={etat} />
    </form>
  );
}
