import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";
import type { Facture } from "@/domain/facture";
import type { Paiement } from "@/domain/paiement";

export interface PdfFactureOptions {
  vendeurNom: string;
  vendeurAdresse?: string | null;
  logementNom?: string | null;
  xmlFacturX: string;
  paiements?: Paiement[];
  montantPayeCentimes?: number;
  resteCentimes?: number;
  mentionsLegales?: string | null;
}

function euros(centimes: number): string {
  return `${(centimes / 100).toFixed(2).replace(".", ",")} €`;
}

function texteSur(valeur: string): string {
  return valeur.replace(/\u202f|\u00a0/g, " ").slice(0, 500);
}

async function ecrire(
  page: PDFPage,
  texte: string,
  options: {
    x: number;
    y: number;
    taille?: number;
    police: PDFFont;
    couleur?: ReturnType<typeof rgb>;
    maxWidth?: number;
  },
) {
  const { x, y, taille = 10, police, couleur = rgb(0.1, 0.1, 0.1) } = options;
  let valeur = texteSur(texte);
  if (options.maxWidth) {
    while (valeur.length > 0 && police.widthOfTextAtSize(valeur, taille) > options.maxWidth) {
      valeur = valeur.slice(0, -1);
    }
  }
  page.drawText(valeur, { x, y, size: taille, font: police, color: couleur });
}

