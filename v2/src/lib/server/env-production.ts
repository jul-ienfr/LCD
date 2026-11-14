/**
 * Validation de l'environnement de production.
 *
 * Objectif : refuser un démarrage qui accepterait un secret de développement,
 * une URL non HTTPS ou une configuration e-mail incohérente. La validation est
 * pure (aucune lecture de `process.env` interne) pour être testable, puis
 * branchée dans `hooks.server.ts`.
 *
 * Elle ne s'active que si `NODE_ENV=production` **et** `APP_URL` est en HTTPS :
 * un build local (`node build`, `APP_URL=http://127.0.0.1`) n'est donc pas
 * bloqué, alors qu'un vrai déploiement l'est.
 */

export type NiveauConstat = "erreur" | "avertissement";

export interface ConstatEnvironnement {
  variable: string;
  niveau: NiveauConstat;
  message: string;
}

const SECRETS_DE_DEVELOPPEMENT = new Set([
  "dev-only-change-me-please-32chars-min",
  "change-me-with-openssl-rand-hex-32",
  "change-me-with-openssl-rand-hex-24",
  "change-me-app-role-hex-24",
  "ci-only-change-me-please-32chars-min",
  "ci-app-role-password-24-chars",
]);

const HOTES_SMTP_LOCAUX = ["localhost", "127.0.0.1", "mailpit", "mailhog"];

const estVide = (valeur: string | undefined): boolean =>
  !valeur || valeur.trim() === "";

const estSecretDeDeveloppement = (valeur: string | undefined): boolean =>
  !valeur || SECRETS_DE_DEVELOPPEMENT.has(valeur.trim());

const estHttps = (valeur: string | undefined): boolean =>
  (valeur ?? "").trim().toLowerCase().startsWith("https://");

const urlSmtpLocale = (valeur: string | undefined): boolean => {
  const brute = (valeur ?? "").toLowerCase();
  return HOTES_SMTP_LOCAUX.some(
    (hote) =>
      brute.includes(`@${hote}`) ||
      brute.includes(`//${hote}:`) ||
      brute.includes(`//${hote}/`),
  );
};

/**
 * Vrai si l'environnement doit être refusé au démarrage.
 * Une URL HTTPS en production est le signal d'un déploiement réel.
 */
export const doitValiderEnProduction = (
  env: Record<string, string | undefined>,
): boolean =>
  env.NODE_ENV === "production" && estHttps(env.APP_URL ?? env.BETTER_AUTH_URL);

/**
 * Retourne la liste des erreurs et avertissements. Une liste vide signifie
 * que la configuration est acceptable.
 */
