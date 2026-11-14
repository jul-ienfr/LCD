/**
 * T608 — Tests d'application des demandes d'extras voyageur.
 *
 * Couvre les deux use cases et le double en mémoire du port :
 * - `DemanderExtra` : prix indicatif par type, idempotence par `ref`, audit,
 *   refus des types inconnus et des messages trop longs ;
 * - `DeciderDemandeExtra` : validation, refus motivé (≥ 10 caractères),
 *   facturation depuis une demande validée, décision unique, audit.
 */
import { describe, expect, it } from "vitest";
import { DeciderDemandeExtra } from "@/application/use-cases/decider-demande-extra";
import {
  DemanderExtra,
  messageDemande,
  prixIndicatifExtra,
} from "@/application/use-cases/demander-extra";
import {
  MESSAGE_EXTRA_MAX,
  MOTIF_REFUS_MIN,
  PRIX_EXTRA_MAX_CENTIMES,
  prixArriveeAnticipee,
  prixDepartTardif,
  refDemandeExtra,
} from "@/domain/demande-extra";
import { ErreurMetier } from "@/domain/erreurs";
import { PLANCHER_ABSOLU_CENTIMES } from "@/domain/recommandation-prix";
import { DemandesExtraRepositoryMemoire } from "../helpers/demandes-extra-repository-memoire";

const TENANT = "11111111-1111-4111-8111-111111111111";
const LOGEMENT = "22222222-2222-4222-8222-222222222222";
const RESERVATION = "33333333-3333-4333-8333-333333333333";
const PRIX_NUIT = 20_000;

const ENTREE = {
  tenantId: TENANT,
  logementId: LOGEMENT,
  reservationId: RESERVATION,
  type: "depart-tardif",
  prixNuitCentimes: PRIX_NUIT,
};

interface Trace {
  action: string;
  cible: string;
  details: Record<string, unknown>;
}

function creerTraces() {
  const traces: Trace[] = [];
  return {
    traces,
    tracer: async (entree: Trace) => {
      traces.push(entree);
    },
  };
}

async function erreurDe(promesse: Promise<unknown>): Promise<ErreurMetier> {
  try {
    await promesse;
  } catch (erreur) {
    return erreur as ErreurMetier;
  }
  throw new Error("Aucune erreur n'a été levée.");
}

describe("prixIndicatifExtra", () => {
  it("dérive le supplément du prix de la nuit pour un départ tardif", () => {
    expect(
      prixIndicatifExtra({ type: "depart-tardif", prixNuitCentimes: PRIX_NUIT }),
    ).toBe(prixDepartTardif(PRIX_NUIT));
  });

  it("dérive le supplément du prix de la nuit pour une arrivée anticipée", () => {
    expect(
      prixIndicatifExtra({
        type: "arrivee-anticipee",
        prixNuitCentimes: PRIX_NUIT,
      }),
    ).toBe(prixArriveeAnticipee(PRIX_NUIT));
  });

  it("retombe sur le plancher tarifaire pour un extra forfaitaire", () => {
    expect(
      prixIndicatifExtra({ type: "lit-bebe", prixNuitCentimes: PRIX_NUIT }),
    ).toBe(PLANCHER_ABSOLU_CENTIMES);
  });

  it("respecte un prix imposé par l'appelant", () => {
    expect(
      prixIndicatifExtra({
        type: "transfert",
        prixNuitCentimes: PRIX_NUIT,
        prixCentimes: 4_500,
      }),
    ).toBe(4_500);
  });
});

describe("messageDemande", () => {
  it("rogne les espaces et ramène un message vide à null", () => {
    expect(messageDemande("  Bonjour  ")).toBe("Bonjour");
    expect(messageDemande("   ")).toBeNull();
    expect(messageDemande(undefined)).toBeNull();
  });
});

