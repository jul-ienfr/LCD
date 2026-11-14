import { describe, expect, it } from "vitest";
import { ErreurMetier } from "@/domain/erreurs";
import {
  COMMENTAIRE_AVIS_MAX,
  MOTIF_MODERATION_MIN,
  avisPublies,
  dateInvitationAvis,
  enregistrerAvis,
  inviterAvis,
  masquerAvis,
  noteMoyenne,
  publierAvis,
  repartitionNotes,
  repondreAvis,
  validerNote,
  type AvisVoyageur,
} from "@/domain/avis-voyageur";

function invitation(partiel: Partial<AvisVoyageur> = {}): AvisVoyageur {
  return {
    ...inviterAvis({
      id: "avis-1",
      ref: "AVIS-RES12345",
      reservationId: "res123456789",
      logementId: "logement-1",
      depart: "2026-12-20",
      maintenant: "2026-12-21T09:00:00.000Z",
    }),
    ...partiel,
  };
}

function avisPublie(
  id: string,
  note: number,
  publieLe: string,
  recuLe = publieLe,
): AvisVoyageur {
  return {
    ...invitation({ id }),
    note,
    statut: "publie",
    recuLe,
    publieLe,
  };
}

describe("avis voyageur", () => {
  it("calcule la date d'invitation au lendemain du départ et refuse une date mal formée", () => {
    expect(dateInvitationAvis("2026-12-20")).toBe("2026-12-21");
    expect(dateInvitationAvis("2026-12-31")).toBe("2027-01-01");
    expect(dateInvitationAvis("2027-02-28")).toBe("2027-03-01");
    expect(() => dateInvitationAvis("20/12/2026")).toThrow(ErreurMetier);
    expect(() => dateInvitationAvis("2026-12-20T10:00:00.000Z")).toThrow(
      "La date de départ doit être au format AAAA-MM-JJ.",
    );
  });

  it("crée une invitation au statut invite sans note ni commentaire", () => {
    const avis = inviterAvis({
      id: "avis-1",
      ref: "AVIS-RES12345",
      reservationId: "res123456789",
      logementId: "logement-1",
      depart: "2026-12-20",
      maintenant: "2026-12-21T09:00:00.000Z",
    });
    expect(avis.statut).toBe("invite");
    expect(avis.note).toBeNull();
    expect(avis.commentaire).toBeNull();
    expect(avis.recuLe).toBeNull();
    expect(avis.publieLe).toBeNull();
    expect(avis.reponseHote).toBeNull();
    expect(avis.inviteLe).toBe("2026-12-21T09:00:00.000Z");
    expect(avis.ref).toBe("AVIS-RES12345");

    expect(() =>
      inviterAvis({
        id: "",
        ref: "AVIS-RES12345",
        reservationId: "res123456789",
        logementId: "logement-1",
        depart: "2026-12-20",
      }),
    ).toThrow(ErreurMetier);
  });

  it("valide une note entière entre 1 et 5", () => {
    expect(validerNote(1)).toBe(1);
    expect(validerNote(5)).toBe(5);
    expect(() => validerNote(0)).toThrow("La note doit être un entier entre 1 et 5.");
    expect(() => validerNote(6)).toThrow(ErreurMetier);
    expect(() => validerNote(4.5)).toThrow(ErreurMetier);
  });

  it("enregistre un avis reçu avec note et commentaire trimé", () => {
    const avis = enregistrerAvis(invitation(), {
      note: 4,
      commentaire: "  Séjour très agréable.  ",
      maintenant: "2026-12-22T10:00:00.000Z",
    });
    expect(avis.statut).toBe("recu");
    expect(avis.note).toBe(4);
    expect(avis.commentaire).toBe("Séjour très agréable.");
    expect(avis.recuLe).toBe("2026-12-22T10:00:00.000Z");

    const sansCommentaire = enregistrerAvis(invitation({ id: "avis-2" }), { note: 5 });
    expect(sansCommentaire.commentaire).toBeNull();
  });

  it("refuse l'enregistrement hors statut invité et un commentaire trop long", () => {
    const recu = enregistrerAvis(invitation(), { note: 4 });
    expect(() => enregistrerAvis(recu, { note: 5 })).toThrow(
      "Un avis ne peut être enregistré que depuis le statut « invité ».",
    );
    expect(() => enregistrerAvis(invitation(), { note: 9 })).toThrow(ErreurMetier);
    expect(() =>
      enregistrerAvis(invitation(), {
        note: 3,
        commentaire: "a".repeat(COMMENTAIRE_AVIS_MAX + 1),
      }),
    ).toThrow(ErreurMetier);
  });

  it("publie un avis reçu sans exiger de note minimale", () => {
    const recu = enregistrerAvis(invitation(), { note: 5 });
    const publie = publierAvis(recu, "2026-12-22T11:00:00.000Z");
    expect(publie.statut).toBe("publie");
    expect(publie.publieLe).toBe("2026-12-22T11:00:00.000Z");

    // Un avis à 1 étoile est publié comme les autres.
    const negatif = publierAvis(
      enregistrerAvis(invitation({ id: "avis-negatif" }), { note: 1 }),
      "2026-12-22T11:00:00.000Z",
    );
    expect(negatif.statut).toBe("publie");
    expect(negatif.note).toBe(1);

    expect(() => publierAvis(invitation())).toThrow(
      "Seul un avis reçu peut être publié.",
    );
  });

  it("masque un avis publié avec un motif suffisant et refuse un motif court", () => {
    const publie = publierAvis(enregistrerAvis(invitation(), { note: 2 }));
    const masque = masquerAvis(publie, { motif: "  Propos injurieux signalés.  " });
    expect(masque.statut).toBe("masque");

    expect(() =>
      masquerAvis(publie, { motif: "a".repeat(MOTIF_MODERATION_MIN) }),
    ).not.toThrow();
    expect(() => masquerAvis(publie, { motif: "court" })).toThrow(
      "Un masquage exige un motif d'au moins dix caractères.",
    );
    expect(() => masquerAvis(invitation(), { motif: "Motif assez long." })).toThrow(
      "Seul un avis publié peut être masqué.",
    );
  });

  it("répond à un avis, sauf s'il est masqué", () => {
    const publie = publierAvis(enregistrerAvis(invitation(), { note: 3 }));
    const repondu = repondreAvis(publie, "  Merci pour votre retour.  ");
    expect(repondu.reponseHote).toBe("Merci pour votre retour.");
    expect(repondu.statut).toBe("publie");

    expect(() => repondreAvis(publie, "   ")).toThrow(
      "La réponse de l'hôte ne peut pas être vide.",
    );
    expect(() =>
      repondreAvis(publie, "a".repeat(COMMENTAIRE_AVIS_MAX + 1)),
    ).toThrow(ErreurMetier);

    const masque = masquerAvis(publie, { motif: "Propos injurieux signalés." });
    expect(() => repondreAvis(masque, "Merci.")).toThrow(
      "Un avis masqué ne peut pas recevoir de réponse.",
    );
  });

  it("calcule la moyenne des seuls avis publiés", () => {
    expect(noteMoyenne([])).toBeNull();
    expect(noteMoyenne([invitation(), enregistrerAvis(invitation({ id: "b" }), { note: 5 })])).toBeNull();

    const publies = [
      avisPublie("a", 5, "2026-12-22T10:00:00.000Z"),
      avisPublie("b", 4, "2026-12-23T10:00:00.000Z"),
      avisPublie("c", 2, "2026-12-24T10:00:00.000Z"),
    ];
    // (5 + 4 + 2) / 3 = 3,666… → 3,7
    expect(noteMoyenne(publies)).toBe(3.7);
    // Un avis reçu mais non publié ne compte pas.
    expect(
      noteMoyenne([...publies, enregistrerAvis(invitation({ id: "d" }), { note: 1 })]),
    ).toBe(3.7);
  });

  it("répartit les notes publiées et trie les avis du plus récent au plus ancien", () => {
    const avis = [
      avisPublie("a", 5, "2026-12-22T10:00:00.000Z"),
      avisPublie("b", 5, "2026-12-25T10:00:00.000Z"),
      avisPublie("c", 3, "2026-12-24T10:00:00.000Z"),
      avisPublie("d", 3, "2026-12-24T10:00:00.000Z", "2026-12-23T08:00:00.000Z"),
      invitation({ id: "e" }),
      enregistrerAvis(invitation({ id: "f" }), { note: 1 }),
    ];
    expect(repartitionNotes(avis)).toEqual({ 1: 0, 2: 0, 3: 2, 4: 0, 5: 2 });
    expect(repartitionNotes([])).toEqual({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });

    // Répartition de { 3: 2, 5: 2 } → moyenne (5+5+3+3) / 4 = 4.
    expect(noteMoyenne(avis)).toBe(4);

    expect(avisPublies(avis).map((entree) => entree.id)).toEqual([
      "b",
      "c",
      "d",
      "a",
    ]);
  });
});
