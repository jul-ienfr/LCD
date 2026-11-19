import { describe, expect, it } from "vitest";
import {
  cleAlerteDisjoncteur,
  deciderDisjoncteur,
  effetDisjoncteur,
  messageAlerteDisjoncteur,
} from "@/domain/disjoncteur";

describe("effetDisjoncteur", () => {
  it("compte une erreur franche de synchronisation", () => {
    expect(effetDisjoncteur("erreur")).toBe("echec");
  });

  it("compte une lecture de réservations en échec (partiel transitoire)", () => {
    expect(effetDisjoncteur("partiel", { lectureEnEchec: true })).toBe(
      "echec",
    );
  });

  it("laisse neutre un partiel de configuration ou de donnée", () => {
    expect(effetDisjoncteur("partiel", { lectureEnEchec: false })).toBe(
      "neutre",
    );
    expect(effetDisjoncteur("partiel")).toBe("neutre");
  });

  it("réinitialise sur les issues abouties", () => {
    expect(effetDisjoncteur("ok")).toBe("succes");
    expect(effetDisjoncteur("inchange")).toBe("succes");
    expect(effetDisjoncteur("lecture_seule")).toBe("succes");
  });

  it("laisse neutre une configuration incomplète", () => {
    expect(effetDisjoncteur("configuration_incomplete")).toBe("neutre");
  });
});

describe("deciderDisjoncteur", () => {
  it("incrémente à chaque échec sans ouvrir avant le seuil", () => {
    let echecs = 0;
    for (let i = 0; i < 4; i++) {
      const decision = deciderDisjoncteur({
        echecsConsecutifs: echecs,
        effet: "echec",
        seuil: 5,
      });
      expect(decision.ouvrir).toBe(false);
      expect(decision.reinitialise).toBe(false);
      echecs = decision.echecsConsecutifs;
    }
    expect(echecs).toBe(4);
  });

  it("ouvre au seuil atteint", () => {
    const decision = deciderDisjoncteur({
      echecsConsecutifs: 4,
      effet: "echec",
      seuil: 5,
    });
    expect(decision.echecsConsecutifs).toBe(5);
    expect(decision.ouvrir).toBe(true);
  });

  it("reste ouvert au-delà du seuil (idempotent)", () => {
    const decision = deciderDisjoncteur({
      echecsConsecutifs: 9,
      effet: "echec",
      seuil: 5,
    });
    expect(decision.echecsConsecutifs).toBe(10);
    expect(decision.ouvrir).toBe(true);
  });

  it("réinitialise le compteur après un succès", () => {
    const decision = deciderDisjoncteur({
      echecsConsecutifs: 3,
      effet: "succes",
      seuil: 5,
    });
    expect(decision.echecsConsecutifs).toBe(0);
    expect(decision.ouvrir).toBe(false);
    expect(decision.reinitialise).toBe(true);
  });

  it("n'écrit rien après un succès si le compteur est déjà à zéro", () => {
    const decision = deciderDisjoncteur({
      echecsConsecutifs: 0,
      effet: "succes",
      seuil: 5,
    });
    expect(decision.echecsConsecutifs).toBe(0);
    expect(decision.reinitialise).toBe(false);
    expect(decision.ouvrir).toBe(false);
  });

  it("ne touche à rien sur un effet neutre", () => {
    const decision = deciderDisjoncteur({
      echecsConsecutifs: 3,
      effet: "neutre",
      seuil: 5,
    });
    expect(decision.echecsConsecutifs).toBe(3);
    expect(decision.ouvrir).toBe(false);
    expect(decision.reinitialise).toBe(false);
  });

  it("plancher du seuil à 1", () => {
    const decision = deciderDisjoncteur({
      echecsConsecutifs: 0,
      effet: "echec",
      seuil: 0,
    });
    expect(decision.ouvrir).toBe(true);
  });
});

describe("alerte de disjoncteur", () => {
  it("produit une clé stable par affectation", () => {
    expect(cleAlerteDisjoncteur("t1", "l1")).toBe("fournisseur:t1:l1");
  });

  it("décrit la pause, la reprise manuelle et la dernière erreur", () => {
    const message = messageAlerteDisjoncteur({
      logementNom: "Loft Bastille",
      fournisseurCode: "beds24",
      echecsConsecutifs: 5,
      derniereErreur: "HTTP 500",
    });
    expect(message).toContain("beds24");
    expect(message).toContain("Loft Bastille");
    expect(message).toContain("5 échecs consécutifs");
    expect(message).toContain("Reprise manuelle");
    expect(message).toContain("HTTP 500");
  });

  it("reste lisible sans nom de logement ni erreur", () => {
    const message = messageAlerteDisjoncteur({
      logementNom: null,
      fournisseurCode: "channex",
      echecsConsecutifs: 5,
      derniereErreur: null,
    });
    expect(message).toContain("channex");
    expect(message).not.toContain("Dernière erreur");
  });
});
