import { connection } from "next/server";
import { capturerErreur } from "@/lib/telemetry";

const TAILLE_MAX = 10_000;

export async function POST(request: Request) {
  await connection();

  if (!process.env.SENTRY_DSN) {
    return new Response(null, { status: 204 });
  }

  const texte = await request.text();
  if (texte.length > TAILLE_MAX) {
    return new Response("Payload trop volumineux", { status: 413 });
  }

  let corps: {
    message?: unknown;
    digest?: unknown;
    stack?: unknown;
    path?: unknown;
  };
  try {
    corps = JSON.parse(texte) as typeof corps;
  } catch {
    return new Response("JSON invalide", { status: 400 });
  }

  const message =
    typeof corps.message === "string" && corps.message.trim()
      ? corps.message.trim().slice(0, 500)
      : "Erreur client inconnue";
  const erreur = new Error(message);
  erreur.name = "ErreurClient";
  if (typeof corps.stack === "string") {
    erreur.stack = corps.stack.slice(0, 5_000);
  }

  await capturerErreur("client", erreur, {
    digest:
      typeof corps.digest === "string" ? corps.digest.slice(0, 200) : undefined,
    path: typeof corps.path === "string" ? corps.path.slice(0, 500) : undefined,
    userAgent: request.headers.get("user-agent")?.slice(0, 200),
  });

  return new Response(null, { status: 204 });
}
