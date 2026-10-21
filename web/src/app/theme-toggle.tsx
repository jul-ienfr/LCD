"use client";
// Bascule thème : bouton lune/soleil dans l'en-tête, retour sur la page
// courante. Sans JS : POST natif puis redirect (le toggle reste visible).
import { usePathname } from "next/navigation";
import { basculerTheme } from "./actions";

export function ThemeToggle({ theme }: { theme: string }) {
  const chemin = usePathname() || "/";
  return (
    <form action={basculerTheme} className="flex-none">
      <input type="hidden" name="retour" value={chemin} />
      <button
        type="submit"
        className="inline-flex min-h-11 items-center rounded-full border border-[var(--bordure)] bg-[var(--surface)] px-2.5 text-sm"
        aria-label={theme === "sombre" ? "Passer en clair" : "Passer en sombre"}
        title={theme === "sombre" ? "Thème : sombre (manuel)" : theme === "clair" ? "Thème : clair (manuel)" : "Thème : auto (OS)"}
      >
        {theme === "sombre" ? "☀ Clair" : "🌙 Sombre"}
      </button>
    </form>
  );
}
