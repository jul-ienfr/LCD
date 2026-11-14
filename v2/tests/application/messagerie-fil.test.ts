import { describe, expect, it, vi } from "vitest";
import type { CanalMessagePort } from "@/application/ports/canal-message-port";
import { EnvoyerMessageFil } from "@/application/use-cases/envoyer-message";
import {
  ExecuterAutomatisation,
  variablesAutomatisation,
} from "@/application/use-cases/executer-automatisation";
import { OuvrirFil } from "@/application/use-cases/ouvrir-fil";
import type { Automatisation } from "@/domain/automatisation-message";
import { ErreurMetier } from "@/domain/erreurs";
import { declenchementsDu } from "@/lib/server/planificateur-messages";
import { AutomatisationsRepositoryMemoire } from "../helpers/automatisations-repository-memoire";
import { FilsVoyageurRepositoryMemoire } from "../helpers/fils-voyageur-repository-memoire";

const TENANT = "11111111-1111-4111-8111-111111111111";
const LOGEMENT = "22222222-2222-4222-8222-222222222222";
const RESERVATION = "33333333-3333-4333-8333-333333333333";

function envoyerFaux(): CanalMessagePort & { appels: unknown[] } {
  const appels: unknown[] = [];
  return {
    appels,
    async envoyer(input) {
      appels.push(input);
      return { externalId: "ext-1", statut: "envoye" };
    },
  };
}

describe("ouverture d'un fil voyageur", () => {
  it("crée le fil puis regroupe par réservation, email et téléphone", async () => {
    const depot = new FilsVoyageurRepositoryMemoire();
    const ouvrir = new OuvrirFil(depot);

    const premier = await ouvrir.executer({
      tenantId: TENANT,
      logementId: LOGEMENT,
      voyageurNom: "Camille Test",
      voyageurEmail: "Camille@Example.FR",
      voyageurTelephone: "+33 6 12 34 56 78",
    });
    expect(premier.cree).toBe(true);
    expect(premier.fil.voyageurEmail).toBe("camille@example.fr");
    expect(premier.fil.voyageurTelephone).toBe("+33612345678");
    expect(premier.fil.cleRegroupement).toBe("email:camille@example.fr");

    const parEmail = await ouvrir.executer({
      tenantId: TENANT,
      logementId: LOGEMENT,
      voyageurNom: "Camille Test",
      voyageurEmail: "camille@example.fr",
    });
    expect(parEmail.cree).toBe(false);
    expect(depot.fils).toHaveLength(1);

    const parReservation = await ouvrir.executer({
      tenantId: TENANT,
      logementId: LOGEMENT,
      reservationId: RESERVATION,
      voyageurNom: "Camille Test",
      voyageurEmail: "camille@example.fr",
    });
    expect(parReservation.regroupe).toBe(true);
    expect(parReservation.fil.reservationId).toBe(RESERVATION);
    expect(depot.fils).toHaveLength(1);

    const parTelephone = await ouvrir.executer({
      tenantId: TENANT,
      logementId: LOGEMENT,
      voyageurNom: "Camille Test",
      voyageurTelephone: "+33 6 12 34 56 78",
    });
    expect(parTelephone.regroupe).toBe(true);
    expect(parTelephone.fil.id).toBe(premier.fil.id);
    expect(depot.fils).toHaveLength(1);
  });

  it("ne mélange pas deux voyageurs différents", async () => {
    const depot = new FilsVoyageurRepositoryMemoire();
    const ouvrir = new OuvrirFil(depot);
    await ouvrir.executer({
      tenantId: TENANT,
      logementId: LOGEMENT,
      voyageurNom: "Camille Test",
      voyageurEmail: "camille@example.fr",
    });
    await ouvrir.executer({
      tenantId: TENANT,
      logementId: LOGEMENT,
      voyageurNom: "Dominique Autre",
      voyageurEmail: "dominique@example.fr",
    });
    expect(depot.fils).toHaveLength(2);
  });

  it("n'écrase jamais une donnée connue du fil", async () => {
    const depot = new FilsVoyageurRepositoryMemoire();
    const ouvrir = new OuvrirFil(depot);
    const { fil } = await ouvrir.executer({
      tenantId: TENANT,
      logementId: LOGEMENT,
      voyageurNom: "Camille Test",
      voyageurEmail: "camille@example.fr",
    });
    const { fil: apres } = await ouvrir.executer({
      tenantId: TENANT,
      voyageurNom: "Camille Test",
      voyageurEmail: "camille@example.fr",
      voyageurTelephone: "+33611111111",
    });
    expect(apres.id).toBe(fil.id);
    expect(apres.voyageurEmail).toBe("camille@example.fr");
    expect(apres.voyageurTelephone).toBe("+33611111111");

    const { fil: encore } = await ouvrir.executer({
      tenantId: TENANT,
      voyageurNom: "Camille Test",
      voyageurEmail: "camille@example.fr",
      voyageurTelephone: "+33699999999",
    });
    expect(encore.voyageurTelephone).toBe("+33611111111");
    expect(depot.fils).toHaveLength(1);
  });
});

