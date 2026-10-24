"use client";

export function BoutonImprimer() {
  return (
    <button
      className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium print:hidden"
      onClick={() => window.print()}
      type="button"
    >
      Imprimer / PDF
    </button>
  );
}
