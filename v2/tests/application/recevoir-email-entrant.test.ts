import { describe, expect, it } from "vitest";
import type { StockageFichiers } from "@/application/ports/stockage";
import { RecevoirEmailEntrant } from "@/application/use-cases/recevoir-email-entrant";
import type { EmailEntrant } from "@/domain/email-entrant";
import { FilsVoyageurRepositoryMemoire } from "../helpers/fils-voyageur-repository-memoire";

const TENANT = "00000000-0000-4000-8000-000000000001";

function stockageMemoire(): StockageFichiers & { fichiers: Map<string, Uint8Array> } {
  const fichiers = new Map<string, Uint8Array>();
  return {
    fichiers,
    async put(cle, contenu) {
      fichiers.set(cle, contenu);
    },
    async get(cle) {
      const contenu = fichiers.get(cle);
      if (!contenu) throw new Error("absent");
      return contenu;
    },
    async signedUrl(cle) {
      return `https://stockage.test/${cle}`;
    },
    async delete(cle) {
      fichiers.delete(cle);
    },
  };
}

function email(extra: Partial<EmailEntrant> = {}): EmailEntrant {
  return {
    messageId: "<msg-1@mail.example.fr>",
    inReplyTo: "<sortant@lcd.example.fr>",
    de: "camille@example.fr",
    vers: "reponses+demo@inbox.example.fr",
    sujet: "Re: Question arrivée",
    texte: "Bonjour, arrivée vers 18 h.",
    date: new Date("2026-11-10T08:00:00.000Z"),
    piecesJointes: [],
    ...extra,
  };
}

async function preparer() {
  const fils = new FilsVoyageurRepositoryMemoire();
  const fil = await fils.creer({
    tenantId: TENANT,
    logementId: "logement-1",
    voyageurNom: "Camille",
    voyageurEmail: "camille@example.fr",
    cleRegroupement: "email:camille@example.fr",
  });
  return { fils, fil };
}

describe("réception d’un e-mail entrant", () => {
  it("range le message dans le fil du contact et conserve le Message-ID", async () => {
    const { fils, fil } = await preparer();
    const resultat = await new RecevoirEmailEntrant(fils).executer(
      TENANT,
      email(),
    );

    expect(resultat.type).toBe("recu");
    if (resultat.type !== "recu") return;
    expect(resultat.dejaRecu).toBe(false);
    expect(resultat.message).toMatchObject({
      filId: fil.id,
      canal: "email",
      sens: "entrant",
      externalId: "<msg-1@mail.example.fr>",
      expediteur: "camille@example.fr",
      destinataire: "reponses+demo@inbox.example.fr",
      statut: "recu",
    });
    expect(fils.messages).toHaveLength(1);
  });

  it("suit In-Reply-To avant le repli sur l’adresse du contact", async () => {
    const fils = new FilsVoyageurRepositoryMemoire();
    await fils.creer({
      tenantId: TENANT,
      logementId: "logement-ancien",
      voyageurNom: "Camille — ancien séjour",
      voyageurEmail: "camille@example.fr",
      cleRegroupement: "email:camille@example.fr",
    });
    const sejourCourant = await fils.creer({
      tenantId: TENANT,
      logementId: "logement-courant",
      voyageurNom: "Camille — séjour courant",
      voyageurEmail: "camille@example.fr",
      cleRegroupement: "reservation:courante",
    });
    await fils.creerMessage({
      tenantId: TENANT,
      filId: sejourCourant.id,
      ref: "sortant-parent",
      canal: "email",
      sens: "sortant",
      contenu: "Question arrivée",
      externalId: "<parent@lcd.example.fr>",
      statut: "envoye",
    });

    const resultat = await new RecevoirEmailEntrant(fils).executer(
      TENANT,
      email({ inReplyTo: "<parent@lcd.example.fr>" }),
    );

    expect(resultat.type).toBe("recu");
    if (resultat.type !== "recu") return;
    expect(resultat.message.filId).toBe(sejourCourant.id);
  });

  it("est idempotent sur le Message-ID", async () => {
    const { fils } = await preparer();
    const useCase = new RecevoirEmailEntrant(fils);
    await useCase.executer(TENANT, email());
    const second = await useCase.executer(TENANT, email());

    expect(second.type).toBe("recu");
    if (second.type !== "recu") return;
    expect(second.dejaRecu).toBe(true);
    expect(fils.messages).toHaveLength(1);
  });

  it("ignore un expéditeur inconnu sans créer de contact", async () => {
    const { fils } = await preparer();
    const resultat = await new RecevoirEmailEntrant(fils).executer(
      TENANT,
      email({ de: "inconnu@example.fr", messageId: "<msg-2@mail.example.fr>" }),
    );
    expect(resultat).toEqual({ type: "ignore", motif: "fil_introuvable" });
    expect(fils.fils).toHaveLength(1);
    expect(fils.messages).toHaveLength(0);
  });

  it("ignore un fil sans logement, car un message doit y être rattaché", async () => {
    const fils = new FilsVoyageurRepositoryMemoire();
    await fils.creer({
      tenantId: TENANT,
      voyageurNom: "Sans logement",
      voyageurEmail: "camille@example.fr",
      cleRegroupement: "email:camille@example.fr",
    });
    const resultat = await new RecevoirEmailEntrant(fils).executer(
      TENANT,
      email(),
    );
    expect(resultat).toEqual({ type: "ignore", motif: "logement_absent" });
  });

  it("stocke une pièce jointe acceptée", async () => {
    const { fils } = await preparer();
    const stockage = stockageMemoire();
    const resultat = await new RecevoirEmailEntrant(fils, stockage).executer(
      TENANT,
      email({
        messageId: "<msg-3@mail.example.fr>",
        piecesJointes: [
          {
            nomFichier: "arrivee.pdf",
            typeMime: "application/pdf",
            octets: new Uint8Array([1, 2, 3]),
          },
        ],
      }),
    );

    expect(resultat.type).toBe("recu");
    expect(stockage.fichiers.size).toBe(1);
    expect(fils.piecesJointes).toHaveLength(1);
    expect(fils.piecesJointes[0]?.nomFichier).toBe("arrivee.pdf");
  });
});
