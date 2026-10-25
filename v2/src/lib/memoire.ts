import { createHmac } from "node:crypto";
import { env } from "./env";

/** Empreinte non réversible : l'email en clair n'est jamais stocké. */
export function hashEmail(email: string): string {
  return createHmac("sha256", env.BETTER_AUTH_SECRET)
    .update(email.trim().toLowerCase())
    .digest("hex");
}
