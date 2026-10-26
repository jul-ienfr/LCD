import { connection } from "next/server";
import journal from "../../../../drizzle/meta/_journal.json";
import {
  manquantsSchema,
  rlsEffective,
  type EtatRole,
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
        ) as "commissionBp",
        exists (
          select 1
          from information_schema.columns
          where table_schema = 'public'
            and table_name = 'tenants'
            and column_name = 'nature'
        ) as "tenantNature",
        exists (
          select 1
          from information_schema.columns
          where table_schema = 'public'
            and table_name = 'logement_proprietaires'
            and column_name = 'mode'
        ) as "mandatMode",
        to_regclass('drizzle.__drizzle_migrations')::text as "migrationsTable"
    `;

    let migrations = 0;
    if (etat?.migrationsTable) {
      const [compte] = await sql<{ nombre: number }[]>`
        select count(*)::int as nombre
        from drizzle.__drizzle_migrations
      `;
      migrations = Number(compte?.nombre ?? 0);
    }

    const manquants = manquantsSchema(
      { ...etat, migrations },
      journal.entries.length,
    );

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

    const [role] = await sql<EtatRole[]>`
      select
        current_user as "utilisateur",
        coalesce(
          (select rolsuper from pg_roles where rolname = current_user),
          false
        ) as "superutilisateur",
        coalesce(
          (select rolbypassrls from pg_roles where rolname = current_user),
          false
        ) as "bypassRls",
        exists (
          select 1
          from pg_class c
          join pg_namespace n on n.oid = c.relnamespace
          where n.nspname = 'public'
            and c.relkind = 'r'
            and c.relowner = (
              select oid from pg_roles where rolname = current_user
            )
        ) as "proprietaireTables"
    `;

    if (!rlsEffective(role)) {
      return Response.json(
        {
          ok: false,
          service: "lcd-v2",
          version: APP_VERSION,
          db: "up",
          schema: "ok",
          rls: "unsafe",
          role: role?.utilisateur ?? null,
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
        rls: "ok",
        role: role?.utilisateur ?? null,
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
