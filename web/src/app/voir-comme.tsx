"use client";
// Voir-comme (§14 V5/V6) : bascule de session dans l'en-tête.
// La passerelle reste l'unique vérité RBAC — ici on change juste la session.
// Sans JS : le <form> POSTe sur la Server Action (retour par défaut /hote).
// Mode IdP (§S3.3) : `vuPar` = qui regarde RÉELLEMENT (Remote-User prouvé) —
// bandeau permanent tant que la cible (lcd_vu) diffère ; le geste est
// journalisé côté passerelle avant toute bascule (voir voirComme action).
import { usePathname } from "next/navigation";
import { voirComme } from "./actions";
import { PROFILS } from "@/lib/profils";

export function VoirComme({
  courant,
  personne,
  vuPar,
}: {
  courant: string;
  personne: string;
  vuPar?: string;
}) {
  const chemin = usePathname() || "/hote";
  return (
    <form action={voirComme} className="flex flex-wrap items-center gap-1.5 text-xs">
      {vuPar && (
        <span className="rounded-full bg-amber-400 px-2 py-1 font-bold text-black">
          {vuPar} voit comme {personne}
        </span>
      )}
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
        {Object.entries(PROFILS).map(([id, p]) => (
          <option key={id} value={id} className="text-(--encre)">
            Voir comme {p.court}
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
