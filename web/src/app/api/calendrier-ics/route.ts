// Flux iCalendar (.ics) du planning du parc — LECTURE SEULE.
// Permet à l'opérateur de s'abonner depuis Google/Apple/Outlook : une journée
// occupée = un VEVENT journée entière. Rien n'est calculé ici : la passerelle
// dit jour par jour (disponible / conflit_ref), on ne fait que sérialiser.
// Jamais d'événement inventé : un jour en erreur (box muette) est ignoré et
// signalé en X-LCD-NOTE.
import { gwGet } from "@/lib/gateway";

type Case = {
  jour?: string;
  disponible?: boolean;
  conflit_ref?: string | null;
  erreur?: string;
};
type Logement = {
  box_id?: string;
  logement_id?: string;
  nom?: string;
  jours?: Case[];
};
type Calendrier = {
  debut?: string;
  fin?: string;
  jours?: number;
  note?: string;
  logements?: Logement[];
};

const JOURS_MIN = 3;
const JOURS_MAX = 62; // borne passerelle (JOURS_MAX) : jamais un DoS sur les boxes

function echapper(v: unknown): string {
  return String(v ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

// Pliage RFC 5545 : 75 octets max par ligne, continuation par 1 espace.
function plier(ligne: string): string {
  if (Buffer.byteLength(ligne, "utf8") <= 75) return ligne;
  const morceaux: string[] = [];
  let reste = ligne;
  let premier = true;
  while (Buffer.byteLength(reste, "utf8") > 75) {
    let coupe = 74;
    while (coupe > 0 && Buffer.byteLength(reste.slice(0, coupe), "utf8") > 74) coupe--;
    morceaux.push((premier ? "" : " ") + reste.slice(0, coupe));
    reste = reste.slice(coupe);
    premier = false;
  }
  morceaux.push((premier ? "" : " ") + reste);
  return morceaux.join("\r\n");
}

function lendemain(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

export async function GET(req: Request): Promise<Response> {
  const q = new URL(req.url).searchParams;
  const jours = Math.min(JOURS_MAX, Math.max(JOURS_MIN, Number(q.get("jours")) || 14));
  const m = /^(\d{4}-\d{2}-\d{2})$/.exec(q.get("debut") || "");
  const debut = m ? m[1] : "";
  let cal: Calendrier = {};
  let erreur = "";
  try {
    cal = await gwGet<Calendrier>(
      debut
        ? `/calendrier-parc?jours=${jours}&debut=${encodeURIComponent(debut)}`
        : `/calendrier-parc?jours=${jours}`,
    );
  } catch (e) {
    erreur = e instanceof Error ? e.message : "gateway injoignable";
  }

  const logements = cal.logements || [];
  const horodatage = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  const lignes: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//LCD Parc//Planning occupation//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:LCD Parc — occupation",
    "X-WR-CALDESC:Occupation du parc (lecture seule). 1 VEVENT = 1 séjour occupé ou 1 conflit à trancher.",
    "REFRESH-INTERVAL;VALUE=DURATION:PT1H",
    "X-PUBLISHED-TTL:PT1H",
    `X-LCD-FENETRE:${cal.debut || debut || "aujourdhui"}/${cal.fin || ""}`,
    `X-LCD-JOURS:${jours}`,
    `X-LCD-LOGEMENTS:${logements.length}`,
  ];
  if (cal.note) lignes.push(`X-LCD-NOTE:${echapper(cal.note)}`);
  if (erreur) lignes.push(`X-LCD-ERREUR:${echapper(erreur)}`);

  let evenements = 0;
  let casesIgnorees = 0;
  for (const l of logements) {
    const joursL = l.jours || [];
    let courant: { de: string; fin: string; conflit: string | null } | null = null;
    const fermer = () => {
      if (!courant) return;
      const prefixe = courant.conflit ? "Conflit" : "Occupe";
      const nom = l.nom || l.logement_id || "logement";
      lignes.push(
        "BEGIN:VEVENT",
        `UID:lcd-${echapper(l.logement_id)}-${courant.de}@lcd.local`,
        `DTSTAMP:${horodatage}`,
        `DTSTART;VALUE=DATE:${courant.de}`,
        `DTEND;VALUE=DATE:${courant.fin}`,
        plier(`SUMMARY:${prefixe} — ${echapper(nom)}`),
        plier(
          `DESCRIPTION:logement_id=${echapper(l.logement_id)};box_id=${echapper(l.box_id || "")}` +
            (courant.conflit ? `;conflit_ref=${echapper(courant.conflit)}` : ""),
        ),
        "TRANSP:OPAQUE",
        "END:VEVENT",
      );
      evenements++;
      courant = null;
    };
    for (const c of joursL) {
      const jour = c.jour;
      if (!jour) continue;
      if (c.erreur) {
        fermer();
        casesIgnorees++;
        continue;
      }
      const occupe = c.disponible === false;
      if (!occupe) {
        fermer();
        continue;
      }
      if (courant) {
        courant.fin = lendemain(jour);
        courant.conflit = courant.conflit || c.conflit_ref || null;
      } else {
        courant = { de: jour, fin: lendemain(jour), conflit: c.conflit_ref || null };
      }
    }
    fermer();
  }
  lignes.push(`X-LCD-EVENEMENTS:${evenements}`);
  if (casesIgnorees) lignes.push(`X-LCD-CASES-IGNOREES:${casesIgnorees}`);
  lignes.push("END:VCALENDAR");

  const corps = lignes.join("\r\n") + "\r\n";
  return new Response(corps, {
    status: 200,
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "cache-control": "no-store",
      "content-disposition": `inline; filename="lcd-planning-${debut || "aujourdhui"}.ics"`,
    },
  });
}
