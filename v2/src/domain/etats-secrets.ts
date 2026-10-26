/**
 * État des secrets et connecteurs, sans jamais exposer une valeur.
 * Le domaine reçoit des valeurs opérationnelles et n'en retourne que
 * l'état : configuré, absent, défaut local ou alerte d'exploitation.
 */

export interface ConfigSecrets {
  betterAuthSecret: string;
  auth2faRequis: boolean;
  migrationUrlConfiguree: boolean;
  smtpUrl: string;
  emailActive: boolean;
  smsActive: boolean;
  brevoKeyConfiguree: boolean;
  stripeCleConfiguree: boolean;
  stripeWebhookConfigure: boolean;
  llmUrlConfiguree: boolean;
  llmCleConfiguree: boolean;
  s3Endpoint: string;
  s3CleConfiguree: boolean;
  cronSecretConfigure: boolean;
  relanceAutoActivee: boolean;
  sentryDsnConfigure: boolean;
  boxRuntimeConfigure: boolean;
  superAdminEmails: string;
}

export type EtatSecret =
  | "configure"
  | "absent"
  | "defaut_local"
  | "alerte";

export interface ItemSecret {
  cle: string;
  etat: EtatSecret;
  note: string;
}

const DEFAUT_BETTER_AUTH = "dev-only-change-me-please-32chars-min";

export function etatSecrets(config: ConfigSecrets): ItemSecret[] {
  const items: ItemSecret[] = [];

  const secret = config.betterAuthSecret;
  if (secret === DEFAUT_BETTER_AUTH || secret.startsWith("dev-only")) {
    items.push({
      cle: "BETTER_AUTH_SECRET",
      etat: "alerte",
      note: "Secret de développement : à regénérer (≥ 32 caractères) avant toute exposition publique.",
    });
  } else if (secret.length < 32) {
    items.push({
      cle: "BETTER_AUTH_SECRET",
      etat: "alerte",
      note: `Secret trop court (${secret.length} caractères, 32 requis).`,
    });
  } else {
    items.push({
      cle: "BETTER_AUTH_SECRET",
      etat: "configure",
      note: `${secret.length} caractères.`,
    });
  }

  items.push({
    cle: "MIGRATION_DATABASE_URL",
    etat: config.migrationUrlConfiguree ? "configure" : "absent",
    note: config.migrationUrlConfiguree
      ? "Connexion owner réservée aux migrations et à la supervision."
      : "Migrations et supervision cross-tenant indisponibles.",
  });

  if (!config.auth2faRequis) {
    items.push({
      cle: "AUTH_2FA_REQUIRED",
      etat: config.auth2faRequis ? "configure" : "alerte",
      note: "2FA facultative : à activer (true) en production.",
    });
  } else {
    items.push({
      cle: "AUTH_2FA_REQUIRED",
      etat: "configure",
      note: "TOTP imposé aux rôles staff.",
    });
  }

  const smtpLocal = config.smtpUrl.includes("127.0.0.1") ||
    config.smtpUrl.includes("localhost");
  items.push({
    cle: "SMTP_URL",
    etat: !config.emailActive
      ? "absent"
      : smtpLocal
        ? "defaut_local"
        : "configure",
    note: !config.emailActive
      ? "Emails coupés."
      : smtpLocal
        ? "Serveur local (Mailpit) : à remplacer par un relais distant en prod."
        : "Relais SMTP distant configuré.",
  });

  items.push({
    cle: "BREVO_API_KEY",
    etat: !config.smsActive
      ? "absent"
      : config.brevoKeyConfiguree
        ? "configure"
        : "alerte",
    note: !config.smsActive
      ? "SMS désactivés."
      : config.brevoKeyConfiguree
        ? "SMS Brevo activés."
        : "SMS activés sans clé Brevo : l'envoi échouera.",
  });

  items.push({
    cle: "STRIPE_SECRET_KEY",
    etat: config.stripeCleConfiguree ? "configure" : "absent",
    note: config.stripeCleConfiguree
      ? "Paiements Stripe utilisables."
      : "Paiements en ligne inactifs.",
  });
  items.push({
    cle: "STRIPE_WEBHOOK_SECRET",
    etat: config.stripeWebhookConfigure ? "configure" : "absent",
    note: config.stripeWebhookConfigure
      ? "Webhook vérifié par signature."
      : "Webhook Stripe non vérifiable.",
  });

  items.push({
    cle: "LLM_API_URL",
    etat: config.llmUrlConfiguree
      ? config.llmCleConfiguree
        ? "configure"
        : "alerte"
      : "absent",
    note: config.llmUrlConfiguree
      ? config.llmCleConfiguree
        ? "Assistant distant actif (repli local garanti)."
        : "Endpoint LLM sans clé : vérifier la configuration."
      : "Assistant en mode local.",
  });

  items.push({
    cle: "S3_ENDPOINT",
    etat: !config.s3CleConfiguree
      ? "absent"
      : config.s3Endpoint.includes("127.0.0.1") ||
          config.s3Endpoint.includes("localhost")
        ? "defaut_local"
        : "configure",
    note: !config.s3CleConfiguree
      ? "Fichiers non stockés."
      : config.s3Endpoint.includes("127.0.0.1") ||
          config.s3Endpoint.includes("localhost")
        ? "Bucket local : à basculer vers un S3 distant en prod."
        : "Bucket distant configuré.",
  });

  items.push({
    cle: "CRON_SECRET",
    etat: config.cronSecretConfigure ? "configure" : "absent",
    note: config.cronSecretConfigure
      ? "Tâches planifiées authentifiées."
      : "Crons HTTP non authentifiés.",
  });
  items.push({
    cle: "RELANCE_AUTO_ENABLED",
    etat: config.relanceAutoActivee ? "configure" : "absent",
    note: config.relanceAutoActivee
      ? "Relances automatiques quotidiennes actives."
      : "Relances manuelles uniquement.",
  });
  items.push({
    cle: "SENTRY_DSN",
    etat: config.sentryDsnConfigure ? "configure" : "absent",
    note: config.sentryDsnConfigure
      ? "Erreurs remontées à Sentry."
      : "Aucun reporting d'erreurs distant.",
  });
  items.push({
    cle: "BOX_RUNTIME_CONFIG",
    etat: config.boxRuntimeConfigure ? "configure" : "absent",
    note: config.boxRuntimeConfigure
      ? "Connecteurs box configurés."
      : "Pile logicielle seule.",
  });
  items.push({
    cle: "SUPER_ADMIN_EMAILS",
    etat: config.superAdminEmails.trim() ? "configure" : "absent",
    note: config.superAdminEmails.trim()
      ? "Allowlist d'exploitation active."
      : "Seul le rôle `super_admin` ouvre la supervision.",
  });

  return items;
}

export function compteParEtat(items: ItemSecret[]): Record<EtatSecret, number> {
  const compte: Record<EtatSecret, number> = {
    configure: 0,
    absent: 0,
    defaut_local: 0,
    alerte: 0,
  };
  for (const item of items) compte[item.etat] += 1;
  return compte;
}
