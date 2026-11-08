ALTER TABLE "plans_tarifaires" ADD COLUMN "mode" text DEFAULT 'independant' NOT NULL;--> statement-breakpoint
ALTER TABLE "plans_tarifaires" ADD COLUMN "ajustement_pourcentage" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "plans_tarifaires" ADD COLUMN "herite_restrictions" boolean DEFAULT true NOT NULL;