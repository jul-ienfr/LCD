import { ErreurMetier } from "./erreurs";

export type StatutDispatch = "proposee" | "acceptee" | "refusee" | "retiree";
export type DecisionDispatch = "accepter" | "refuser";

export interface Dispatch {
  id: string;
  tenantId: string;
  missionId: string;
  prestataireId: string;
  ref: string;
  statut: StatutDispatch;
  message: string;
  createdAt: Date;
  reponduAt: Date | null;
}

export const STATUTS_DISPATCH: readonly StatutDispatch[] = [
  "proposee",
  "acceptee",
  "refusee",
  "retiree",
];

export const LIBELLES_STATUT_DISPATCH: Record<StatutDispatch, string> = {
  proposee: "Proposée",
  acceptee: "Acceptée",
  refusee: "Refusée",
  retiree: "Retirée",
};

export const MESSAGE_DISPATCH_MAX = 500;

export function dispatchActif(statut: StatutDispatch): boolean {
  return statut === "proposee" || statut === "acceptee";
}

export function refDispatchValide(ref: string): boolean {
  return /^[A-Za-z0-9-]{4,64}$/.test(ref);
}

export function validerMessageDispatch(message: string): string {
  const texte = message.trim();
  if (texte.length > MESSAGE_DISPATCH_MAX) {
    throw new ErreurMetier(
      "DISPATCH_INVALIDE",
      `Le message est limité à ${MESSAGE_DISPATCH_MAX} caractères.`,
    );
  }
  return texte;
}

export function repondreDispatch(
  dispatch: Pick<Dispatch, "statut">,
  decision: DecisionDispatch,
  maintenant: Date = new Date(),
): { statut: StatutDispatch; reponduAt: Date } {
  if (dispatch.statut !== "proposee") {
    throw new ErreurMetier(
      "DISPATCH_INVALIDE",
      "Cette offre n’est plus en attente de réponse.",
    );
  }
  return {
    statut: decision === "accepter" ? "acceptee" : "refusee",
    reponduAt: maintenant,
  };
}

export function retirerDispatch(
  dispatch: Pick<Dispatch, "statut">,
  maintenant: Date = new Date(),
): { statut: StatutDispatch; reponduAt: Date } {
  if (dispatch.statut !== "proposee") {
    throw new ErreurMetier(
      "DISPATCH_INVALIDE",
      "Seule une offre proposée peut être retirée.",
    );
  }
  return { statut: "retiree", reponduAt: maintenant };
}
