import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "./env";

export interface PayloadCalendrier {
  v: 1;
  tenantId: string;
  logementId: string;
  exp: number;
}

const DUREE_JOURS = 3650;

function base64url(input: string): string {
  return Buffer.from(input).toString("base64url");
}

function signature(payload: string): string {
  return createHmac("sha256", env.BETTER_AUTH_SECRET)
    .update(`calendrier:${payload}`)
    .digest("base64url");
}

export function creerTokenCalendrier(
  data: Omit<PayloadCalendrier, "v" | "exp"> & { exp?: number },
): string {
  const exp =
    data.exp ??
    Math.floor(Date.now() / 1000) + DUREE_JOURS * 24 * 60 * 60;
  const payload: PayloadCalendrier = {
    v: 1,
    tenantId: data.tenantId,
    logementId: data.logementId,
    exp,
  };
  const encoded = base64url(JSON.stringify(payload));
  return `${encoded}.${signature(encoded)}`;
}

export function verifierTokenCalendrier(
  token: string,
  maintenant = Date.now(),
): PayloadCalendrier | null {
  const [encoded, sig] = token.split(".");
  if (!encoded || !sig) return null;

  const attendu = signature(encoded);
  const a = Buffer.from(sig);
  const b = Buffer.from(attendu);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8"),
    ) as Partial<PayloadCalendrier>;

    if (
      payload.v !== 1 ||
      typeof payload.tenantId !== "string" ||
      typeof payload.logementId !== "string" ||
      typeof payload.exp !== "number"
    ) {
      return null;
    }
    if (payload.exp <= Math.floor(maintenant / 1000)) return null;

    return payload as PayloadCalendrier;
  } catch {
    return null;
  }
}
