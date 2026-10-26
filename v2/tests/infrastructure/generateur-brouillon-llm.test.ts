import { describe, expect, it } from "vitest";
import type {
  BrouillonGenere,
  GenerateurBrouillon,
  RequeteBrouillon,
} from "@/application/ports/generateur-brouillon";
import type { LlmMessage, LlmProvider } from "@/application/ports/llm";
import { GenerateurBrouillonLocal } from "@/infrastructure/adapters/generateur-brouillon-local";
import {
  GenerateurBrouillonAvecRepli,
  GenerateurBrouillonLlm,
} from "@/infrastructure/adapters/generateur-brouillon-llm";

const requete: RequeteBrouillon = {
  invite: "Rédige un message d’arrivée.",
  intention: "arrivee",
  ton: "neutre",
  niveau: "standard",
  logement: "Loft Bastille",
  voyageur: "Camille",
  details: "",
};

class LlmEspion implements LlmProvider {
  messages: LlmMessage[] = [];
  options: { maxTokens?: number; modele?: string } | undefined;
  erreur: Error | null = null;

  async completer(
    messages: LlmMessage[],
    options?: { maxTokens?: number; modele?: string },
  ) {
    this.messages = messages;
    this.options = options;
    if (this.erreur) throw this.erreur;
    return {
      texte: "  Bonjour Camille, bienvenue.  ",
      modele: "modele-distant",
      tokensEntree: 120,
      tokensSortie: 40,
    };
  }
}

describe("adapter LLM de brouillons", () => {
  it("transmet le prompt système et borne la génération", async () => {
    const llm = new LlmEspion();
    const generateur = new GenerateurBrouillonLlm(llm, "modele-premium");
    const brouillon = await generateur.generer(requete);

    expect(brouillon.texte).toBe("Bonjour Camille, bienvenue.");
    expect(brouillon.modele).toBe("modele-distant");
    expect(brouillon.coutEstimeCentimes).toBe(2);
    expect(llm.messages[0]?.role).toBe("system");
    expect(llm.messages[1]?.content).toBe(requete.invite);
    expect(llm.options?.maxTokens).toBe(300);
    expect(llm.options?.modele).toBeUndefined();
  });

  it("utilise le modèle premium pour le niveau premium", async () => {
    const llm = new LlmEspion();
    const generateur = new GenerateurBrouillonLlm(llm, "modele-premium");
    await generateur.generer({ ...requete, niveau: "premium" });
    expect(llm.options?.modele).toBe("modele-premium");
  });

  it("replie sur le local si le fournisseur échoue", async () => {
    const llm = new LlmEspion();
    llm.erreur = new Error("réseau");
    const generateur = new GenerateurBrouillonAvecRepli(
      new GenerateurBrouillonLlm(llm),
      new GenerateurBrouillonLocal(),
    );
    const brouillon = await generateur.generer(requete);
    expect(brouillon.texte).toContain("Bonjour Camille");
    expect(brouillon.texte).toContain("Loft Bastille");
    expect(brouillon.coutEstimeCentimes).toBe(2);
  });

  it("n’appelle pas le repli quand le principal réussit", async () => {
    const principal: GenerateurBrouillon = {
      async generer(): Promise<BrouillonGenere> {
        return {
          texte: "Principal.",
          modele: "m",
          coutEstimeCentimes: 1,
        };
      },
    };
    const repli: GenerateurBrouillon = {
      async generer(): Promise<BrouillonGenere> {
        throw new Error("ne doit pas être appelé");
      },
    };
    const generateur = new GenerateurBrouillonAvecRepli(principal, repli);
    expect((await generateur.generer(requete)).texte).toBe("Principal.");
  });
});
