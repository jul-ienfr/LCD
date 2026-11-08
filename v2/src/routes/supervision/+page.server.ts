import type { PageServerLoad } from "./$types";
import {
  lireVersionPubliee,
  listerVersionsApparence,
} from "@/lib/server/apparence";
import { DrizzleSupervisionRepository } from "@/infrastructure/db/repositories/supervision-repository";
import { requireSuperAdmin } from "@/lib/server/session";
import {
  lireSanteBox,
  lireSanteDisque,
  lireSanteTls,
} from "@/lib/server/sante-systeme";

export const load: PageServerLoad = async (event) => {
  const session = requireSuperAdmin(event);
  const [version, versions, situation, disque, tls, box] = await Promise.all([
    lireVersionPubliee(),
    listerVersionsApparence(5),
    new DrizzleSupervisionRepository().situation(),
    lireSanteDisque(),
    lireSanteTls(),
    lireSanteBox(),
  ]);

  return {
    email: session.user.email,
    situation,
    sante: { disque, tls, box },
    version: version
      ? { version: version.version, publieLe: version.publieLe }
      : null,
    versions: versions.map((entree) => ({
      id: entree.id,
      version: entree.version,
      statut: entree.statut,
      publieLe: entree.publieLe,
    })),
  };
};
