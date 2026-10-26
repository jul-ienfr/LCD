import { createHmac, timingSafeEqual } from "node:crypto";
import {
  roleApercuValide,
  type Apercu,
  type RoleApercu,
} from "@/domain/apercu";

function base64url(entree: Buffer | string): string {
  return Buffer.from(entree).toString("base64url");
}

function signature(charge: string, secret: string): string {
  return createHmac("sha256", secret).update(charge).digest("base64url");
}

export function signerApercu(apercu: Apercu, secret: string): string {
  const charge = base64url(
    JSON.stringify({
      email: apercu.email.trim().toLowerCase(),
      role: apercu.role,
      exp: apercu.exp,
    }),
  );
  return `${charge}.${signature(charge, secret)}`;
}

export function verifierApercuValeur(
  valeur: string | null | undefined,
  secret: string,
  options: { email?: string | null; maintenant?: number } = {},
): Apercu | null {
  if (!valeur) return null;
  const [charge, sig] = valeur.split(".");
  if (!charge || !sig) return null;

  const attendue = signature(charge, secret);
  const a = Buffer.from(sig);
  const b = Buffer.from(attendue);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  let data: unknown;
  try {
    data = JSON.parse(Buffer.from(charge, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (typeof data !== "object" || data === null) return null;
  const { email, role, exp } = data as Record<string, unknown>;
  if (typeof email !== "string" || !email) return null;
  if (typeof role !== "string" || !roleApercuValide(role)) return null;
  if (typeof exp !== "number" || !Number.isFinite(exp)) return null;
  const maintenant = options.maintenant ?? Math.floor(Date.now() / 1000);
  if (exp <= maintenant) return null;
  if (options.email && options.email.trim().toLowerCase() !== email) return null;

  return { email, role: role as RoleApercu, exp };
}
