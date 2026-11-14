import { describe, expect, it } from "vitest";
import {
  doitValiderEnProduction,
  resumeConstats,
  validerEnvironnementProduction,
} from "@/lib/server/env-production";

const secret32 = "a".repeat(64);

/** Environnement de production minimal mais complet et valide. */
const envValide = (): Record<string, string | undefined> => ({
  NODE_ENV: "production",
  APP_URL: "https://lcd.example.fr",
  BETTER_AUTH_URL: "https://lcd.example.fr",
  BETTER_AUTH_SECRET: secret32,
  CRON_SECRET: secret32,
  BACKUP_ENCRYPTION_KEY: "c".repeat(44),
  SUIVI_HASH_SECRET: secret32,
  DATABASE_URL: `postgres://lcd_app:${"b".repeat(48)}@postgres:5432/lcd`,
  MIGRATION_DATABASE_URL: `postgres://lcd:${"b".repeat(48)}@postgres:5432/lcd`,
  AUTH_2FA_REQUIRED: "true",
  EMAIL_ENABLED: "true",
  EMAIL_FROM: "LCD <no-reply@lcd.example.fr>",
  SMTP_URL: "smtp://smtp.brevo.com:587",
  STOCKAGE_LOCAL_DIR: "/var/lib/lcd/photos",
  ICS_SCHEDULER_ENABLED: "true",
});

const erreurs = (env: Record<string, string | undefined>): string[] =>
  validerEnvironnementProduction(env)
    .filter((constat) => constat.niveau === "erreur")
    .map((constat) => constat.variable);

describe("validation de l'environnement de production (T021)", () => {
  it("accepte une configuration de production complète", () => {
    expect(erreurs(envValide())).toEqual([]);
  });

  it("ne signale qu'un avertissement quand les e-mails sont désactivés", () => {
    const env = envValide();
    env.EMAIL_ENABLED = "false";
    env.SMTP_URL = "";
    env.EMAIL_FROM = "";

    const constats = validerEnvironnementProduction(env);
    expect(constats.filter((c) => c.niveau === "erreur")).toEqual([]);
    expect(constats.map((c) => c.variable)).toContain("EMAIL_ENABLED");
  });

  it("refuse une URL publique non HTTPS", () => {
    const env = envValide();
    env.APP_URL = "http://lcd.example.fr";
    expect(erreurs(env)).toContain("APP_URL");
  });

  it("refuse un secret d'authentification de développement", () => {
    const env = envValide();
    env.BETTER_AUTH_SECRET = "dev-only-change-me-please-32chars-min";
    expect(erreurs(env)).toContain("BETTER_AUTH_SECRET");
  });

  it("refuse un CRON_SECRET de développement ou trop court", () => {
    const envDev = envValide();
    envDev.CRON_SECRET = "ci-only-change-me-please-32chars-min";
    expect(erreurs(envDev)).toContain("CRON_SECRET");

    const envCourt = envValide();
    envCourt.CRON_SECRET = "court";
    expect(erreurs(envCourt)).toContain("CRON_SECRET");
  });

  it("refuse un mot de passe de base de développement", () => {
    const env = envValide();
    env.DATABASE_URL = "postgres://lcd_app:change-me-app-role-hex-24@postgres:5432/lcd";
    expect(erreurs(env)).toContain("DATABASE_URL");
  });

  it("refuse un SMTP local alors que les e-mails sont activés", () => {
    const env = envValide();
    env.EMAIL_ENABLED = "true";
    env.SMTP_URL = "smtp://mailpit:1025";
    expect(erreurs(env)).toContain("SMTP_URL");
  });

  it("refuse une adresse d'expédition sur un domaine de test", () => {
    const env = envValide();
    env.EMAIL_FROM = "LCD <no-reply@lcd.test>";
    expect(erreurs(env)).toContain("EMAIL_FROM");
  });

  it("refuse un tenant de démonstration en production", () => {
    const env = envValide();
    env.SEED_DEMO_PASSWORD = "demo-demo-demo";
    expect(erreurs(env)).toContain("SEED_DEMO_PASSWORD");
  });

  it("refuse un stockage non persistant", () => {
    const env = envValide();
    env.STOCKAGE_LOCAL_DIR = ".data/photos";
    expect(erreurs(env)).toContain("STOCKAGE_LOCAL_DIR");
  });

  it("refuse la 2FA désactivée et les secrets de sauvegarde absents", () => {
    const env = envValide();
    env.AUTH_2FA_REQUIRED = "false";
    env.BACKUP_ENCRYPTION_KEY = "";
    env.SUIVI_HASH_SECRET = "";
    const variables = erreurs(env);
    expect(variables).toContain("AUTH_2FA_REQUIRED");
    expect(variables).toContain("BACKUP_ENCRYPTION_KEY");
    expect(variables).toContain("SUIVI_HASH_SECRET");
  });

  it("avertit sans bloquer sur les écarts non critiques", () => {
    const env = envValide();
    env.BETTER_AUTH_URL = "https://www.lcd.example.fr";
    env.DATABASE_URL = `postgres://lcd:${"b".repeat(48)}@postgres:5432/lcd`;
    env.STRIPE_SECRET_KEY = "sk_test_123";
    env.SEED_ADMIN_PASSWORD = "change-me-with-at-least-12-chars";

    const constats = validerEnvironnementProduction(env);
    expect(constats.filter((c) => c.niveau === "erreur")).toEqual([]);
    const variables = constats.map((c) => c.variable);
    expect(variables).toContain("BETTER_AUTH_URL");
    expect(variables).toContain("DATABASE_URL");
    expect(variables).toContain("STRIPE_SECRET_KEY");
    expect(variables).toContain("SEED_ADMIN_PASSWORD");
  });

  it("resumeConstats ne liste que les erreurs", () => {
    const env = envValide();
    env.APP_URL = "http://localhost:3000";
    env.BETTER_AUTH_URL = "https://www.lcd.example.fr";
    const resume = resumeConstats(validerEnvironnementProduction(env));
    expect(resume).toContain("APP_URL");
    expect(resume).not.toContain("BETTER_AUTH_URL");
  });
});

describe("déclenchement de la validation (T021)", () => {
  it("ne valide pas un build local en HTTP", () => {
    expect(
      doitValiderEnProduction({
        NODE_ENV: "production",
        APP_URL: "http://127.0.0.1",
      }),
    ).toBe(false);
  });

  it("ne valide pas en développement même avec HTTPS", () => {
    expect(
      doitValiderEnProduction({
        NODE_ENV: "development",
        APP_URL: "https://lcd.example.fr",
      }),
    ).toBe(false);
  });

  it("valide un déploiement réel en HTTPS", () => {
    expect(
      doitValiderEnProduction({
        NODE_ENV: "production",
        APP_URL: "https://lcd.example.fr",
      }),
    ).toBe(true);
  });

  it("se rabat sur BETTER_AUTH_URL si APP_URL est absente", () => {
    expect(
      doitValiderEnProduction({
        NODE_ENV: "production",
        BETTER_AUTH_URL: "https://lcd.example.fr",
      }),
    ).toBe(true);
  });
});
