import { beforeEach, describe, expect, it } from "vitest";
import type {
  CreerValidationSensibleData,
  ValidationSensibleRepository,
} from "@/application/ports/validation-sensible-repository";
import { SortiesArgent } from "@/application/use-cases/sorties-argent";
import type {
  TypeValidationSensible,
  ValidationSensible,
} from "@/domain/validation-sensible";

const TENANT = "11111111-1111-4111-8111-111111111111";

class ValidationsMemoire implements ValidationSensibleRepository {
  valeurs: ValidationSensible[] = [];

  async creer(data: CreerValidationSensibleData): Promise<ValidationSensible> {
    const validation: ValidationSensible = {
      id: crypto.randomUUID(),
      tenantId: data.tenantId,
      type: data.type,
      cibleId: data.cibleId,
      ref: data.ref,
      montantCentimes: data.montantCentimes,
      payload: data.payload,
      demandeurId: data.demandeurId,
      demandeurEmail: data.demandeurEmail,
      statut: "en_attente",
      decideurId: null,
      decideurEmail: null,
      motifDecision: null,
      decideLe: null,
      payeeLe: null,
      createdAt: new Date(),
    };
    this.valeurs.push(validation);
    return validation;
  }

  async trouverParId(_tenantId: string, id: string) {
    return this.valeurs.find((validation) => validation.id === id) ?? null;
  }

  async trouverEnAttente(
    _tenantId: string,
    type: TypeValidationSensible,
    cibleId: string,
  ) {
    return (
      this.valeurs.find(
        (validation) =>
          validation.type === type &&
          validation.cibleId === cibleId &&
          validation.statut === "en_attente",
      ) ?? null
    );
  }

  async listerEnAttente() {
    return this.valeurs.filter((validation) => validation.statut === "en_attente");
  }

  async listerParTypes(_tenantId: string, types: readonly TypeValidationSensible[]) {
    return this.valeurs.filter((validation) => types.includes(validation.type));
  }

  async marquerPayee(
    _tenantId: string,
    id: string,
    acteurId: string,
    acteurEmail: string,
  ) {
    const validation = this.valeurs.find((entree) => entree.id === id);
    if (!validation || validation.statut !== "approuvee") return null;
    validation.statut = "payee";
    validation.decideurId = acteurId;
    validation.decideurEmail = acteurEmail;
    validation.payeeLe = new Date();
    return validation;
  }

  async decider(
    _tenantId: string,
    id: string,
    statut: "approuvee" | "rejetee",
    decideurId: string,
    decideurEmail: string,
    motifDecision: string | null,
  ) {
    const validation = this.valeurs.find((entree) => entree.id === id);
    if (!validation || validation.statut !== "en_attente") return null;
    validation.statut = statut;
    validation.decideurId = decideurId;
    validation.decideurEmail = decideurEmail;
    validation.motifDecision = motifDecision;
    validation.decideLe = new Date();
    return validation;
  }
}

describe("sorties d’argent", () => {
  let repo: ValidationsMemoire;
  let sorties: SortiesArgent;

  beforeEach(() => {
    repo = new ValidationsMemoire();
    sorties = new SortiesArgent(repo);
  });

  async function demander() {
    return sorties.demander({
      tenantId: TENANT,
      type: "remboursement",
      beneficiaire: "  Camille Martin  ",
      montantCentimes: 12_050,
      motif: "  Séjour écourté, remboursement partiel.  ",
      reference: "RES-2026-42",
      demandeurId: "user-1",
      demandeurEmail: "hote@lcd.test",
    });
  }

  it("crée une demande en attente avec un payload normalisé", async () => {
    const validation = await demander();
    expect(validation.statut).toBe("en_attente");
    expect(validation.type).toBe("remboursement");
    expect(validation.montantCentimes).toBe(12_050);
    expect(validation.payload).toEqual({
      beneficiaire: "Camille Martin",
      motif: "Séjour écourté, remboursement partiel.",
      reference: "RES-2026-42",
    });
  });

  it("interdit au demandeur d’approuver sa propre sortie", async () => {
    const validation = await demander();
    await expect(
      sorties.decider({
        tenantId: TENANT,
        validationId: validation.id,
        decision: "approuvee",
        decideurId: "user-1",
        decideurEmail: "hote@lcd.test",
        motifDecision: null,
      }),
    ).rejects.toMatchObject({ code: "VALIDATION_SENSIBLE_INVALIDE" });
    expect(repo.valeurs[0]?.statut).toBe("en_attente");
  });

  it("approuve par un second compte puis marque payée", async () => {
    const validation = await demander();
    const approuvee = await sorties.decider({
      tenantId: TENANT,
      validationId: validation.id,
      decision: "approuvee",
      decideurId: "user-2",
      decideurEmail: "comptable@lcd.test",
      motifDecision: "Justificatif vérifié.",
    });
    expect(approuvee.statut).toBe("approuvee");

    const payee = await sorties.payer({
      tenantId: TENANT,
      validationId: validation.id,
      acteurId: "user-2",
      acteurEmail: "comptable@lcd.test",
    });
    expect(payee.statut).toBe("payee");
    expect(payee.payeeLe).toBeInstanceOf(Date);
  });

  it("refuse de payer une sortie encore en attente ou rejetée", async () => {
    const validation = await demander();
    await expect(
      sorties.payer({
        tenantId: TENANT,
        validationId: validation.id,
        acteurId: "user-2",
        acteurEmail: "comptable@lcd.test",
      }),
    ).rejects.toMatchObject({ code: "VALIDATION_SENSIBLE_INVALIDE" });

    await sorties.decider({
      tenantId: TENANT,
      validationId: validation.id,
      decision: "rejetee",
      decideurId: "user-2",
      decideurEmail: "comptable@lcd.test",
      motifDecision: "Hors contrat.",
    });
    await expect(
      sorties.payer({
        tenantId: TENANT,
        validationId: validation.id,
        acteurId: "user-2",
        acteurEmail: "comptable@lcd.test",
      }),
    ).rejects.toMatchObject({ code: "VALIDATION_SENSIBLE_INVALIDE" });
  });

  it("rejette les montants, bénéficiaires et motifs invalides", async () => {
    await expect(
      sorties.demander({
        tenantId: TENANT,
        type: "geste_commercial",
        beneficiaire: "Client",
        montantCentimes: 0,
        motif: "Geste",
        reference: "",
        demandeurId: "user-1",
        demandeurEmail: "hote@lcd.test",
      }),
    ).rejects.toMatchObject({ code: "VALIDATION_SENSIBLE_INVALIDE" });

    await expect(
      sorties.demander({
        tenantId: TENANT,
        type: "reversement",
        beneficiaire: "X",
        montantCentimes: 100,
        motif: "Reversement",
        reference: "",
        demandeurId: "user-1",
        demandeurEmail: "hote@lcd.test",
      }),
    ).rejects.toMatchObject({ code: "VALIDATION_SENSIBLE_INVALIDE" });
  });
});
