import { connection } from "next/server";
import {
  manquantsSchema,
  type EtatSchema,
} from "@/domain/readiness";
import { sql } from "@/infrastructure/db/client";
import { APP_VERSION } from "@/lib/version";

export async function GET() {
  await connection();

  const debut = Date.now();
  try {
    const [etat] = await sql<EtatSchema[]>`
      select
        to_regclass('public.cautions')::text as cautions,
        to_regclass('public.webhooks')::text as webhooks,
        to_regclass('public.webhook_deliveries')::text as "webhookDeliveries",
        exists (
          select 1
          from information_schema.columns
          where table_schema = 'public'
            and table_name = 'logement_proprietaires'
            and column_name = 'commission_bp'
        ) as "commissionBp"
    `;

    const manquants = manquantsSchema(etat);

    if (manquants.length > 0) {
      return Response.json(
        {
          ok: false,
          service: "lcd-v2",
          version: APP_VERSION,
          db: "up",
          schema: "pending",
          manquants,
          dureeMs: Date.now() - debut,
          date: new Date().toISOString(),
        },
        { status: 503 },
      );
    }

    return Response.json(
      {
        ok: true,
        service: "lcd-v2",
        version: APP_VERSION,
        db: "up",
        schema: "ok",
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
