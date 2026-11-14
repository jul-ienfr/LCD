/**
 * T095 — Mesure first-party : anonymat, liste blanche de propriétés, rétention
 * 90 jours.
 *
 * Contrat : `specs/004-ergonomie-experience-client/contracts/mesure.md`.
 */
import { describe, expect, it } from "vitest";
import type { Consentement } from "@/domain/suivi";
import {
  creerEvenement,
  parcoursParId,
  typeSuiviPour,
  VERSION_MESURE,
} from "@/lib/mesure/evenements";
import {
  contientPii,
  dansRetention,
  dateLimiteRetention,
  enregistrerMesure,
  ErreurMesure,
  filtrerProprietes,
  motifPii,
  normaliserMesure,
  PROPRIETES_AUTORISEES,
  RETENTION_JOURS,
  type DepotMesure,
} from "@/lib/server/mesure";

const CONSENTEMENT: Consentement = {
  version: "2026-11",
  mesure: true,
  publicite: false,
};

function evenementValide(surcharge: Record<string, unknown> = {}) {
  return creerEvenement({
    nom: "etape_vue",
    parcoursId: "P-RESA",
    surface: "reservation",
    route: "/reserver",
    etape: "prix",
    version: VERSION_MESURE,
    date: "2026-11-13T10:00:00.000Z",
    ...surcharge,
  } as Parameters<typeof creerEvenement>[0]);
}

describe("rétention 90 jours", () => {
  it("déclare 90 jours de rétention", () => {
    expect(RETENTION_JOURS).toBe(90);
  });

  it("place la limite à 90 jours en arrière", () => {
    const maintenant = new Date("2026-11-13T12:00:00.000Z");
    const limite = dateLimiteRetention(maintenant);
    const ecart = maintenant.getTime() - limite.getTime();
    expect(ecart).toBe(90 * 24 * 60 * 60 * 1000);
    expect(limite.toISOString()).toBe("2026-08-15T12:00:00.000Z");
  });

  it("conserve un événement de 89 jours et purge celui de 91 jours", () => {
    const maintenant = new Date("2026-11-13T12:00:00.000Z");
    const il89jours = new Date(maintenant.getTime() - 89 * 24 * 60 * 60 * 1000);
    const il91jours = new Date(maintenant.getTime() - 91 * 24 * 60 * 60 * 1000);
    expect(dansRetention(il89jours, maintenant)).toBe(true);
    expect(dansRetention(il91jours, maintenant)).toBe(false);
  });

  it("refuse une date illisible", () => {
    expect(dansRetention("pas-une-date")).toBe(false);
  });
});

describe("liste blanche de propriétés", () => {
  it("accepte les propriétés déclarées", () => {
    const propres = filtrerProprietes({
      modeLite: "L1",
      nombreResultats: 12,
      sansJs: true,
    });
    expect(propres).toEqual({ modeLite: "L1", nombreResultats: 12, sansJs: true });
  });

  it("refuse une propriété hors liste blanche au lieu de la perdre", () => {
    expect(() => filtrerProprietes({ commentaire: "trop long" })).toThrow(
      ErreurMesure,
    );
  });

  it("expose `evenement` et `parcoursId` dans la liste blanche", () => {
    expect(PROPRIETES_AUTORISEES).toContain("evenement");
    expect(PROPRIETES_AUTORISEES).toContain("parcoursId");
  });
});

describe("absence de PII", () => {
  it("détecte un e-mail", () => {
    expect(motifPii("contact@example.com")).toBe("email");
  });

  it("détecte un téléphone français ou suisse", () => {
    expect(motifPii("06 12 34 56 78")).toBe("telephone");
    expect(motifPii("+41 78 123 45 67")).toBe("telephone");
  });

  it("détecte un nom propre", () => {
    expect(motifPii("Jean Dupont")).toBe("nom_propre");
  });

  it("détecte une adresse IP et un token", () => {
    expect(motifPii("192.168.1.24")).toBe("adresse_ip");
    expect(
      motifPii("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.signature"),
    ).toBe("token");
  });

  it("ne signale pas les valeurs techniques d'un événement", () => {
    for (const valeur of [
      "/reserver",
      "P-RESA",
      "2026-11-13T10:00:00.000Z",
      "etape_vue",
      "reservation",
      42,
      true,
    ]) {
      expect(contientPii(valeur)).toBe(false);
    }
  });

  it("refuse un événement dont une propriété ressemble à un e-mail", () => {
    expect(() =>
      normaliserMesure({
        tenantId: "t1",
        visiteurId: "v1",
        sessionId: "s1",
        evenement: evenementValide(),
        consentement: CONSENTEMENT,
        proprietes: { etape: "voyageur@example.com" },
      }),
    ).toThrow(ErreurMesure);
  });

  it("ne stocke jamais l'IP brute ni l'agent utilisateur en clair", () => {
    const normalise = normaliserMesure({
      tenantId: "t1",
      visiteurId: "v1",
      sessionId: "s1",
      evenement: evenementValide(),
      consentement: CONSENTEMENT,
    });
    expect(normalise.ipHash).toBeNull();
    expect(Object.keys(normalise.metadata)).not.toContain("ip");
    expect(Object.keys(normalise.metadata)).not.toContain("userAgent");
  });

  it("refuse un événement sans tenant (tenant issu de la session)", () => {
    expect(() =>
      normaliserMesure({
        tenantId: "",
        visiteurId: "v1",
        sessionId: "s1",
        evenement: evenementValide(),
        consentement: CONSENTEMENT,
      }),
    ).toThrow(/session/);
  });
});

