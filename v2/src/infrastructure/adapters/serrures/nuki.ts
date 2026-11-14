/**
 * T606 — Adapter Nuki (serrure connectée) via l'API Nuki Web.
 *
 * Couche infrastructure : c'est le seul endroit qui appelle Nuki. Le domaine
 * `acces-serrure.ts` décide du fournisseur sans jamais faire d'HTTP (règle 4).
 *
 * Contractuellement, l'API Nuki Web attend :
 * - création : `PUT /smartlock/{serrureId}/authorization` avec
 *   `{ codepin, name, timeLimited: { from, until } }`, retourne `{ codeId }` ;
 * - révocation : `DELETE /smartlock/{serrureId}/authorization/{codeId}`.
 *
 * Sans token (`NUKI_API_TOKEN`), `estDisponible()` renvoie false et les
 * méthodes lèvent une `ErreurMetier` propre : l'appelant (T607) bascule alors
 * en repli manuel. La config est injectable pour rendre les tests déterministes
 * sans toucher au singleton `env`.
 */
import type { SerrureConnecteePort } from "@/application/ports/serrure-connectee";
import { ErreurMetier } from "@/domain/erreurs";
import { env } from "@/lib/env";
import { requeteFournisseur, urlAvecParametres } from "../fournisseurs/http";

export interface ConfigSerrureNuki {
  /** Token API Nuki ; par défaut lu dans `env.NUKI_API_TOKEN`. */
  token?: string;
  /** Base de l'API ; par défaut `env.NUKI_API_BASE`. */
  base?: string;
  /** fetch injectable pour les tests. */
  fetchImpl?: typeof fetch;
}

interface ReponseAutorisationNuki {
  codeId?: string | number;
}

/** Un code programmé sur une serrure Nuki fait exactement 6 chiffres. */
function codeNukiValide(code: string): boolean {
  return /^\d{6}$/.test(code);
}

/** Un 404 sur la révocation signifie que le code n'existe plus : idempotent. */
function estErreurIntrouvable(erreur: unknown): boolean {
  return erreur instanceof ErreurMetier && erreur.message.includes("(404)");
}

export function creerSerrureNuki(
  config: ConfigSerrureNuki = {},
): SerrureConnecteePort {
  const tokenDe = (): string | undefined => config.token ?? env.NUKI_API_TOKEN;
  const baseDe = (): string => config.base ?? env.NUKI_API_BASE;

  return {
    nom: "Nuki",

    estDisponible: () => Boolean(tokenDe()?.trim()),

    async creerCode(input) {
      const token = tokenDe()?.trim();
      if (!token) {
        throw new ErreurMetier(
          "SERRURE_INDISPONIBLE",
          "Token Nuki absent : création du code impossible.",
        );
      }
      if (!input.serrureId.trim()) {
        throw new ErreurMetier(
          "SERRURE_INDISPONIBLE",
          "Identifiant de serrure Nuki manquant.",
        );
      }
      if (!codeNukiValide(input.code)) {
        throw new ErreurMetier(
          "SERRURE_INDISPONIBLE",
          "Le code programmé sur la serrure Nuki doit contenir 6 chiffres.",
        );
      }

      const reponse = await requeteFournisseur<ReponseAutorisationNuki>({
        url: urlAvecParametres(
          baseDe(),
          `smartlock/${input.serrureId}/authorization`,
          {},
        ),
        methode: "PUT",
        entetes: { Authorization: `Bearer ${token}` },
        corps: {
          codepin: input.code,
          name: input.nom.trim().slice(0, 32) || "Code LCD",
          timeLimited: { from: input.valideDe, until: input.valideA },
        },
        timeoutMs: env.FOURNISSEUR_HTTP_TIMEOUT_MS,
        fetchImpl: config.fetchImpl,
      });

      if (reponse.codeId === undefined || reponse.codeId === null) {
        throw new ErreurMetier(
          "SERRURE_INDISPONIBLE",
          "Nuki n'a pas retourné d'identifiant de code.",
        );
      }
      return { externalId: String(reponse.codeId) };
    },

    async revoquerCode(input) {
      const token = tokenDe()?.trim();
      if (!token) {
        throw new ErreurMetier(
          "SERRURE_INDISPONIBLE",
          "Token Nuki absent : révocation du code impossible.",
        );
      }
      if (!input.serrureId.trim() || !input.externalId.trim()) {
        throw new ErreurMetier(
          "SERRURE_INDISPONIBLE",
          "Identifiants de serrure/code Nuki manquants.",
        );
      }

      try {
        await requeteFournisseur<unknown>({
          url: urlAvecParametres(
            baseDe(),
            `smartlock/${input.serrureId}/authorization/${input.externalId}`,
            {},
          ),
          methode: "DELETE",
          entetes: { Authorization: `Bearer ${token}` },
          timeoutMs: env.FOURNISSEUR_HTTP_TIMEOUT_MS,
          fetchImpl: config.fetchImpl,
        });
      } catch (erreur) {
        // Un code déjà supprimé chez Nuki n'est pas une erreur : idempotence.
        if (estErreurIntrouvable(erreur)) return;
        throw erreur;
      }
    },
  };
}