describe("DemanderExtra", () => {
  it("enregistre une demande proposée au statut « demande » et l'audite", async () => {
    const demandes = new DemandesExtraRepositoryMemoire();
    const { traces, tracer } = creerTraces();
    const useCase = new DemanderExtra({ demandes, tracer });

    const resultat = await useCase.executer({
      ...ENTREE,
      message: "Nous arriverons après 20 h.",
    });

    expect(resultat.cree).toBe(true);
    expect(resultat.statut).toBe("demande");
    expect(resultat.type).toBe("depart-tardif");
    expect(resultat.prixCentimes).toBe(prixDepartTardif(PRIX_NUIT));
    expect(resultat.ref).toBe(refDemandeExtra(RESERVATION, "depart-tardif"));
    expect(demandes.rows).toHaveLength(1);
    expect(demandes.rows[0]?.message).toBe("Nous arriverons après 20 h.");
    expect(demandes.rows[0]?.tenantId).toBe(TENANT);
    expect(traces).toHaveLength(1);
    expect(traces[0]?.action).toBe("extra.demande");
    // La cible d'audit est la référence stable, lisible par un humain.
    expect(traces[0]?.cible).toBe(resultat.ref);
    expect(traces[0]?.details).toMatchObject({
      reservationId: RESERVATION,
      type: "depart-tardif",
      cree: true,
    });
  });

  it("est idempotent : le rejeu retourne la demande existante", async () => {
    const demandes = new DemandesExtraRepositoryMemoire();
    const useCase = new DemanderExtra({ demandes });

    const premier = await useCase.executer(ENTREE);
    const rejeu = await useCase.executer({ ...ENTREE, message: "Autre texte" });

    expect(rejeu.cree).toBe(false);
    expect(rejeu.id).toBe(premier.id);
    expect(rejeu.ref).toBe(premier.ref);
    expect(demandes.rows).toHaveLength(1);
    // Le message d'origine n'est pas écrasé par le rejeu.
    expect(demandes.rows[0]?.message).toBeNull();
  });

  it("refuse un type d'extra inconnu", async () => {
    const demandes = new DemandesExtraRepositoryMemoire();
    const useCase = new DemanderExtra({ demandes });

    const erreur = await erreurDe(useCase.executer({ ...ENTREE, type: "jet-ski" }));

    expect(erreur).toBeInstanceOf(ErreurMetier);
    expect((erreur as ErreurMetier).code).toBe("DEMANDE_EXTRA_INVALIDE");
    expect(demandes.rows).toHaveLength(0);
  });

  it("refuse un message trop long", async () => {
    const demandes = new DemandesExtraRepositoryMemoire();
    const useCase = new DemanderExtra({ demandes });

    const erreur = await erreurDe(
      useCase.executer({ ...ENTREE, message: "a".repeat(MESSAGE_EXTRA_MAX + 1) }),
    );

    expect((erreur as ErreurMetier).code).toBe("DEMANDE_EXTRA_INVALIDE");
    expect(demandes.rows).toHaveLength(0);
  });

  it("refuse un prix dépassant le plafond autorisé", async () => {
    const demandes = new DemandesExtraRepositoryMemoire();
    const useCase = new DemanderExtra({ demandes });

    const erreur = await erreurDe(
      useCase.executer({
        ...ENTREE,
        type: "transfert",
        prixCentimes: PRIX_EXTRA_MAX_CENTIMES + 1,
      }),
    );

    expect((erreur as ErreurMetier).code).toBe("DEMANDE_EXTRA_INVALIDE");
    expect(demandes.rows).toHaveLength(0);
  });
});

