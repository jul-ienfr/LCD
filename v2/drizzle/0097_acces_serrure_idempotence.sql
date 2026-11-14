-- T601/T606/T607 : complète `acces_serrure` (créée en 0096) pour l'idempotence,
-- la fenêtre de validité et la traçabilité de la révocation.
-- 0096 est déjà appliquée : on étend, on ne réécrit pas (règle projet 8).

ALTER TABLE "acces_serrure" ADD COLUMN "ref" text;--> statement-breakpoint
ALTER TABLE "acces_serrure" ADD COLUMN "valide_de" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "acces_serrure" ADD COLUMN "valide_a" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "acces_serrure" ADD COLUMN "revoque_le" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "acces_serrure" ADD COLUMN "revoque_par" text;--> statement-breakpoint
ALTER TABLE "acces_serrure" ADD COLUMN "external_id" text;--> statement-breakpoint
UPDATE "acces_serrure"
   SET "ref" = 'ACC-' || substr("logement_id"::text, 1, 8) || '-' || to_char("created_at", 'YYYYMMDD')
 WHERE "ref" IS NULL;--> statement-breakpoint
UPDATE "acces_serrure"
   SET "valide_de" = "created_at"
 WHERE "valide_de" IS NULL;--> statement-breakpoint
UPDATE "acces_serrure"
   SET "valide_a" = COALESCE("expire_le", "created_at" + interval '1 day')
 WHERE "valide_a" IS NULL;--> statement-breakpoint
ALTER TABLE "acces_serrure" ALTER COLUMN "ref" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "acces_serrure" ALTER COLUMN "valide_de" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "acces_serrure" ALTER COLUMN "valide_a" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "acces_serrure" ADD CONSTRAINT "acces_serrure_fenetre_coherente" CHECK ("valide_a" > "valide_de");--> statement-breakpoint
ALTER TABLE "acces_serrure" ADD CONSTRAINT "acces_serrure_code_numerique" CHECK ("code" IS NULL OR "code" ~ '^[0-9]{4,8}$');--> statement-breakpoint
CREATE UNIQUE INDEX "acces_serrure_tenant_ref_uq" ON "acces_serrure" USING btree ("tenant_id","ref");--> statement-breakpoint
CREATE INDEX "acces_serrure_tenant_logement_statut_idx" ON "acces_serrure" USING btree ("tenant_id","logement_id","statut");
