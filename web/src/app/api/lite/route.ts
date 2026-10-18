// app/api/lite/route.ts — préférence « version légère » (mode L1, §F7) :
// GET /api/lite?on=1&retour=/chemin → cookie lcd_lite + redirect. Route
// handler (pas de server action) : lien <a> natif, fonctionne SANS JavaScript
// sur les vieux téléphones. `retour` = chemin interne seul (anti open-redirect
// comme voir-comme/basculerTheme).
import { NextResponse, type NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const on = p.get("on") === "1";
  const brut = p.get("retour") || "/";
  const retour =
    brut.startsWith("/") && !brut.startsWith("//") && !brut.includes("\\") && !brut.includes("\n")
      ? brut
      : "/";
  const rep = NextResponse.redirect(new URL(retour, req.url), 303);
  rep.cookies.set("lcd_lite", on ? "1" : "0", {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });
  return rep;
}
