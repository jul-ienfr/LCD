import { describe, expect, it } from "vitest";
import { LANGUES_STAFF } from "@/lib/i18n-staff";
import { traductionsRecherche } from "@/lib/i18n-recherche";
import { traductionsEntite } from "@/lib/i18n-entite";
import { traductionsAcces } from "@/lib/i18n-acces";
import { traductionsSecurite } from "@/lib/i18n-securite";
import { traductionsPlanning } from "@/lib/i18n-planning";
import { traductionsCanaux } from "@/lib/i18n-canaux";
import { traductionsMenage } from "@/lib/i18n-menage";
import { traductionsMissions } from "@/lib/i18n-missions";
import { traductionsFactures } from "@/lib/i18n-factures";
import { traductionsCompta } from "@/lib/i18n-compta";
import { traductionsFinance } from "@/lib/i18n-finance";
import { traductionsVoyageurs } from "@/lib/i18n-voyageurs";
import { traductionsRelation } from "@/lib/i18n-relation";
import { traductionsExploitation } from "@/lib/i18n-exploitation";
import { traductionsConformite } from "@/lib/i18n-conformite";
import { traductionsAdministration } from "@/lib/i18n-administration";
import { traductionsAnnonce } from "@/lib/i18n-annonce";
import { traductionsCommunication } from "@/lib/i18n-communication";
import { traductionsPrix } from "@/lib/i18n-prix";
import { traductionsProprietaires } from "@/lib/i18n-proprietaires";
import { traductionsIntegrations } from "@/lib/i18n-integrations";
import { traductionsDispatch } from "@/lib/i18n-dispatch";
import { traductionsPhrases } from "@/lib/i18n-phrases";
import { traductionsTourisme } from "@/lib/i18n-tourisme";
import { traductionsTranquillite } from "@/lib/i18n-tranquillite";
import { traductionsExtras } from "@/lib/i18n-extras";
import { traductionsStocks } from "@/lib/i18n-stocks";
import { traductionsInventaire } from "@/lib/i18n-inventaire";
import { traductionsReglagesGroupe } from "@/lib/i18n-reglages-groupe";
import { traductionsEntretienDomaine } from "@/lib/i18n-entretien-domaine";
import { traductionsEtatsDesLieux } from "@/lib/i18n-etats-des-lieux";
import { traductionsPlanningImport } from "@/lib/i18n-planning-import";
import { traductionsDetails } from "@/lib/i18n-details";
import { traductionsNavigation } from "@/lib/i18n-nav";

function chaines(valeur: unknown): string[] {
  if (typeof valeur === "string") return [valeur];
  if (Array.isArray(valeur)) return valeur.flatMap(chaines);
  if (valeur && typeof valeur === "object") {
    return Object.values(valeur).flatMap(chaines);
  }
  return [];
}

