import { redirect } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

const COOKIE = "lcd_cookies_ok";

export const GET: RequestHandler = ({ cookies, url }) => {
  cookies.set(COOKIE, "1", {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  const retour = url.searchParams.get("retour") ?? "/";
  const cible = retour.startsWith("/") && !retour.startsWith("//") ? retour : "/";
  redirect(303, cible);
};
