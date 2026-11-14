/**
 * Diagnostic temporaire : vérifie que la configuration de suivi du tenant de
 * démonstration est bien lue et active (support de T089-T092).
 */
import { DrizzleSuiviRepository } from "@/infrastructure/db/repositories/suivi-repository";
import { configurationSuiviActive } from "@/domain/suivi";
import { suiviActifPourTenant } from "@/lib/server/suivi";

const tenantId = process.argv[2] ?? "a56b5bcf-11cc-429d-a63f-a766613ac66d";

const configuration = await new DrizzleSuiviRepository().lireConfiguration(
  tenantId,
);
console.log("configuration:", JSON.stringify(configuration));
console.log(
  "configurationSuiviActive:",
  configuration ? configurationSuiviActive(configuration) : null,
);
console.log("suiviActifPourTenant:", await suiviActifPourTenant(tenantId));
process.exit(0);
