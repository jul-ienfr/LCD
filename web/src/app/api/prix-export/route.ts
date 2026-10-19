// Export CSV de la grille de prix (lecture seule) : 7 jours x logement
// depuis GET /api/apercu-parc de la passerelle — rien n'est enrichi ici,
// aucune écriture. ?depuis=ISO (bornes 90 j côté page, la passerelle ramène
// une date invalide à aujourd'hui) : la même fenêtre que /prix.
// Colonnes : logement_id, date, direct, puis 1 colonne par canal connu.
import { gwGet } from "@/lib/gateway";

type LigneBrute = unknown;
type Logement = {
  box_id?: string;
  logement_id?: string;
  nom?: string;
  prix_7j?: LigneBrute[];
};
type Apercu = { erreur?: string; logements?: Logement[] };

function csvUne(v: unknown): string {
  return `"${String(v ?? "").replace(/"/g, '""')}"`;
}
// Normalisation identique à /prix : [date, direct, {canal:valeur}] ou
// {value:[...]} — jamais 0 inventé : valeur absente = cellule vide.
function ligne(j: unknown): { date: string; direct: string; canaux: Record<string, string> } {
  const vide = { date: "", direct: "", canaux: {} as Record<string, string> };
  let arr: unknown[] | null = null;
  if (Array.isArray(j) && j.length >= 2) arr = j;
  else if (j && typeof j === "object" && Array.isArray((j as { value?: unknown[] }).value)
           && (j as { value: unknown[] }).value.length >= 2) arr = (j as { value: unknown[] }).value;
  if (!arr) return vide;
  const [d, v, rest] = arr as [unknown, unknown, unknown];
  const num = (x: unknown): string => {
    const n = typeof x === "number" ? x : (typeof x === "string" ? Number(x) : Number((x as { direct?: unknown })?.direct));
    return Number.isFinite(n) ? String(n) : "";
  };
  const canaux: Record<string, string> = {};
  if (rest && typeof rest === "object") {
    for (const [k, val] of Object.entries(rest as Record<string, unknown>)) {
      const n = typeof val === "number" ? val : (typeof val === "string" ? Number(val) : NaN);
      if (Number.isFinite(n)) canaux[k] = String(n);
    }
  }
  return { date: String(d ?? ""), direct: num(v), canaux };
}

export async function GET(req: Request): Promise<Response> {
  const q = new URL(req.url).searchParams;
  const c = /^(\d{4}-\d{2}-\d{2})$/.exec(q.get("depuis") || "");
  const depuis = c ? c[1] : "";
  let ap: Apercu = {};
  let note = "";
  try {
    ap = await gwGet<Apercu>(
      depuis
        ? `/api/apercu-parc?depuis=${encodeURIComponent(depuis)}`
        : "/api/apercu-parc",
    );
  } catch (e) {
    note = e instanceof Error ? e.message : "gateway injoignable";
  }
  const logements = ap.logements || [];
  const deq = (l: Logement) => (l.prix_7j || []).map(ligne).filter((j) => j.date);
  // Colonnes canaux = union des canaux vus (ordre stable : rencontres triées).
  const canauxVus = new Set<string>();
  for (const l of logements) for (const j of deq(l)) for (const k of Object.keys(j.canaux)) canauxVus.add(k);
  const canaux = [...canauxVus].sort();
  const lignes: string[] = [
    ["logement_id", "date", "direct", ...canaux].map(csvUne).join(";"),
  ];
  for (const l of logements) {
    for (const j of deq(l)) {
      lignes.push(
        [
          l.logement_id, j.date, j.direct,
          ...canaux.map((k) => j.canaux[k] ?? ""),
        ]
          .map(csvUne)
          .join(";"),
      );
    }
  }
  if (note) lignes.push(csvUne("ERREUR: " + note));
  if (!logements.some((l) => deq(l).length)) lignes.push(csvUne("aucun prix (passerelle muette ou registry vide)"));
  const corps = "\ufeff" + lignes.join("\r\n") + "\r\n";
  return new Response(corps, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition":
        `attachment; filename="lcd-prix-${depuis || "aujourdhui"}.csv"`,
    },
  });
}
