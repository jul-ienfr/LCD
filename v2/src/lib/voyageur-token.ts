import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "./env";

export interface PayloadVoyageur {
  v: 1;
  tenantId: string;
  logementId: string;
  reservationId: string;
  exp: number; // epoch secondes
}

const DUREE_JOURS = 60;

function base64url(input: string | Buffer): string {
  return Buffer.from(input).toString("base64url");
}

function signature(payload: string): string {
  return createHmac("sha256", env.BETTER_AUTH_SECRET)
    .update(payload)
    .digest("base64url");
}

export function creerTokenVoyageur(
  data: Omit<PayloadVoyageur, "v" | "exp"> & { exp?: number },
): string {
  const exp =
    data.exp ?? Math.floor(Date.now() / 1000) + DUREE_JOURS * 24 * 60 * 60;
  const payload: PayloadVoyageur = {
    v: 1,
    tenantId: data.tenantId,
    logementId: data.logementId,
    reservationId: data.reservationId,
    exp,
  };
  const encoded = base64url(JSON.stringify(payload));
  return `${encoded}.${signature(encoded)}`;
}

export function verifierTokenVoyageur(
  token: string,
  maintenant = Date.now(),
): PayloadVoyageur | null {
  const [encoded, sig] = token.split(".");
  if (!encoded || !sig) return null;

  const attendu = signature(encoded);
  const a = Buffer.from(sig);
  const b = Buffer.from(attendu);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8"),
    ) as Partial<PayloadVoyageur>;

    if (
      payload.v !== 1 ||
      typeof payload.tenantId !== "string" ||
      typeof payload.logementId !== "string" ||
      typeof payload.reservationId !== "string" ||
      typeof payload.exp !== "number"
    ) {
      return null;
    }
    if (payload.exp <= Math.floor(maintenant / 1000)) return null;

    return payload as PayloadVoyageur;
  } catch {
    return null;
  }
}

export function tokenVoyageurExpireDansJours(
  reservationFin: string,
  jours = 30,
): number {
  const fin = Date.parse(`${reservationFin}T00:00:00.000Z`);
  const min = Date.now() + DUREE_JOURS * 24 * 60 * 60 * 1000;
  const sejour = fin + jours * 24 * 60 * 60 * 1000;
  return Math.floor(Math.max(min, sejour) / 1000);
}
