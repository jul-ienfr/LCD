import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { twoFactor } from "better-auth/plugins";
import { eq } from "drizzle-orm";
import { db } from "@/infrastructure/db/client";
import {
  account,
  session,
  twoFactor as twoFactorTable,
  verification,
} from "@/infrastructure/db/auth-schema";
import * as schema from "@/infrastructure/db/schema";
import { creerEmailSmtp } from "@/infrastructure/adapters/email-smtp";
import { env } from "@/lib/env";
import { logErreur } from "@/lib/logger";

export const auth = betterAuth({
  appName: "LCD Parc",
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: [
    env.BETTER_AUTH_URL,
    ...(env.BETTER_AUTH_TRUSTED_ORIGINS?.split(",")
      .map((origine) => origine.trim())
      .filter(Boolean) ?? []),
    ...(env.NODE_ENV !== "production"
      ? ["http://localhost:3000", "http://127.0.0.1:3000"]
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
    // Les comptes sont créés par un admin depuis /hote/utilisateurs.
    // L'endpoint public Better Auth /sign-up/email reste fermé.
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
        // Jamais modifiable par le client : le tenant vient de la session et
        // les comptes sont créés directement par l'admin/le seed.
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
        // Un compte désactivé ne peut plus ouvrir de session, même avec un
        // mot de passe valide. Les sessions existantes sont supprimées par
        // l'action de désactivation.
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
  // Freine le brute-force sans bloquer les batteries E2E qui se connectent
  // plusieurs fois de suite depuis la même IP.
  rateLimit: {
    enabled: true,
    window: 60,
    max: 500,
    // La règle par défaut /sign-in/email est 3/10 s, trop stricte pour une
    // équipe qui se reconnecte et pour les batteries E2E. On garde un plafond
    // réel (100/min/IP) ; l'edge Caddy/Netlify peut durcir.
    customRules: {
      "/sign-in/email": { window: 60, max: 100 },
      "/two-factor/*": { window: 60, max: 100 },
      "/request-password-reset": { window: 60, max: 5 },
      "/reset-password": { window: 60, max: 10 },
    },
  },
  plugins: [twoFactor(), nextCookies()],
});