describe("envoi d'un message dans un fil", () => {
  async function preparer(): Promise<{
    depot: FilsVoyageurRepositoryMemoire;
    canal: ReturnType<typeof envoyerFaux>;
    envoyer: EnvoyerMessageFil;
    filId: string;
  }> {
    const depot = new FilsVoyageurRepositoryMemoire();
    const ouvrir = new OuvrirFil(depot);
    const { fil } = await ouvrir.executer({
      tenantId: TENANT,
      logementId: LOGEMENT,
      voyageurNom: "Camille Test",
      voyageurEmail: "camille@example.fr",
      voyageurTelephone: "+33612345678",
    });
    const canal = envoyerFaux();
    return { depot, canal, envoyer: new EnvoyerMessageFil(depot, canal), filId: fil.id };
  }

  it("envoie par email, trace le message et passe le fil en attente", async () => {
    const { depot, canal, envoyer, filId } = await preparer();
    const resultat = await envoyer.executer({
      tenantId: TENANT,
      filId,
      ref: "MSG-0001",
      canal: "email",
      contenu: "Bonjour Camille, voici les informations d'arrivée.",
      sujet: "Votre arrivée",
    });
    expect(resultat.dejaEnvoye).toBe(false);
    expect(resultat.message.externalId).toBe("ext-1");
    expect(resultat.message.statut).toBe("envoye");
    expect(canal.appels).toHaveLength(1);
    expect(depot.messages).toHaveLength(1);
    expect(depot.fils[0]!.statut).toBe("en_attente");
    expect(depot.fils[0]!.dernierMessageAt).not.toBeNull();
  });

  it("envoie un brouillon existant sans le réécrire, une seule fois", async () => {
    const { depot, canal, envoyer, filId } = await preparer();
    const brouillon = await depot.creerMessage({
      tenantId: TENANT,
      filId,
      ref: "AUTO-PREP-J7",
      canal: "email",
      sens: "sortant",
      contenu: "Bonjour Camille, votre séjour approche.",
      statut: "brouillon",
    });

    const resultat = await envoyer.envoyerBrouillon({
      tenantId: TENANT,
      filId,
      messageId: brouillon.id,
    });
    expect(resultat.dejaEnvoye).toBe(false);
    expect(resultat.message.statut).toBe("envoye");
    expect(resultat.message.contenu).toBe("Bonjour Camille, votre séjour approche.");
    expect(canal.appels).toHaveLength(1);
    expect((canal.appels[0] as { ref: string }).ref).toBe("AUTO-PREP-J7");

    const rejeu = await envoyer.envoyerBrouillon({
      tenantId: TENANT,
      filId,
      messageId: brouillon.id,
    });
    expect(rejeu.dejaEnvoye).toBe(true);
    expect(canal.appels).toHaveLength(1);
    expect(depot.messages).toHaveLength(1);
  });

  it("refuse d'envoyer un brouillon après un opt-out", async () => {
    const { depot, envoyer, filId } = await preparer();
    await depot.mettreAJour(TENANT, filId, {
      consentements: { email: true, sms: false, whatsapp: false },
    });
    const brouillon = await depot.creerMessage({
      tenantId: TENANT,
      filId,
      ref: "AUTO-SMS-J1",
      canal: "sms",
      sens: "sortant",
      contenu: "Rappel : votre arrivée est demain.",
      statut: "brouillon",
    });
    await expect(
      envoyer.envoyerBrouillon({ tenantId: TENANT, filId, messageId: brouillon.id }),
    ).rejects.toThrowError(/consenti/i);
    expect(depot.messages[0]!.statut).toBe("brouillon");
  });

  it("ne renvoie pas deux fois le même message", async () => {
    const { canal, envoyer, filId, depot } = await preparer();
    await envoyer.executer({
      tenantId: TENANT,
      filId,
      ref: "MSG-0002",
      canal: "email",
      contenu: "Bonjour Camille, un premier message.",
    });
    const rejeu = await envoyer.executer({
      tenantId: TENANT,
      filId,
      ref: "MSG-0002",
      canal: "email",
      contenu: "Bonjour Camille, un premier message.",
    });
    expect(rejeu.dejaEnvoye).toBe(true);
    expect(canal.appels).toHaveLength(1);
    expect(depot.messages).toHaveLength(1);
  });

  it("refuse un SMS sans consentement, un canal non direct et un fil sans contact", async () => {
    const { envoyer, filId } = await preparer();
    await expect(
      envoyer.executer({
        tenantId: TENANT,
        filId,
        ref: "MSG-0003",
        canal: "sms",
        contenu: "Bonjour Camille, message court par SMS.",
      }),
    ).rejects.toThrowError(/consenti/i);

    await expect(
      envoyer.executer({
        tenantId: TENANT,
        filId,
        ref: "MSG-0004",
        canal: "ota",
        contenu: "Bonjour Camille, message via la plateforme.",
      }),
    ).rejects.toThrowError(/inbox/i);

    await expect(
      envoyer.executer({
        tenantId: TENANT,
        filId,
        ref: "MSG-0005",
        canal: "email",
        contenu: "Court",
      }),
    ).rejects.toThrowError(ErreurMetier);
  });

  it("propage l'erreur du connecteur sans écrire de message", async () => {
    const depot = new FilsVoyageurRepositoryMemoire();
    const ouvrir = new OuvrirFil(depot);
    const { fil } = await ouvrir.executer({
      tenantId: TENANT,
      logementId: LOGEMENT,
      voyageurNom: "Camille Test",
      voyageurEmail: "camille@example.fr",
    });
    const canal: CanalMessagePort = {
      envoyer: vi.fn().mockRejectedValue(new Error("SMTP indisponible")),
    };
    const envoyer = new EnvoyerMessageFil(depot, canal);
    await expect(
      envoyer.executer({
        tenantId: TENANT,
        filId: fil.id,
        ref: "MSG-0006",
        canal: "email",
        contenu: "Bonjour Camille, information importante.",
      }),
    ).rejects.toThrowError(/SMTP indisponible/);
    expect(depot.messages).toHaveLength(0);
  });
});

