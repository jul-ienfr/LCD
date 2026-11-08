import { createHmac, timingSafeEqual } from "node:crypto";
import type { RequestEvent } from "@sveltejs/kit";
import { env } from "@/lib/env";

export const COOKIE_APERCU_APPARENCE = "lcd_apercu_apparence";
export const DUREE_APERCU_APPARENCE = 30 * 60;

type Charge = {
  v: 1;
  sub: string;
  exp: number;
};

function base64url(entree: Buffer | string): string {
  return Buffer.from(entree).toString("base64url");
}

function signature(charge: string): string {
  return createHmac("sha256", env.BETTER_AUTH_SECRET)
    .update(charge)
    .digest("base64url");
}

export function signerApercuApparence(sub: string): string {
  const charge: Charge = {
    v: 1,
    sub,
    exp: Math.floor(Date.now() / 1000) + DUREE_APERCU_APPARENCE,
  };
  const encode = base64url(JSON.stringify(charge));
  return `${encode}.${signature(encode)}`;
}

export function verifierApercuApparence(
  valeur: string | null | undefined,
  sub: string | null | undefined,
): Charge | null {
  if (!valeur || !sub) return null;
  const [encode, sig] = valeur.split(".");
  if (!encode || !sig) return null;

  const attendue = signature(encode);
  const a = Buffer.from(sig);
  const b = Buffer.from(attendue);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  let data: unknown;
  try {
    data = JSON.parse(Buffer.from(encode, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (typeof data !== "object" || data === null) return null;
  const { v, sub: sujet, exp } = data as Record<string, unknown>;
  if (v !== 1 || typeof sujet !== "string" || sujet !== sub) return null;
  if (typeof exp !== "number" || !Number.isFinite(exp)) return null;
  if (exp <= Math.floor(Date.now() / 1000)) return null;
  return { v: 1, sub: sujet, exp };
}

export function poserCookieApercuApparence(
  event: RequestEvent,
  sub: string,
): void {
  event.cookies.set(COOKIE_APERCU_APPARENCE, signerApercuApparence(sub), {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/",
    maxAge: DUREE_APERCU_APPARENCE,
  });
}

export function effacerCookieApercuApparence(event: RequestEvent): void {
  event.cookies.delete(COOKIE_APERCU_APPARENCE, { path: "/" });
}
