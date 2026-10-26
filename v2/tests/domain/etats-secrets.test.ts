import { describe, expect, it } from "vitest";
import {
  compteParEtat,
  etatSecrets,
  type ConfigSecrets,
} from "@/domain/etats-secrets";

function config(overrides: Partial<ConfigSecrets> = {}): ConfigSecrets {
  return {
    betterAuthSecret: "a".repeat(40),
    auth2faRequis: true,
    migrationUrlConfiguree: true,
    smtpUrl: "smtps://mail.lcd.test:465",
    emailActive: true,
    smsActive: false,
    brevoKeyConfiguree: false,
    stripeCleConfiguree: true,
    stripeWebhookConfigure: true,
    llmUrlConfiguree: true,
    llmCleConfiguree: true,
    s3Endpoint: "https://s3.lcd.test",
    s3CleConfiguree: true,
    cronSecretConfigure: true,
    relanceAutoActivee: false,
    sentryDsnConfigure: true,
    boxRuntimeConfigure: false,
    superAdminEmails: "owner@lcd.test",
    ...overrides,
  };
}

function etatDe(items: ReturnType<typeof etatSecrets>, cle: string) {
  return items.find((item) => item.cle === cle)?.etat;
}

describe("état des secrets", () => {
  it("signale un secret Better Auth de développement ou trop court", () => {
    const defaut = etatSecrets(
      config({ betterAuthSecret: "dev-only-change-me-please-32chars-min" }),
    );
    expect(etatDe(defaut, "BETTER_AUTH_SECRET")).toBe("alerte");

    const court = etatSecrets(config({ betterAuthSecret: "court" }));
    expect(etatDe(court, "BETTER_AUTH_SECRET")).toBe("alerte");

    const bon = etatSecrets(config());
    expect(etatDe(bon, "BETTER_AUTH_SECRET")).toBe("configure");
  });

  it("alerte sur la 2FA coupée et les SMS sans clé", () => {
    const items = etatSecrets(
      config({ auth2faRequis: false, smsActive: true }),
    );
    expect(etatDe(items, "AUTH_2FA_REQUIRED")).toBe("alerte");
    expect(etatDe(items, "BREVO_API_KEY")).toBe("alerte");
  });

  it("distingue les défauts locaux SMTP et S3", () => {
    const items = etatSecrets(
      config({
        smtpUrl: "smtp://127.0.0.1:1025",
        s3Endpoint: "http://localhost:9000",
      }),
    );
    expect(etatDe(items, "SMTP_URL")).toBe("defaut_local");
    expect(etatDe(items, "S3_ENDPOINT")).toBe("defaut_local");
  });

  it("ne divulgue jamais les valeurs et compte les états", () => {
    const items = etatSecrets(config({ migrationUrlConfiguree: false }));
    expect(JSON.stringify(items)).not.toContain("a".repeat(40));
    expect(JSON.stringify(items)).not.toContain("owner@lcd.test");
    const compte = compteParEtat(items);
    expect(compte.alerte).toBe(0);
    expect(compte.absent).toBeGreaterThan(0);
    expect(Object.values(compte).reduce((a, b) => a + b, 0)).toBe(items.length);
  });
});