describe("exécution d'une automatisation", () => {
  const contexte = {
    reservationId: RESERVATION,
    reference: "DIR-0001",
    logementId: LOGEMENT,
    logementNom: "Villa Test",
    clientNom: "Camille Test",
    clientEmail: "camille@example.fr",
    arrivee: "2027-06-10",
    depart: "2027-06-17",
    nuits: 7,
    statutReservation: "confirmee",
  };

  async function preparer() {
    const depot = new FilsVoyageurRepositoryMemoire();
    const automatisations = new AutomatisationsRepositoryMemoire();
    const executeur = new ExecuterAutomatisation(
      automatisations,
      depot,
      new OuvrirFil(depot),
    );
    const automatisation = await automatisations.creer({
      tenantId: TENANT,
      code: "veille-arrivee",
      libelle: "Instructions d'arrivée (J-1)",
      declencheur: "j-1",
      canal: "email",
      sujet: "Votre arrivée demain au {{logement}}",
      modele: "Bonjour {{voyageur}}, arrivée le {{arrivee}} au {{logement}}.",
    });
    return { depot, automatisations, executeur, automatisation };
  }

  it("prépare un brouillon dans le fil et trace l'exécution", async () => {
    const { depot, automatisations, executeur, automatisation } = await preparer();
    const resultat = await executeur.executer({
      tenantId: TENANT,
      automatisation,
      contexte,
    });
    expect(resultat?.statut).toBe("brouillon");
    expect(resultat?.contenu).toContain("Bonjour Camille Test");
    expect(resultat?.variablesManquantes).toEqual([]);
    expect(depot.fils).toHaveLength(1);
    expect(depot.messages).toHaveLength(1);
    expect(depot.messages[0]!.statut).toBe("brouillon");
    expect(depot.messages[0]!.sens).toBe("sortant");
    expect(automatisations.executions).toHaveLength(1);
    expect(automatisations.executions[0]!.statut).toBe("brouillon");
    expect(automatisations.executions[0]!.details).toMatchObject({
      canal: "email",
      declencheur: "j-1",
    });
  });

  it("ne rejoue jamais deux fois la même exécution", async () => {
    const { depot, executeur, automatisation } = await preparer();
    await executeur.executer({ tenantId: TENANT, automatisation, contexte });
    const rejeu = await executeur.executer({
      tenantId: TENANT,
      automatisation,
      contexte,
    });
    expect(rejeu?.statut).toBe("deja_executee");
    expect(depot.messages).toHaveLength(1);
  });

  it("ignore les conditions non remplies et les opt-out", async () => {
    const { executeur, automatisations, depot } = await preparer();
    const cible = await automatisations.creer({
      tenantId: TENANT,
      code: "sms-rappel",
      libelle: "Rappel SMS",
      declencheur: "j-1",
      canal: "sms",
      modele: "Bonjour {{voyageur}}, rappel de votre arrivée demain.",
      conditions: { nuitsMin: 10 },
    });
    const ignoree = await executeur.executer({
      tenantId: TENANT,
      automatisation: cible,
      contexte,
    });
    expect(ignoree).toBeNull();

    const sms = await automatisations.creer({
      tenantId: TENANT,
      code: "sms-rappel-2",
      libelle: "Rappel SMS court",
      declencheur: "j-1",
      canal: "sms",
      modele: "Bonjour {{voyageur}}, rappel de votre arrivée demain.",
    });
    const resultat = await executeur.executer({
      tenantId: TENANT,
      automatisation: sms,
      contexte,
    });
    expect(resultat?.statut).toBe("ignore");
    expect(depot.messages).toHaveLength(0);
    expect(automatisations.executions[0]!.statut).toBe("ignore");
  });

  it("expose les variables de rendu", () => {
    expect(variablesAutomatisation(contexte)).toEqual({
      voyageur: "Camille Test",
      logement: "Villa Test",
      arrivee: "2027-06-10",
      depart: "2027-06-17",
      nuits: "7",
      reference: "DIR-0001",
      guide: "",
      avis: "",
    });
  });
});

