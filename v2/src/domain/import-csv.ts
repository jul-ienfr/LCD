/**
 * US8 (T802/T800) — Import CSV et parcours d'onboarding.
 *
 * Le parseur est volontairement sans dépendance : il accepte `,` ou `;`,
 * les guillemets avec `""` échappés, les retours ligne CRLF et un BOM UTF-8.
 * Les analyseurs ne touchent ni au réseau ni à la base : ils produisent des
 * lignes valides et un rapport d'erreurs numéroté, consommé par la route.
 */
import { dateIsoValide } from "./calendrier";
import { codeLogementValide, nomLogementValide } from "./logement";

// --- Parcours d'onboarding ---

export const PARCOURS_ONBOARDING = [
  {
    code: "logement",
    titre: "Créer le premier logement",
    detail: "Code stable, nom et adresse, puis vérification de la copropriété.",
    lien: "/hote/logements",
  },
  {
    code: "guide",
    titre: "Compléter le guide voyageur",
    detail: "Arrivée, wifi, règles et recommandations locales.",
    lien: "/hote/logements",
  },
  {
    code: "prix",
    titre: "Définir les prix",
    detail: "Au moins une nuit tarifée sur le mois en cours.",
    lien: "/hote/prix",
  },
  {
    code: "planning",
    titre: "Relier le planning",
    detail: "Importer un flux iCal pour éviter les doubles réservations.",
    lien: "/hote/planning/import",
  },
  {
    code: "equipe",
    titre: "Inviter l'équipe",
    detail: "Un compte par personne, avec le rôle minimal nécessaire.",
    lien: "/hote/utilisateurs",
  },
  {
    code: "messages",
    titre: "Préparer les messages",
    detail: "Modèles d'arrivée, de départ et de suivi.",
    lien: "/hote/phrases",
  },
  {
    code: "reservation",
    titre: "Créer une réservation test",
    detail: "Vérifier le parcours complet avant la première vraie demande.",
    lien: "/hote/logements",
  },
] as const;

export type CodeEtapeOnboarding = (typeof PARCOURS_ONBOARDING)[number]["code"];

export function progressionOnboarding(
  faits: Partial<Record<CodeEtapeOnboarding, boolean>>,
): {
  faites: number;
  total: number;
  pourcentage: number;
  termine: boolean;
  prochaine: CodeEtapeOnboarding | null;
} {
  const total = PARCOURS_ONBOARDING.length;
  const faites = PARCOURS_ONBOARDING.filter((etape) => faits[etape.code]).length;
  const prochaine =
    PARCOURS_ONBOARDING.find((etape) => !faits[etape.code])?.code ?? null;
  return {
    faites,
    total,
    pourcentage: Math.round((faites / total) * 100),
    termine: faites === total,
    prochaine,
  };
}

// --- Parseur CSV ---

export interface ErreurImport {
  ligne: number;
  message: string;
}

export interface LigneCsv {
  /** Numéro de ligne dans le fichier d'origine (1 = en-tête). */
  numero: number;
  valeurs: Record<string, string>;
}

export interface ResultatParsingCsv {
  entetes: string[];
  lignes: LigneCsv[];
  erreurs: ErreurImport[];
}

