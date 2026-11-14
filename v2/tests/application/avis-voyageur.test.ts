import { describe, expect, it } from "vitest";
import {
  DeposerAvisVoyageur,
  InviterAvisVoyageur,
  ModererAvisVoyageur,
} from "@/application/use-cases/gerer-avis-voyageur";
import { ErreurMetier } from "@/domain/erreurs";
import { refAvisVoyageur } from "@/domain/avis-voyageur";
import { AvisVoyageurRepositoryMemoire } from "../helpers/avis-voyageur-repository-memoire";

const TENANT = "11111111-1111-4111-8111-111111111111";
const RESERVATION = "reservation-abcdef12";
const LOGEMENT = "22222222-2222-4222-8222-222222222222";

function invitation() {
  return new InviterAvisVoyageur(new AvisVoyageurRepositoryMemoire());
}

describe("invitation à un avis (J+1)", () => {
  it("crée une invitation au statut invite avec une référence stable", async () => {
    const repo = new AvisVoyageurRepositoryMemoire();
    const resultat = await new InviterAvisVoyageur(repo).executer({
      tenantId: TENANT,
      reservationId: RESERVATION,
      logementId: LOGEMENT,
      depart: "2027-06-17",
      maintenant: "2027-06-18T09:00:00.000Z",
    });

    expect(resultat.cree).toBe(true);
    expect(resultat.avis.statut).toBe("invite");
    expect(resultat.avis.ref).toBe(refAvisVoyageur(RESERVATION));
    expect(resultat.avis.note).toBeNull();
    expect(resultat.avis.inviteLe).toBe("2027-06-18T09:00:00.000Z");
  });

  it("est idempotente : un rejeu retrouve l'invitation sans en créer une seconde", async () => {
    const repo = new AvisVoyageurRepositoryMemoire();
    const cas = new InviterAvisVoyageur(repo);
    const input = {
      tenantId: TENANT,
      reservationId: RESERVATION,
      logementId: LOGEMENT,
      depart: "2027-06-17",
    };

    const premier = await cas.executer(input);
    const second = await cas.executer(input);

    expect(premier.cree).toBe(true);
    expect(second.cree).toBe(false);
    expect(second.avis.id).toBe(premier.avis.id);
    expect(repo.avis).toHaveLength(1);
  });

  it("refuse une date de départ mal formée", async () => {
    await expect(
      invitation().executer({
        tenantId: TENANT,
        reservationId: RESERVATION,
        logementId: LOGEMENT,
        depart: "17/06/2027",
      }),
    ).rejects.toBeInstanceOf(ErreurMetier);
  });
});

describe("dépôt d'un avis voyageur", () => {
  it("enregistre la note et le commentaire et passe au statut recu", async () => {
    const repo = new AvisVoyageurRepositoryMemoire();
    await new InviterAvisVoyageur(repo).executer({
      tenantId: TENANT,
      reservationId: RESERVATION,
      logementId: LOGEMENT,
      depart: "2027-06-17",
    });

    const avis = await new DeposerAvisVoyageur(repo).executer({
      tenantId: TENANT,
      reservationId: RESERVATION,
      note: 5,
      commentaire: "  Séjour parfait.  ",
      maintenant: "2027-06-19T10:00:00.000Z",
    });

    expect(avis.statut).toBe("recu");
    expect(avis.note).toBe(5);
    expect(avis.commentaire).toBe("Séjour parfait.");
    expect(avis.recuLe).toBe("2027-06-19T10:00:00.000Z");
  });

  it("refuse un dépôt sans invitation", async () => {
    await expect(
      new DeposerAvisVoyageur(
        new AvisVoyageurRepositoryMemoire(),
      ).executer({
        tenantId: TENANT,
        reservationId: RESERVATION,
        note: 4,
      }),
    ).rejects.toBeInstanceOf(ErreurMetier);
  });

  it("refuse une note hors 1–5", async () => {
    const repo = new AvisVoyageurRepositoryMemoire();
    await new InviterAvisVoyageur(repo).executer({
      tenantId: TENANT,
      reservationId: RESERVATION,
      logementId: LOGEMENT,
      depart: "2027-06-17",
    });

    await expect(
      new DeposerAvisVoyageur(repo).executer({
        tenantId: TENANT,
        reservationId: RESERVATION,
        note: 6,
      }),
    ).rejects.toBeInstanceOf(ErreurMetier);
  });

  it("refuse un second dépôt sur un avis déjà reçu", async () => {
    const repo = new AvisVoyageurRepositoryMemoire();
    await new InviterAvisVoyageur(repo).executer({
      tenantId: TENANT,
      reservationId: RESERVATION,
      logementId: LOGEMENT,
      depart: "2027-06-17",
    });
    const cas = new DeposerAvisVoyageur(repo);
    await cas.executer({
      tenantId: TENANT,
      reservationId: RESERVATION,
      note: 4,
    });

    await expect(
      cas.executer({
        tenantId: TENANT,
        reservationId: RESERVATION,
        note: 2,
      }),
    ).rejects.toBeInstanceOf(ErreurMetier);
  });
});

