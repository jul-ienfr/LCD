import type { LogementAvecFournisseur } from "@/application/ports/fournisseur-repository";
import type { CodeFournisseur } from "@/domain/fournisseur";
import {
  evaluerSanteSync,
  type SanteSync,
} from "@/domain/sante-fournisseur";
import { env } from "@/lib/env";

export function intervalleMinutesFournisseur(
  code: CodeFournisseur | null,
): number {
  if (code === "hostport") return env.FOURNISSEUR_HOSTPORT_INTERVAL_MINUTES;
  if (code === "nobeds") return env.FOURNISSEUR_NOBEDS_INTERVAL_MINUTES;
  return env.FOURNISSEUR_SYNC_INTERVAL_MINUTES;
}

export function santeLogementFournisseur(
  logement: LogementAvecFournisseur,
  maintenant: Date,
): SanteSync | null {
  if (!logement.fournisseurCode || !logement.actif) return null;
  return evaluerSanteSync({
    derniereSync: logement.derniereSync,
    dernierStatut: logement.dernierStatut,
    intervalleMinutes: intervalleMinutesFournisseur(logement.fournisseurCode),
    maintenant,
  });
}
