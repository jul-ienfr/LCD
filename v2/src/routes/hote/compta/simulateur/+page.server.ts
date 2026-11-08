import { LIBELLES_REGIME_SIMULABLE, regimeSimulableValide, simulerFiscalite, type RegimeSimulable } from "@/domain/simulateur-fiscal";
import { DrizzleTenantRepository } from "@/infrastructure/db/repositories/tenant-repository";
import { centimesDepuisSaisie, formaterEuros } from "@/lib/format";
import { requireRole, tenantIdDeSession } from "@/lib/server/session";
import type { PageServerLoad } from "./$types";

const ROLES = ["admin", "hote", "comptable"] as const;

function montant(valeur: string | null): number {
  return centimesDepuisSaisie(valeur ?? "") ?? 0;
}

function saisie(centimes: number): string {
  return (centimes / 100).toFixed(2).replace(".", ",");
}

function regimeParDefaut(regimeTenant: string | undefined): RegimeSimulable {
  return regimeTenant === "micro_bic_classe"
    ? "micro_bic_classe"
    : "micro_bic_non_classe";
}

export const load: PageServerLoad = async (event) => {
  const session = requireRole(event, ROLES);
  const tenantId = tenantIdDeSession(session);
  const tenant = await new DrizzleTenantRepository().trouver(tenantId);

  const regimeParam = event.url.searchParams.get("regime") ?? "";
  const regime = regimeSimulableValide(regimeParam)
    ? regimeParam
    : regimeParDefaut(tenant?.regime);

  const recettes = montant(event.url.searchParams.get("recettes"));
  const charges = montant(event.url.searchParams.get("charges"));
  const amortissements = montant(
    event.url.searchParams.get("amortissements"),
  );

  const simulation = simulerFiscalite({
    regime,
    recettesCentimes: recettes,
    chargesCentimes: charges,
    amortissementsCentimes: amortissements,
  });

  return {
    langue: event.cookies.get("lcd_langue") ?? "fr",
    regimes: (["micro_bic_non_classe", "micro_bic_classe"] as const).map(
      (id) => ({ id, label: LIBELLES_REGIME_SIMULABLE[id] }),
    ),
    regime,
    regimeLibelle: LIBELLES_REGIME_SIMULABLE[regime],
    saisies: {
      recettes: saisie(recettes),
      charges: saisie(charges),
      amortissements: saisie(amortissements),
    },
    simulation,
    montants: {
      seuil: formaterEuros(simulation.seuilCentimes),
      abattement:
        simulation.abattementCentimes === null
          ? null
          : formaterEuros(simulation.abattementCentimes),
      baseMicro:
        simulation.baseMicroCentimes === null
          ? null
          : formaterEuros(simulation.baseMicroCentimes),
      baseReel: formaterEuros(simulation.baseReelCentimes),
      deficit: formaterEuros(simulation.deficitReportableCentimes),
      ecart:
        simulation.ecartBaseCentimes === null
          ? null
          : formaterEuros(Math.abs(simulation.ecartBaseCentimes)),
    },
    tauxAbattement: `${simulation.abattementBp / 100} %`,
  };
};
