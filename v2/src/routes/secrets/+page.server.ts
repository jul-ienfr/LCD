import {
  compteParEtat,
  etatSecrets,
  type EtatSecret,
} from "@/domain/etats-secrets";
import { env } from "@/lib/env";
import { requireSuperAdmin } from "@/lib/server/session";
import type { PageServerLoad } from "./$types";

const LIBELLES: Record<EtatSecret, string> = {
  configure: "configuré",
  absent: "absent",
  defaut_local: "défaut local",
  alerte: "alerte",
};

export const load: PageServerLoad = async (event) => {
  requireSuperAdmin(event);

  const items = etatSecrets({
    betterAuthSecret: env.BETTER_AUTH_SECRET,
    auth2faRequis: env.AUTH_2FA_REQUIRED,
    migrationUrlConfiguree: Boolean(env.MIGRATION_DATABASE_URL),
    smtpUrl: env.SMTP_URL,
    emailActive: env.EMAIL_ENABLED,
    smsActive: env.SMS_ENABLED,
    brevoKeyConfiguree: Boolean(env.BREVO_API_KEY),
    stripeCleConfiguree: Boolean(env.STRIPE_SECRET_KEY),
    stripeWebhookConfigure: Boolean(env.STRIPE_WEBHOOK_SECRET),
    llmUrlConfiguree: Boolean(env.LLM_API_URL),
    llmCleConfiguree: Boolean(env.LLM_API_KEY),
    s3Endpoint: env.S3_ENDPOINT,
    s3CleConfiguree: Boolean(env.S3_ACCESS_KEY_ID),
    cronSecretConfigure: Boolean(env.CRON_SECRET),
    relanceAutoActivee: env.RELANCE_AUTO_ENABLED,
    sentryDsnConfigure: Boolean(env.SENTRY_DSN),
    boxRuntimeConfigure: Boolean(env.BOX_RUNTIME_CONFIG),
    superAdminEmails: env.SUPER_ADMIN_EMAILS,
  });
  const compte = compteParEtat(items);

  return {
    items: items.map((item) => ({
      ...item,
      libelle: LIBELLES[item.etat],
    })),
    compte: (Object.keys(compte) as EtatSecret[]).map((etat) => ({
      etat,
      libelle: LIBELLES[etat],
      nombre: compte[etat],
    })),
    alerteProduction: env.NODE_ENV === "production" && compte.alerte > 0,
    nombreAlertes: compte.alerte,
  };
};
