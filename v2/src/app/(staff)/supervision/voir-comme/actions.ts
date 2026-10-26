"use server";

import { redirect } from "next/navigation";
import { roleApercuValide } from "@/domain/apercu";
import { poserCookieApercu } from "@/lib/apercu";
import { requireSuperAdmin, tenantIdDeSession } from "@/lib/session";
import { withTenant } from "@/infrastructure/db/client";
import { auditLogs } from "@/infrastructure/db/schema";

export async function demarrerApercuAction(formData: FormData) {
  const session = await requireSuperAdmin();
  const tenantId = tenantIdDeSession(session);
  const role = String(formData.get("role") ?? "");
  if (!roleApercuValide(role)) {
    redirect("/supervision/voir-comme?erreur=role");
  }
  const email = session.user.email;
  if (!email) {
    redirect("/supervision/voir-comme?erreur=email");
  }

  await poserCookieApercu(email, role);
  await withTenant(tenantId, (tx) =>
    tx.insert(auditLogs).values({
      tenantId,
      qui: email,
      action: "apercu.demarrer",
      cible: role,
      payload: { role, email_reel: email },
    }),
  );

  redirect("/hote");
}
