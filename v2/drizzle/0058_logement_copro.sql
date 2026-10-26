ALTER TABLE "logements" ADD COLUMN "copro_verifiee" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "logements" ADD COLUMN "copro_verifiee_le" timestamp with time zone;--> statement-breakpoint
UPDATE "logements" SET "copro_verifiee" = true WHERE "copro_verifiee" = false;
