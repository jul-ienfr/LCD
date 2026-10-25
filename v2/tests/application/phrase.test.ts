import { describe, expect, it } from "vitest";
import type {
  EnregistrerPhraseData,
  MettreAJourPhraseData,
  PhrasesRepository,
} from "@/application/ports/phrases-repository";
import {
  EnregistrerPhrase,
  InstallerPhrasesDefaut,
  SupprimerPhrase,
} from "@/application/use-cases/phrase";
import type { Phrase } from "@/domain/phrase";

class MemoirePhrases implements PhrasesRepository {
  items: Phrase[] = [];

  async enregistrer(data: EnregistrerPhraseData): Promise<Phrase> {
    const existante = await this.trouverParRef(data.tenantId, data.ref);
    const maintenant = new Date();
    if (existante) {
      Object.assign(existante, data, { updatedAt: maintenant });
      return existante;
    }
    const phrase: Phrase = {
      id: crypto.randomUUID(),
      ...data,
      createdAt: maintenant,
      updatedAt: maintenant,
    };
    this.items.push(phrase);
    return phrase;
  }
  async mettreAJour(
    tenantId: string,
    id: string,
    data: MettreAJourPhraseData,
  ): Promise<Phrase | null> {
    const phrase = await this.trouverParId(tenantId, id);
    if (!phrase) return null;
    Object.assign(phrase, data, { updatedAt: new Date() });
    return phrase;
  }
  async trouverParRef(tenantId: string, ref: string) {
    return (
      this.items.find((p) => p.tenantId === tenantId && p.ref === ref) ?? null
    );
  }
  async trouverParId(tenantId: string, id: string) {
    return (
      this.items.find((p) => p.tenantId === tenantId && p.id === id) ?? null
    );
  }
  async listerParLogement(tenantId: string, logementId: string) {
    return this.items.filter(
      (p) => p.tenantId === tenantId && p.logementId === logementId,
    );
  }
  async supprimer(tenantId: string, id: string) {
    this.items = this.items.filter(
      (p) => !(p.tenantId === tenantId && p.id === id),
    );
  }
}

const base = {
  tenantId: "t1",
  logementId: "l1",
  ref: "phrase-1000",
  categorie: "arrivee",
  titre: "  Arrivée  ",
  contenu: "  Bonjour {voyageur}  ",
};

describe("cas d'usage phrase", () => {
  it("crée une phrase normalisée", async () => {
    const repo = new MemoirePhrases();
    const phrase = await new EnregistrerPhrase(repo).executer(base);
    expect(phrase.titre).toBe("Arrivée");
    expect(phrase.contenu).toBe("Bonjour {voyageur}");
    expect(repo.items).toHaveLength(1);
  });

  it("met à jour une phrase existante par référence", async () => {
    const repo = new MemoirePhrases();
    const cas = new EnregistrerPhrase(repo);
    const premier = await cas.executer(base);
    const second = await cas.executer({
      ...base,
      titre: "Nouveau titre",
      contenu: "Nouveau message",
    });
    expect(second.id).toBe(premier.id);
    expect(second.titre).toBe("Nouveau titre");
    expect(repo.items).toHaveLength(1);
  });

  it("met à jour par identifiant et refuse un identifiant inconnu", async () => {
    const repo = new MemoirePhrases();
    const cas = new EnregistrerPhrase(repo);
    const phrase = await cas.executer(base);
    const maj = await cas.executer({
      ...base,
      id: phrase.id,
      ref: "",
      titre: "Édité",
      contenu: "Contenu édité",
    });
    expect(maj.titre).toBe("Édité");

    await expect(
      cas.executer({ ...base, id: "inconnu", ref: "" }),
    ).rejects.toMatchObject({ code: "PHRASE_INVALIDE" });
  });

  it("installe les modèles une seule fois par logement", async () => {
    const repo = new MemoirePhrases();
    const cas = new InstallerPhrasesDefaut(repo);
    const creees = await cas.executer({ tenantId: "t1", logementId: "l1" });
    expect(creees).toHaveLength(4);
    const encore = await cas.executer({ tenantId: "t1", logementId: "l1" });
    expect(encore).toHaveLength(0);
    expect(repo.items).toHaveLength(4);
    expect(repo.items[0]?.logementId).toBe("l1");
  });

  it("supprime une phrase", async () => {
    const repo = new MemoirePhrases();
    const phrase = await new EnregistrerPhrase(repo).executer(base);
    await new SupprimerPhrase(repo).executer("t1", phrase.id);
    expect(repo.items).toHaveLength(0);
  });
});
