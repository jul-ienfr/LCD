/**
 * T307 — e-mail entrant : modèle pur, sans dépendance SMTP/IMAP.
 *
 * Le connecteur (webhook fournisseur ou IMAP) fournit un message déjà
 * téléchargé ; ce module ne fait que valider et normaliser. Aucun HTML n'est
 * conservé : seul le texte est journalisé, pour éviter les pixels de suivi et
 * les scripts d'un expéditeur.
 */

export const TAILLE_CORPS_EMAIL_MAX = 50_000;
export const TAILLE_PIECE_EMAIL_MAX = 8 * 1024 * 1024;
export const NOMBRE_PIECES_EMAIL_MAX = 8;

export interface PieceJointeEntrante {
  nomFichier: string;
  typeMime: string;
  octets: Uint8Array;
}

export interface EmailEntrant {
  messageId: string;
  inReplyTo: string | null;
  de: string;
  vers: string;
  sujet: string;
  texte: string;
  date: Date;
  piecesJointes: PieceJointeEntrante[];
}

export interface EmailEntrantBrut {
  messageId?: unknown;
  inReplyTo?: unknown;
  de?: unknown;
  vers?: unknown;
  sujet?: unknown;
  texte?: unknown;
  date?: unknown;
  piecesJointes?: unknown;
  /** Ignoré volontairement : on ne conserve jamais le HTML. */
  html?: unknown;
}

const MOTIF_EMAIL = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
const MOTIF_SLUG = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

export function adresseEmailValide(valeur: string): boolean {
  return valeur.length <= 320 && MOTIF_EMAIL.test(valeur);
}

/**
 * Adresse de réponse d'un tenant : `reponses+<slug>@inbox.exemple.fr`.
 * Le repli `slug@inbox.exemple.fr` est accepté pour les boîtes dédiées.
 */
export function slugTenantDepuisDestinataire(
  destinataire: string,
  domaine: string,
): string | null {
  const propre = destinataire.trim().toLowerCase();
  const domainePropre = domaine.trim().toLowerCase().replace(/^@/u, "");
  if (!domainePropre) return null;
  const correspondance = /<([^<>]+)>/u.exec(propre);
  const adresse = (correspondance?.[1] ?? propre).trim();
  const arobase = adresse.lastIndexOf("@");
  if (arobase <= 0 || adresse.slice(arobase + 1) !== domainePropre) return null;
  const local = adresse.slice(0, arobase);
  const slug = local.startsWith("reponses+")
    ? local.slice("reponses+".length)
    : local;
  return MOTIF_SLUG.test(slug) ? slug : null;
}

function texteCourt(valeur: unknown, max: number): string | null {
  if (typeof valeur !== "string") return null;
  const propre = valeur.trim();
  return propre ? propre.slice(0, max) : null;
}

function adresseExtraite(valeur: unknown): string | null {
  const brut = texteCourt(valeur, 320);
  if (!brut) return null;
  const angle = /<([^<>]+)>/u.exec(brut);
  return (angle?.[1] ?? brut).trim().toLowerCase();
}

function nomFichierSur(valeur: unknown): string | null {
  const nom = texteCourt(valeur, 120);
  if (!nom) return null;
  return nom
    .replace(/[\\/]/gu, "-")
    .replace(/[\u0000-\u001f]/gu, "")
    .replace(/\.{2,}/gu, "-")
    .trim();
}

/**
 * Valide un message entrant. Retourne `null` plutôt que de lever : un
 * webhook mal formé ne doit jamais faire tomber le connecteur.
 */
export function normaliserEmailEntrant(
  brut: EmailEntrantBrut,
): EmailEntrant | null {
  const messageId = texteCourt(brut.messageId, 500);
  const de = adresseExtraite(brut.de);
  const vers = adresseExtraite(brut.vers);
  const sujet = texteCourt(brut.sujet, 300) ?? "";
  const texte = texteCourt(brut.texte, TAILLE_CORPS_EMAIL_MAX) ?? "";
  if (!messageId || !de || !vers || !adresseEmailValide(de) || !adresseEmailValide(vers)) {
    return null;
  }
  if (!texte && !sujet) return null;

  const dateBrute = typeof brut.date === "string" ? new Date(brut.date) : null;
  const date =
    dateBrute && !Number.isNaN(dateBrute.getTime()) ? dateBrute : new Date();

  const piecesJointes: PieceJointeEntrante[] = [];
  if (Array.isArray(brut.piecesJointes)) {
    for (const entree of brut.piecesJointes.slice(0, NOMBRE_PIECES_EMAIL_MAX)) {
      if (!entree || typeof entree !== "object") continue;
      const objet = entree as Record<string, unknown>;
      const nomFichier = nomFichierSur(objet.nomFichier);
      const typeMime = texteCourt(objet.typeMime, 100);
      if (!nomFichier || !typeMime) continue;
      const octets = objet.octets;
      if (!(octets instanceof Uint8Array)) continue;
      if (octets.byteLength <= 0 || octets.byteLength > TAILLE_PIECE_EMAIL_MAX) {
        continue;
      }
      piecesJointes.push({ nomFichier, typeMime, octets });
    }
  }

  return {
    messageId,
    inReplyTo: texteCourt(brut.inReplyTo, 500),
    de,
    vers,
    sujet,
    texte,
    date,
    piecesJointes,
  };
}
