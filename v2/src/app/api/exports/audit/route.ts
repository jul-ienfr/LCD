import { connection } from "next/server";
import {
  depuisJours,
  familleAuditValide,
  JOURS_AUDIT_DEFAUT,
  joursAuditValide,
} from "@/domain/audit";
import type { AuditEntry } from "@/application/ports/audit-repository";
import { DrizzleAuditRepository } from "@/infrastructure/db/repositories/audit-repository";
import { celluleCsv } from "@/lib/csv";
import { getSession, tenantIdDeSession } from "@/lib/session";

const PAGE_HISTORIQUE = 100;
const LIGNES_MAX = 5000;

export async function GET(request: Request) {
  await connection();

  const session = await getSession();
  if (!session || session.user.actif === false) {
    return new Response("Non autorisé", { status: 401 });
  }
  if (session.user.role !== "admin") {
    return new Response("Accès refusé", { status: 403 });
  }

  const url = new URL(request.url);
  const joursDemandes = Number.parseInt(url.searchParams.get("jours") ?? "", 10);
  const jours = joursAuditValide(joursDemandes)
    ? joursDemandes
    : JOURS_AUDIT_DEFAUT;
  const familleParam = url.searchParams.get("famille") ?? "";
  const famille =
    familleParam && familleAuditValide(familleParam) ? familleParam : null;
  const recherche = (url.searchParams.get("q") ?? "").trim().slice(0, 100);

  const tenantId = tenantIdDeSession(session);
  const repo = new DrizzleAuditRepository();
  const criteres = {
    recherche: recherche || undefined,
    depuis: depuisJours(jours),
    prefixe: famille ?? undefined,
  };

  const entrees: AuditEntry[] = [];
  for (let page = 0; entrees.length < LIGNES_MAX; page += 1) {
    const lot = await repo.lister(tenantId, {
      limite: PAGE_HISTORIQUE,
      decalage: page * PAGE_HISTORIQUE,
      ...criteres,
    });
    entrees.push(...lot);
    if (lot.length < PAGE_HISTORIQUE) break;
  }

  const lignes = [
    ["date_iso", "auteur", "action", "cible", "reference", "details_json"],
    ...entrees.slice(0, LIGNES_MAX).map((entree) => [
      entree.createdAt.toISOString(),
      entree.qui,
      entree.action,
      entree.cible ?? "",
      entree.ref ?? "",
      Object.keys(entree.payload).length > 0
        ? JSON.stringify(entree.payload)
        : "",
    ]),
  ];

  const csv = `\uFEFF${lignes.map((l) => l.map(celluleCsv).join(";")).join("\r\n")}`;
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="audit-${jours}j.csv"`,
      "cache-control": "no-store",
    },
  });
}