export async function genererPdfFacture(
  facture: Facture,
  options: PdfFactureOptions,
): Promise<Uint8Array> {
  const document = await PDFDocument.create();
  const normal = await document.embedFont(StandardFonts.Helvetica);
  const gras = await document.embedFont(StandardFonts.HelveticaBold);

  document.setTitle(`Facture ${facture.numero}`);
  document.setAuthor(options.vendeurNom);
  document.setSubject("Facture");
  document.setCreator("LCD Parc");
  document.setProducer("LCD Parc");
  document.setLanguage("fr-FR");
  document.setCreationDate(new Date());

  let page = document.addPage([595.28, 841.89]);
  const largeur = page.getWidth();
  let y = page.getHeight() - 56;

  await ecrire(page, options.vendeurNom, {
    x: 50,
    y,
    taille: 16,
    police: gras,
  });
  await ecrire(page, "Conciergerie locative", {
    x: 50,
    y: y - 18,
    taille: 9,
    police: normal,
    couleur: rgb(0.4, 0.4, 0.4),
  });
  if (options.vendeurAdresse) {
    await ecrire(page, options.vendeurAdresse, {
      x: 50,
      y: y - 32,
      taille: 8,
      police: normal,
      couleur: rgb(0.4, 0.4, 0.4),
      maxWidth: 250,
    });
  }

  await ecrire(page, "FACTURE", {
    x: largeur - 190,
    y,
    taille: 20,
    police: gras,
  });
  await ecrire(page, facture.numero, {
    x: largeur - 190,
    y: y - 22,
    taille: 11,
    police: gras,
  });
  await ecrire(page, `Émise le ${facture.dateEmission}`, {
    x: largeur - 190,
    y: y - 38,
    taille: 8,
    police: normal,
    couleur: rgb(0.4, 0.4, 0.4),
  });
  if (facture.echeance) {
    await ecrire(page, `Échéance : ${facture.echeance}`, {
      x: largeur - 190,
      y: y - 50,
      taille: 8,
      police: normal,
      couleur: rgb(0.4, 0.4, 0.4),
    });
  }

  y -= 86;
  page.drawLine({
    start: { x: 50, y },
    end: { x: largeur - 50, y },
    thickness: 0.5,
    color: rgb(0.8, 0.8, 0.8),
  });

  y -= 24;
  await ecrire(page, "CLIENT", {
    x: 50,
    y,
    taille: 8,
    police: gras,
    couleur: rgb(0.5, 0.5, 0.5),
  });
  await ecrire(page, facture.clientNom, {
    x: 50,
    y: y - 16,
    taille: 11,
    police: gras,
  });
  if (facture.clientEmail) {
    await ecrire(page, facture.clientEmail, {
      x: 50,
      y: y - 30,
      taille: 9,
      police: normal,
      couleur: rgb(0.4, 0.4, 0.4),
    });
  }
  await ecrire(page, "LOGEMENT", {
    x: 320,
    y,
    taille: 8,
    police: gras,
    couleur: rgb(0.5, 0.5, 0.5),
  });
  await ecrire(page, options.logementNom ?? "", {
    x: 320,
    y: y - 16,
    taille: 10,
    police: normal,
    maxWidth: 220,
  });

  y -= 64;
  page.drawRectangle({
    x: 50,
    y: y - 4,
    width: largeur - 100,
    height: 20,
    color: rgb(0.96, 0.96, 0.95),
  });
  await ecrire(page, "Désignation", {
    x: 56,
    y: y + 2,
    taille: 8,
    police: gras,
  });
  await ecrire(page, "Qté", {
    x: 370,
    y: y + 2,
    taille: 8,
    police: gras,
  });
  await ecrire(page, "P.U.", {
    x: 420,
    y: y + 2,
    taille: 8,
    police: gras,
  });
  await ecrire(page, "Total", {
    x: 500,
    y: y + 2,
    taille: 8,
    police: gras,
  });

  y -= 20;
  for (const ligne of facture.lignes) {
    if (y < 180) {
      page = document.addPage([595.28, 841.89]);
      y = page.getHeight() - 56;
      await ecrire(page, `${facture.numero} — suite`, {
        x: 50,
        y,
        taille: 9,
        police: normal,
        couleur: rgb(0.4, 0.4, 0.4),
      });
      y -= 24;
    }
    await ecrire(page, ligne.designation, {
      x: 56,
      y,
      taille: 9,
      police: normal,
      maxWidth: 290,
    });
    await ecrire(page, String(ligne.quantite), {
      x: 374,
      y,
      taille: 9,
      police: normal,
    });
    await ecrire(page, euros(ligne.prixUnitaireCentimes), {
      x: 420,
      y,
      taille: 9,
      police: normal,
    });
    await ecrire(page, euros(ligne.totalCentimes), {
      x: 500,
      y,
      taille: 9,
      police: normal,
    });
    y -= 18;
  }

  y -= 12;
  page.drawLine({
    start: { x: 50, y },
    end: { x: largeur - 50, y },
    thickness: 0.5,
    color: rgb(0.8, 0.8, 0.8),
  });
  y -= 22;

  const totaux: [string, string][] = [
    ["Total HT", euros(facture.montantHtCentimes)],
    ["TVA", euros(facture.tvaCentimes)],
    ["Taxe de séjour", euros(facture.taxeSejourCentimes)],
    ["Total TTC", euros(facture.montantTtcCentimes)],
  ];
  if (options.montantPayeCentimes !== undefined && options.montantPayeCentimes > 0) {
    totaux.push(["Déjà payé", euros(options.montantPayeCentimes)]);
    totaux.push(["Reste à payer", euros(options.resteCentimes ?? 0)]);
  }

  for (const [libelle, montant] of totaux) {
    const important = libelle === "Total TTC";
    await ecrire(page, libelle, {
      x: 360,
      y,
      taille: important ? 10 : 9,
      police: important ? gras : normal,
      couleur: important ? rgb(0.1, 0.1, 0.1) : rgb(0.4, 0.4, 0.4),
    });
    await ecrire(page, montant, {
      x: 500,
      y,
      taille: important ? 10 : 9,
      police: important ? gras : normal,
    });
    y -= important ? 20 : 16;
  }

  if (options.mentionsLegales) {
    y -= 18;
    await ecrire(page, options.mentionsLegales, {
      x: 50,
      y,
      taille: 7,
      police: normal,
      couleur: rgb(0.45, 0.45, 0.45),
      maxWidth: 495,
    });
  }

  const pied = page.getHeight() - 24;
  await ecrire(
    page,
    "Document généré par LCD Parc. Le XML Factur-X est incorporé en pièce jointe.",
    {
      x: 50,
      y: pied,
      taille: 7,
      police: normal,
      couleur: rgb(0.55, 0.55, 0.55),
      maxWidth: 495,
    },
  );

  await document.attach(new TextEncoder().encode(options.xmlFacturX), "factur-x.xml", {
    mimeType: "application/xml",
    description: "Factur-X CII",
    creationDate: new Date(),
    modificationDate: new Date(),
  });

  return document.save();
}
