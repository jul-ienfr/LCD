import { redirect } from "@sveltejs/kit";
import { withTenant } from "@/infrastructure/db/client";
import { auditLogs } from "@/infrastructure/db/schema";
import { effacerCookieApercu, lireApercu } from "@/lib/server/apercu";
import { requireSuperAdmin, tenantIdDeSession } from "@/lib/server/session";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async (event) => {
  const session = requireSuperAdmin(event);
  const tenantId = tenantIdDeSession(session);
  const apercu = lireApercu(event, session);

  effacerCookieApercu(event);

  if (apercu) {
    await withTenant(tenantId, (tx) =>
      tx.insert(auditLogs).values({
        tenantId,
        qui: session.user.email ?? session.user.id,
        action: "apercu.quitter",
        cible: apercu.role,
        ref: `apercu-${crypto.randomUUID()}`,
        payload: { role: apercu.role },
      }),
    );
  }

  redirect(303, "/supervision");
};
