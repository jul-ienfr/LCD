"use client";

import { useActionState, useEffect, useRef } from "react";
import { LIBELLES_ROLE, ROLES_UTILISATEUR } from "@/domain/utilisateur";
import { creerUtilisateurAction, type EtatUtilisateur } from "./actions";

const etatInitial: EtatUtilisateur = { ok: false, message: "" };

export function FormulaireCreationUtilisateur() {
  const [etat, action, enCours] = useActionState(
    creerUtilisateurAction,
    etatInitial,
  );
  const formulaire = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (etat.ok) formulaire.current?.reset();
  }, [etat]);

  return (
    <form action={action} className="space-y-4" ref={formulaire}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1 text-sm font-medium">
          <span>Nom</span>
          <input
            autoComplete="name"
            className="w-full rounded-xl border border-stone-300 p-3 text-base"
            maxLength={120}
            minLength={2}
            name="name"
            required
          />
        </label>
        <label className="block space-y-1 text-sm font-medium">
          <span>Email</span>
          <input
            autoComplete="off"
            className="w-full rounded-xl border border-stone-300 p-3 text-base"
            maxLength={254}
            name="email"
            required
            type="email"
          />
        </label>
        <label className="block space-y-1 text-sm font-medium">
          <span>Rôle</span>
          <select
            className="w-full rounded-xl border border-stone-300 p-3 text-base"
            defaultValue="hote"
            name="role"
            required
          >
            {ROLES_UTILISATEUR.map((role) => (
              <option key={role} value={role}>
                {LIBELLES_ROLE[role]}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1 text-sm font-medium">
          <span>Mot de passe provisoire</span>
          <input
            autoComplete="new-password"
            className="w-full rounded-xl border border-stone-300 p-3 text-base"
            maxLength={128}
            minLength={12}
            name="password"
            required
            type="password"
          />
        </label>
      </div>

      <p className="text-xs text-stone-500">
        12 caractères minimum. Communiquez-le à la personne par un canal sûr :
        elle pourra le changer dans Sécurité / 2FA.
      </p>

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
        {enCours ? "Création…" : "Créer le compte"}
      </button>
    </form>
  );
}