describe("modération d'un avis voyageur", () => {
  async function avisRecu(repo: AvisVoyageurRepositoryMemoire) {
    await new InviterAvisVoyageur(repo).executer({
      tenantId: TENANT,
      reservationId: RESERVATION,
      logementId: LOGEMENT,
      depart: "2027-06-17",
    });
    return new DeposerAvisVoyageur(repo).executer({
      tenantId: TENANT,
      reservationId: RESERVATION,
      note: 3,
      commentaire: "Correct.",
    });
  }

  it("publie un avis reçu, y compris négatif", async () => {
    const repo = new AvisVoyageurRepositoryMemoire();
    const avis = await avisRecu(repo);

    const publie = await new ModererAvisVoyageur(repo).executer({
      tenantId: TENANT,
      avisId: avis.id,
      action: "publier",
      maintenant: "2027-06-20T08:00:00.000Z",
    });

    expect(publie.statut).toBe("publie");
    expect(publie.note).toBe(3);
    expect(publie.publieLe).toBe("2027-06-20T08:00:00.000Z");
  });

  it("masque un avis publié avec un motif suffisant et refuse un motif court", async () => {
    const repo = new AvisVoyageurRepositoryMemoire();
    const avis = await avisRecu(repo);
    const cas = new ModererAvisVoyageur(repo);
    await cas.executer({
      tenantId: TENANT,
      avisId: avis.id,
      action: "publier",
    });

    await expect(
      cas.executer({
        tenantId: TENANT,
        avisId: avis.id,
        action: "masquer",
        motif: "court",
      }),
    ).rejects.toBeInstanceOf(ErreurMetier);

    const masque = await cas.executer({
      tenantId: TENANT,
      avisId: avis.id,
      action: "masquer",
      motif: "Propos injurieux signalés par le voyageur.",
    });
    expect(masque.statut).toBe("masque");
  });

  it("ajoute la réponse publique de l'hôte", async () => {
    const repo = new AvisVoyageurRepositoryMemoire();
    const avis = await avisRecu(repo);

    const repondu = await new ModererAvisVoyageur(repo).executer({
      tenantId: TENANT,
      avisId: avis.id,
      action: "repondre",
      reponse: "Merci pour votre retour, à bientôt !",
    });

    expect(repondu.reponseHote).toBe("Merci pour votre retour, à bientôt !");
  });

  it("refuse une action inconnue et un avis introuvable", async () => {
    const repo = new AvisVoyageurRepositoryMemoire();
    const avis = await avisRecu(repo);
    const cas = new ModererAvisVoyageur(repo);

    await expect(
      cas.executer({
        tenantId: TENANT,
        avisId: avis.id,
        action: "inconnue" as never,
      }),
    ).rejects.toBeInstanceOf(ErreurMetier);

    await expect(
      cas.executer({
        tenantId: TENANT,
        avisId: "absent",
        action: "publier",
      }),
    ).rejects.toBeInstanceOf(ErreurMetier);
  });
});

describe("référence d'avis", () => {
  it("est stable et rejette une réservation vide", () => {
    expect(refAvisVoyageur("reservation-abcdef12")).toBe("AVIS-RESERVAT");
    expect(refAvisVoyageur("reservation-abcdef12")).toBe(
      refAvisVoyageur("reservation-abcdef12"),
    );
    expect(() => refAvisVoyageur("  ")).toThrow(ErreurMetier);
  });
});