function normaliserEntete(valeur: string): string {
  return valeur
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function compter(valeur: string, caractere: string): number {
  return valeur.split(caractere).length - 1;
}

/** Détecte le séparateur sur la première ligne hors guillemets. */
function detecterSeparateur(texte: string): "," | ";" {
  let dansGuillemets = false;
  let virgules = 0;
  let pointsVirgules = 0;
  for (const caractere of texte) {
    if (caractere === '"') dansGuillemets = !dansGuillemets;
    else if (!dansGuillemets && caractere === "\n") break;
    else if (!dansGuillemets && caractere === ",") virgules += 1;
    else if (!dansGuillemets && caractere === ";") pointsVirgules += 1;
  }
  return pointsVirgules > virgules ? ";" : ",";
}

export function parserCsv(texte: string): ResultatParsingCsv {
  const propre = texte.replace(/^\uFEFF/, "");
  const separateur = detecterSeparateur(propre);
  const lignes: LigneCsv[] = [];
  const erreurs: ErreurImport[] = [];
  let champs: string[] = [];
  let champ = "";
  let dansGuillemets = false;
  let numeroLigne = 1;
  let numeroEnregistrement = 0;

  const terminerChamp = () => {
    champs.push(champ.trim());
    champ = "";
  };

  const terminerEnregistrement = () => {
    terminerChamp();
    const valeurs = champs;
    champs = [];
    numeroEnregistrement += 1;

    if (valeurs.every((valeur) => valeur === "")) return;

    if (numeroEnregistrement === 1) {
      const entetes = valeurs.map(normaliserEntete);
      if (entetes.some((entete) => !entete)) {
        erreurs.push({ ligne: numeroLigne, message: "En-tête vide." });
      }
      const doublons = entetes.filter(
        (entete, index) => entetes.indexOf(entete) !== index,
      );
      if (doublons.length > 0) {
        erreurs.push({
          ligne: numeroLigne,
          message: `Colonne(s) en double : ${[...new Set(doublons)].join(", ")}.`,
        });
      }
      champsEntetes = entetes;
      return;
    }

    if (!champsEntetes) return;
    if (valeurs.length !== champsEntetes.length) {
      erreurs.push({
        ligne: numeroLigne,
        message: `Attendu ${champsEntetes.length} colonnes, trouvé ${valeurs.length}.`,
      });
      return;
    }
    const objet: Record<string, string> = {};
    champsEntetes.forEach((entete, index) => {
      objet[entete] = valeurs[index] ?? "";
    });
    lignes.push({ numero: numeroLigne, valeurs: objet });
  };

  let champsEntetes: string[] | null = null;

  for (let index = 0; index < propre.length; index += 1) {
    const caractere = propre[index];

    if (dansGuillemets) {
      if (caractere === '"') {
        if (propre[index + 1] === '"') {
          champ += '"';
          index += 1;
        } else {
          dansGuillemets = false;
        }
      } else {
        if (caractere === "\n") numeroLigne += 1;
        champ += caractere;
      }
      continue;
    }

    if (caractere === '"') {
      dansGuillemets = true;
    } else if (caractere === separateur) {
      terminerChamp();
    } else if (caractere === "\n") {
      terminerEnregistrement();
      numeroLigne += 1;
    } else if (caractere === "\r") {
      // Ignoré : le \n suivant termine l'enregistrement.
    } else {
      champ += caractere;
    }
  }

  if (dansGuillemets) {
    erreurs.push({
      ligne: numeroLigne,
      message: "Guillemet non fermé en fin de fichier.",
    });
  }
  if (champ !== "" || champs.length > 0) {
    terminerEnregistrement();
  }

  return {
    entetes: champsEntetes ?? [],
    lignes,
    erreurs,
  };
}

// --- Analyse logements ---

export interface LogementImporte {
  numero: number;
  code: string;
  nom: string;
  adresse: string | null;
}

export interface ResultatAnalyse<T> {
  lignes: T[];
  erreurs: ErreurImport[];
}

export function analyserLogementsCsv(texte: string): ResultatAnalyse<LogementImporte> {
  const parse = parserCsv(texte);
  const erreurs = [...parse.erreurs];
  const lignes: LogementImporte[] = [];
  const codes = new Set<string>();

  if (!parse.entetes.includes("code") || !parse.entetes.includes("nom")) {
    erreurs.push({
      ligne: 1,
      message: "Colonnes obligatoires : code, nom.",
    });
    return { lignes, erreurs };
  }

  for (const ligne of parse.lignes) {
    const code = ligne.valeurs.code?.trim().toLowerCase() ?? "";
    const nom = ligne.valeurs.nom?.trim() ?? "";
    if (!codeLogementValide(code)) {
      erreurs.push({
        ligne: ligne.numero,
        message: `Code logement invalide : « ${code} ».`,
      });
      continue;
    }
    if (!nomLogementValide(nom)) {
      erreurs.push({
        ligne: ligne.numero,
        message: "Nom du logement : 2 à 120 caractères.",
      });
      continue;
    }
    if (codes.has(code)) {
      erreurs.push({
        ligne: ligne.numero,
        message: `Code logement en double dans le fichier : « ${code} ».`,
      });
      continue;
    }
    codes.add(code);
    lignes.push({
      numero: ligne.numero,
      code,
      nom,
      adresse: ligne.valeurs.adresse?.trim() || null,
    });
  }

  return { lignes, erreurs };
}

// --- Analyse réservations ---

export interface ReservationImportee {
  numero: number;
  ref: string;
  logementCode: string;
  debut: string;
  fin: string;
  clientNom: string | null;
  voyageurs: number;
  montantCentimes: number;
}

export function analyserReservationsCsv(
  texte: string,
  codesLogements: readonly string[],
): ResultatAnalyse<ReservationImportee> {
  const parse = parserCsv(texte);
  const erreurs = [...parse.erreurs];
  const lignes: ReservationImportee[] = [];
  const refs = new Set<string>();
  const codes = new Set(codesLogements.map((code) => code.toLowerCase()));

  const obligatoires = ["ref", "logement", "debut", "fin"];
  const manquantes = obligatoires.filter(
    (colonne) => !parse.entetes.includes(colonne),
  );
  if (manquantes.length > 0) {
    erreurs.push({
      ligne: 1,
      message: `Colonnes obligatoires manquantes : ${manquantes.join(", ")}.`,
    });
    return { lignes, erreurs };
  }

  for (const ligne of parse.lignes) {
    const ref = ligne.valeurs.ref?.trim() ?? "";
    const logementCode = ligne.valeurs.logement?.trim().toLowerCase() ?? "";
    const debut = ligne.valeurs.debut?.trim() ?? "";
    const fin = ligne.valeurs.fin?.trim() ?? "";

    if (!ref) {
      erreurs.push({ ligne: ligne.numero, message: "Référence vide." });
      continue;
    }
    if (refs.has(ref)) {
      erreurs.push({
        ligne: ligne.numero,
        message: `Référence en double dans le fichier : « ${ref} ».`,
      });
      continue;
    }
    if (!codes.has(logementCode)) {
      erreurs.push({
        ligne: ligne.numero,
        message: `Logement inconnu : « ${logementCode} ».`,
      });
      continue;
    }
    if (!dateIsoValide(debut) || !dateIsoValide(fin)) {
      erreurs.push({
        ligne: ligne.numero,
        message: "Dates attendues au format AAAA-MM-JJ.",
      });
      continue;
    }
    if (fin <= debut) {
      erreurs.push({
        ligne: ligne.numero,
        message: "La date de fin doit être postérieure au début.",
      });
      continue;
    }

    const montantBrut = ligne.valeurs.montant_centimes?.trim();
    const montant = montantBrut ? Number.parseInt(montantBrut, 10) : 0;
    if (!Number.isFinite(montant) || montant < 0) {
      erreurs.push({
        ligne: ligne.numero,
        message: "Montant en centimes invalide.",
      });
      continue;
    }
    const voyageursBrut = ligne.valeurs.voyageurs?.trim();
    const voyageurs = voyageursBrut ? Number.parseInt(voyageursBrut, 10) : 1;
    if (!Number.isFinite(voyageurs) || voyageurs < 1) {
      erreurs.push({
        ligne: ligne.numero,
        message: "Nombre de voyageurs invalide.",
      });
      continue;
    }

    refs.add(ref);
    lignes.push({
      numero: ligne.numero,
      ref,
      logementCode,
      debut,
      fin,
      clientNom: ligne.valeurs.client_nom?.trim() || null,
      voyageurs,
      montantCentimes: montant,
    });
  }

  return { lignes, erreurs };
}

/** Résumé lisible d'un import, utilisé par l'UI. */
export function resumeImport(crees: number, erreurs: readonly ErreurImport[]): string {
  if (erreurs.length === 0) return `${crees} ligne(s) importée(s).`;
  return `${crees} ligne(s) importée(s), ${erreurs.length} erreur(s).`;
}
