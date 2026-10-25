"use client";

import { useState } from "react";

export function BoutonCopier({ valeur }: { valeur: string }) {
  const [copie, setCopie] = useState(false);

  async function copier() {
    try {
      await navigator.clipboard.writeText(valeur);
      setCopie(true);
      window.setTimeout(() => setCopie(false), 2_000);
    } catch {
      setCopie(false);
    }
  }

  return (
    <button
      className="rounded-full border border-bordure px-4 py-2 text-sm font-medium"
      onClick={copier}
      type="button"
    >
      {copie ? "URL copiée" : "Copier l’URL"}
    </button>
  );
}
