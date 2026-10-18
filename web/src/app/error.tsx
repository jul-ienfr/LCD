"use client";
// Page d'erreur runtime : message honnête + bouton réessayer + retour accueil.
import Link from "next/link";

export default function ErreurGlobale({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-5 px-4 py-20 text-center">
      <p className="text-5xl" role="img" aria-label="Erreur">⚠</p>
      <h1 className="text-2xl font-extrabold tracking-tight">
        Le moteur n&apos;a pas répondu comme prévu
      </h1>
      <p className="max-w-md text-sm text-(--encre-douce)">
        {error.message}
        {error.digest ? ` (réf. ${error.digest})` : ""}
        . Aucune écriture n&apos;est partie en silence : une action non aboutie
        reste non aboutie (§16.2 — jamais d&apos;écrasement silencieux).
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <button type="button" onClick={reset} className="bouton bouton-principal px-5 py-2.5">
          Réessayer
        </button>
        <Link href="/" className="bouton bouton-secondaire px-4 py-2.5">
          ← Accueil
        </Link>
      </div>
    </div>
  );
}
