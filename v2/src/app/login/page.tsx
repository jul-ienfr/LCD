"use client";

import { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export default function PageLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErreur(null);
    setEnCours(true);

    let resultat;
    try {
      resultat = await authClient.signIn.email({
        email,
        password,
        fetchOptions: { signal: AbortSignal.timeout(15_000) },
      });
    } catch {
      setErreur(
        "La connexion prend trop de temps. Vérifiez le réseau puis réessayez.",
      );
      setEnCours(false);
      return;
    }

    const { data, error } = resultat;
    if (error) {
      setErreur(error.message ?? "Connexion refusée.");
      setEnCours(false);
      return;
    }

    if ((data as { twoFactorRedirect?: boolean } | undefined)?.twoFactorRedirect) {
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/two-factor");
      return;
    }

    const role = (data?.user as { role?: string } | undefined)?.role;
    const destination =
      role === "presta"
        ? "/presta"
        : role === "proprietaire"
          ? "/proprio"
          : role === "commercial"
            ? "/commercial"
            : "/hote";

    // Navigation complète : le cookie de session est pris en compte par le
    // serveur, sans course avec le routeur client ni le service worker.
    window.location.assign(destination);
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-6 py-16">
      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-widest text-encre-faine">
          LCD Parc
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Connexion staff</h1>
        <p className="text-encre-douce">
          Espace hôte, admin et exploitation. La 2FA sera demandée après
          l’activation du compte.
        </p>
      </header>

      <noscript>
        <p className="rounded-xl border border-alerte bg-alerte-douce p-4 text-sm text-alerte">
          La connexion staff nécessite JavaScript. L’espace voyageur, lui,
          fonctionne sans JavaScript.
        </p>
      </noscript>

      <form className="space-y-4" onSubmit={onSubmit}>
        <label className="block space-y-1 text-sm font-medium">
          <span>Email</span>
          <input
            className="w-full rounded-xl border border-bordure p-3 text-base"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label className="block space-y-1 text-sm font-medium">
          <span>Mot de passe</span>
          <input
            className="w-full rounded-xl border border-bordure p-3 text-base"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        {erreur ? (
          <p className="rounded-xl border border-danger bg-danger-douce p-3 text-sm text-danger">
            {erreur}
          </p>
        ) : null}

        <button
          className="w-full rounded-full bg-encre px-5 py-3 text-sm font-medium text-fond disabled:opacity-50"
          type="submit"
          disabled={enCours}
        >
          {enCours ? "Connexion…" : "Se connecter"}
        </button>
      </form>

      <Link className="text-sm underline" href="/">
        Retour à l’accueil
      </Link>
    </main>
  );
}
