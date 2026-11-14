-- Journal de correspondance V1 → V2 (spec 005, US3).
-- Une ligne par enregistrement source traité : la clé primaire rend l'import
-- idempotent et interdit deux correspondances concurrentes.
CREATE TABLE IF NOT EXISTS "migration_v1" (
	"source" text NOT NULL,
	"cle_source" text NOT NULL,
	"cible" text NOT NULL,
	"id_cible" text NOT NULL,
	"empreinte" text NOT NULL,
	"statut" text NOT NULL,
	"motif" text,
	"cree_le" timestamp with time zone DEFAULT now() NOT NULL,
	"maj_le" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "migration_v1_source_cle_source_cible_pk" PRIMARY KEY("source","cle_source","cible")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "migration_v1_statut_idx" ON "migration_v1" USING btree ("statut");
