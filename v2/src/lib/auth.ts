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
import { env } from "@/lib/env";

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
  },
  user: {
    modelName: "users",
    additionalFields: {
      tenantId: {
        type: "string",
        required: true,
        input: true,
      },
      role: {
        type: "string",
        required: false,
        defaultValue: "operateur",
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
    },
  },
  plugins: [twoFactor(), nextCookies()],
});
