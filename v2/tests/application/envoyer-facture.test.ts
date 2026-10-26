import { describe, expect, it } from "vitest";
import { CreerFacture } from "@/application/use-cases/creer-facture";
import { EnvoyerFacture } from "@/application/use-cases/envoyer-facture";
import type { FactureRepository } from "@/application/ports/facture-repository";
import { formaterEuros } from "@/lib/format";
import { EmailSenderMemoire } from "../helpers/email-sender-memoire";
import { FactureRepositoryMemoire } from "../helpers/facture-repository-memoire";
import { TenantRepositoryMemoire } from "../helpers/tenant-repository-memoire";

const tenantId = "11111111-1111-4111-8111-111111111111";
const logementId = "22222222-2222-4222-8222-222222222222";

async function contexte(input: {
  clientEmail?: string | null;
  emettre?: boolean;
}) {
  const factures: FactureRepository = new FactureRepositoryMemoire();
  const facture = await new CreerFacture(factures).executer({
    tenantId,
    logementId,
    numero: "FAC-2026-0200",
    clientNom: "Client Envoi",
    clientEmail: input.clientEmail,
    dateEmission: "2026-11-20",
    echeance: "2026-12-20",
    tvaCentimes: 3_600,
    taxeSejourCentimes: 900,
    lignes: [
      {
        designation: "Séjour 3 nuits",
        quantite: 3,
        prixUnitaireCentimes: 12_000,
      },
    ],
  });
  if (input.emettre !== false) {
    await factures.changerStatut(tenantId, facture.id, "emise");
  }
  const tenants = new TenantRepositoryMemoire();
  tenants.ajouter({
    id: tenantId,
    slug: "lcd",
    nom: "LCD Parc",
    nature: "nom_propre",
    regime: "micro_bic_non_classe",
    tva: "non",
    siren: null,
    adresse: null,
    mentionsLegales: null,
    statut: "actif",
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const email = new EmailSenderMemoire();
  return { factures, facture, tenants, email };
}

describe("EnvoyerFacture", () => {
  it("envoie la facture au client avec un lien signé", async () => {
    const { factures, facture, tenants, email } = await contexte({
      clientEmail: "client@example.com",
    });

    const resultat = await new EnvoyerFacture(
      factures,
      tenants,
      email,
    ).executer({
      tenantId,
      factureId: facture.id,
      baseUrl: "https://lcd.test/",
    });

    expect(resultat.destinataire).toBe("client@example.com");
    expect(resultat.lien).toMatch(/^https:\/\/lcd\.test\/facture\//);
    expect(email.messages).toHaveLength(1);
    const message = email.messages[0];
    expect(message?.to).toBe("client@example.com");
    expect(message?.subject).toContain("FAC-2026-0200");
    expect(message?.text).toContain(formaterEuros(40_500));
    expect(message?.text).toContain(resultat.lien);
    expect(message?.attachments).toBeUndefined();
  });

  it("joint le PDF de la facture quand il est fourni", async () => {
    const { factures, facture, tenants, email } = await contexte({
      clientEmail: "client@example.com",
    });
    const contenu = new Uint8Array([37, 80, 68, 70]);

    await new EnvoyerFacture(factures, tenants, email).executer({
      tenantId,
      factureId: facture.id,
      baseUrl: "https://lcd.test",
      pieceJointe: {
        filename: "FAC-2026-0200.pdf",
        content: contenu,
        contentType: "application/pdf",
      },
    });

    expect(email.messages[0]?.attachments).toHaveLength(1);
    expect(email.messages[0]?.attachments?.[0]?.filename).toBe(
      "FAC-2026-0200.pdf",
    );
    expect(email.messages[0]?.attachments?.[0]?.content).toBe(contenu);
  });

  it("accepte une adresse fournie au moment de l'envoi", async () => {
    const { factures, facture, tenants, email } = await contexte({});
    const resultat = await new EnvoyerFacture(
      factures,
      tenants,
      email,
    ).executer({
      tenantId,
      factureId: facture.id,
      baseUrl: "https://lcd.test",
      email: "autre@example.com",
    });

    expect(resultat.destinataire).toBe("autre@example.com");
    expect(email.messages[0]?.to).toBe("autre@example.com");
  });

  it("envoie une relance pour une facture émise", async () => {
    const { factures, facture, tenants, email } = await contexte({
      clientEmail: "client@example.com",
    });

    await new EnvoyerFacture(factures, tenants, email).executer({
      tenantId,
      factureId: facture.id,
      baseUrl: "https://lcd.test",
      type: "relance",
    });

    const message = email.messages[0];
    expect(message?.subject).toContain("Relance facture FAC-2026-0200");
    expect(message?.text).toContain("n'a pas encore été réglée");
    expect(message?.text).toContain("https://lcd.test/facture/");
  });

  it("refuse une relance sur une facture soldée", async () => {
    const { factures, facture, tenants, email } = await contexte({
      clientEmail: "client@example.com",
    });
    await factures.changerStatut(tenantId, facture.id, "payee");

    await expect(
      new EnvoyerFacture(factures, tenants, email).executer({
        tenantId,
        factureId: facture.id,
        baseUrl: "https://lcd.test",
        type: "relance",
      }),
    ).rejects.toMatchObject({ code: "FACTURE_INVALIDE" });
    expect(email.messages).toHaveLength(0);
  });

  it("refuse une facture en brouillon", async () => {
    const { factures, facture, tenants, email } = await contexte({
      clientEmail: "client@example.com",
      emettre: false,
    });

    await expect(
      new EnvoyerFacture(factures, tenants, email).executer({
        tenantId,
        factureId: facture.id,
        baseUrl: "https://lcd.test",
      }),
    ).rejects.toMatchObject({ code: "FACTURE_INVALIDE" });
  });

  it("refuse une adresse email absente ou invalide", async () => {
    const { factures, facture, tenants, email } = await contexte({});

    await expect(
      new EnvoyerFacture(factures, tenants, email).executer({
        tenantId,
        factureId: facture.id,
        baseUrl: "https://lcd.test",
      }),
    ).rejects.toMatchObject({ code: "EMAIL_INVALIDE" });

    await expect(
      new EnvoyerFacture(factures, tenants, email).executer({
        tenantId,
        factureId: facture.id,
        baseUrl: "https://lcd.test",
        email: "pas-un-email",
      }),
    ).rejects.toMatchObject({ code: "EMAIL_INVALIDE" });
  });
});
