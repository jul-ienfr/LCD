import { describe, expect, it } from "vitest";
import type {
  DemandeTraduction,
  Traducteur,
  Traduction,
} from "@/application/ports/traducteur";
import { TraduireMessageFil } from "@/application/use-cases/traduire-message-fil";
import { ErreurMetier } from "@/domain/erreurs";
import { FilsVoyageurRepositoryMemoire } from "../helpers/fils-voyageur-repository-memoire";

const TENANT = "11111111-1111-4111-8111-111111111111";
const LOGEMENT = "22222222-2222-4222-8222-222222222222";

class TraducteurEspion implements Traducteur {
  demandes: DemandeTraduction[] = [];

  async traduire(demande: DemandeTraduction): Promise<Traduction> {
    this.demandes.push(demande);
    return { texte: `[${demande.vers}] ${demande.texte}`, modele: "modele-test" };
  }
}

async function preparer() {
  const fils = new FilsVoyageurRepositoryMemoire();
  const fil = await fils.creer({
    tenantId: TENANT,
    logementId: LOGEMENT,
    voyageurNom: "Camille",
    voyageurEmail: "camille@example.test",
    langue: "en",
    cleRegroupement: "email:camille@example.test",
  });
  const message = await fils.creerMessage({
    tenantId: TENANT,
    filId: fil.id,
    ref: "IN-1",
    canal: "email",
    sens: "entrant",
    contenu: "What time can we arrive?",
    statut: "recu",
  });
  const traducteur = new TraducteurEspion();
  return {
    fil,
    message,
    traducteur,
    cas: new TraduireMessageFil(fils, traducteur),
  };
}

describe("cas d'usage traduction dans un fil", () => {
  it("traduit un message entrant vers la langue du staff", async () => {
    const { fil, message, traducteur, cas } = await preparer();

    const resultat = await cas.executerMessage({
      tenantId: TENANT,
      filId: fil.id,
      messageId: message.id,
      vers: "fr",
    });

    expect(resultat.messageId).toBe(message.id);
    expect(resultat.langueSource).toBe("en");
    expect(resultat.langueCible).toBe("fr");
    expect(resultat.texte).toBe("[fr] What time can we arrive?");
    expect(traducteur.demandes).toEqual([
      { texte: "What time can we arrive?", de: "en", vers: "fr" },
    ]);
  });

  it("refuse un message d'un autre fil ou déjà dans la langue cible", async () => {
    const { fil, message, cas } = await preparer();

    await expect(
      cas.executerMessage({
        tenantId: TENANT,
        filId: "autre-fil",
        messageId: message.id,
        vers: "fr",
      }),
    ).rejects.toBeInstanceOf(ErreurMetier);

    await expect(
      cas.executerMessage({
        tenantId: TENANT,
        filId: fil.id,
        messageId: message.id,
        vers: "en",
      }),
    ).rejects.toThrow(/déjà dans la langue/);
  });

  it("traduit une réponse non envoyée vers la langue du voyageur", async () => {
    const { fil, traducteur, cas } = await preparer();

    const resultat = await cas.executerBrouillon({
      tenantId: TENANT,
      filId: fil.id,
      texte: "Bonjour Camille, arrivée à 15 h.",
      de: "fr",
    });

    expect(resultat.langueCible).toBe("en");
    expect(resultat.messageId).toBeNull();
    expect(resultat.texte).toBe("[en] Bonjour Camille, arrivée à 15 h.");
    expect(traducteur.demandes[0]?.vers).toBe("en");
  });
});
