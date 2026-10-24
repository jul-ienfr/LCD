import { connection } from "next/server";
import { sql } from "@/infrastructure/db/client";
import { APP_VERSION } from "@/lib/version";

export async function GET() {
  await connection();

  const debut = Date.now();
  try {
    await sql`select 1`;
    return Response.json(
      {
        ok: true,
        service: "lcd-v2",
        version: APP_VERSION,
        db: "up",
        dureeMs: Date.now() - debut,
        date: new Date().toISOString(),
      },
      { status: 200 },
    );
  } catch {
    return Response.json(
      {
        ok: false,
        service: "lcd-v2",
        version: APP_VERSION,
        db: "down",
        date: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
