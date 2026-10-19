// lib/identite.ts — UNE source de vérité pour l'identité front (F3 / §F5).
//
// Bascule testable : LCD_IDP = "1" → mode IdP (déploiement "tout en
// production", Req F3) ; absent → mode lab P1 (batteries inchangées).
//
// Mode IdP : l'identité PROUVÉE = en-tête Remote-User posé par Caddy
// (forward_auth Authelia, anti-spoof : les 4 en-têtes sont d'abord stripés).
// Le front ne fait QUE lire — il ne prouve ni ne valide rien : la vérité
// RBAC reste la passerelle à chaque écriture (le serveur refit son contrôle
// avec `qui` = sujet LCD, id identique à custom/acces.yaml, zéro table de
// traduction). Aucun repli cookie en mode IdP : l'entrée sans-IdP a disparu.
//
// Voir-comme (§14 V5/V6 / §S3.3) : en mode IdP la cible est le cookie
// `lcd_vu` (httpOnly) ; `qui_reel` reste Remote-User pour le bandeau d'audit
// et le payload gateway {qui_reel, qui} qui journalise le geste (90 j).
import { cookies, headers } from "next/headers";

export type Identite = {
  /** true = LCD_IDP=1 : identité = Remote-User, jamais le cookie lcd_qui. */
  modeIdp: boolean;
  /** Identité réelle prouvée : Remote-User (IdP) ou lcd_qui (lab). */
  quiReel: string;
  /** Cible voir-comme active ("" = on voit comme soi). */
  vuComme: string;
  /** Identité EFFECTIVE = vuComme || quiReel — celle qui pilote l'écran. */
  qui: string;
};

export async function lireIdentite(): Promise<Identite> {
  const jar = await cookies();
  if (process.env.LCD_IDP !== "1") {
    const qui = jar.get("lcd_qui")?.value || "";
    return { modeIdp: false, quiReel: qui, vuComme: "", qui };
  }
  const hdr = await headers();
  const quiReel = (hdr.get("remote-user") || "").trim();
  const brut = (jar.get("lcd_vu")?.value || "").trim();
  const vuComme = brut && brut !== quiReel ? brut : "";
  return { modeIdp: true, quiReel, vuComme, qui: vuComme || quiReel };
}

/** URL du portail IdP, exposee au navigateur (lien <a> natif, sans JS). */
export function portailIdp(): string {
  return (process.env.LCD_IDP_URL || "https://lcd.test:4002").replace(/\/+$/, "");
}

/** Endpoint INTERNE Authelia (reseau docker front) — logout serveur :
 * le front n'envoie JAMAIS le navigateur frapper l'IdP en interne. */
export function autheliaInterne(): string {
  return (process.env.LCD_IDP_INTERNE || "http://authelia:9091").replace(/\/+$/, "");
}
