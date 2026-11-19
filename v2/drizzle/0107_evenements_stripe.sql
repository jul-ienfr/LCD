-- Spec 006, FR-024 — trace des événements Stripe.
-- Une ligne par événement reçu (`evt_...`), clé d'idempotence : un retry
-- Stripe ne crée jamais deux traces. L'événement normalisé (sans PII brute)
-- est conservé pour permettre le rejeu des échecs depuis /supervision.
-- Table plateforme (aucun tenant_id).
CREATE TABLE IF NOT EXISTS "evenements_stripe" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"evenement_id" text NOT NULL,
	"type" text NOT NULL,
	"objet_id" text,
	"statut" text NOT NULL DEFAULT 'recu',
	"evenement" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"erreur" text,
	"tentatives" integer DEFAULT 1 NOT NULL,
	"recu_le" timestamp with time zone DEFAULT now() NOT NULL,
	"derniere_tentative_le" timestamp with time zone DEFAULT now() NOT NULL,
	"traite_le" timestamp with time zone,
	"rejoue_le" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "evenements_stripe" ADD CONSTRAINT "evenements_stripe_evenement_objet" CHECK (jsonb_typeof("evenement") = 'object');--> statement-breakpoint
ALTER TABLE "evenements_stripe" ADD CONSTRAINT "evenements_stripe_statut_valide" CHECK ("statut" IN ('recu','traite','ignore','echec'));--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "evenements_stripe_evenement_id_uq" ON "evenements_stripe" USING btree ("evenement_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "evenements_stripe_statut_idx" ON "evenements_stripe" USING btree ("statut","recu_le");--> statement-breakpoint

-- Le rôle applicatif doit tracer les événements reçus par le webhook.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lcd_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON "evenements_stripe" TO lcd_app;
  END IF;
END $$;--> statement-breakpoint

-- Rétention : purge des traces au-delà de 180 jours (FR-015). Les échecs ne
-- sont jamais purgés automatiquement : ils attendent une décision humaine.
CREATE OR REPLACE FUNCTION purger_evenements_stripe(p_retention_jours integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  supprimees integer;
BEGIN
  DELETE FROM evenements_stripe
  WHERE recu_le < now() - make_interval(days => p_retention_jours)
    AND statut <> 'echec';
  GET DIAGNOSTICS supprimees = ROW_COUNT;
  RETURN supprimees;
END;
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION purger_evenements_stripe(integer) FROM public;--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lcd_app') THEN
    GRANT EXECUTE ON FUNCTION purger_evenements_stripe(integer) TO lcd_app;
  END IF;
END $$;
