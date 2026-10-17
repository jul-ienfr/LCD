// Export CSV de la compta (lecture seule) : pivot Chorus Pro / Excel.
// Tout vient de GET /export-compta de la passerelle — rien n'est enrichi
// ici, aucune écriture. SIREN manquant reste une colonne explicite.
import { gwGet } from "@/lib/gateway";

type Facture = {
  entite_id?: string;
  logement_id?: string;
  ref?: string;
  montant_ttc?: number | string;
  tva?: string;
  emetteur_siren?: string | null;
  siren_manquant?: boolean;
  pdp_ref?: string | null;
  sans_pdp?: boolean;
  exporte_le?: string;
};
type ExportCompta = {
  par_entite?: Record<string, Facture[]>;
  sans_entite?: Facture[];
};

function csvUne(v: unknown): string {
  return `"${String(v ?? "").replace(/"/g, '""')}"`;
}

export async function GET(): Promise<Response> {
  let parEntite: Record<string, Facture[]> = {};
  let sansEntite: Facture[] = [];
  let note = "";
  try {
    const ex = await gwGet<ExportCompta>("/export-compta");
    parEntite = ex.par_entite || {};
    sansEntite = ex.sans_entite || [];
  } catch (e) {
    note = e instanceof Error ? e.message : "gateway injoignable";
  }
  const lignes: string[] = [
    ["entite_id", "logement_id", "ref", "montant_ttc", "tva", "siren_emetteur", "siren_manquant", "pdp_ref", "sans_pdp", "exporte_le"]
      .map(csvUne)
      .join(";"),
  ];
  for (const [ent, fs] of Object.entries(parEntite))
    for (const f of fs)
      lignes.push(
        [
          ent,
          f.logement_id,
          f.ref,
          f.montant_ttc,
          f.tva,
          f.emetteur_siren ?? "",
          f.siren_manquant ? "OUI" : "non",
          f.pdp_ref ?? "",
          f.sans_pdp ? "OUI" : "non",
          f.exporte_le,
        ]
          .map(csvUne)
          .join(";"),
      );
  for (const f of sansEntite)
    lignes.push(
      [
        "SANS_ENTITE",
        f.logement_id,
        f.ref,
        f.montant_ttc,
        f.tva,
        f.emetteur_siren ?? "",
        f.siren_manquant ? "OUI" : "non",
        f.pdp_ref ?? "",
        f.sans_pdp ? "OUI" : "non",
        f.exporte_le,
      ]
        .map(csvUne)
        .join(";"),
    );
  if (note) lignes.push(csvUne("ERREUR: " + note));
  const corps = "\ufeff" + lignes.join("\r\n") + "\r\n";
  return new Response(corps, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="lcd-export-compta.csv"',
    },
  });
}
