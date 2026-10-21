// middleware.ts — ARRIVEE PAR ROLE, au bon endroit.
//
// Pourquoi ici et pas dans la page : /login est servie sans dependre de la
// requete (rendu anticipé), donc `headers()` n'y voit PAS le Remote-User pose
// par Caddy -- mesure du 2026-10-19 : /hote affiche « Sam · operateur »,
// /login ne voit aucune identite. Une redirection ecrite dans la page ne peut
// donc pas se declencher. Le middleware, lui, tourne AVANT le rendu et voit
// toujours les en-tetes de la requete.
//
// Regle : un utilisateur authentifie qui atterrit sur /login repart chez lui
// (table PROFILS = seule source de verite, aucun if par role ici). On ne
// redirige JAMAIS : sans identite (anonyme ou apres deconnexion), avec un
// parametre d'erreur (l'utilisateur doit lire le message), ou vers /login.
import { NextResponse, type NextRequest } from "next/server";
import { PROFILS } from "@/lib/profils";

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;
  if (pathname !== "/login") return NextResponse.next();
  if (searchParams.has("erreur")) return NextResponse.next();

  const qui = (req.headers.get("remote-user") || "").trim();
  if (!qui) return NextResponse.next();

  const cible = PROFILS[qui]?.cible;
  if (!cible || cible.startsWith("/login")) return NextResponse.next();

  const [chemin, requete] = cible.split("?");
  const dest = req.nextUrl.clone();
  dest.pathname = chemin;
  dest.search = requete ? `?${requete}` : "";
  return NextResponse.redirect(dest);
}

export const config = { matcher: "/login" };