describe("i18n administration et planning", () => {
  it("remplit les dictionnaires dans les cinq langues", () => {
    for (const langue of LANGUES_STAFF) {
      for (const dictionnaire of [
        traductionsRecherche(langue),
        traductionsEntite(langue),
        traductionsAcces(langue),
        traductionsSecurite(langue),
        traductionsPlanning(langue),
        traductionsCanaux(langue),
        traductionsMenage(langue),
        traductionsMissions(langue),
        traductionsFactures(langue),
        traductionsCompta(langue),
        traductionsFinance(langue),
        traductionsVoyageurs(langue),
        traductionsRelation(langue),
        traductionsExploitation(langue),
        traductionsConformite(langue),
        traductionsAdministration(langue),
        traductionsAnnonce(langue),
        traductionsCommunication(langue),
        traductionsPrix(langue),
        traductionsProprietaires(langue),
        traductionsIntegrations(langue),
        traductionsDispatch(langue),
        traductionsPhrases(langue),
        traductionsTourisme(langue),
        traductionsTranquillite(langue),
        traductionsExtras(langue),
        traductionsStocks(langue),
        traductionsInventaire(langue),
        traductionsEntretienDomaine(langue),
        traductionsReglagesGroupe(langue),
        traductionsEtatsDesLieux(langue),
        traductionsPlanningImport(langue),
        traductionsDetails(langue),
        traductionsNavigation(langue),
      ]) {
        const valeurs = chaines(dictionnaire);
        expect(valeurs.length).toBeGreaterThan(5);
        expect(valeurs.every((valeur) => valeur.trim().length > 0)).toBe(true);
      }
    }
  });

  it("interpole les données dynamiques", () => {
    expect(traductionsRecherche("en").resultats(3, "ABC")).toContain("ABC");
    expect(traductionsPlanning("de").nuits(2)).toContain("2");
    expect(traductionsCanaux("es").sansImport(4)).toContain("4");
    expect(traductionsAcces("it").sessions(2)).toContain("2");
    expect(traductionsSecurite("fr").expireLe("01/01")).toContain("01/01");
    expect(traductionsMenage("de").photosAide(8)).toContain("8");
    expect(traductionsMissions("it").titre("marzo")).toContain("marzo");
    expect(traductionsFactures("en").aRelancer(2)).toContain("2");
    expect(traductionsCompta("de").sejours(3)).toContain("3");
    expect(traductionsFinance("it").doubleAide("300 €")).toContain("300");
    expect(traductionsVoyageurs("es").messagesDe("Villa", 4)).toContain("Villa");
    expect(traductionsRelation("de").registreDe("Haus")).toContain("Haus");
    expect(traductionsExploitation("it").dossiersDe("Villa", 2)).toContain("Villa");
    expect(traductionsConformite("es").pConservees(2)).toContain("2");
    expect(traductionsAdministration("de").progression(2, 5, 40)).toContain("40");
    expect(traductionsAnnonce("it").mentions(2, 9, 22)).toContain("22");
    expect(traductionsCommunication("de").aMots(12, 80)).toContain("12");
    expect(traductionsPrix("es").resume("Villa", "V1", "Base", 3, 2)).toContain("Villa");
    expect(traductionsProprietaires("en").okRattache("Alice", "Villa")).toContain(
      "Villa",
    );
    expect(traductionsProprietaires("es").dates("2026-01-01", "2026-02-01")).toContain(
      "2026-02-01",
    );
    expect(traductionsIntegrations("de").okEnregistre("HA")).toContain("HA");
    expect(traductionsDispatch("it").missionsAVenir(3)).toContain("3");
    expect(traductionsPhrases("es").phrasesDe("Villa")).toContain("Villa");
    expect(traductionsTourisme("de").lieux(4)).toContain("4");
    expect(traductionsTranquillite("it").carnetDe("Casa", 2)).toContain("Casa");
    expect(traductionsExtras("de").okCree("Frühstück")).toContain("Frühstück");
    expect(traductionsExtras("en").resume(3, 1)).toContain("3");
    expect(traductionsStocks("es").consommablesDe("Villa")).toContain("Villa");
    expect(traductionsInventaire("de").biensDe("Villa")).toContain("Villa");
    expect(traductionsEntretienDomaine("es").eNouvelle("Villa")).toContain("Villa");
    expect(traductionsEntretienDomaine("it").dDnsDetail("x.test", "jeton")).toContain("jeton");
    expect(traductionsEtatsDesLieux("de").nouvelle("Villa")).toContain("Villa");
    expect(traductionsPlanningImport("en").fluxOk("Airbnb")).toContain("Airbnb");
    expect(traductionsDetails("it").fOuvertPar("Camille", "01/01")).toContain("Camille");
    expect(traductionsDetails("es").pTitre).toContain("romoc");
    expect(traductionsNavigation("de").apercuLectureSeule("Hôte")).toContain("Hôte");
    expect(traductionsReglagesGroupe("es").apercuModifies(3)).toContain("3");
    expect(
      traductionsReglagesGroupe("it").resumeReglages(2, 5, "Base"),
    ).toContain("2");
  });

  it("retombe sur le français", () => {
    expect(traductionsRecherche("xx").titre).toBe("Recherche globale");
    expect(traductionsEntite("xx").titre).toBe("Entité juridique");
    expect(traductionsAcces("xx").titre).toBe("Registre des accès");
    expect(traductionsSecurite("xx").titrePage).toContain("Sécurité");
    expect(traductionsPlanning("xx").titre("novembre")).toContain("Planning");
    expect(traductionsCanaux("xx").titre).toBe("Channel manager");
    expect(traductionsMenage("xx").titre).toBe("Ménage");
    expect(traductionsMissions("xx").creer).toBe("Créer une mission");
    expect(traductionsFactures("xx").creer).toBe("Créer une facture");
    expect(traductionsCompta("xx").reglages).toBe("Réglages");
    expect(traductionsProprietaires("xx").titre).toBe("Propriétaires et mandats");
    expect(traductionsIntegrations("xx").titre).toBe("Intégrations");
    expect(traductionsDispatch("xx").titre).toBe("Dispatch prestataires");
    expect(traductionsPhrases("xx").titre).toBe("Phrases types");
    expect(traductionsTourisme("xx").titre).toBe("Office de tourisme");
    expect(traductionsTranquillite("xx").titre).toBe("Carnet de tranquillité");
    expect(traductionsExtras("xx").titre).toBe("Extras voyageur");
    expect(traductionsStocks("xx").titre).toBe("Consommables & courses");
    expect(traductionsInventaire("xx").titre).toBe("Inventaire durable");
    expect(traductionsReglagesGroupe("xx").titre).toBe("Réglages groupés");
    expect(traductionsPlanningImport("xx").titre).toBe("Synchronisation ICS");
  });
});
