"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
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
    <html lang="fr">
      <body>
        <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-4 px-6 py-16">
          <p className="text-sm font-medium uppercase tracking-widest">
            Erreur
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            LCD Parc est indisponible.
          </h1>
          <p>
            Une erreur critique est survenue. Réessayez dans quelques instants.
          </p>
          {error.digest ? (
            <p className="font-mono text-xs">Référence : {error.digest}</p>
          ) : null}
          <button
            className="w-fit rounded-full bg-stone-900 px-5 py-3 text-sm font-medium text-white"
            onClick={reset}
            type="button"
          >
            Réessayer
          </button>
        </main>
      </body>
    </html>
  );
}
