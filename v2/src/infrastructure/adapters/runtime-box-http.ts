import type { EtatBox, RuntimeBox } from "@/application/ports/runtime-box";

/** Adapter HTTP Home Assistant / Moli. Aucun type HA/Moli dans le domaine. */
export function creerRuntimeBox(): RuntimeBox {
  return {
    async etat(): Promise<EtatBox> {
      throw new Error(
        "Runtime box non configuré : implémenter l'appel HTTP HA/Moli.",
      );
    },
    async executer(): Promise<void> {
      throw new Error(
        "Runtime box non configuré : implémenter la commande tracée.",
      );
    },
  };
}
