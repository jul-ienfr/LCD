import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { sveltekitCookies } from "better-auth/svelte-kit";
import { twoFactor } from "better-auth/plugins";
import { eq } from "drizzle-orm";
import { getRequestEvent } from "$app/server";import { db } from "@/infrastructure/db/client";
import {
  account,
  session,
  twoFactor as twoFactorTable,
  verification,
} from "@/infrastructure/db/auth-schema";
import * as schema from "@/infrastructure/db/schema";
import { creerEmailSmtp } from "@/infrastructure/adapters/email-smtp";
import { env } from "@/lib/env";
import { marque } from "@/lib/branding";
import { logErreur } from "@/lib/logger";

const limiteConnexion = /localhost|127\.0\.0\.1/u.test(env.BETTER_AUTH_URL)
  ? 1_000
  : 100;

export const auth = betterAuth({
  appName: marque(),
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: [
    env.BETTER_AUTH_URL,
    ...(env.BETTER_AUTH_TRUSTED_ORIGINS?.split(",")
      .map((origine) => origine.trim())
      .filter(Boolean) ?? []),
    ...(env.NODE_ENV !== "production"
      ? [
          "http://localhost:5173",
          "http://127.0.0.1:5173",
          "http://localhost:4173",
          "http://127.0.0.1:4173",
          "http://localhost:3000",
          "http://127.0.0.1:3000",
        ]
      : []),
  ],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      ...schema,
      user: schema.users,
      session,
      account,
      verification,
      twoFactor: twoFactorTable,
    },
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: 12,
    resetPasswordTokenExpiresIn: 60 * 60,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      try {
        const lien = url.replaceAll("&", "&amp;");
        await creerEmailSmtp().envoyer({
          to: user.email,
          subject: "Réinitialisez votre mot de passe LCD",
          text: [
            `Bonjour ${user.name},`,
            "",
            "Pour choisir un nouveau mot de passe LCD, ouvrez ce lien (valable 1 heure) :",
            url,
            "",
            "Si vous n’êtes pas à l’origine de cette demande, ignorez cet e-mail.",
          ].join("\n"),
          html: [
            `<p>Bonjour ${user.name.replace(/[<>&"]/g, "")},</p>`,
            "<p>Pour choisir un nouveau mot de passe LCD, ouvrez ce lien (valable 1 heure) :</p>",
            `<p><a href="${lien}">Réinitialiser mon mot de passe</a></p>`,
            "<p>Si vous n’êtes pas à l’origine de cette demande, ignorez cet e-mail.</p>",
          ].join(""),
        });
      } catch (error) {
        logErreur("auth.resetPasswordEmail", error, { userId: user.id });
      }
    },
  },
  user: {
    modelName: "users",
    additionalFields: {
      tenantId: {
        type: "string",
        required: true,
        input: false,
      },
      role: {
        type: "string",
        required: false,
        defaultValue: "operateur",
        input: false,
      },
      actif: {
        type: "boolean",
        required: false,
        defaultValue: true,
        input: false,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const [utilisateur] = await db
            .select({ actif: schema.users.actif })
            .from(schema.users)
            .where(eq(schema.users.id, session.userId))
            .limit(1);
          if (!utilisateur || !utilisateur.actif) {
            throw new APIError("FORBIDDEN", {
              message: "Compte désactivé. Contactez un administrateur.",
            });
          }
        },
      },
    },
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 500,
    customRules: {
      "/sign-in/email": { window: 60, max: limiteConnexion },
      "/two-factor/*": { window: 60, max: limiteConnexion },
      "/request-password-reset": { window: 60, max: 5 },
      "/reset-password": { window: 60, max: 10 },
    },
  },
  plugins: [twoFactor(), sveltekitCookies(getRequestEvent)],
});
