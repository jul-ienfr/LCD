import { error } from "@sveltejs/kit";
import { extname } from "node:path";
import { DrizzlePhotoPreuveRepository } from "@/infrastructure/db/repositories/photo-preuve-repository";
import { proprietaireVoitPhotosLogement } from "@/lib/server/acces-preuves";
import { logErreur } from "@/lib/logger";
import { tenantIdDeSession, verifierAccesApi } from "@/lib/server/session";
import { stockageFichiers } from "@/lib/server/stockage";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ params, locals }) => {
  // Le propriétaire est admis (FR-037), mais seulement sur les photos des
  // logements de son mandat et quand sa visibilité ouvre les photos.
  const refus = verifierAccesApi(locals.session, ["admin", "hote", "proprietaire"]);
  if (refus) return refus;

  const session = locals.session!;
  const tenantId = tenantIdDeSession(session);
  const photo = await new DrizzlePhotoPreuveRepository().trouverParId(
    tenantId,
    params.id,
  );
  if (!photo) error(404, "Photo introuvable");
  if (
    session.user.role === "proprietaire" &&
    !(await proprietaireVoitPhotosLogement(tenantId, session, photo.logementId))
  ) {
    error(403, "Accès refusé");
  }

  try {
    const octets = await stockageFichiers().get(photo.chemin);
    return new Response(new Uint8Array(octets), {
      headers: {
        "Content-Type": photo.contentType,
        "Content-Length": String(photo.tailleOctets),
        "Cache-Control": "private, max-age=3600",
        "Content-Disposition": `inline; filename="${photo.ref}${extname(photo.chemin)}"`,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (erreur) {
    logErreur("api.photos.lire", erreur, { photoId: photo.id });
    error(404, "Photo indisponible");
  }
};
