import { describe, expect, it } from "vitest";
import {
  analyserLogementsCsv,
  analyserReservationsCsv,
  parserCsv,
  progressionOnboarding,
} from "@/domain/import-csv";

describe("parseur CSV", () => {
  it("gère les virgules, les guillemets et les valeurs vides", () => {
    const resultat = parserCsv(
      'code,nom,adresse\nappart-1,"Appart, centre",\nappart-2,Studio,"12 rue A"',
    );
    expect(resultat.erreurs).toEqual([]);
    expect(resultat.entetes).toEqual(["code", "nom", "adresse"]);
    expect(resultat.lignes).toHaveLength(2);
    expect(resultat.lignes[0]?.valeurs).toEqual({
      code: "appart-1",
      nom: "Appart, centre",
      adresse: "",
    });
  });

  it("détecte le point-virgule, le BOM et les retours CRLF", () => {
    const resultat = parserCsv(
      "\uFEFFcode;nom\r\nappart-1;Studio\r\n",
    );
    expect(resultat.entetes).toEqual(["code", "nom"]);
    expect(resultat.lignes).toHaveLength(1);
    expect(resultat.lignes[0]?.valeurs.nom).toBe("Studio");
  });

  it("décode les guillemets échappés", () => {
    const resultat = parserCsv('code,nom\nappart-1,"Le ""petit"" studio"');
    expect(resultat.lignes[0]?.valeurs.nom).toBe('Le "petit" studio');
  });

  it("signale une ligne au nombre de colonnes incorrect", () => {
    const resultat = parserCsv("code,nom\nappart-1,Studio,trop");
    expect(resultat.erreurs[0]?.message).toContain("Attendu 2 colonnes");
    expect(resultat.lignes).toHaveLength(0);
  });
});

describe("import logements", () => {
  it("accepte des lignes valides", () => {
    const resultat = analyserLogementsCsv(
      "code,nom,adresse\nappart-1,Studio,12 rue A\nappart-2,Duplex,",
    );
    expect(resultat.erreurs).toEqual([]);
    expect(resultat.lignes).toEqual([
      { numero: 2, code: "appart-1", nom: "Studio", adresse: "12 rue A" },
      { numero: 3, code: "appart-2", nom: "Duplex", adresse: null },
    ]);
  });

  it("rapporte les codes invalides et les doublons ligne par ligne", () => {
    const resultat = analyserLogementsCsv(
      "code,nom\nAppart 1,Studio\nappart-2,Studio A\nappart-2,Studio B",
    );
    expect(resultat.lignes).toHaveLength(1);
    expect(resultat.erreurs).toEqual([
      { ligne: 2, message: "Code logement invalide : « appart 1 »." },
      {
        ligne: 4,
        message: "Code logement en double dans le fichier : « appart-2 ».",
      },
    ]);
  });

  it("exige les colonnes code et nom", () => {
    const resultat = analyserLogementsCsv("titre\nStudio");
    expect(resultat.lignes).toHaveLength(0);
    expect(resultat.erreurs[0]?.message).toContain("code, nom");
  });
});

describe("import réservations", () => {
  const codes = ["appart-1", "appart-2"];

  it("accepte une réservation valide", () => {
    const resultat = analyserReservationsCsv(
      "ref,logement,debut,fin,client_nom,voyageurs,montant_centimes\n" +
        "R-1,appart-1,2026-12-01,2026-12-05,Ada,2,45000",
      codes,
    );
    expect(resultat.erreurs).toEqual([]);
    expect(resultat.lignes[0]).toEqual({
      numero: 2,
      ref: "R-1",
      logementCode: "appart-1",
      debut: "2026-12-01",
      fin: "2026-12-05",
      clientNom: "Ada",
      voyageurs: 2,
      montantCentimes: 45000,
    });
  });

  it("refuse un logement inconnu, une date inversée et un doublon de ref", () => {
    const resultat = analyserReservationsCsv(
      "ref,logement,debut,fin\n" +
        "R-1,inconnu,2026-12-01,2026-12-05\n" +
        "R-2,appart-1,2026-12-05,2026-12-01\n" +
        "R-3,appart-1,2026-12-01,2026-12-05\n" +
        "R-3,appart-2,2026-12-06,2026-12-08",
      codes,
    );
    expect(resultat.lignes).toHaveLength(1);
    expect(resultat.erreurs.map((erreur) => erreur.ligne)).toEqual([2, 3, 5]);
    expect(resultat.erreurs[0]?.message).toContain("Logement inconnu");
    expect(resultat.erreurs[1]?.message).toContain("postérieure");
    expect(resultat.erreurs[2]?.message).toContain("Référence en double");
  });
});

describe("progression onboarding", () => {
  it("calcule faites, pourcentage, termine et prochaine étape", () => {
    const debut = progressionOnboarding({});
    expect(debut).toMatchObject({
      faites: 0,
      total: 7,
      pourcentage: 0,
      termine: false,
      prochaine: "logement",
    });

    const partiel = progressionOnboarding({ logement: true, guide: true });
    expect(partiel.faites).toBe(2);
    expect(partiel.pourcentage).toBe(29);
    expect(partiel.prochaine).toBe("prix");

    const fini = progressionOnboarding({
      logement: true,
      guide: true,
      prix: true,
      planning: true,
      equipe: true,
      messages: true,
      reservation: true,
    });
    expect(fini).toMatchObject({
      faites: 7,
      pourcentage: 100,
      termine: true,
      prochaine: null,
    });
  });
});
