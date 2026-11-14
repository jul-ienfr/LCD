/**
 * T607 — Use case de création d'un code d'accès pour une réservation.
 *
 * Orchestration hexagonale :
 * 1. Domaine pur (`acces-serrure.ts`) : fenêtre d'accès, référence stable,
 *    génération du code, choix du fournisseur.
 * 2. Port `SerrureConnecteePort` : tentative Nuki. Tout échec lève une
 *    `ErreurMetier` propre → bascule en repli manuel (jamais de blocage
 *    d'arrivée voyageur).
 * 3. Port `AccesSerrureRepository` : persistance idempotente par `ref`.
 *
 * L'audit est à la charge de la route appelante (pattern projet) qui insère
 * dans `auditLogs` avec l'action `serrure.code_creer`.
 */
import {
  choisirFournisseur,
  fenetreAcces,
  genererCodeAcces,
  refAcces,
  type FournisseurSerrure,
} from "@/domain/acces-serrure";
import type { AccesSerrureRepository } from "../ports/guides-repository";
import type { SerrureConnecteePort } from "../ports/serrure-connectee";

export interface CreerAccesSerrureInput {
  tenantId: string;
  logementId: string;
  reservationId?: string | null;
  /** Jour d'arrivée (AAAA-MM-JJ). */
  arrivee: string;
  /** Jour de départ (AAAA-MM-JJ). */
  depart: string;
  /** Heure d'arrivée (HH:MM), défaut 15:00. */
  heureArrivee?: string;
  /** Heure de départ (HH:MM), défaut 11:00. */
  heureDepart?: string;
  /** Identifiant de la serrure chez le fournisseur (Nuki). */
  serrureId?: string | null;
}

export interface ResultatCreerAccesSerrure {
  id: string;
  ref: string;
  code: string;
  fournisseur: FournisseurSerrure;
  valideDe: string;
  valideA: string;
  /** True si l'accès existait déjà (rejeu idempotent). */
  existant: boolean;
  /** True si Nuki a échoué et qu'on a basculé en repli manuel. */
  fallback: boolean;
}

export class CreerAccesSerrure {
  constructor(
    private readonly acces: AccesSerrureRepository,
    private readonly serrure: SerrureConnecteePort,
  ) {}

  async executer(input: CreerAccesSerrureInput): Promise<ResultatCreerAccesSerrure> {
    // 1. Fenêtre d'accès (domaine pur, lève si dates incohérentes).
    const fenetre = fenetreAcces({
      arrivee: input.arrivee,
      depart: input.depart,
      heureArrivee: input.heureArrivee,
      heureDepart: input.heureDepart,
    });

    // 2. Référence stable → idempotence (règle 7).
    const ref = refAcces(input.logementId, fenetre.valideDe);

    // 3. Rejeu : l'accès existe déjà pour cette ref.
    const existant = await this.acces.trouverParRef(input.tenantId, ref);
    if (existant) {
      return {
        id: existant.id,
        ref: existant.ref,
        code: existant.code ?? "",
        fournisseur: (existant.fournisseur ?? "manuel") as FournisseurSerrure,
        valideDe: existant.valideDe,
        valideA: existant.valideA,
        existant: true,
        fallback: false,
      };
    }

    // 4. Génération du code (6 chiffres, domaine pur).
    const code = genererCodeAcces();

    // 5. Choix du fournisseur : nuki si disponible ET serrure identifiée.
    const disponible = this.serrure.estDisponible() && Boolean(input.serrureId);
    const fournisseurChoisi = choisirFournisseur(disponible);

    let fournisseurEffectif: FournisseurSerrure;
    let type: "numerique" | "manuel";
    let externalId: string | null = null;
    let fallback = false;

    if (fournisseurChoisi === "nuki") {
      try {
        const resultat = await this.serrure.creerCode({
          serrureId: input.serrureId!,
          code,
          nom: ref,
          valideDe: fenetre.valideDe,
          valideA: fenetre.valideA,
        });
        externalId = resultat.externalId;
        fournisseurEffectif = "nuki";
        type = "numerique";
      } catch {
        // T607 — Repli manuel : une panne de partenaire ne doit jamais
        // bloquer l'arrivée d'un voyageur.
        fournisseurEffectif = "manuel";
        type = "manuel";
        fallback = true;
      }
    } else {
      fournisseurEffectif = "manuel";
      type = "manuel";
    }

    // 6. Persistance idempotente par ref.
    const { id } = await this.acces.creer(input.tenantId, {
      logementId: input.logementId,
      reservationId: input.reservationId ?? null,
      ref,
      type,
      code,
      fournisseur: fournisseurEffectif,
      valideDe: fenetre.valideDe,
      valideA: fenetre.valideA,
      externalId,
    });

    return {
      id,
      ref,
      code,
      fournisseur: fournisseurEffectif,
      valideDe: fenetre.valideDe,
      valideA: fenetre.valideA,
      existant: false,
      fallback,
    };
  }
}
