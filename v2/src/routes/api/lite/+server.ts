import { redirect } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

const COOKIE = "lcd_lite";

export const GET: RequestHandler = ({ cookies, url }) => {
  const demande = url.searchParams.get("on");
  const actif = demande === null ? cookies.get(COOKIE) !== "1" : demande === "1";

  if (actif) {
    cookies.set(COOKIE, "1", {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  } else {
    cookies.delete(COOKIE, { path: "/" });
  }

  const retour = url.searchParams.get("retour") ?? "/";
  const cible = retour.startsWith("/") && !retour.startsWith("//") ? retour : "/";
  redirect(303, cible);
};
