import journal from "../../../drizzle/meta/_journal.json";
import { DrizzleSupervisionRepository } from "@/infrastructure/db/repositories/supervision-repository";
import { env } from "@/lib/env";
import { requireSuperAdmin } from "@/lib/server/session";
import { APP_VERSION } from "@/lib/version";
import type { PageServerLoad } from "./$types";

function duree(secondes: number): string {
  const jours = Math.floor(secondes / 86_400);
  const heures = Math.floor((secondes % 86_400) / 3_600);
  const minutes = Math.floor((secondes % 3_600) / 60);
  if (jours > 0) return `${jours} j ${heures} h`;
  if (heures > 0) return `${heures} h ${minutes} min`;
  return `${minutes} min`;
}

export const load: PageServerLoad = async (event) => {
  requireSuperAdmin(event);
  const etat = await new DrizzleSupervisionRepository().etatSysteme();
  const attendues = journal.entries.length;
  const derniereAttendue = journal.entries[journal.entries.length - 1]?.tag;

  return {
    etat,
    attendues,
    derniereAttendue: derniereAttendue ?? null,
    runtime: {
      version: APP_VERSION,
      environnement: env.NODE_ENV,
      url: env.APP_URL,
      node: process.version,
      plateforme: `${process.platform} ${process.arch}`,
      uptime: duree(process.uptime()),
      deuxFacteurs: env.AUTH_2FA_REQUIRED ? "oui" : "non",
    },
  };
};
