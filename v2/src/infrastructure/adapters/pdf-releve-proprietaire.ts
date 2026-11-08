import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";

export interface LigneRelevePdf {
  logement: string;
  sejours: number;
  caCentimes: number;
  commissionCentimes: number;
  chargesCentimes: number;
  netCentimes: number;
}

export interface ReleveProprietairePdfOptions {
  proprietaire: string;
  moisLabel: string;
  lignes: LigneRelevePdf[];
  totalCaCentimes: number;
  totalCommissionCentimes: number;
  totalChargesCentimes: number;
  totalNetCentimes: number;
  accent?: string | null;
}

function euros(centimes: number): string {
  return `${(centimes / 100).toFixed(2).replace(".", ",")} €`;
}

function propre(valeur: string): string {
  return valeur.replace(/\u202f|\u00a0/g, " ");
}

function tronquer(
  texte: string,
  police: PDFFont,
  taille: number,
  largeur: number,
): string {
  let valeur = propre(texte);
  while (valeur.length > 0 && police.widthOfTextAtSize(valeur, taille) > largeur) {
    valeur = valeur.slice(0, -1);
  }
  return valeur;
}

function couleurHex(valeur: string | null | undefined) {
  const hex = /^#[0-9a-f]{6}$/i.test(valeur ?? "")
    ? (valeur ?? "").slice(1)
    : "0e7c6b";
  return rgb(
    Number.parseInt(hex.slice(0, 2), 16) / 255,
    Number.parseInt(hex.slice(2, 4), 16) / 255,
    Number.parseInt(hex.slice(4, 6), 16) / 255,
  );
}

function entete(page: PDFPage, police: PDFFont) {
  const y = page.getHeight() - 92;
  const colonnes: [string, number][] = [
    ["Logement", 40],
    ["Séjours", 250],
    ["CA", 310],
    ["Commission", 390],
    ["Charges", 475],
    ["Net", 540],
  ];
  for (const [libelle, x] of colonnes) {
    page.drawText(libelle, {
      x,
      y,
      size: 9,
      font: police,
      color: rgb(0.35, 0.35, 0.35),
    });
  }
  page.drawLine({
    start: { x: 40, y: y - 6 },
    end: { x: 555, y: y - 6 },
    thickness: 0.5,
    color: rgb(0.8, 0.8, 0.8),
  });
  return y - 20;
}

export async function genererReleveProprietairePdf(
  options: ReleveProprietairePdfOptions,
): Promise<Uint8Array> {
  const document = await PDFDocument.create();
  const normal = await document.embedFont(StandardFonts.Helvetica);
  const gras = await document.embedFont(StandardFonts.HelveticaBold);
  const accent = couleurHex(options.accent);

  document.setTitle(`Relevé propriétaire ${options.moisLabel}`);
  document.setAuthor("LCD Parc");
  document.setSubject("Relevé propriétaire");
  document.setCreator("LCD Parc");
  document.setProducer("LCD Parc");
  document.setLanguage("fr-FR");
  document.setCreationDate(new Date());

  let page = document.addPage([595.28, 841.89]);
  page.drawRectangle({
    x: 0,
    y: page.getHeight() - 6,
    width: page.getWidth(),
    height: 6,
    color: accent,
  });
  page.drawText("Relevé propriétaire", {
    x: 40,
    y: page.getHeight() - 50,
    size: 20,
    font: gras,
    color: rgb(0.1, 0.1, 0.1),
  });
  page.drawText(propre(`${options.proprietaire} · ${options.moisLabel}`), {
    x: 40,
    y: page.getHeight() - 70,
    size: 10,
    font: normal,
    color: rgb(0.35, 0.35, 0.35),
  });

  let y = entete(page, normal);

  for (const ligne of options.lignes) {
    if (y < 80) {
      page = document.addPage([595.28, 841.89]);
      y = entete(page, normal);
    }
    const valeurs: [string, number][] = [
      [tronquer(ligne.logement, normal, 9, 195), 40],
      [String(ligne.sejours), 250],
      [euros(ligne.caCentimes), 310],
      [euros(ligne.commissionCentimes), 390],
      [euros(ligne.chargesCentimes), 475],
      [euros(ligne.netCentimes), 540],
    ];
    for (const [valeur, x] of valeurs) {
      page.drawText(valeur, {
        x,
        y,
        size: 9,
        font: normal,
        color: rgb(0.15, 0.15, 0.15),
      });
    }
    page.drawLine({
      start: { x: 40, y: y - 5 },
      end: { x: 555, y: y - 5 },
      thickness: 0.3,
      color: rgb(0.9, 0.9, 0.9),
    });
    y -= 18;
  }

  if (y < 120) {
    page = document.addPage([595.28, 841.89]);
    y = entete(page, normal);
  }

  y -= 6;
  page.drawLine({
    start: { x: 40, y: y + 10 },
    end: { x: 555, y: y + 10 },
    thickness: 0.8,
    color: rgb(0.3, 0.3, 0.3),
  });
  page.drawText("Totaux", {
    x: 40,
    y,
    size: 10,
    font: gras,
    color: rgb(0.1, 0.1, 0.1),
  });
  const totaux: [string, number][] = [
    [euros(options.totalCaCentimes), 310],
    [euros(options.totalCommissionCentimes), 390],
    [euros(options.totalChargesCentimes), 475],
    [euros(options.totalNetCentimes), 540],
  ];
  for (const [valeur, x] of totaux) {
    page.drawText(valeur, {
      x,
      y,
      size: 10,
      font: gras,
      color: rgb(0.1, 0.1, 0.1),
    });
  }

  page.drawText(
    propre(
      "Document indicatif : charges forfaitaires du mandat, hors régularisations annuelles.",
    ),
    {
      x: 40,
      y: 42,
      size: 7.5,
      font: normal,
      color: rgb(0.45, 0.45, 0.45),
    },
  );

  return document.save();
}
