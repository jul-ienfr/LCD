import {
  codeFournisseurValide,
  externalPropertyIdValide,
  ficheFournisseur,
  type CodeFournisseur,
} from "@/domain/fournisseur";
import { ErreurMetier } from "@/domain/erreurs";
import type {
  AffectationFournisseur,
  EtatSyncFournisseur,
  FournisseurRepository,
} from "../ports/fournisseur-repository";
import type { FournisseurCanal } from "../ports/fournisseur-canal";

export interface AffecterFournisseurInput {
  tenantId: string;
  logementId: string;
  fournisseurCode: string;
  externalPropertyId?: string | null;
  externalRoomTypeId?: string | null;
  externalRatePlanId?: string | null;
}

/**
 * T116 — Affecte un fournisseur à un logement avec test de connexion optionnel.
 *
 * Si la factory `creerFournisseur` est fournie et retourne un adaptateur,
 * le test de connexion est exécuté avant l'affectation. Le résultat est
 * enregistré comme état de santé initial dans le repository.
 *
 * Sans factory (usage legacy, tests simples), l'affectation se fait sans
 * test — le comportement existant est préservé.
 */
export class AffecterFournisseur {
  constructor(
    private readonly repo: FournisseurRepository,
    private readonly creerFournisseur?: (
      code: CodeFournisseur,
    ) => FournisseurCanal | null,
  ) {}

  async executer(
    input: AffecterFournisseurInput,
  ): Promise<AffectationFournisseur> {
    if (
      !codeFournisseurValide(input.fournisseurCode) ||
      !ficheFournisseur(input.fournisseurCode)
    ) {
      throw new ErreurMetier(
        "FOURNISSEUR_INVALIDE",
        "Choisissez un fournisseur reconnu.",
      );
    }
    const externalPropertyId =
      input.externalPropertyId?.trim() || null;
    const externalRoomTypeId =
      input.externalRoomTypeId?.trim() || null;
    const externalRatePlanId =
      input.externalRatePlanId?.trim() || null;
    if (!externalPropertyIdValide(externalPropertyId)) {
      throw new ErreurMetier(
        "FOURNISSEUR_INVALIDE",
        "L\u2019identifiant de logement externe est invalide.",
      );
    }
    if (!externalPropertyIdValide(externalRoomTypeId)) {
      throw new ErreurMetier(
        "FOURNISSEUR_INVALIDE",
        "L\u2019identifiant de type de chambre est invalide.",
      );
    }
    if (!externalPropertyIdValide(externalRatePlanId)) {
      throw new ErreurMetier(
        "FOURNISSEUR_INVALIDE",
        "L\u2019identifiant de plan tarifaire est invalide.",
      );
    }
    const activations = await this.repo.listerActivations();
    const activation = activations?.find(
      (entree) => entree.code === input.fournisseurCode,
    );
    if (!activation?.actif) {
      throw new ErreurMetier(
        "FOURNISSEUR_INVALIDE",
        "Ce fournisseur n\u2019est pas activ\u00e9 par le super-admin.",
      );
    }

    // --- T116 : test de connexion optionnel ---
    const fournisseur = this.creerFournisseur?.(
      input.fournisseurCode as CodeFournisseur,
    );
    let etatSync: EtatSyncFournisseur | null = null;

    if (fournisseur) {
      try {
        const resultat = await fournisseur.testerConnexion();
        if (resultat.ok) {
          etatSync = {
            statut: "ok",
            message: `Connexion vérifiée : ${resultat.message}`,
            empreinte: null,
          };
        } else {
          // Connexion échouée : on affecte quand même (l'utilisateur peut
          // corriger la config) mais on trace l'échec comme santé initiale.
          etatSync = {
            statut: "erreur",
            message: `Test connexion échoué : ${resultat.message}`,
            empreinte: null,
          };
        }
      } catch (erreur) {
        etatSync = {
          statut: "erreur",
          message: `Test connexion impossible : ${
            erreur instanceof Error ? erreur.message : String(erreur)
          }`,
          empreinte: null,
        };
      }
    }

    const affectation = await this.repo.affecter({
      tenantId: input.tenantId,
      logementId: input.logementId,
      fournisseurCode: input.fournisseurCode as CodeFournisseur,
      externalPropertyId,
      externalRoomTypeId,
      externalRatePlanId,
    });

    // Enregistrer la santé initiale si disponible
    if (etatSync && this.repo.enregistrerSync) {
      await this.repo.enregistrerSync(
        input.tenantId,
        input.logementId,
        etatSync,
      );
    }

    return affectation;
  }
}
