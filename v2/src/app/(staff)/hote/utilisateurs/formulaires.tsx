"use client";

import { useActionState } from "react";
import { LIBELLES_ROLE, ROLES_UTILISATEUR } from "@/domain/utilisateur";
import {
  changerActifUtilisateurAction,
  changerRoleUtilisateurAction,
  reinitialiserDeuxFacteursAction,
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
          ? "rounded-xl border border-accent bg-accent-douce p-3 text-sm text-accent"
          : "rounded-xl border border-danger bg-danger-douce p-3 text-sm text-danger"
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
            ? "rounded-full border border-danger px-4 py-2 text-xs font-medium text-danger disabled:opacity-50"
            : "rounded-full border border-accent px-4 py-2 text-xs font-medium text-accent disabled:opacity-50"
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
        <label className="block space-y-1 text-xs font-medium text-encre-douce">
          <span>Nouveau mot de passe</span>
          <input
            autoComplete="new-password"
            className="w-full rounded-lg border border-bordure p-2 text-sm"
            maxLength={128}
            minLength={12}
            name="password"
            required
            type="password"
          />
        </label>
        <label className="block space-y-1 text-xs font-medium text-encre-douce">
          <span>Confirmation</span>
          <input
            autoComplete="new-password"
            className="w-full rounded-lg border border-bordure p-2 text-sm"
            maxLength={128}
            minLength={12}
            name="confirmation"
            required
            type="password"
          />
        </label>
      </div>
      <button
        className="rounded-full border border-bordure px-4 py-2 text-xs font-medium disabled:opacity-50"
        disabled={enCours}
        type="submit"
      >
        {enCours ? "Réinitialisation…" : "Réinitialiser le mot de passe"}
      </button>
      <MessageEtat etat={etat} />
    </form>
  );
}

export function FormulaireDeuxFacteurs({ userId }: { userId: string }) {
  const [etat, action, enCours] = useActionState(
    reinitialiserDeuxFacteursAction,
    etatInitial,
  );

  return (
    <form action={action} className="space-y-2">
      <input name="userId" type="hidden" value={userId} />
      <p className="text-xs text-encre-douce">
        Supprime le secret TOTP et les codes de secours. Le compte devra
        réenrôler sa 2FA après reconnexion ; ses sessions sont fermées.
      </p>
      <button
        className="rounded-full border border-danger px-4 py-2 text-xs font-medium text-danger disabled:opacity-50"
        disabled={enCours}
        onClick={(event) => {
          if (
            !window.confirm(
              "Réinitialiser la double authentification de ce compte ?",
            )
          ) {
            event.preventDefault();
          }
        }}
        type="submit"
      >
        {enCours ? "Réinitialisation…" : "Réinitialiser la 2FA"}
      </button>
      <MessageEtat etat={etat} />
    </form>
  );
}

export function FormulaireRole({
  userId,
  roleActuel,
}: {
  userId: string;
  roleActuel: string;
}) {
  const [etat, action, enCours] = useActionState(
    changerRoleUtilisateurAction,
    etatInitial,
  );

  return (
    <form action={action} className="space-y-3">
      <input name="userId" type="hidden" value={userId} />
      <label className="block space-y-1 text-xs font-medium text-encre-douce">
        <span>Rôle</span>
        <select
          className="w-full rounded-lg border border-bordure p-2 text-sm"
          defaultValue={roleActuel}
          key={roleActuel}
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
      <button
        className="rounded-full border border-bordure px-4 py-2 text-xs font-medium disabled:opacity-50"
        disabled={enCours}
        type="submit"
      >
        {enCours ? "Mise à jour…" : "Changer le rôle"}
      </button>
      <MessageEtat etat={etat} />
    </form>
  );
}
