import "server-only";
import { cookies } from "next/headers";
import {
  DUREE_APERCU_SECONDES,
  type Apercu,
} from "@/domain/apercu";
import { env } from "@/lib/env";
import {
  signerApercu,
  verifierApercuValeur,
} from "@/lib/apercu-signature";

export const COOKIE_APERCU = "lcd_apercu";

export async function lireApercuBrut(): Promise<Apercu | null> {
  const valeur = (await cookies()).get(COOKIE_APERCU)?.value;
  return verifierApercuValeur(valeur, env.BETTER_AUTH_SECRET);
}

export async function lireApercu(session: {
  user: { email?: string | null };
}): Promise<Apercu | null> {
  const valeur = (await cookies()).get(COOKIE_APERCU)?.value;
  return verifierApercuValeur(valeur, env.BETTER_AUTH_SECRET, {
    email: session.user.email,
  });
}

export async function poserCookieApercu(
  email: string,
  role: Apercu["role"],
): Promise<void> {
  const apercu: Apercu = {
    email: email.trim().toLowerCase(),
    role,
    exp: Math.floor(Date.now() / 1000) + DUREE_APERCU_SECONDES,
  };
  (await cookies()).set(COOKIE_APERCU, signerApercu(apercu, env.BETTER_AUTH_SECRET), {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/",
    maxAge: DUREE_APERCU_SECONDES,
  });
}

export async function effacerCookieApercu(): Promise<void> {
  (await cookies()).delete(COOKIE_APERCU);
}
