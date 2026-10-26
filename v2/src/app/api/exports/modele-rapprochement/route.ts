import { connection } from "next/server";
import { getSession } from "@/lib/session";

const MODELE = `date;libelle;montant;reference
15/10/2026;VIR Client DUPONT;450,00;VIR-2026-001
16/10/2026;PRLV Charges bancaires;-32,50;
20/10/2026;CB Encaissement séjour;780,00;CB-2026-042
`;

export async function GET() {
  await connection();

  const session = await getSession();
  if (!session || session.user.actif === false) {
    return new Response("Non autorisé", { status: 401 });
  }
  if (!["admin", "hote", "comptable"].includes(session.user.role ?? "")) {
    return new Response("Accès refusé", { status: 403 });
  }

  return new Response(MODELE, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="modele-rapprochement.csv"',
      "Cache-Control": "private, no-store",
    },
  });
}
