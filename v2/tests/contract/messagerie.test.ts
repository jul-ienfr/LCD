/**
 * T310 — Contrat des connecteurs de messagerie.
 *
 * Le port `CanalMessagePort` doit avoir le même comportement pour tous ses
 * adaptateurs : envoi email/SMS, repli de sujet, refus explicite des canaux
 * sans connecteur. Aucun test ne frappe un fournisseur réel : le contrat de
 * forme est toujours exécuté, la sandbox reste opt-in.
 */
import { describe, expect, it, vi } from "vitest";
import type { CanalMessagePort } from "@/application/ports/canal-message-port";
import { ErreurMetier } from "@/domain/erreurs";
import { creerCanalMessage } from "@/infrastructure/adapters/canal-message";

function emailEspion() {
  return vi.fn().mockResolvedValue(undefined);
}

function smsEspion() {
  return vi.fn().mockResolvedValue(undefined);
}

async function verifierContrat(port: CanalMessagePort, canal: "email" | "sms") {
  const resultat = await port.envoyer({
    canal,
    destinataire:
      canal === "email" ? "camille@example.fr" : "+33612345678",
    sujet: "Votre arrivée",
    contenu: "Bonjour Camille.",
    ref: `CONTRAT-${canal}`,
    expediteur: canal === "email" ? "hote@example.fr" : null,
  });
  expect(resultat.statut).toBe("envoye");
  expect(resultat.externalId === null || typeof resultat.externalId === "string").toBe(
    true,
  );
}

describe("contrat des connecteurs de messagerie", () => {
  it("respecte le contrat d'envoi email et transmet le reply-to", async () => {
    const email = emailEspion();
    const port = creerCanalMessage({ email: { envoyer: email } });

    await verifierContrat(port, "email");

    expect(email).toHaveBeenCalledWith({
      to: "camille@example.fr",
      subject: "Votre arrivée",
      text: "Bonjour Camille.",
      replyTo: "hote@example.fr",
    });
  });

  it("respecte le contrat d'envoi SMS sans sujet", async () => {
    const sms = smsEspion();
    const port = creerCanalMessage({ sms: { envoyer: sms } });

    await verifierContrat(port, "sms");

    expect(sms).toHaveBeenCalledWith({
      to: "+33612345678",
      text: "Bonjour Camille.",
    });
  });

  it("applique le sujet par défaut quand le sujet est vide", async () => {
    const email = emailEspion();
    const port = creerCanalMessage({ email: { envoyer: email } });

    await port.envoyer({
      canal: "email",
      destinataire: "camille@example.fr",
      sujet: "   ",
      contenu: "Bonjour.",
      ref: "CONTRAT-DEFAUT",
    });

    expect(email).toHaveBeenCalledWith(
      expect.objectContaining({ subject: "Votre séjour" }),
    );
  });

  it("refuse explicitement OTA faute de connecteur", async () => {
    const port = creerCanalMessage({
      email: { envoyer: emailEspion() },
      sms: { envoyer: smsEspion() },
    });

    await expect(
      port.envoyer({
        canal: "ota",
        destinataire: "+33612345678",
        contenu: "Bonjour.",
        ref: "CONTRAT-ota",
      }),
    ).rejects.toMatchObject({
      code: "CANAL_INDISPONIBLE",
    });
  });

  it("respecte le contrat d'envoi WhatsApp et remonte l'identifiant fournisseur", async () => {
    const whatsapp = vi.fn().mockResolvedValue({ externalId: "wamid.42" });
    const port = creerCanalMessage({ whatsapp: { envoyer: whatsapp } });

    const resultat = await port.envoyer({
      canal: "whatsapp",
      destinataire: "+33612345678",
      contenu: "Bonjour Camille.",
      ref: "CONTRAT-whatsapp",
    });

    expect(whatsapp).toHaveBeenCalledWith({
      to: "+33612345678",
      text: "Bonjour Camille.",
    });
    expect(resultat).toEqual({ externalId: "wamid.42", statut: "envoye" });
  });

  it("refuse WhatsApp sans fournisseur configuré", async () => {
    const port = creerCanalMessage({ email: { envoyer: emailEspion() } });
    await expect(
      port.envoyer({
        canal: "whatsapp",
        destinataire: "+33612345678",
        contenu: "Bonjour.",
        ref: "CONTRAT-whatsapp-absent",
      }),
    ).rejects.toMatchObject({ code: "CANAL_INDISPONIBLE" });
  });

  it("refuse un fournisseur absent au lieu de simuler un envoi", async () => {
    const sansEmail = creerCanalMessage({});
    await expect(
      sansEmail.envoyer({
        canal: "email",
        destinataire: "camille@example.fr",
        contenu: "Bonjour.",
        ref: "CONTRAT-SANS-EMAIL",
      }),
    ).rejects.toBeInstanceOf(ErreurMetier);

    const sansSms = creerCanalMessage({
      email: { envoyer: emailEspion() },
    });
    await expect(
      sansSms.envoyer({
        canal: "sms",
        destinataire: "+33612345678",
        contenu: "Bonjour.",
        ref: "CONTRAT-SANS-SMS",
      }),
    ).rejects.toMatchObject({ code: "CANAL_INDISPONIBLE" });
  });
});
