import { connection } from "next/server";
import { chargerDocumentFacture } from "@/infrastructure/adapters/document-facture";
import { verifierTokenFacture } from "@/lib/facture-token";
import { getSession, tenantIdDeSession } from "@/lib/session";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await connection();

  const { id } = await params;
  const url = new URL(request.url);
  const token = url.searchParams.get("t");

  let tenantId: string | null = null;
  if (token) {
    const payload = verifierTokenFacture(token);
    if (!payload || payload.factureId !== id) {
      return new Response("Lien invalide ou expiré", { status: 401 });
    }
    tenantId = payload.tenantId;
  } else {
    const session = await getSession();
    if (!session || session.user.actif === false) {
      return new Response("Non autorisé", { status: 401 });
    }
    if (!["admin", "hote", "comptable"].includes(session.user.role ?? "")) {
      return new Response("Accès refusé", { status: 403 });
    }
    tenantId = tenantIdDeSession(session);
  }

  const document = await chargerDocumentFacture(tenantId, id);
  if (!document) {
    return new Response("Facture introuvable", { status: 404 });
  }

  const corps = new Blob([document.pdf as unknown as BlobPart], {
    type: "application/pdf",
  });

  return new Response(corps, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${document.facture.numero}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
