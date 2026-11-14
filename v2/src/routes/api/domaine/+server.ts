import { json } from "@sveltejs/kit";
import { hoteNormalise, estHoteLocal } from "@/lib/routage-domaine";
import { sql } from "@/infrastructure/db/client";
import { logErreur } from "@/lib/logger";
import type { RequestHandler } from "./$types";

/**
 * T209 — résolution d'un domaine personnalisé actif vers le slug du tenant.
 * Appelé par le hook `reroute` avant la résolution de route.
 */
export const GET: RequestHandler = async ({ url }) => {
  const hote = hoteNormalise(url.searchParams.get("hote") ?? "");
  if (!hote || estHoteLocal(hote)) {
    return json({ ok: false }, { status: 404 });
  }

  try {
    const [ligne] = await sql<{ slug: string }[]>`
      select slug from domaine_public_par_hote(${hote})
    `;
    if (!ligne) return json({ ok: false }, { status: 404 });
    return json(
      { ok: true, slug: ligne.slug },
      { headers: { "cache-control": "public, max-age=60" } },
    );
  } catch (error) {
    logErreur("domaine.public", error, { hote });
    return json({ ok: false }, { status: 500 });
  }
};
