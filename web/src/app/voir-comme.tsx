"use client";
// Voir-comme (§14 V5/V6) : bascule de session dans l'en-tête.
// La passerelle reste l'unique vérité RBAC — ici on change juste lasession.
// Sans JS : le <form> POSTe sur la Server Action (retour par défaut /hote).
import { usePathname } from "next/navigation";
import { voirComme } from "./actions";

export function VoirComme({
  courant,
  personne,
}: {
  courant: string;
  personne: string;
}) {
  const chemin = usePathname() || "/hote";
  return (
    <form action={voirComme} className="flex flex-wrap items-center gap-1.5 text-xs">
      <span className="rounded-full bg-white/15 px-2 py-1 font-semibold text-white">
        {personne} · {courant}
      </span>
      <input type="hidden" name="retour" value={chemin} />
      <label className="sr-only" htmlFor="voir-qui">Voir comme</label>
      <select
        id="voir-qui"
        name="qui"
        defaultValue={courant}
        className="rounded-full border border-white/25 bg-white/10 px-2 py-1 text-xs text-white backdrop-blur"
      >
        {Object.entries(PERSONNES).map(([id, label]) => (
          <option key={id} value={id} className="text-(--encre)">
            Voir comme {label}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-(--encre)"
      >
        ⇄
      </button>
    </form>
  );
}

const PERSONNES: Record<string, string> = {
  personne_01: "Cl. super_admin",
  personne_02: "Al. admin",
  personne_03: "S. opérateur",
  personne_04: "R. comptable",
  personne_05: "M. proprio",
  commercial_01: "I. commercial",
};
