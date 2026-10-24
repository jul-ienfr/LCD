import type { OtaSource, SejourOta } from "@/application/ports/ota";

/** Adapter OTA/ICS : API fournisseur ou flux ICS, confiné ici. */
export function creerOtaSource(): OtaSource {
  return {
    async lireSejours(): Promise<SejourOta[]> {
      throw new Error(
        "OTA non configuré : implémenter l'API/ICS dans cet adapter.",
      );
    },
  };
}
