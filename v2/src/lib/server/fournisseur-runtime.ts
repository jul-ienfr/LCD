import { ImporterReservationsFournisseur } from "@/application/use-cases/importer-reservations-fournisseur";
import { SynchroniserFournisseur } from "@/application/use-cases/synchroniser-fournisseur";
import {
  creerFournisseur,
  fournisseurConfigure,
} from "@/infrastructure/adapters/fournisseurs";
import { DrizzleBlocageRepository } from "@/infrastructure/db/repositories/blocage-repository";
import { DrizzleFournisseurRepository } from "@/infrastructure/db/repositories/fournisseur-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzlePlanTarifaireRepository } from "@/infrastructure/db/repositories/plan-tarifaire-repository";
import { DrizzleReservationRepository } from "@/infrastructure/db/repositories/reservation-repository";
import { DrizzleRestrictionSejourRepository } from "@/infrastructure/db/repositories/restriction-sejour-repository";
import { DrizzleTarifRepository } from "@/infrastructure/db/repositories/tarif-repository";
import { DrizzleTenantRepository } from "@/infrastructure/db/repositories/tenant-repository";

export function creerSynchroniseurFournisseur(
  fournisseurs = new DrizzleFournisseurRepository(),
): SynchroniserFournisseur {
  return new SynchroniserFournisseur(
    fournisseurs,
    new DrizzleReservationRepository(),
    new DrizzleBlocageRepository(),
    new DrizzleTarifRepository(),
    new DrizzleRestrictionSejourRepository(),
    new ImporterReservationsFournisseur(
      new DrizzleReservationRepository(),
      new DrizzleBlocageRepository(),
    ),
    (code) => (fournisseurConfigure(code) ? creerFournisseur(code) : null),
    new DrizzleLogementRepository(),
    new DrizzlePlanTarifaireRepository(),
    new DrizzleTenantRepository(),
  );
}