describe("événements de parcours", () => {
  it("décrit les parcours mesurés du contrat", () => {
    for (const id of [
      "P-RESA",
      "P-SEJOUR",
      "P-INCIDENT",
      "P-HOTE-5",
      "P-RECHERCHE",
      "P-PRESTA",
    ]) {
      expect(parcoursParId(id)?.id).toBe(id);
    }
  });

  it("refuse un parcours inconnu", () => {
    expect(() => evenementValide({ parcoursId: "P-PIRATE" })).toThrow(
      /Parcours inconnu/,
    );
  });

  it("projette les noms d'événements vers les types de suivi", () => {
    expect(typeSuiviPour("parcours_reussi")).toBe("conversion");
    expect(typeSuiviPour("etape_vue")).toBe("page_vue");
    expect(typeSuiviPour("erreur_formulaire")).toBe("autre");
  });

  it("normalise une route en retirant requête et fragment", () => {
    const evenement = evenementValide({
      route: "/voyageur?token=abc123#acces",
    });
    expect(evenement.route).toBe("/voyageur");
  });

  it("conserve la recherche sans résultat comme événement dédié", () => {
    const evenement = creerEvenement({
      nom: "recherche_sans_resultat",
      parcoursId: "P-RECHERCHE",
      surface: "staff",
      route: "/hote/recherche",
      resultat: "erreur",
      role: "hote",
    });
    expect(evenement.nom).toBe("recherche_sans_resultat");
    expect(typeSuiviPour(evenement.nom)).toBe("autre");
  });
});

describe("enregistrement via le dépôt", () => {
  it("transmet un événement normalisé, sans PII, au dépôt", async () => {
    const appels: Parameters<DepotMesure["enregistrerEvenement"]>[0][] = [];
    const depot: DepotMesure = {
      async enregistrerEvenement(entree) {
        appels.push(entree);
        return { id: "evt-1", creeLe: "2026-11-13T10:00:01.000Z" };
      },
    };

    const stocke = await enregistrerMesure(
      {
        tenantId: "tenant-1",
        visiteurId: "visiteur-anonyme",
        sessionId: "session-anonyme",
        evenement: evenementValide(),
        consentement: CONSENTEMENT,
        proprietes: { sansJs: true, nombreResultats: 3 },
      },
      depot,
    );

    expect(appels).toHaveLength(1);
    const envoye = appels[0]!;
    expect(envoye.type).toBe("page_vue");
    expect(envoye.nom).toBe("etape_vue");
    expect(envoye.page).toBe("/reserver");
    expect(envoye.metadata).toMatchObject({
      evenement: "etape_vue",
      parcoursId: "P-RESA",
      surface: "reservation",
      etape: "prix",
      sansJs: true,
      nombreResultats: 3,
    });
    expect(JSON.stringify(envoye.metadata)).not.toMatch(/@|\+41|06 \d/);
    expect(stocke.id).toBe("evt-1");
    expect(stocke.nom).toBe("etape_vue");
  });

  it("échoue avant le dépôt si une propriété est interdite", async () => {
    let appele = false;
    const depot: DepotMesure = {
      async enregistrerEvenement() {
        appele = true;
        return { id: "evt-2" };
      },
    };
    await expect(
      enregistrerMesure(
        {
          tenantId: "tenant-1",
          visiteurId: "v",
          sessionId: "s",
          evenement: evenementValide(),
          consentement: CONSENTEMENT,
          proprietes: { email: "a@b.fr" },
        },
        depot,
      ),
    ).rejects.toBeInstanceOf(ErreurMesure);
    expect(appele).toBe(false);
  });
});
