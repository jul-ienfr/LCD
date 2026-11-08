import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import { creerChallengeCaptcha } from "@/domain/captcha";
import { db } from "@/infrastructure/db/client";
import { tentativesConnexion } from "@/infrastructure/db/schema";
import { env } from "@/lib/env";
import { logErreur } from "@/lib/logger";

export type ModeCaptcha = "off" | "progressif" | "toujours";

const FENETRE_MS = env.CAPTCHA_FENETRE_MINUTES * 60 * 1000;

/** Clé non réversible : aucune IP ni e-mail en clair dans la base. */
export function cleTentative(ip: string): string {
  return createHash("sha256")
    .update(`${env.BETTER_AUTH_SECRET}:${ip}`)
    .digest("hex");
}

export interface EtatTentatives {
  echecs: number;
  requis: boolean;
  bloqueJusqua: Date | null;
}

export async function etatTentatives(cle: string): Promise<EtatTentatives> {
  const [ligne] = await db
    .select()
    .from(tentativesConnexion)
    .where(eq(tentativesConnexion.cle, cle))
    .limit(1);
  if (!ligne) return { echecs: 0, requis: false, bloqueJusqua: null };

  const maintenant = Date.now();
  const dansFenetre =
    maintenant - ligne.dernierEchec.getTime() <= FENETRE_MS;
  const bloque =
    ligne.bloqueJusqua !== null && ligne.bloqueJusqua.getTime() > maintenant;
  const requis =
    bloque || (dansFenetre && ligne.echecs >= env.CAPTCHA_SEUIL);

  return {
    echecs: dansFenetre ? ligne.echecs : 0,
    requis,
    bloqueJusqua: ligne.bloqueJusqua,
  };
}

export async function enregistrerEchecTentative(cle: string): Promise<EtatTentatives> {
  const maintenant = new Date();
  const etat = await etatTentatives(cle);
  const echecs = etat.echecs + 1;
  const bloqueJusqua =
    echecs >= env.CAPTCHA_SEUIL
      ? new Date(maintenant.getTime() + FENETRE_MS)
      : null;

  await db
    .insert(tentativesConnexion)
    .values({
      cle,
      echecs,
      dernierEchec: maintenant,
      bloqueJusqua,
    })
    .onConflictDoUpdate({
      target: tentativesConnexion.cle,
      set: {
        echecs,
        dernierEchec: maintenant,
        bloqueJusqua,
      },
    });

  if (bloqueJusqua) {
    // Alerte d'exploitation : aucune donnée nominative, la clé est un hash.
    console.warn(
      `[auth] ${echecs} échecs de connexion en ${env.CAPTCHA_FENETRE_MINUTES} min — CAPTCHA et blocage temporaire déclenchés (clé ${cle.slice(0, 12)}…).`,
    );
  }

  return { echecs, requis: bloqueJusqua !== null, bloqueJusqua };
}

export async function effacerTentatives(cle: string): Promise<void> {
  try {
    await db
      .delete(tentativesConnexion)
      .where(eq(tentativesConnexion.cle, cle));
  } catch (error) {
    logErreur("captcha.effacerTentatives", error, { cle: cle.slice(0, 12) });
  }
}

export interface CaptchaAffiche {
  question: string;
  token: string;
}

export function creerCaptcha(): { affiche: CaptchaAffiche; nonce: string } {
  const challenge = creerChallengeCaptcha(env.BETTER_AUTH_SECRET);
  return {
    affiche: { question: challenge.question, token: challenge.token },
    nonce: challenge.nonce,
  };
}

export function captchaActif(): boolean {
  return env.CAPTCHA_MODE !== "off";
}