export const validerEnvironnementProduction = (
  env: Record<string, string | undefined>,
): ConstatEnvironnement[] => {
  const constats: ConstatEnvironnement[] = [];

  const erreur = (variable: string, message: string): void => {
    constats.push({ variable, niveau: "erreur", message });
  };
  const avertir = (variable: string, message: string): void => {
    constats.push({ variable, niveau: "avertissement", message });
  };

  // URLs publiques
  if (!estHttps(env.APP_URL)) {
    erreur("APP_URL", "doit commencer par https:// en production.");
  }
  if (!estHttps(env.BETTER_AUTH_URL)) {
    erreur("BETTER_AUTH_URL", "doit commencer par https:// en production.");
  }
  if (
    !estVide(env.APP_URL) &&
    !estVide(env.BETTER_AUTH_URL) &&
    env.APP_URL !== env.BETTER_AUTH_URL
  ) {
    avertir(
      "BETTER_AUTH_URL",
      "diffère de APP_URL : vérifier les cookies et les redirections.",
    );
  }

  // Secrets d'authentification et d'exploitation
  if (estSecretDeDeveloppement(env.BETTER_AUTH_SECRET)) {
    erreur(
      "BETTER_AUTH_SECRET",
      "absent ou égal à un secret de développement ; générer openssl rand -hex 32.",
    );
  } else if ((env.BETTER_AUTH_SECRET ?? "").trim().length < 32) {
    erreur("BETTER_AUTH_SECRET", "doit contenir au moins 32 caractères.");
  }

  if (estSecretDeDeveloppement(env.CRON_SECRET)) {
    erreur(
      "CRON_SECRET",
      "absent ou égal à un secret de développement ; les crons seraient ouverts.",
    );
  } else if ((env.CRON_SECRET ?? "").trim().length < 32) {
    erreur("CRON_SECRET", "doit contenir au moins 32 caractères.");
  }

  if (estVide(env.BACKUP_ENCRYPTION_KEY)) {
    erreur(
      "BACKUP_ENCRYPTION_KEY",
      "absente : les sauvegardes ne seraient pas chiffrées.",
    );
  }

  if (estVide(env.SUIVI_HASH_SECRET)) {
    erreur(
      "SUIVI_HASH_SECRET",
      "absent : le journal de suivi utiliserait un repli non dédié.",
    );
  }

  // Base de données
  const urlBase = env.DATABASE_URL ?? "";
  if (estVide(urlBase)) {
    erreur("DATABASE_URL", "absente.");
  } else {
    if (urlBase.includes("change-me") || urlBase.includes(":lcd@")) {
      erreur(
        "DATABASE_URL",
        "contient un mot de passe de développement.",
      );
    }
    if (!urlBase.includes("lcd_app")) {
      avertir(
        "DATABASE_URL",
        "ne semble pas utiliser le rôle applicatif lcd_app : la RLS peut être contournée.",
      );
    }
  }

  if (estVide(env.MIGRATION_DATABASE_URL)) {
    avertir(
      "MIGRATION_DATABASE_URL",
      "absente : migrations et sauvegardes indisponibles depuis le runtime.",
    );
  }

  // Authentification
  if (!["true", "1"].includes((env.AUTH_2FA_REQUIRED ?? "").trim())) {
    erreur(
      "AUTH_2FA_REQUIRED",
      "doit être true en production pour les rôles staff.",
    );
  }

  // E-mail
  const emailActif = ["true", "1"].includes(
    (env.EMAIL_ENABLED ?? "").trim(),
  );
  if (emailActif) {
    if (estVide(env.SMTP_URL)) {
      erreur("SMTP_URL", "EMAIL_ENABLED=true mais SMTP_URL est vide.");
    } else if (urlSmtpLocale(env.SMTP_URL)) {
      erreur(
        "SMTP_URL",
        "pointe vers un serveur local (Mailpit/Mailhog) : aucun e-mail ne partirait.",
      );
    }
    if (estVide(env.EMAIL_FROM)) {
      erreur("EMAIL_FROM", "EMAIL_ENABLED=true mais EMAIL_FROM est vide.");
    } else if ((env.EMAIL_FROM ?? "").includes(".test")) {
      erreur(
        "EMAIL_FROM",
        "utilise un domaine de test ; utiliser le domaine vérifié SPF/DKIM.",
      );
    }
  } else {
    avertir(
      "EMAIL_ENABLED",
      "désactivé : aucun e-mail transactionnel ne sera envoyé.",
    );
  }

  // Comptes de démonstration
  if (!estVide(env.SEED_ADMIN_PASSWORD)) {
    avertir(
      "SEED_ADMIN_PASSWORD",
      "encore présent : le retirer après la première initialisation.",
    );
  }
  if (!estVide(env.SEED_DEMO_PASSWORD)) {
    erreur(
      "SEED_DEMO_PASSWORD",
      "un tenant de démonstration serait créé en production.",
    );
  }

  // Stockage
  if (
    estVide(env.STOCKAGE_LOCAL_DIR) ||
    (env.STOCKAGE_LOCAL_DIR ?? "").startsWith(".data")
  ) {
    erreur(
      "STOCKAGE_LOCAL_DIR",
      "doit pointer vers un volume persistant (ex. /var/lib/lcd/photos).",
    );
  }

  // Paiement
  if ((env.STRIPE_SECRET_KEY ?? "").startsWith("sk_test_")) {
    avertir(
      "STRIPE_SECRET_KEY",
      "clé de test en production : aucun paiement réel ne sera encaissé.",
    );
  }

  // Planificateur
  if (!["true", "1"].includes((env.ICS_SCHEDULER_ENABLED ?? "").trim())) {
    avertir(
      "ICS_SCHEDULER_ENABLED",
      "désactivé : prévoir un cron HTTP /api/cron/sync-ota unique.",
    );
  }

  return constats;
};

export const resumeConstats = (constats: ConstatEnvironnement[]): string =>
  constats
    .filter((constat) => constat.niveau === "erreur")
    .map((constat) => `- ${constat.variable} : ${constat.message}`)
    .join("\n");
