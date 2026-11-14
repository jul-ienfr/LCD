import { eq } from "drizzle-orm";
import { dbAdmin } from "../src/infrastructure/db/client";
import { DrizzleSuiviRepository } from "../src/infrastructure/db/repositories/suivi-repository";
import { tenants } from "../src/infrastructure/db/schema";
import { purgerMesures, RETENTION_JOURS } from "../src/lib/server/mesure";

/**
 * Purge les événements de suivi au-delà de 13 mois (plan de retrait du journal
 * first-party) puis les événements bruts de mesure d'ergonomie au-delà de la
 * rétention de 90 jours du contrat de mesure. À lancer par cron ou à la main :
 *   npm run db:purge-suivi
 */
const MOIS_RETENTION = 13;

async function principal() {
  if (!dbAdmin) {
    console.error("Base d'administration indisponible.");
    process.exit(1);
  }
  const avant = new Date(
    Date.now() - MOIS_RETENTION * 30 * 24 * 60 * 60 * 1_000,
  ).toISOString();
  const repo = new DrizzleSuiviRepository();
  const actifs = await dbAdmin
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.statut, "actif"));
  let total = 0;
  let totalMesure = 0;
  for (const tenant of actifs) {
    const supprimes = await repo.purgerAvant(tenant.id, avant);
    total += supprimes;
    if (supprimes > 0) {
      console.log(`${tenant.id} : ${supprimes} événement(s) purgé(s).`);
    }
    // Mesure d'ergonomie : rétention courte (90 jours), purge ciblée sur les
    // noms d'événements du contrat pour ne pas toucher au journal de suivi.
    const mesuresSupprimees = await purgerMesures(tenant.id);
    totalMesure += mesuresSupprimees;
    if (mesuresSupprimees > 0) {
      console.log(
        `${tenant.id} : ${mesuresSupprimees} événement(s) de mesure purgé(s).`,
      );
    }
  }
  console.log(`Purge terminée : ${total} événement(s) avant ${avant}.`);
  console.log(
    `Mesure d'ergonomie : ${totalMesure} événement(s) brut(s) de plus de ${RETENTION_JOURS} jours purgé(s).`,
  );
}

principal().catch((erreur) => {
  console.error("Purge impossible :", erreur);
  process.exit(1);
});
