"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export default function PageTwoFactor() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErreur(null);
    setEnCours(true);

    const { error } = await authClient.twoFactor.verifyTotp({ code });

    if (error) {
      setErreur(error.message ?? "Code refusé.");
      setEnCours(false);
      return;
    }

    router.push("/hote");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-6 py-16">
      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-widest text-stone-500">
          LCD Parc
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Vérification en deux étapes
        </h1>
        <p className="text-stone-600">
          Saisissez le code à 6 chiffres de votre application
          d’authentification.
        </p>
      </header>

      <form className="space-y-4" onSubmit={onSubmit}>
        <label className="block space-y-1 text-sm font-medium">
          <span>Code TOTP</span>
          <input
            className="w-full rounded-xl border border-stone-300 p-3 text-center font-mono text-2xl tracking-[0.4em]"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            required
            autoFocus
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
          disabled={enCours || code.length !== 6}
        >
          {enCours ? "Vérification…" : "Vérifier"}
        </button>
      </form>

      <Link className="text-sm underline" href="/login">
        Revenir à la connexion
      </Link>
    </main>
  );
}
