/**
 * Harnais de contrat sandbox (T026).
 *
 * Utilitaires partagés par les tests de contrat qui frappent un vrai
 * fournisseur en sandbox (Beds24, Channex, PriceLabs…). Ces tests sont
 * opt-in : sans les variables d'environnement sandbox, ils sont sautés
 * (skip) et jamais exécutés par défaut. Convention : un test de contrat
 * appelle `exigerSandbox()` dès sa première ligne et reçoit une fonction
 * `fetch` bornée + des assertions de forme communes.
 *
 * Activation : SANDBOX_TESTS=1 + clés du fournisseur concerné.
 */

import { afterAll } from "vitest";

export const TIMEOUT_SANDBOX_MS = 20_000;

export function sandboxActive(): boolean {
  return process.env.SANDBOX_TESTS === "1" || process.env.SANDBOX_TESTS === "true";
}

/**
 * Retourne la valeur d'une variable sandbox ou null si absente.
 * Les tests de contrat doivent l'utiliser pour décider skip/run.
 */
export function variableSandbox(nom: string): string | null {
  const valeur = process.env[nom]?.trim();
  return valeur && valeur.length > 0 ? valeur : null;
}

export interface ContexteSandbox {
  actif: boolean;
  raisons: string[];
}

/**
 * Évalue si le contexte sandbox est complet pour un fournisseur donné.
 * Le test appelle ensuite `sauterSiInactif(ctx)` pour skipper proprement.
 */
export function evaluerSandbox(variablesRequises: string[]): ContexteSandbox {
  const raisons: string[] = [];
  if (!sandboxActive()) raisons.push("SANDBOX_TESTS n'est pas à 1");
  for (const nom of variablesRequises) {
    if (!variableSandbox(nom)) raisons.push(`${nom} absent`);
  }
  return { actif: raisons.length === 0, raisons };
}

/**
 * fetch borné pour les appels sandbox : timeout + User-Agent identifiable.
 * Jamais de secret dans l'URL de log ; les erreurs incluent le statut seul.
 */
export async function appelSandbox(
  url: string,
  init: RequestInit = {},
): Promise<Response> {
  const controleur = new AbortController();
  const minuteur = setTimeout(() => controleur.abort(), TIMEOUT_SANDBOX_MS);
  try {
    return await fetch(url, {
      ...init,
      signal: controleur.signal,
      headers: {
        "user-agent": "lcd-v2/contract-test",
        ...(init.headers ?? {}),
      },
    });
  } finally {
    clearTimeout(minuteur);
  }
}

/**
 * Nettoie les éventuelles ressources créées pendant le test de contrat.
 * Enregistre une série de callbacks de teardown exécutés en afterAll.
 */
export function enregistrerNettoyage(fn: () => Promise<void> | void): void {
  afterAll(async () => {
    await fn();
  });
}
