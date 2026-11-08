import type { RequestEvent } from "@sveltejs/kit";
import type { VersionApparence } from "@/application/ports/apparence-repository";
import type { Apparence } from "@/domain/apparence/types";
import {
  apparenceDepuisAnciennesCles,
  normaliserApparence,
} from "@/domain/apparence/validation";
import { DrizzleApparenceRepository } from "@/infrastructure/db/repositories/apparence-repository";
import { DrizzleParametresSiteRepository } from "@/infrastructure/db/repositories/parametres-site-repository";
import { logErreur } from "@/lib/logger";
import {
  COOKIE_APERCU_APPARENCE,
  verifierApercuApparence,
} from "@/lib/server/apercu-apparence";
import { estSuperAdmin } from "@/lib/server/session";

const depots = new DrizzleApparenceRepository();
const parametres = new DrizzleParametresSiteRepository();

export const APPARENCE_DEFAUT = normaliserApparence(null);

async function ancienneApparence(): Promise<Apparence> {
  try {
    const design = await parametres.lire("design");
    const brut = await parametres.lire("identite");
    let identite: unknown = null;
    if (brut) {
      try {
        identite = JSON.parse(brut);
      } catch {
        identite = null;
      }
    }
    return apparenceDepuisAnciennesCles(design, identite);
  } catch {
    return APPARENCE_DEFAUT;
  }
}

export async function lireApparencePubliee(): Promise<Apparence> {
  try {
    const version = await depots.lirePubliee();
    if (version) {
      return normaliserApparence(version.configuration);
    }
  } catch (error) {
    logErreur("apparence.lirePubliee", error);
  }
  return ancienneApparence();
}

export async function lireVersionPubliee(): Promise<VersionApparence | null> {
  try {
    return await depots.lirePubliee();
  } catch (error) {
    logErreur("apparence.lireVersionPubliee", error);
    return null;
  }
}

export async function lireApparenceBrouillon(): Promise<VersionApparence | null> {
  try {
    return await depots.lireBrouillon();
  } catch (error) {
    logErreur("apparence.lireBrouillon", error);
    return null;
  }
}

export async function listerVersionsApparence(
  limite = 20,
): Promise<VersionApparence[]> {
  try {
    return await depots.listerVersions(limite);
  } catch (error) {
    logErreur("apparence.listerVersions", error);
    return [];
  }
}

export async function enregistrerBrouillonApparence(
  apparence: Apparence,
  acteur: string,
): Promise<VersionApparence> {
  return depots.enregistrerBrouillon(apparence, acteur);
}

export async function publierApparence(
  apparence: Apparence,
  acteur: string,
  motif: string | null = null,
): Promise<VersionApparence> {
  return depots.publier(apparence, acteur, motif);
}

export async function revenirApparence(
  versionId: string,
  acteur: string,
  motif: string | null = null,
): Promise<VersionApparence> {
  return depots.revenir(versionId, acteur, motif);
}

export async function apparencePourRequete(
  event: RequestEvent,
): Promise<{ apparence: Apparence; apercu: boolean }> {
  const session = event.locals.session;
  const apercu =
    verifierApercuApparence(
      event.cookies.get(COOKIE_APERCU_APPARENCE),
      session?.user.id,
    ) !== null;

  if (apercu && estSuperAdmin(session)) {
    const brouillon = await lireApparenceBrouillon();
    if (brouillon) {
      return {
        apparence: normaliserApparence(brouillon.configuration),
        apercu: true,
      };
    }
  }

  return { apparence: await lireApparencePubliee(), apercu: false };
}
