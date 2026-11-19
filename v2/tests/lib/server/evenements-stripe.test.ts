import { describe, expect, it, vi } from "vitest";
import type { EvenementPaiement } from "@/application/ports/paiement";
import { ErreurMetier } from "@/domain/erreurs";
import type { AlerteAEnregistrer } from "@/lib/server/alertes-exploitation";
import {
  ignorerEvenementStripe,
  rejouerEvenementStripe,
  traiterAvecTrace,
  verifierEchecsEvenementsStripe,
} from "@/lib/server/evenements-stripe";
import type { ResultatTraitementStripe } from "@/lib/server/webhook-stripe";
import { EvenementsStripeRepositoryMemoire } from "../../helpers/evenements-stripe-repository-memoire";

const tenantId = "11111111-1111-4111-8111-111111111111";

function evenement(
  partiel: Partial<EvenementPaiement> = {},
): EvenementPaiement {
  return {
    type: "paiement_reussi",
    evenementId: "evt_test_1",
    sessionId: "cs_test_1",
    montantCentimes: 30_000,
    devise: "EUR",
    reference: "RES-1",
    metadata: { tenant_id: tenantId, echeance_id: "echeance-1" },
    ...partiel,
  } as EvenementPaiement;
}

const succes: ResultatTraitementStripe = {
  traite: true,
  reponse: { ignored: false },
};

describe("trace des événements Stripe (FR-024)", () => {
  it("trace un événement, le traite et le marque traite", async () => {
    const repo = new EvenementsStripeRepositoryMemoire();
    const traiter = vi.fn().mockResolvedValue(succes);

    const resultat = await traiterAvecTrace(evenement(), { repo, traiter });

    expect(resultat.deja).toBe(false);
    expect(traiter).toHaveBeenCalledTimes(1);
    const trace = await repo.trouverParEvenementId("evt_test_1");
    expect(trace?.statut).toBe("traite");
    expect(trace?.objetId).toBe("cs_test_1");
    expect(trace?.tentatives).toBe(1);
    expect(trace?.traiteLe).not.toBeNull();
    expect(trace?.evenement).toMatchObject({ evenementId: "evt_test_1" });
  });

  it("ne retraite jamais un événement déjà traité (retry Stripe)", async () => {
    const repo = new EvenementsStripeRepositoryMemoire();
    const traiter = vi.fn().mockResolvedValue(succes);
    await traiterAvecTrace(evenement(), { repo, traiter });

    const rejeu = await traiterAvecTrace(evenement(), { repo, traiter });

    expect(rejeu.deja).toBe(true);
    expect(rejeu.traitement).toBeNull();
    expect(traiter).toHaveBeenCalledTimes(1);
    expect(repo.traces).toHaveLength(1);
  });

  it("trace un échec avec son message, puis rejoue après correction", async () => {
    const repo = new EvenementsStripeRepositoryMemoire();
    const traiter = vi
      .fn()
      .mockRejectedValueOnce(new Error("base indisponible"))
      .mockResolvedValueOnce(succes);

    await expect(
      traiterAvecTrace(evenement(), { repo, traiter }),
    ).rejects.toThrow("base indisponible");

    const enEchec = await repo.trouverParEvenementId("evt_test_1");
    expect(enEchec?.statut).toBe("echec");
    expect(enEchec?.erreur).toBe("base indisponible");
    expect(await repo.compterEchoues()).toBe(1);

    const rejeu = await rejouerEvenementStripe("evt_test_1", { repo, traiter });
    expect(rejeu.deja).toBe(false);
    const apres = await repo.trouverParEvenementId("evt_test_1");
    expect(apres?.statut).toBe("traite");
    expect(apres?.tentatives).toBe(2);
    expect(apres?.rejoueLe).not.toBeNull();
    expect(apres?.erreur).toBeNull();
    expect(await repo.compterEchoues()).toBe(0);
  });

  it("un rejeu qui échoue encore reste en échec", async () => {
    const repo = new EvenementsStripeRepositoryMemoire();
    const traiter = vi.fn().mockRejectedValue(new Error("toujours cassé"));
    await expect(
      traiterAvecTrace(evenement(), { repo, traiter }),
    ).rejects.toThrow();
    await expect(
      rejouerEvenementStripe("evt_test_1", { repo, traiter }),
    ).rejects.toThrow("toujours cassé");

    const trace = await repo.trouverParEvenementId("evt_test_1");
    expect(trace?.statut).toBe("echec");
    expect(trace?.tentatives).toBe(2);
  });

  it("refuse de rejouer un événement inconnu", async () => {
    const repo = new EvenementsStripeRepositoryMemoire();
    await expect(
      rejouerEvenementStripe("evt_inconnu", { repo }),
    ).rejects.toThrowError(ErreurMetier);
  });

  it("traite un événement ignoré sans repasser par le métier", async () => {
    const repo = new EvenementsStripeRepositoryMemoire();
    const traiter = vi.fn().mockResolvedValue({
      traite: false,
      reponse: { ignored: true },
    } satisfies ResultatTraitementStripe);

    await traiterAvecTrace(
      evenement({ type: "autre", sessionId: "", metadata: {} }),
      { repo, traiter },
    );
    const trace = await repo.trouverParEvenementId("evt_test_1");
    expect(trace?.statut).toBe("ignore");

    const rejeu = await traiterAvecTrace(
      evenement({ type: "autre", sessionId: "", metadata: {} }),
      { repo, traiter },
    );
    expect(rejeu.deja).toBe(true);
    expect(traiter).toHaveBeenCalledTimes(1);
  });

  it("permet à l'exploitant d'ignorer un faux positif", async () => {
    const repo = new EvenementsStripeRepositoryMemoire();
    await repo.enregistrer({
      evenementId: "evt_test_1",
      type: "paiement_reussi",
      objetId: "cs_test_1",
      evenement: evenement() as unknown as Record<string, unknown>,
    });
    await repo.marquerStatut("evt_test_1", {
      statut: "echec",
      erreur: "échec de test",
    });
    expect(await repo.compterEchoues()).toBe(1);

    const trace = await ignorerEvenementStripe("evt_test_1", { repo });

    expect(trace.statut).toBe("ignore");
    expect(await repo.compterEchoues()).toBe(0);
  });

  it("ne trace pas un événement sans identifiant exploitable", async () => {
    const repo = new EvenementsStripeRepositoryMemoire();
    const traiter = vi.fn().mockResolvedValue(succes);

    const resultat = await traiterAvecTrace(
      evenement({ evenementId: "" }),
      { repo, traiter },
    );

    expect(resultat.trace).toBeNull();
    expect(traiter).toHaveBeenCalledTimes(1);
    expect(repo.traces).toHaveLength(0);
  });
});