describe("planificateur de messages", () => {
  const reservation = {
    id: RESERVATION,
    ref: "DIR-0001",
    logementId: LOGEMENT,
    logementNom: "Villa Test",
    clientNom: "Camille Test",
    clientEmail: "camille@example.fr",
    debut: "2027-06-10",
    fin: "2027-06-17",
    statut: "confirmee",
  };
  const modele: Automatisation = {
    id: "auto-1",
    tenantId: TENANT,
    code: "veille-arrivee",
    libelle: "J-1",
    declencheur: "j-1",
    canal: "email",
    sujet: null,
    modele: "Bonjour {{voyageur}}.",
    conditions: {},
    actif: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it("ne déclenche qu'à la bonne date et pour les bons statuts", () => {
    expect(declenchementsDu("2027-06-09", [reservation], [modele])).toHaveLength(1);
    expect(declenchementsDu("2027-06-08", [reservation], [modele])).toHaveLength(0);
    expect(
      declenchementsDu(
        "2027-06-09",
        [{ ...reservation, statut: "annulee" }],
        [modele],
      ),
    ).toHaveLength(0);
    expect(
      declenchementsDu("2027-06-09", [reservation], [{ ...modele, actif: false }]),
    ).toHaveLength(0);
    expect(
      declenchementsDu(
        "2027-06-09",
        [reservation],
        [{ ...modele, declencheur: "reservation_creee" }],
      ),
    ).toHaveLength(0);
  });
});
