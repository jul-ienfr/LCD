import { describe, expect, it } from "vitest";
import { AjouterPieceJointe, validerPieceJointe } from "@/application/use-cases/ajouter-piece-jointe";
import { OuvrirFil } from "@/application/use-cases/ouvrir-fil";
import { ErreurMetier } from "@/domain/erreurs";
import { FilsVoyageurRepositoryMemoire } from "../helpers/fils-voyageur-repository-memoire";
import type { StockageFichiers } from "@/application/ports/stockage";

const TENANT = "11111111-1111-4111-8111-111111111111";
const LOGEMENT = "22222222-2222-4222-8222-222222222222";

function stockageMemoire(): StockageFichiers & { cles: string[] } {
  const cles: string[] = [];
  return {
    cles,
    async put(cle) {
      cles.push(cle);
    },
    async get() {
      return new Uint8Array();
    },
    async signedUrl(cle) {
      return `/api/fichier/${cle}`;
    },
    async delete(cle) {
      const index = cles.indexOf(cle);
      if (index >= 0) cles.splice(index, 1);
    },
  };
}

async function preparer() {
  const depot = new FilsVoyageurRepositoryMemoire();
  const ouvrir = new OuvrirFil(depot);
  const { fil } = await ouvrir.executer({
    tenantId: TENANT,
    logementId: LOGEMENT,
    voyageurNom: "Camille Test",
    voyageurEmail: "camille@example.fr",
  });
  const message = await depot.creerMessage({
    tenantId: TENANT,
    filId: fil.id,
    ref: "MSG-PJ-0001",
    canal: "email",
    sens: "sortant",
    contenu: "Bonjour Camille, voici le plan d'accès.",
  });
  return { depot, message, stockage: stockageMemoire() };
}

describe("pièces jointes de message", () => {
  it("range le fichier puis rattache la pièce au message", async () => {
    const { depot, message, stockage } = await preparer();
    const ajouter = new AjouterPieceJointe(depot, stockage);
    const piece = await ajouter.executer({
      tenantId: TENANT,
      messageId: message.id,
      nomFichier: "plan-acces.pdf",
      contentType: "application/pdf",
      octets: new Uint8Array([1, 2, 3, 4]),
    });
    expect(piece.nomFichier).toBe("plan-acces.pdf");
    expect(piece.typeMime).toBe("application/pdf");
    expect(piece.tailleOctets).toBe(4);
    expect(piece.cleStockage).toContain(`messages/${TENANT}/${message.id}/`);
    expect(stockage.cles).toHaveLength(1);
    expect(await depot.listerPiecesJointes(TENANT, message.id)).toHaveLength(1);
  });

  it("refuse un format inconnu, un fichier vide ou trop lourd", () => {
    expect(() =>
      validerPieceJointe({ contentType: "application/x-msdownload", taille: 10 }),
    ).toThrowError(/format/i);
    expect(() =>
      validerPieceJointe({ contentType: "image/jpeg", taille: 0 }),
    ).toThrowError(/vide/i);
    expect(() =>
      validerPieceJointe({ contentType: "image/png", taille: 9 * 1024 * 1024 }),
    ).toThrowError(/trop lourde/i);
    expect(validerPieceJointe({ contentType: "image/png", taille: 1024 })).toEqual({
      contentType: "image/png",
      extension: "png",
    });
  });

  it("nettoie le nom de fichier et refuse un message inconnu", async () => {
    const { depot, message, stockage } = await preparer();
    const ajouter = new AjouterPieceJointe(depot, stockage);
    const piece = await ajouter.executer({
      tenantId: TENANT,
      messageId: message.id,
      nomFichier: "../../etc/passwd.jpg",
      contentType: "image/jpeg",
      octets: new Uint8Array([9]),
    });
    expect(piece.nomFichier).toBe("----etc-passwd.jpg");
    expect(piece.cleStockage).not.toContain("..");

    await expect(
      ajouter.executer({
        tenantId: TENANT,
        messageId: "00000000-0000-4000-8000-000000000999",
        nomFichier: "plan.jpg",
        contentType: "image/jpeg",
        octets: new Uint8Array([1]),
      }),
    ).rejects.toThrowError(ErreurMetier);
    expect(stockage.cles).toHaveLength(1);
  });
});