describe("DeciderDemandeExtra", () => {
  async function demander(
    demandes: DemandesExtraRepositoryMemoire,
    type = "depart-tardif",
  ) {
    const resultat = await new DemanderExtra({ demandes }).executer({
      ...ENTREE,
      type,
    });
    return resultat;
  }

  it("valide une demande et l'audite", async () => {
    const demandes = new DemandesExtraRepositoryMemoire();
    const { traces, tracer } = creerTraces();
    const demande = await demander(demandes);

    const resultat = await new DeciderDemandeExtra({
      demandes,
      tracer,
    }).executer({
      tenantId: TENANT,
      demandeId: demande.id,
      decision: "validee",
      par: "staff@lcd.fr",
      maintenant: "2027-05-01T10:00:00.000Z",
    });

    expect(resultat.modifiee).toBe(true);
    expect(resultat.demande.statut).toBe("validee");
    expect(resultat.demande.decideePar).toBe("staff@lcd.fr");
    expect(resultat.demande.decideeLe).toBe("2027-05-01T10:00:00.000Z");
    expect(demandes.rows[0]?.statut).toBe("validee");
    expect(traces).toHaveLength(1);
    expect(traces[0]?.action).toBe("extra.decision");
    expect(traces[0]?.cible).toBe(resultat.demande.ref);
    expect(traces[0]?.details).toMatchObject({
      demandeId: resultat.demande.id,
      statut: "validee",
      par: "staff@lcd.fr",
    });
  });

  it("exige un motif d'au moins dix caractères pour un refus", async () => {
    const demandes = new DemandesExtraRepositoryMemoire();
    const demande = await demander(demandes);
    const useCase = new DeciderDemandeExtra({ demandes });

    const erreur = await erreurDe(
      useCase.executer({
        tenantId: TENANT,
        demandeId: demande.id,
        decision: "refusee",
        par: "staff@lcd.fr",
        motif: "non",
      }),
    );

    expect((erreur as ErreurMetier).code).toBe("DEMANDE_EXTRA_INVALIDE");
    expect(demandes.rows[0]?.statut).toBe("demande");
  });

  it("enregistre le motif d'un refus valide", async () => {
    const demandes = new DemandesExtraRepositoryMemoire();
    const demande = await demander(demandes);
    const motif = "Le logement est déjà occupé le lendemain.";
    expect(motif.length).toBeGreaterThanOrEqual(MOTIF_REFUS_MIN);

    const resultat = await new DeciderDemandeExtra({ demandes }).executer({
      tenantId: TENANT,
      demandeId: demande.id,
      decision: "refusee",
      par: "staff@lcd.fr",
      motif,
    });

    expect(resultat.demande.statut).toBe("refusee");
    expect(resultat.demande.motifRefus).toBe(motif);
    expect(demandes.rows[0]?.motifRefus).toBe(motif);
  });

  it("ne rejoue pas une décision déjà prise", async () => {
    const demandes = new DemandesExtraRepositoryMemoire();
    const demande = await demander(demandes);
    const useCase = new DeciderDemandeExtra({ demandes });

    await useCase.executer({
      tenantId: TENANT,
      demandeId: demande.id,
      decision: "validee",
      par: "staff@lcd.fr",
    });
    const erreur = await erreurDe(
      useCase.executer({
        tenantId: TENANT,
        demandeId: demande.id,
        decision: "refusee",
        par: "autre@lcd.fr",
        motif: "Changement d'avis côté staff.",
      }),
    );

    expect((erreur as ErreurMetier).code).toBe("DEMANDE_EXTRA_INVALIDE");
    expect(demandes.rows[0]?.statut).toBe("validee");
  });

  it("facture une demande validée", async () => {
    const demandes = new DemandesExtraRepositoryMemoire();
    const demande = await demander(demandes);
    const useCase = new DeciderDemandeExtra({ demandes });

    await useCase.executer({
      tenantId: TENANT,
      demandeId: demande.id,
      decision: "validee",
      par: "staff@lcd.fr",
    });
    const resultat = await useCase.executer({
      tenantId: TENANT,
      demandeId: demande.id,
      decision: "facturee",
      par: "staff@lcd.fr",
    });

    expect(resultat.demande.statut).toBe("facturee");
    expect(demandes.rows[0]?.statut).toBe("facturee");
  });

  it("refuse de facturer une demande encore au statut « demande »", async () => {
    const demandes = new DemandesExtraRepositoryMemoire();
    const demande = await demander(demandes);

    const erreur = await erreurDe(
      new DeciderDemandeExtra({ demandes }).executer({
        tenantId: TENANT,
        demandeId: demande.id,
        decision: "facturee",
        par: "staff@lcd.fr",
      }),
    );

    expect((erreur as ErreurMetier).code).toBe("DEMANDE_EXTRA_INVALIDE");
    expect(demandes.rows[0]?.statut).toBe("demande");
  });

  it("refuse une décision inconnue et une demande introuvable", async () => {
    const demandes = new DemandesExtraRepositoryMemoire();
    const demande = await demander(demandes);
    const useCase = new DeciderDemandeExtra({ demandes });

    const inconnue = await erreurDe(
      useCase.executer({
        tenantId: TENANT,
        demandeId: demande.id,
        decision: "peut-etre" as "validee",
        par: "staff@lcd.fr",
      }),
    );
    const absente = await erreurDe(
      useCase.executer({
        tenantId: TENANT,
        demandeId: "44444444-4444-4444-8444-444444444444",
        decision: "validee",
        par: "staff@lcd.fr",
      }),
    );

    expect((inconnue as ErreurMetier).code).toBe("DEMANDE_EXTRA_INVALIDE");
    expect((absente as ErreurMetier).code).toBe("DEMANDE_EXTRA_INVALIDE");
    expect(demandes.rows[0]?.statut).toBe("demande");
  });

  it("ne voit pas les demandes d'un autre tenant", async () => {
    const demandes = new DemandesExtraRepositoryMemoire();
    const demande = await demander(demandes);

    const erreur = await erreurDe(
      new DeciderDemandeExtra({ demandes }).executer({
        tenantId: "99999999-9999-4999-8999-999999999999",
        demandeId: demande.id,
        decision: "validee",
        par: "staff@lcd.fr",
      }),
    );

    expect((erreur as ErreurMetier).code).toBe("DEMANDE_EXTRA_INVALIDE");
  });
});
