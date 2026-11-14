import { describe, expect, it } from "vitest";
import type {
  BrouillonGenere,
  GenerateurBrouillon,
  RequeteBrouillon,
} from "@/application/ports/generateur-brouillon";
import { RedigerBrouillonFil } from "@/application/use-cases/rediger-brouillon-fil";
import { ErreurMetier } from "@/domain/erreurs";
import { ConsommationsAssistantRepositoryMemoire } from "../helpers/consommations-assistant-repository-memoire";
import { FilsVoyageurRepositoryMemoire } from "../helpers/fils-voyageur-repository-memoire";
import { LogementRepositoryMemoire } from "../helpers/logement-repository-memoire";

const TENANT = "11111111-1111-4111-8111-111111111111";

class GenerateurEspion implements GenerateurBrouillon {
  requete: RequeteBrouillon | null = null;

  constructor(private readonly texte = "Bonjour Camille, arrivée à 15 h.") {}

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
    tenantId: TENANT,
    code: "loft-fil",
    nom: "Loft Fil",
  });
  const fils = new FilsVoyageurRepositoryMemoire();
  const fil = await fils.creer({
    tenantId: TENANT,
    logementId: logement.id,
    voyageurNom: "Camille",
    voyageurEmail: "camille@example.test",
    cleRegroupement: "email:camille@example.test",
  });
  await fils.creerMessage({
    tenantId: TENANT,
    filId: fil.id,
    ref: "E2E-IN-1",
    canal: "email",
    sens: "entrant",
    contenu: "Bonjour, à quelle heure peut-on arriver ? Mon code est 4821.",
    statut: "recu",
  });
  const generateur = new GenerateurEspion(texte);
  const consommations = new ConsommationsAssistantRepositoryMemoire();
  return {
    fil,
    generateur,
    consommations,
    cas: new RedigerBrouillonFil(
      generateur,
      fils,
      logements,
      consommations,
    ),
  };
}

describe("cas d'usage brouillon assistant contextualisé par un fil", () => {
  it("génère un brouillon, l'ajoute au fil et enregistre le coût", async () => {
    const { fil, generateur, consommations, cas } = await preparer();

    const resultat = await cas.executer({
      tenantId: TENANT,
      filId: fil.id,
      intention: "arrivee",
      ton: "neutre",
      canal: "email",
      details: "Arrivée à partir de 15 h.",
    });

    expect(resultat.message.statut).toBe("brouillon");
    expect(resultat.message.sens).toBe("sortant");
    expect(resultat.message.filId).toBe(fil.id);
    expect(resultat.message.ref).toMatch(/^assist-arrivee-/);
    expect(resultat.message.contenu).toBe(
      "Bonjour Camille, arrivée à 15 h.",
    );
    expect(resultat.coutEstimeCentimes).toBe(0);
    expect(consommations.items).toHaveLength(1);
    expect(generateur.requete?.invite).toContain("Historique récent du fil");
    expect(generateur.requete?.invite).toContain("à quelle heure");
    expect(generateur.requete?.invite).not.toContain("4821");
  });

  it("rejoue la même demande sans créer un second brouillon", async () => {
    const { fil, consommations, cas } = await preparer();
    const input = {
      tenantId: TENANT,
      filId: fil.id,
      intention: "arrivee",
      ton: "neutre",
      canal: "email",
      details: "Arrivée à partir de 15 h.",
    };

    const premier = await cas.executer(input);
    const second = await cas.executer(input);

    expect(second.message.id).toBe(premier.message.id);
    expect(consommations.items).toHaveLength(1);
  });

  it("refuse un fil clos et un brouillon hors garde-fous", async () => {
    const { fil, cas } = await preparer("mot ".repeat(90));

    await expect(
      cas.executer({
        tenantId: TENANT,
        filId: fil.id,
        intention: "arrivee",
        ton: "neutre",
        canal: "email",
      }),
    ).rejects.toBeInstanceOf(ErreurMetier);

    const fils = new FilsVoyageurRepositoryMemoire();
    const clos = await fils.creer({
      tenantId: TENANT,
      logementId: "00000000-0000-4000-8000-000000000000",
      voyageurNom: "Clos",
      cleRegroupement: "email:clos@example.test",
    });
    await fils.mettreAJour(TENANT, clos.id, { statut: "clos" });
    const casClos = new RedigerBrouillonFil(
      new GenerateurEspion(),
      fils,
      new LogementRepositoryMemoire(),
      new ConsommationsAssistantRepositoryMemoire(),
    );
    await expect(
      casClos.executer({
        tenantId: TENANT,
        filId: clos.id,
        intention: "arrivee",
        ton: "neutre",
        canal: "email",
      }),
    ).rejects.toThrow("fil clos");
  });
});
