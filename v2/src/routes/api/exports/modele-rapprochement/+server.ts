import { verifierAccesApi } from "@/lib/server/session";
import type { RequestHandler } from "./$types";

const MODELE = `date;libelle;montant;reference
15/10/2026;VIR Client DUPONT;450,00;VIR-2026-001
16/10/2026;PRLV Charges bancaires;-32,50;
20/10/2026;CB Encaissement séjour;780,00;CB-2026-042
`;

export const GET: RequestHandler = async ({ locals }) => {
  const refus = verifierAccesApi(locals.session, ["admin", "hote", "comptable"]);
  if (refus) return refus;

  return new Response(MODELE, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="modele-rapprochement.csv"',
      "Cache-Control": "private, no-store",
    },
  });
};
