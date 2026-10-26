ALTER TABLE "menages" ADD COLUMN "score" integer;--> statement-breakpoint
ALTER TABLE "menages" ADD COLUMN "cout_centimes" integer;--> statement-breakpoint
ALTER TABLE "menages" ADD COLUMN "duree_minutes" integer;
--> statement-breakpoint
ALTER TABLE "menages" ADD CONSTRAINT "menages_score_check" CHECK ("score" IS NULL OR ("score" BETWEEN 1 AND 5));
--> statement-breakpoint
ALTER TABLE "menages" ADD CONSTRAINT "menages_cout_check" CHECK ("cout_centimes" IS NULL OR "cout_centimes" >= 0);
--> statement-breakpoint
ALTER TABLE "menages" ADD CONSTRAINT "menages_duree_check" CHECK ("duree_minutes" IS NULL OR "duree_minutes" > 0);