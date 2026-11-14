ALTER TABLE "fils_voyageur" ADD COLUMN "assigne_a" text;--> statement-breakpoint
CREATE INDEX "fils_voyageur_tenant_assigne_idx" ON "fils_voyageur" USING btree ("tenant_id","assigne_a");
