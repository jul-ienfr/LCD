"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-4 px-6 py-16">
      <p className="text-sm font-medium uppercase tracking-widest text-stone-500">
        Erreur
      </p>
      <h1 className="text-3xl font-semibold tracking-tight">
        Une erreur est survenue.
      </h1>
      <p className="text-stone-600">
        L’action n’a pas abouti. Vous pouvez réessayer ; si le problème
        persiste, contactez l’administrateur avec l’heure de l’incident.
      </p>
      {error.digest ? (
        <p className="font-mono text-xs text-stone-500">
          Référence : {error.digest}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <button
          className="rounded-full bg-stone-900 px-5 py-3 text-sm font-medium text-white"
          onClick={reset}
          type="button"
        >
          Réessayer
        </button>
        <Link className="rounded-full border border-stone-300 px-5 py-3 text-sm" href="/">
          Retour à l’accueil
        </Link>
      </div>
    </main>
  );
}
