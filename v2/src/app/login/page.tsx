"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export default function PageLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@lcd.test");
  const [password, setPassword] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErreur(null);
    setEnCours(true);

    const { data, error } = await authClient.signIn.email({
      email,
      password,
    });

    if (error) {
      setErreur(error.message ?? "Connexion refusée.");
      setEnCours(false);
      return;
    }

    const role = (data?.user as { role?: string } | undefined)?.role;
    router.push(role === "presta" ? "/presta" : "/hote");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-6 py-16">
      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-widest text-stone-500">
          LCD Parc
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Connexion staff</h1>
        <p className="text-stone-600">
          Espace hôte, admin et exploitation. La 2FA sera demandée après
          l’activation du compte.
        </p>
      </header>

      <noscript>
        <p className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          La connexion staff nécessite JavaScript. L’espace voyageur, lui,
          fonctionne sans JavaScript.
        </p>
      </noscript>

      <form className="space-y-4" onSubmit={onSubmit}>
        <label className="block space-y-1 text-sm font-medium">
          <span>Email</span>
          <input
            className="w-full rounded-xl border border-stone-300 p-3 text-base"
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
            className="w-full rounded-xl border border-stone-300 p-3 text-base"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        {erreur ? (
          <p className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-800">
            {erreur}
          </p>
        ) : null}

        <button
          className="w-full rounded-full bg-stone-900 px-5 py-3 text-sm font-medium text-white disabled:opacity-50"
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
