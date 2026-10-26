"use client";

import { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export function FormulaireReinitialisation({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [termine, setTermine] = useState(false);
  const [enCours, setEnCours] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErreur(null);

    if (password !== confirmation) {
      setErreur("Les deux mots de passe ne correspondent pas.");
      return;
    }
    if (password.length < 12) {
      setErreur("Le mot de passe doit contenir au moins 12 caractères.");
      return;
    }

    setEnCours(true);
    try {
      const { error } = await authClient.resetPassword({
        newPassword: password,
        token,
        fetchOptions: { signal: AbortSignal.timeout(15_000) },
      });
      if (error) {
        setErreur(
          error.message ??
            "Lien invalide ou expiré. Demandez un nouvel e-mail.",
        );
        return;
      }
      setTermine(true);
    } catch {
      setErreur(
        "La réinitialisation prend trop de temps. Vérifiez le réseau puis réessayez.",
      );
    } finally {
      setEnCours(false);
    }
  }

  if (termine) {
    return (
      <div className="space-y-4 rounded-2xl border border-accent bg-accent-douce p-5 text-sm text-accent">
        <p>
          Votre mot de passe a été modifié. Vous pouvez maintenant vous
          connecter.
        </p>
        <Link className="underline" href="/login">
          Aller à la connexion
        </Link>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <label className="block space-y-1 text-sm font-medium">
        <span>Nouveau mot de passe</span>
        <input
          autoComplete="new-password"
          className="w-full rounded-xl border border-bordure bg-surface p-3"
          maxLength={128}
          minLength={12}
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
      </label>
      <label className="block space-y-1 text-sm font-medium">
        <span>Confirmation</span>
        <input
          autoComplete="new-password"
          className="w-full rounded-xl border border-bordure bg-surface p-3"
          maxLength={128}
          minLength={12}
          onChange={(event) => setConfirmation(event.target.value)}
          required
          type="password"
          value={confirmation}
        />
      </label>

      {erreur ? (
        <p className="rounded-xl border border-danger bg-danger-douce p-3 text-sm text-danger">
          {erreur}
        </p>
      ) : null}

      <button
        className="w-full rounded-full bg-encre px-5 py-3 font-medium text-fond disabled:opacity-50"
        disabled={enCours}
        type="submit"
      >
        {enCours ? "Enregistrement…" : "Changer le mot de passe"}
      </button>
    </form>
  );
}
