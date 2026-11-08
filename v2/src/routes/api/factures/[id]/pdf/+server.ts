import { chargerDocumentFacture } from "@/infrastructure/adapters/document-facture";
import { verifierTokenFacture } from "@/lib/facture-token";
import { tenantIdDeSession, verifierAccesApi } from "@/lib/server/session";
import type { RequestHandler } from "./$types";

const ROLES = ["admin", "hote", "comptable"];

export const GET: RequestHandler = async ({ params, url, locals }) => {
  let tenantId: string | null = null;
  const token = url.searchParams.get("t");
  if (token) {
    const payload = verifierTokenFacture(token);
    if (!payload || payload.factureId !== params.id) {
      return new Response("Lien invalide ou expiré", { status: 401 });
    }
    tenantId = payload.tenantId;
  } else {
    const session = locals.session;
    const refus = verifierAccesApi(session, ROLES);
    if (refus) return refus;
    tenantId = tenantIdDeSession(session!);
  }

  const document = await chargerDocumentFacture(tenantId, params.id);
  if (!document) return new Response("Facture introuvable", { status: 404 });

  return new Response(Buffer.from(document.pdf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${document.facture.numero}.pdf"`,
      "cache-control": "private, no-store",
    },
  });
};
