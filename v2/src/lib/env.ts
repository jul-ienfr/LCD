import { z } from "zod";

const databaseUrl =
  process.env.DATABASE_URL?.trim() ||
  process.env.NETLIFY_DB_URL?.trim() ||
  "postgres://lcd:lcd@127.0.0.1:5432/lcd";

const schema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  APP_URL: z.string().default("http://localhost:5173"),

  DATABASE_URL: z.string().min(1).default(databaseUrl),
  // Connexion owner : migrations, seed et sauvegardes uniquement.
  MIGRATION_DATABASE_URL: z.string().optional(),

  BETTER_AUTH_SECRET: z
    .string()
    .min(32)
    .default("dev-only-change-me-please-32chars-min"),
  BETTER_AUTH_URL: z.string().default("http://localhost:5173"),
  BETTER_AUTH_TRUSTED_ORIGINS: z.string().optional(),
  // Obligation de TOTP pour les rôles staff (admin, hôte, comptable,
  // opérateur). Désactivée par défaut pour ne pas bloquer le local ; à mettre
  // à true en production.
  AUTH_2FA_REQUIRED: z
    .string()
    .default("false")
    .transform((v) => v === "true" || v === "1"),
  // Emails (séparés par des virgules) traités comme super-admin sans
  // modification en base. Réservé à l'exploitation ; jamais exposé au client.
  SUPER_ADMIN_EMAILS: z.string().default(""),

  // Médiation de la consommation (obligation LCEN / code de la consommation).
  // Le nom est le seul champ requis ; l'URL et l'adresse sont affichées si
  // fournies. Un nom vide signifie « médiateur non désigné ».
  MEDIATEUR_NOM: z.string().default(""),
  MEDIATEUR_URL: z.string().default(""),
  MEDIATEUR_ADRESSE: z.string().default(""),

  // CAPTCHA auto-hébergé du login (aucun service externe, aucun traceur).
  // `progressif` : défi après CAPTCHA_SEUIL échecs dans la fenêtre.
  // `toujours` : défi dès le premier affichage. `off` : désactivé.
  CAPTCHA_MODE: z
    .enum(["off", "progressif", "toujours"])
    .default("progressif"),
  CAPTCHA_SEUIL: z.coerce.number().int().min(1).max(20).default(3),
  CAPTCHA_FENETRE_MINUTES: z.coerce.number().int().min(1).max(1_440).default(15),

  // Stockage S3-compatible : R2, MinIO, OVH, Scaleway.
  STOCKAGE_LOCAL_DIR: z.string().default(".data/photos"),
  S3_ENDPOINT: z.string().default("http://127.0.0.1:9000"),
  S3_REGION: z.string().default("auto"),
  S3_BUCKET: z.string().default("lcd"),
  S3_ACCESS_KEY_ID: z.string().default("minio"),
  S3_SECRET_ACCESS_KEY: z.string().default("minio12345"),

  // Supervision : seuils d'alerte lus par /supervision et le heartbeat box.
  ALERTE_DISQUE_GO: z.coerce.number().min(0).default(2),
  ALERTE_TLS_JOURS: z.coerce.number().int().min(1).max(365).default(14),
  BOX_HEARTBEAT_MAX_MINUTES: z.coerce.number().int().min(1).default(15),
  BOX_TOKEN: z.string().default(""),
  HEALTH_TOKEN: z.string().default(""),

  S3_FORCE_PATH_STYLE: z
    .string()
    .default("true")
    .transform((v) => v === "true"),

  // Email transactionnel.
  EMAIL_ENABLED: z
    .string()
    .default("true")
    .transform((v) => v === "true" || v === "1"),
  EMAIL_FROM: z.string().default("LCD <no-reply@lcd.test>"),
  SMTP_URL: z.string().default("smtp://127.0.0.1:1025"),
  // Entrée e-mail T307 : webhook signé, adresse reponses+<slug>@domaine.
  EMAIL_WEBHOOK_SECRET: z.string().optional(),
  EMAIL_INBOUND_DOMAIN: z.string().optional(),

  // SMS transactionnels (Brevo), désactivés par défaut.
  SMS_ENABLED: z
    .string()
    .default("false")
    .transform((v) => v === "true" || v === "1"),
  BREVO_API_KEY: z.string().optional(),
  BREVO_SMS_SENDER: z.string().default("LCD"),

  // WhatsApp Business Cloud (Meta), désactivé par défaut.
  WHATSAPP_ENABLED: z
    .string()
    .default("false")
    .transform((v) => v === "true" || v === "1"),
  WHATSAPP_API_TOKEN: z.string().optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
  WHATSAPP_API_VERSION: z.string().default("v21.0"),

  // Sel de hachage des IP du journal de suivi (facultatif : BETTER_AUTH_SECRET
  // sert de repli). Aucune IP en clair n'est stockée.
  SUIVI_HASH_SECRET: z.string().optional(),

  // Paiement (facultatif au démarrage).
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // Assistant LLM (facultatif) : endpoint OpenAI-compatible.
  LLM_API_URL: z.string().url().optional(),
  LLM_API_KEY: z.string().optional(),
  LLM_MODEL: z.string().default("gpt-4o-mini"),
  LLM_MODEL_PREMIUM: z.string().optional(),
  // Traduction à la demande dans les fils (optionnelle, désactivée par défaut).
  TRADUCTION_ENABLED: z
    .string()
    .default("false")
    .transform((v) => v === "true" || v === "1"),

  // Tâches planifiées (cron OTA, backups déclenchés par HTTP).
  CRON_SECRET: z.string().optional(),

  // Canal d'alerte d'exploitation (spec 006, T-11) : email SMTP existant.
  // Vide = pas de notification sortante ; l'alerte reste dans la table et
  // /supervision la montre, et FR-012 la signale comme brique manquante.
  ALERTE_EMAIL: z.string().default(""),
  // Délai anti-tempête entre deux notifications d'une même alerte.
  ALERTE_NOTIFICATION_DELAI_MINUTES: z.coerce
    .number()
    .int()
    .min(5)
    .max(10_080)
    .default(360),
  // Sonde d'absence des tâches planifiées : activée par défaut, cadence
  // bornée. Elle ne notifie que si ALERTE_EMAIL est configuré.
  VERIF_TACHES_ENABLED: z
    .string()
    .default("true")
    .transform((v) => v === "true" || v === "1"),
  VERIF_TACHES_INTERVALLE_MINUTES: z.coerce
    .number()
    .int()
    .min(5)
    .max(1_440)
    .default(30),

  // Synchronisation ICS automatique. Le planificateur in-process nécessite
  // ICS_SCHEDULER_ENABLED=true sur un serveur persistant ; il reste désactivé
  // sur les plateformes serverless où il ne survivrait pas.
  ICS_SCHEDULER_ENABLED: z.string().optional(),
  ICS_SYNC_INTERVAL_MINUTES: z.coerce
    .number()
    .int()
    .min(1)
    .max(1_440)
    .default(5),
  ICS_SYNC_CONCURRENCE: z.coerce.number().int().min(1).max(16).default(4),
  ICS_SYNC_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .min(1_000)
    .max(60_000)
    .default(12_000),
  ICS_SYNC_TICK_SECONDS: z.coerce.number().int().min(10).max(300).default(30),
  ICS_SYNC_MAX_FLUX_PAR_CYCLE: z.coerce
    .number()
    .int()
    .min(1)
    .max(1_000)
    .default(100),
  ICS_SYNC_LEASE_MINUTES: z.coerce
    .number()
    .int()
    .min(1)
    .max(60)
    .default(10),

  // Synchronisation des fournisseurs channel manager. Désactivée par défaut :
  // le cron HTTP /api/cron/sync-fournisseurs reste disponible.
  FOURNISSEUR_SYNC_ENABLED: z.string().optional(),
  FOURNISSEUR_SYNC_INTERVAL_MINUTES: z.coerce
    .number()
    .int()
    .min(1)
    .max(1_440)
    .default(15),
  FOURNISSEUR_SYNC_TICK_SECONDS: z.coerce
    .number()
    .int()
    .min(10)
    .max(900)
    .default(300),
  FOURNISSEUR_SYNC_CONCURRENCE: z.coerce
    .number()
    .int()
    .min(1)
    .max(8)
    .default(2),
  FOURNISSEUR_SYNC_MAX_LOGEMENTS: z.coerce
    .number()
    .int()
    .min(1)
    .max(5_000)
    .default(200),
  FOURNISSEUR_SYNC_LEASE_MINUTES: z.coerce
    .number()
    .int()
    .min(1)
    .max(60)
    .default(10),
  FOURNISSEUR_SYNC_HORIZON_JOURS: z.coerce
    .number()
    .int()
    .min(1)
    .max(730)
    .default(365),
  FOURNISSEUR_SYNC_PAST_DAYS: z.coerce
    .number()
    .int()
    .min(1)
    .max(730)
    .default(365),
  // Quotas serrés : Host Port 500 appels/jour/connexion, Nobeds écrit
  // une disponibilité par appel. On espace leurs cycles automatiques.
  FOURNISSEUR_HOSTPORT_INTERVAL_MINUTES: z.coerce
    .number()
    .int()
    .min(1)
    .max(1440)
    .default(60),
  FOURNISSEUR_NOBEDS_INTERVAL_MINUTES: z.coerce
    .number()
    .int()
    .min(1)
    .max(1440)
    .default(240),
  FOURNISSEUR_WEBHOOK_MAX_LOGEMENTS: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(20),

  // Relances automatiques quotidiennes : désactivées par défaut.
  RELANCE_AUTO_ENABLED: z
    .string()
    .default("false")
    .transform((v) => v === "true" || v === "1"),

  // Formulaire de demande de séjour (enquiry) sur le site public. Désactivé
  // par défaut : sans le flag, le formulaire n'apparaît pas et l'action
  // refuse toute soumission.
  ENQUIRY_ENABLED: z
    .string()
    .default("false")
    .transform((v) => v === "true" || v === "1"),

  // Messages automatiques de séjour (J-7, J-1, arrivée, départ, J+1).
  // Désactivés par défaut : le planificateur ne prépare que des brouillons,
  // et rien n'est envoyé sans validation humaine.
  MESSAGES_AUTO_ENABLED: z
    .string()
    .default("false")
    .transform((v) => v === "true" || v === "1"),

  // Rétention du journal d'audit (purge manuelle, jamais automatique).
  AUDIT_RETENTION_JOURS: z.coerce
    .number()
    .int()
    .min(365)
    .max(36_500)
    .default(1825),

  // Fournisseurs channel manager. Les clés restent côté serveur ; le
  // super-admin active le fournisseur, il ne saisit jamais de secret en clair.
  BEDS24_API_TOKEN: z.string().optional(),
  BEDS24_REFRESH_TOKEN: z.string().optional(),
  BEDS24_API_BASE: z.string().url().default("https://api.beds24.com/v2"),
  BEDS24_WEBHOOK_SECRET: z.string().optional(),
  CHANNEX_API_KEY: z.string().optional(),
  CHANNEX_API_BASE: z.string().url().default("https://app.channex.io/api/v1"),
  CHANNEX_WEBHOOK_SECRET: z.string().optional(),
  SMOOBU_API_KEY: z.string().optional(),
  SMOOBU_API_SECRET: z.string().optional(),
  SMOOBU_API_BASE: z.string().url().default("https://login.smoobu.com/api"),
  SMOOBU_WEBHOOK_SECRET: z.string().optional(),
  HOSTPORT_API_KEY: z.string().optional(),
  HOSTPORT_API_BASE: z
    .string()
    .url()
    .default(
      "https://ntnzabbhtivotmfhwdnm.supabase.co/functions/v1/data-api/v1",
    ),
  HOSTPORT_WEBHOOK_SECRET: z.string().optional(),
  NOBEDS_API_TOKEN: z.string().optional(),
  NOBEDS_API_BASE: z.string().url().default("https://api.nobeds.com"),
  NOBEDS_WEBHOOK_SECRET: z.string().optional(),

  // Revenu management : PriceLabs en partenaire, recommandation locale sinon.
  PRICELABS_API_KEY: z.string().optional(),
  PRICELABS_API_BASE: z.string().url().default("https://api.pricelabs.co/v1"),
  // Import quotidien des recommandations de prix : désactivé par défaut.
  // Même actif, rien ne s'applique sans décision humaine.
  PRICING_IMPORT_ENABLED: z
    .string()
    .default("false")
    .transform((v) => v === "true" || v === "1"),
  FOURNISSEUR_HTTP_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .min(1_000)
    .max(60_000)
    .default(12_000),
  // Disjoncteur fournisseur (FR-023/FR-014) : nombre d'échecs consécutifs
  // avant mise en pause automatique, réglable sans redéploiement.
  FOURNISSEUR_DISJONCTEUR_SEUIL: z.coerce
    .number()
    .int()
    .min(1)
    .max(50)
    .default(5),

  // Serrures connectées : Nuki Web API. Sans token, l'adapter se déclare
  // indisponible et le repli manuel (T607) prend le relais à sa place.
  NUKI_API_TOKEN: z.string().optional(),
  NUKI_API_BASE: z.string().url().default("https://api.nuki.io"),

  // Connecteurs runtime box (Home Assistant / Moli / générique).
  BOX_RUNTIME_CONFIG: z.string().optional(),

  // Observabilité (facultatif).
  SENTRY_DSN: z.string().optional(),
  SENTRY_ENVIRONMENT: z.string().optional(),
  METRICS_TOKEN: z.string().optional(),
});

export type Env = z.infer<typeof schema>;

function chargerEnv(): Env {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Configuration invalide :\n${details}`);
  }

  if (
    parsed.data.NODE_ENV === "production" &&
    !process.env.DATABASE_URL?.trim() &&
    !process.env.NETLIFY_DB_URL?.trim()
  ) {
    throw new Error(
      "DATABASE_URL est obligatoire en production : utilisez le rôle applicatif (lcd_app), jamais le rôle owner.",
    );
  }

  if (
    parsed.data.NODE_ENV === "production" &&
    parsed.data.BETTER_AUTH_SECRET ===
      "dev-only-change-me-please-32chars-min"
  ) {
    throw new Error("BETTER_AUTH_SECRET doit être changé en production.");
  }

  return parsed.data;
}

export const env = chargerEnv();
