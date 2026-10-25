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
    void fetch("/api/telemetry", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        message: error.message,
        digest: error.digest,
        stack: error.stack,
        path: window.location.pathname,
      }),
      keepalive: true,
    }).catch(() => {});
  }, [error]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-4 px-6 py-16">
      <p className="text-sm font-medium uppercase tracking-widest text-encre-faine">
        Erreur
      </p>
      <h1 className="text-3xl font-semibold tracking-tight">
        Une erreur est survenue.
      </h1>
      <p className="text-encre-douce">
        L’action n’a pas abouti. Vous pouvez réessayer ; si le problème
        persiste, contactez l’administrateur avec l’heure de l’incident.
      </p>
      {error.digest ? (
        <p className="font-mono text-xs text-encre-faine">
          Référence : {error.digest}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <button
          className="rounded-full bg-encre px-5 py-3 text-sm font-medium text-fond"
          onClick={reset}
          type="button"
        >
          Réessayer
        </button>
        <Link className="rounded-full border border-bordure px-5 py-3 text-sm" href="/">
          Retour à l’accueil
        </Link>
      </div>
    </main>
  );
}
