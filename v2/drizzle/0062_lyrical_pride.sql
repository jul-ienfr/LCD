CREATE TABLE "apparence_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"version" integer NOT NULL,
	"configuration" jsonb NOT NULL,
	"schema_version" integer DEFAULT 2 NOT NULL,
	"statut" text DEFAULT 'archive' NOT NULL,
	"cree_le" timestamp with time zone DEFAULT now() NOT NULL,
	"cree_par" text NOT NULL,
	"publie_le" timestamp with time zone,
	"publie_par" text,
	"motif" text
);
--> statement-breakpoint
CREATE UNIQUE INDEX "apparence_versions_version_uq" ON "apparence_versions" USING btree ("version");--> statement-breakpoint
CREATE UNIQUE INDEX "apparence_versions_publie_uq" ON "apparence_versions" USING btree ("statut") WHERE "apparence_versions"."statut" = 'publie';--> statement-breakpoint
CREATE UNIQUE INDEX "apparence_versions_brouillon_uq" ON "apparence_versions" USING btree ("statut") WHERE "apparence_versions"."statut" = 'brouillon';--> statement-breakpoint
ALTER TABLE "apparence_versions" ADD CONSTRAINT "apparence_versions_statut_check" CHECK ("statut" IN ('brouillon', 'publie', 'archive'));--> statement-breakpoint
ALTER TABLE "apparence_versions" ADD CONSTRAINT "apparence_versions_version_check" CHECK ("version" >= 0);--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON "apparence_versions" TO lcd_app;
