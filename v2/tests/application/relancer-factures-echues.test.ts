import { describe, expect, it } from "vitest";
import { CreerFacture } from "@/application/use-cases/creer-facture";
import { RelancerFacturesEchues } from "@/application/use-cases/relancer-factures-echues";
import type { Facture } from "@/domain/facture";
import { EmailSenderMemoire } from "../helpers/email-sender-memoire";
import { FactureRepositoryMemoire } from "../helpers/facture-repository-memoire";
import { PaiementRepositoryMemoire } from "../helpers/paiement-repository-memoire";
import { RelanceFactureRepositoryMemoire } from "../helpers/relance-facture-repository-memoire";
import { TenantRepositoryMemoire } from "../helpers/tenant-repository-memoire";

const tenantId = "11111111-1111-4111-8111-111111111111";
const logementId = "22222222-2222-4222-8222-222222222222";
const jour = "2026-12-01";

async function contexte() {
  const factures = new FactureRepositoryMemoire();
  const paiements = new PaiementRepositoryMemoire();
  const relances = new RelanceFactureRepositoryMemoire();
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

  let compteur = 0;
  async function ajouter(input: {
    echeance?: string | null;
    email?: string | null;
    montantTtcCentimes?: number;
    emettre?: boolean;
  }): Promise<Facture> {
    compteur += 1;
    const facture = await new CreerFacture(factures).executer({
      tenantId,
      logementId,
      numero: `FAC-REL-${compteur}`,
      clientNom: `Client ${compteur}`,
      clientEmail:
        input.email === undefined ? "client@example.com" : input.email,
      dateEmission: "2026-11-01",
      echeance: input.echeance === undefined ? "2026-11-20" : input.echeance,
      tvaCentimes: 0,
      taxeSejourCentimes: 0,
      lignes: [
        {
          designation: "Séjour",
          quantite: 1,
          prixUnitaireCentimes: input.montantTtcCentimes ?? 10_000,
        },
      ],
    });
    if (input.emettre !== false) {
      await factures.changerStatut(tenantId, facture.id, "emise");
    }
    return facture;
  }

  const lancer = (echeancesAutorisees?: string[]) =>
    new RelancerFacturesEchues(
      factures,
      paiements,
      relances,
      tenants,
      email,
    ).executer({
      tenantId,
      jour,
      baseUrl: "https://lcd.test",
      echeancesAutorisees,
    });

  return { factures, paiements, email, ajouter, lancer };
}

describe("RelancerFacturesEchues", () => {
  it("relance uniquement les factures émises échues et non soldées", async () => {
    const { ajouter, paiements, email, lancer } = await contexte();
    await ajouter({ email: "retard@example.com" });
    await ajouter({ echeance: "2026-12-20" });
    await ajouter({ echeance: null });
    await ajouter({ emettre: false });
    const soldee = await ajouter({ email: "payee@example.com" });
    await paiements.creer({
      tenantId,
      factureId: soldee.id,
      ref: "PAY-REL-0001",
      montantCentimes: 10_000,
      mode: "virement",
      datePaiement: "2026-11-25",
    });

    const resultat = await lancer();

    expect(resultat).toEqual({
      envoyees: 1,
      dejaRelancees: 0,
      sansEmail: 0,
      echecs: 0,
    });
    expect(email.messages).toHaveLength(1);
    expect(email.messages[0]?.to).toBe("retard@example.com");
    expect(email.messages[0]?.subject).toContain("Relance facture");
  });

  it("ne relance pas deux fois la même facture le même jour", async () => {
    const { ajouter, lancer } = await contexte();
    await ajouter({});

    expect((await lancer()).envoyees).toBe(1);
    const second = await lancer();
    expect(second.envoyees).toBe(0);
    expect(second.dejaRelancees).toBe(1);
  });

  it("limite le cron aux échéances aux dates prévues", async () => {
    const { ajouter, email, lancer } = await contexte();
    await ajouter({ echeance: "2026-11-30", email: "j1@example.com" });
    await ajouter({ echeance: "2026-11-29", email: "j2@example.com" });

    const resultat = await lancer(["2026-11-30"]);

    expect(resultat.envoyees).toBe(1);
    expect(email.messages[0]?.to).toBe("j1@example.com");
  });

  it("compte les factures sans email valide sans les réserver", async () => {
    const { ajouter, lancer } = await contexte();
    await ajouter({ email: null });
    await ajouter({ email: "pas-un-email" });
    await ajouter({ email: "ok@example.com" });

    const resultat = await lancer();

    expect(resultat.envoyees).toBe(1);
    expect(resultat.sansEmail).toBe(2);
  });

  it("libère la réservation quand l'envoi échoue pour permettre un retry", async () => {
    const { ajouter, email, lancer } = await contexte();
    const facture = await ajouter({});
    let echec = true;
    const envoiOriginal = email.envoyer.bind(email);
    email.envoyer = async (message) => {
      if (echec) {
        echec = false;
        throw new Error("SMTP indisponible");
      }
      await envoiOriginal(message);
    };

    const premier = await lancer();
    expect(premier.echecs).toBe(1);
    expect(premier.envoyees).toBe(0);

    const second = await lancer();
    expect(second.envoyees).toBe(1);
    expect(email.messages[0]?.to).toBe("client@example.com");
    expect(facture.id).toBeTruthy();
  });
});
