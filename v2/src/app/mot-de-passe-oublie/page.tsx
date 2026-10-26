"use client";

import { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export default function PageMotDePasseOublie() {
  const [email, setEmail] = useState("");
  const [envoye, setEnvoye] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErreur(null);
    setEnCours(true);

    try {
      const { error } = await authClient.requestPasswordReset({
        email,
        redirectTo: `${window.location.origin}/reinitialiser-mot-de-passe`,
        fetchOptions: { signal: AbortSignal.timeout(15_000) },
      });
      if (error) {
        setErreur(
          error.message ??
            "Demande impossible pour le moment. Réessayez plus tard.",
        );
        setEnCours(false);
        return;
      }
      setEnvoye(true);
    } catch {
      setErreur(
        "La demande prend trop de temps. Vérifiez le réseau puis réessayez.",
      );
    } finally {
      setEnCours(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-6 py-16">
      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-widest text-encre-faine">
          LCD Parc
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Mot de passe oublié
        </h1>
        <p className="text-encre-douce">
          Indiquez l’adresse de votre compte : un lien valable une heure vous
          sera envoyé pour choisir un nouveau mot de passe.
        </p>
      </header>

      {envoye ? (
        <div className="space-y-4 rounded-2xl border border-accent bg-accent-douce p-5 text-sm text-accent">
          <p>
            Si un compte existe avec cette adresse, un e-mail de
            réinitialisation vient d’être envoyé. Pensez à vérifier les
            indésirables.
          </p>
          <Link className="underline" href="/login">
            Retour à la connexion
          </Link>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={onSubmit}>
          <label className="block space-y-1 text-sm font-medium">
            <span>Adresse e-mail</span>
            <input
              autoComplete="email"
              className="w-full rounded-xl border border-bordure bg-surface p-3"
              maxLength={254}
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
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
            {enCours ? "Envoi…" : "Envoyer le lien"}
          </button>

          <p className="text-center text-sm text-encre-douce">
            <Link className="underline" href="/login">
              Retour à la connexion
            </Link>
          </p>
        </form>
      )}
    </main>
  );
}
