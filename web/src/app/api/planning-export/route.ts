// Export CSV du planning du parc (lecture seule) : grille jour x logement
// depuis GET /calendrier-parc de la passerelle — rien n'est enrichi ici,
// aucune écriture. Bornes : 3-30 j (fenêtre permanente) + ?debut ISO <=90 j
// (la passerelle borne elle-même à JOURS_MAX 62 j et ignore une date invalide).
import { gwGet } from "@/lib/gateway";

type Case = { jour?: string; disponible?: boolean; conflit_ref?: string | null; erreur?: string };
type Logement = { box_id?: string; logement_id?: string; nom?: string; jours?: Case[] };
type Calendrier = { logements?: Logement[] };

function csvUne(v: unknown): string {
  return `"${String(v ?? "").replace(/"/g, '""')}"`;
}
function marquer(c: Case): string {
  if (c.erreur) return "?";
  if (c.conflit_ref) return "!conf";
  return c.disponible === false ? "occupe" : "libre";
}

export async function GET(req: Request): Promise<Response> {
  const q = new URL(req.url).searchParams;
  const jours = Math.min(30, Math.max(3, Number(q.get("jours")) || 14));
  const c = /^(\d{4}-\d{2}-\d{2})$/.exec(q.get("debut") || "");
  const base = c ? c[1] : ""; // la gw ignore/ramène à aujourd'hui si vide
  let cal: Calendrier = {};
  let note = "";
  try {
    cal = await gwGet<Calendrier>(
      base
        ? `/calendrier-parc?jours=${jours}&debut=${encodeURIComponent(base)}`
        : `/calendrier-parc?jours=${jours}`,
    );
  } catch (e) {
    note = e instanceof Error ? e.message : "gateway injoignable";
  }
  const logements = cal.logements || [];
  const tete = (logements.find((l) => l.jours?.length)?.jours || [])
    .map((j) => j.jour ?? "");
  const lignes: string[] = [
    ["logement_id", "nom", ...tete].map(csvUne).join(";"),
  ];
  for (const l of logements) {
    lignes.push(
      [
        l.logement_id,
        l.nom ?? "",
        ...(l.jours || []).map(marquer),
      ]
        .map(csvUne)
        .join(";"),
    );
  }
  if (note) lignes.push(csvUne("ERREUR: " + note));
  if (!logements.length) lignes.push(csvUne("aucun logement (registry vide ou passerelle muette)"));
  const corps = "\ufeff" + lignes.join("\r\n") + "\r\n";
  return new Response(corps, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition":
        `attachment; filename="lcd-planning-${(base || "aujourdhui")}.csv"`,
    },
  });
}
