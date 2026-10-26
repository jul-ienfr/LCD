import { NextResponse, type NextRequest } from "next/server";

const COOKIE_APERCU = "lcd_apercu";
const MUTATIONS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * En mode aperçu, seules les lectures passent. L'arrêt de l'aperçu et
 * l'authentification restent possibles pour ne pas enfermer l'opérateur.
 * Le contrôle serveur (requireRole) double cette barrière.
 */
export function proxy(request: NextRequest) {
  if (!request.cookies.has(COOKIE_APERCU)) return NextResponse.next();
  if (!MUTATIONS.has(request.method)) return NextResponse.next();

  const chemin = request.nextUrl.pathname;
  if (
    chemin === "/preview/quitter" ||
    chemin.startsWith("/preview/") ||
    chemin.startsWith("/api/auth/")
  ) {
    return NextResponse.next();
  }

  return NextResponse.redirect(
    new URL("/preview/lecture-seule", request.url),
    303,
  );
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt).*)"],
};
