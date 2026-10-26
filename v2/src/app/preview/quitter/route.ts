import { redirect } from "next/navigation";
import { withTenant } from "@/infrastructure/db/client";
import { auditLogs } from "@/infrastructure/db/schema";
import { effacerCookieApercu, lireApercu } from "@/lib/apercu";
import { requireSession, tenantIdDeSession } from "@/lib/session";

export async function POST() {
  const session = await requireSession();
  const tenantId = tenantIdDeSession(session);
  const apercu = await lireApercu(session);
  if (apercu) {
    await withTenant(tenantId, (tx) =>
      tx.insert(auditLogs).values({
        tenantId,
        qui: session.user.email ?? apercu.email,
        action: "apercu.arreter",
        cible: apercu.role,
        payload: { role: apercu.role, email_reel: apercu.email },
      }),
    );
  }
  await effacerCookieApercu();
  redirect("/supervision");
}
