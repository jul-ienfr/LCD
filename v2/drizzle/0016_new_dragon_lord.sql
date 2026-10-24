CREATE TABLE "commandes_extras" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"reservation_id" uuid NOT NULL,
	"extra_id" uuid NOT NULL,
	"quantite" integer DEFAULT 1 NOT NULL,
	"prix_unitaire_centimes" integer NOT NULL,
	"total_centimes" integer NOT NULL,
	"ref" text NOT NULL,
	"statut" text DEFAULT 'demandee' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "extras" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"logement_id" uuid,
	"code" text NOT NULL,
	"nom" text NOT NULL,
	"description" text,
	"prix_centimes" integer DEFAULT 0 NOT NULL,
	"actif" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "logements" ADD COLUMN "checkin_heure" text;--> statement-breakpoint
ALTER TABLE "logements" ADD COLUMN "checkin_instructions" text;--> statement-breakpoint
ALTER TABLE "logements" ADD COLUMN "wifi_ssid" text;--> statement-breakpoint
ALTER TABLE "logements" ADD COLUMN "wifi_password" text;--> statement-breakpoint
ALTER TABLE "logements" ADD COLUMN "regles" text;--> statement-breakpoint
ALTER TABLE "logements" ADD COLUMN "urgence_tel" text;--> statement-breakpoint
ALTER TABLE "logements" ADD COLUMN "guide_texte" text;--> statement-breakpoint
ALTER TABLE "commandes_extras" ADD CONSTRAINT "commandes_extras_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commandes_extras" ADD CONSTRAINT "commandes_extras_reservation_id_reservations_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commandes_extras" ADD CONSTRAINT "commandes_extras_extra_id_extras_id_fk" FOREIGN KEY ("extra_id") REFERENCES "public"."extras"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "extras" ADD CONSTRAINT "extras_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "extras" ADD CONSTRAINT "extras_logement_id_logements_id_fk" FOREIGN KEY ("logement_id") REFERENCES "public"."logements"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "commandes_extras_tenant_ref_uq" ON "commandes_extras" USING btree ("tenant_id","ref");--> statement-breakpoint
CREATE INDEX "commandes_extras_tenant_reservation_idx" ON "commandes_extras" USING btree ("tenant_id","reservation_id","created_at");--> statement-breakpoint
CREATE INDEX "commandes_extras_tenant_statut_idx" ON "commandes_extras" USING btree ("tenant_id","statut");--> statement-breakpoint
CREATE UNIQUE INDEX "extras_tenant_code_uq" ON "extras" USING btree ("tenant_id","code");--> statement-breakpoint
CREATE INDEX "extras_tenant_actif_idx" ON "extras" USING btree ("tenant_id","actif");