import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "./env";

export interface PayloadFacture {
  v: 1;
  tenantId: string;
  factureId: string;
  exp: number; // epoch secondes
}

const DUREE_JOURS = 90;

function base64url(input: string): string {
  return Buffer.from(input).toString("base64url");
}

function signature(payload: string): string {
  return createHmac("sha256", env.BETTER_AUTH_SECRET)
    .update(`facture:${payload}`)
    .digest("base64url");
}

export function creerTokenFacture(
  data: Omit<PayloadFacture, "v" | "exp"> & { exp?: number },
): string {
  const exp =
    data.exp ?? Math.floor(Date.now() / 1000) + DUREE_JOURS * 24 * 60 * 60;
  const payload: PayloadFacture = {
    v: 1,
    tenantId: data.tenantId,
    factureId: data.factureId,
    exp,
  };
  const encoded = base64url(JSON.stringify(payload));
  return `${encoded}.${signature(encoded)}`;
}

export function verifierTokenFacture(
  token: string,
  maintenant = Date.now(),
): PayloadFacture | null {
  const [encoded, sig] = token.split(".");
  if (!encoded || !sig) return null;

  const attendu = signature(encoded);
  const a = Buffer.from(sig);
  const b = Buffer.from(attendu);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8"),
    ) as Partial<PayloadFacture>;

    if (
      payload.v !== 1 ||
      typeof payload.tenantId !== "string" ||
      typeof payload.factureId !== "string" ||
      typeof payload.exp !== "number"
    ) {
      return null;
    }
    if (payload.exp <= Math.floor(maintenant / 1000)) return null;

    return payload as PayloadFacture;
  } catch {
    return null;
  }
}
