import type { RequestEvent } from "@sveltejs/kit";
import { DUREE_APERCU_SECONDES, type Apercu } from "@/domain/apercu";
import { env } from "@/lib/env";
import {
  signerApercu,
  verifierApercuValeur,
} from "@/lib/apercu-signature";

export const COOKIE_APERCU = "lcd_apercu";

export function lireApercu(
  event: RequestEvent,
  session?: { user: { email?: string | null } },
): Apercu | null {
  const valeur = event.cookies.get(COOKIE_APERCU);
  return verifierApercuValeur(valeur, env.BETTER_AUTH_SECRET, {
    email: session?.user.email,
  });
}

export function poserCookieApercu(
  event: RequestEvent,
  email: string,
  role: Apercu["role"],
): void {
  const apercu: Apercu = {
    email: email.trim().toLowerCase(),
    role,
    exp: Math.floor(Date.now() / 1000) + DUREE_APERCU_SECONDES,
  };
  event.cookies.set(COOKIE_APERCU, signerApercu(apercu, env.BETTER_AUTH_SECRET), {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/",
    maxAge: DUREE_APERCU_SECONDES,
  });
}

export function effacerCookieApercu(event: RequestEvent): void {
  event.cookies.delete(COOKIE_APERCU, { path: "/" });
}
