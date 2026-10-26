import { z } from "zod";

const databaseUrl =
  process.env.DATABASE_URL?.trim() ||
  process.env.NETLIFY_DB_URL?.trim() ||
  "postgres://lcd:lcd@127.0.0.1:5432/lcd";

const schema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  APP_URL: z.string().default("http://localhost:3000"),

  DATABASE_URL: z.string().min(1).default(databaseUrl),
  // Connexion owner : migrations, seed et sauvegardes uniquement.
  MIGRATION_DATABASE_URL: z.string().optional(),

  BETTER_AUTH_SECRET: z
    .string()
    .min(32)
    .default("dev-only-change-me-please-32chars-min"),
  BETTER_AUTH_URL: z.string().default("http://localhost:3000"),
  BETTER_AUTH_TRUSTED_ORIGINS: z.string().optional(),

  // Stockage S3-compatible : R2, MinIO, OVH, Scaleway.
  S3_ENDPOINT: z.string().default("http://127.0.0.1:9000"),
  S3_REGION: z.string().default("auto"),
  S3_BUCKET: z.string().default("lcd"),
  S3_ACCESS_KEY_ID: z.string().default("minio"),
  S3_SECRET_ACCESS_KEY: z.string().default("minio12345"),
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

  // Paiement (facultatif au démarrage).
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // Assistant LLM (facultatif) : endpoint OpenAI-compatible.
  LLM_API_URL: z.string().url().optional(),
  LLM_API_KEY: z.string().optional(),
  LLM_MODEL: z.string().default("gpt-4o-mini"),
  LLM_MODEL_PREMIUM: z.string().optional(),

  // Tâches planifiées (cron OTA, backups déclenchés par HTTP).
  CRON_SECRET: z.string().optional(),

  // Rétention du journal d'audit (purge manuelle, jamais automatique).
  AUDIT_RETENTION_JOURS: z.coerce
    .number()
    .int()
    .min(365)
    .max(36_500)
    .default(1825),

  // Connecteurs runtime box (Home Assistant / Moli / générique).
  BOX_RUNTIME_CONFIG: z.string().optional(),

  // Observabilité (facultatif).
  SENTRY_DSN: z.string().optional(),
  SENTRY_ENVIRONMENT: z.string().optional(),
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
    parsed.data.BETTER_AUTH_SECRET ===
      "dev-only-change-me-please-32chars-min"
  ) {
    throw new Error("BETTER_AUTH_SECRET doit être changé en production.");
  }

  return parsed.data;
}

export const env = chargerEnv();
