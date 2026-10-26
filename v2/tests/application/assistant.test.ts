import { describe, expect, it } from "vitest";
import type {
  BrouillonGenere,
  GenerateurBrouillon,
  RequeteBrouillon,
} from "@/application/ports/generateur-brouillon";
import { RedigerBrouillon } from "@/application/use-cases/assistant";
import { LogementRepositoryMemoire } from "../helpers/logement-repository-memoire";

class GenerateurEspion implements GenerateurBrouillon {
  requete: RequeteBrouillon | null = null;

  constructor(private readonly texte = "Brouillon court.") {}

  async generer(requete: RequeteBrouillon): Promise<BrouillonGenere> {
    this.requete = requete;
    return {
      texte: this.texte,
      modele: "modele-test",
      coutEstimeCentimes: 2,
    };
  }
}

async function preparer(texte?: string) {
  const logements = new LogementRepositoryMemoire();
  const logement = await logements.creer({
    tenantId: "t1",
    code: "loft",
    nom: "Loft Bastille",
  });
  const generateur = new GenerateurEspion(texte);
  return {
    logement,
    generateur,
    cas: new RedigerBrouillon(generateur, logements),
  };
}

describe("cas d'usage assistant", () => {
  it("route, construit le prompt et génère un brouillon", async () => {
    const { logement, generateur, cas } = await preparer();
    const resultat = await cas.executer({
      tenantId: "t1",
      logementId: logement.id,
      intention: "avis",
      ton: "chaleureux",
      voyageur: "Camille",
      details: "Séjour en famille.",
    });
    expect(resultat.routage.niveau).toBe("premium");
    expect(resultat.modele).toBe("modele-test");
    expect(resultat.texte).toBe("Brouillon court.");
    expect(resultat.alertes).toEqual([]);
    expect(resultat.invite).toContain("Loft Bastille");
    expect(resultat.invite).toContain("Camille");
    expect(generateur.requete?.niveau).toBe("premium");
    expect(generateur.requete?.details).toBe("Séjour en famille.");
  });

  it("signale un brouillon hors garde-fous sans le bloquer à la génération", async () => {
    const { logement, cas } = await preparer("mot ".repeat(90));
    const resultat = await cas.executer({
      tenantId: "t1",
      logementId: logement.id,
      intention: "arrivee",
      ton: "neutre",
    });
    expect(resultat.alertes).toContain(
      "Le brouillon dépasse 80 mots (90).",
    );
  });

  it("refuse une intention, un ton ou un logement invalides", async () => {
    const { logement, cas } = await preparer();    await expect(
      cas.executer({
        tenantId: "t1",
        logementId: logement.id,
        intention: "inconnue",
        ton: "neutre",
      }),
    ).rejects.toMatchObject({ code: "ASSISTANT_INVALIDE" });
    await expect(
      cas.executer({
        tenantId: "t1",
        logementId: logement.id,
        intention: "arrivee",
        ton: "sec",
      }),
    ).rejects.toMatchObject({ code: "ASSISTANT_INVALIDE" });
    await expect(
      cas.executer({
        tenantId: "t1",
        logementId: "inconnu",
        intention: "arrivee",
        ton: "neutre",
      }),
    ).rejects.toMatchObject({ code: "ASSISTANT_INVALIDE" });
  });
});