describe("alerte des événements Stripe en échec (FR-024)", () => {
  function espions() {
    const ouvertes: AlerteAEnregistrer[] = [];
    const resolues: string[] = [];
    return {
      ouvertes,
      resolues,
      ouvrir: vi.fn(async (alerte: AlerteAEnregistrer) => {
        ouvertes.push(alerte);
        return { id: "alerte-1", ...alerte } as never;
      }),
      resoudre: vi.fn(async (cle: string) => {
        resolues.push(cle);
        return true;
      }),
      notifier: vi.fn(async () => ({ envoye: true })),
    };
  }

  it("ouvre une alerte critique quand des événements échouent", async () => {
    const repo = new EvenementsStripeRepositoryMemoire();
    await repo.enregistrer({
      evenementId: "evt_test_1",
      type: "paiement_reussi",
      objetId: "cs_test_1",
      evenement: evenement() as unknown as Record<string, unknown>,
    });
    await repo.marquerStatut("evt_test_1", {
      statut: "echec",
      erreur: "boom",
    });
    const { ouvrir, resoudre, notifier, ouvertes } = espions();

    const resultat = await verifierEchecsEvenementsStripe({
      repo,
      ouvrir,
      resoudre,
      notifier,
    });

    expect(resultat.echecs).toBe(1);
    expect(resultat.alerteOuverte).toBe(true);
    expect(ouvertes[0]?.cle).toBe("stripe:evenements-echec");
    expect(ouvertes[0]?.severite).toBe("critique");
    expect(notifier).toHaveBeenCalledTimes(1);
    expect(resoudre).not.toHaveBeenCalled();
  });

  it("compte un événement « recu » bloqué comme un échec", async () => {
    const repo = new EvenementsStripeRepositoryMemoire();
    await repo.enregistrer({
      evenementId: "evt_test_1",
      type: "paiement_reussi",
      objetId: "cs_test_1",
      evenement: evenement() as unknown as Record<string, unknown>,
    });
    repo.bloquer("evt_test_1", 30);
    const { ouvrir, resoudre, notifier } = espions();

    const resultat = await verifierEchecsEvenementsStripe({
      repo,
      ouvrir,
      resoudre,
      notifier,
    });

    expect(resultat.echecs).toBe(1);
    expect(resultat.alerteOuverte).toBe(true);
  });

  it("referme l'alerte quand plus rien n'échoue", async () => {
    const repo = new EvenementsStripeRepositoryMemoire();
    const { ouvrir, resoudre, notifier, resolues } = espions();

    const resultat = await verifierEchecsEvenementsStripe({
      repo,
      ouvrir,
      resoudre,
      notifier,
    });

    expect(resultat.echecs).toBe(0);
    expect(resultat.alerteOuverte).toBe(false);
    expect(ouvrir).not.toHaveBeenCalled();
    expect(resolues).toEqual(["stripe:evenements-echec"]);
  });
});
