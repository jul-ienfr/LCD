import { ErreurMetier } from "@/domain/erreurs";
import { assuranceRcValide } from "@/domain/utilisateur";
import {
  refDispatchValide,
  repondreDispatch,
  retirerDispatch,
  validerMessageDispatch,
  type DecisionDispatch,
} from "@/domain/dispatch";
import type { DispatchRepository } from "../ports/dispatch-repository";
import type { MissionRepository } from "../ports/mission-repository";
import type { UserRepository } from "../ports/user-repository";

function aujourdHui(): string {
  return new Date().toISOString().slice(0, 10);
}

async function verifierPrestataire(
  utilisateurs: UserRepository | undefined,
  tenantId: string,
  prestataireId: string,
): Promise<void> {
  if (!utilisateurs) return;
  const prestataire = await utilisateurs.trouverParId(tenantId, prestataireId);
  if (!prestataire || !prestataire.actif || prestataire.role !== "presta") {
    throw new ErreurMetier(
      "DISPATCH_INVALIDE",
      "Prestataire introuvable ou inactif.",
    );
  }
  if (!assuranceRcValide(prestataire.rcExpireLe, aujourdHui())) {
    throw new ErreurMetier(
      "DISPATCH_INVALIDE",
      "RC professionnelle absente ou expirée : dispatch bloqué. Mettez à jour l’assurance du prestataire.",
    );
  }
}

export interface ProposerDispatchInput {
  tenantId: string;
  missionId: string;
  prestataireId: string;
  ref: string;
  message?: string | null;
}

export class ProposerDispatch {
  constructor(
    private readonly dispatches: DispatchRepository,
    private readonly missions: MissionRepository,
    private readonly utilisateurs?: UserRepository,
  ) {}

  async executer(input: ProposerDispatchInput) {
    if (!refDispatchValide(input.ref)) {
      throw new ErreurMetier("DISPATCH_INVALIDE", "La référence est invalide.");
    }
    if (!input.prestataireId.trim()) {
      throw new ErreurMetier(
        "DISPATCH_INVALIDE",
        "Choisissez un prestataire.",
      );
    }
    await verifierPrestataire(
      this.utilisateurs,
      input.tenantId,
      input.prestataireId,
    );
    const mission = await this.missions.trouverParId(
      input.tenantId,
      input.missionId,
    );
    if (!mission) {
      throw new ErreurMetier("DISPATCH_INVALIDE", "La mission est introuvable.");
    }
    if (mission.statut === "terminee" || mission.statut === "annulee") {
      throw new ErreurMetier(
        "DISPATCH_INVALIDE",
        "Cette mission n’est plus dispatchable.",
      );
    }

    const existant = await this.dispatches.trouverParRef(
      input.tenantId,
      input.ref,
    );
    if (existant) return existant;

    const actif = await this.dispatches.trouverActifParMission(
      input.tenantId,
      input.missionId,
    );
    if (actif) {
      throw new ErreurMetier(
        "DISPATCH_INVALIDE",
        "Une offre est déjà en cours pour cette mission.",
      );
    }

    return this.dispatches.creer({
      tenantId: input.tenantId,
      missionId: input.missionId,
      prestataireId: input.prestataireId,
      ref: input.ref,
      message: validerMessageDispatch(input.message ?? ""),
    });
  }
}

export interface RepondreDispatchInput {
  tenantId: string;
  id: string;
  decision: DecisionDispatch;
}

export class RepondreDispatch {
  constructor(
    private readonly dispatches: DispatchRepository,
    private readonly missions: MissionRepository,
    private readonly utilisateurs?: UserRepository,
  ) {}

  async executer(input: RepondreDispatchInput) {
    const dispatch = await this.dispatches.trouverParId(
      input.tenantId,
      input.id,
    );
    if (!dispatch) {
      throw new ErreurMetier("DISPATCH_INVALIDE", "L’offre est introuvable.");
    }
    const etape = repondreDispatch(dispatch, input.decision);

    if (etape.statut === "acceptee") {
      await verifierPrestataire(
        this.utilisateurs,
        input.tenantId,
        dispatch.prestataireId,
      );
      const mission = await this.missions.assigner(
        input.tenantId,
        dispatch.missionId,
        dispatch.prestataireId,
      );
      if (!mission) {
        throw new ErreurMetier("DISPATCH_INVALIDE", "La mission est introuvable.");
      }
    }

    return this.dispatches.mettreAJourStatut(
      input.tenantId,
      dispatch.id,
      etape.statut,
      etape.reponduAt,
    );
  }
}

export class RetirerDispatch {
  constructor(private readonly dispatches: DispatchRepository) {}

  async executer(tenantId: string, id: string) {
    const dispatch = await this.dispatches.trouverParId(tenantId, id);
    if (!dispatch) {
      throw new ErreurMetier("DISPATCH_INVALIDE", "L’offre est introuvable.");
    }
    const etape = retirerDispatch(dispatch);
    return this.dispatches.mettreAJourStatut(
      tenantId,
      dispatch.id,
      etape.statut,
      etape.reponduAt,
    );
  }
}
