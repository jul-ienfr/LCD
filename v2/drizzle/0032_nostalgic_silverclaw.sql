CREATE TABLE "parametres_site" (
	"cle" text PRIMARY KEY NOT NULL,
	"valeur" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
INSERT INTO "parametres_site" ("cle", "valeur") VALUES ('design', 'sejour') ON CONFLICT ("cle") DO NOTHING;
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lcd_app') THEN
    GRANT SELECT, INSERT, UPDATE ON "parametres_site" TO lcd_app;
  END IF;
END $$;
