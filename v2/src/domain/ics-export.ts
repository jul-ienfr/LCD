export interface EvenementIcs {
  uid: string;
  debut: string;
  fin: string;
  titre: string;
  description?: string | null;
  statut?: "CONFIRMED" | "TENTATIVE";
}

const encodeur = new TextEncoder();

function dateValide(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/u.test(date);
}

function horodatage(date: Date): string {
  return date.toISOString().replace(/[-:]/gu, "").replace(/\.\d{3}Z$/u, "Z");
}

function echapper(texte: string): string {
  return texte
    .replace(/\\/gu, "\\\\")
    .replace(/;/gu, "\\;")
    .replace(/,/gu, "\\,")
    .replace(/\r\n|\r|\n/gu, "\\n");
}

/** Pliage RFC 5545 : 75 octets maximum par ligne, continuation par espace. */
function plier(ligne: string): string {
  const morceaux: string[] = [];
  let courant = "";
  let octets = 0;

  for (const caractere of ligne) {
    const taille = encodeur.encode(caractere).length;
    if (octets + taille > 75) {
      morceaux.push(courant);
      courant = " ";
      octets = 1;
    }
    courant += caractere;
    octets += taille;
  }

  morceaux.push(courant);
  return morceaux.join("\r\n");
}

export function genererCalendrierIcs(
  nom: string,
  evenements: EvenementIcs[],
  maintenant = new Date(),
): string {
  const lignes: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//LCD Parc//Planning//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${echapper(`LCD Parc — ${nom}`)}`,
    "X-WR-TIMEZONE:Europe/Paris",
    "REFRESH-INTERVAL;VALUE=DURATION:PT1H",
    "X-PUBLISHED-TTL:PT1H",
  ];

  for (const evenement of evenements) {
    if (
      !dateValide(evenement.debut) ||
      !dateValide(evenement.fin) ||
      evenement.fin <= evenement.debut
    ) {
      continue;
    }

    lignes.push(
      "BEGIN:VEVENT",
      `UID:${echapper(evenement.uid)}`,
      `DTSTAMP:${horodatage(maintenant)}`,
      `DTSTART;VALUE=DATE:${evenement.debut.replaceAll("-", "")}`,
      `DTEND;VALUE=DATE:${evenement.fin.replaceAll("-", "")}`,
      `SUMMARY:${echapper(evenement.titre)}`,
    );

    if (evenement.description) {
      lignes.push(`DESCRIPTION:${echapper(evenement.description)}`);
    }

    lignes.push(
      `STATUS:${evenement.statut ?? "CONFIRMED"}`,
      "TRANSP:OPAQUE",
      "END:VEVENT",
    );
  }

  lignes.push("END:VCALENDAR");

  return `${lignes.map(plier).join("\r\n")}\r\n`;
}
