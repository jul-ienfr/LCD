import Link from "next/link";
import { connection } from "next/server";
import {
  CONFIRMATION_PURGE_AUDIT,
  dateLimiteRetention,
  depuisJours,
  familleAuditValide,
  JOURS_AUDIT,
  JOURS_AUDIT_DEFAUT,
  joursAuditValide,
  LIBELLES_FAMILLE_AUDIT,
  FAMILLES_AUDIT,
  libelleActionAudit,
} from "@/domain/audit";
import { DrizzleAuditRepository } from "@/infrastructure/db/repositories/audit-repository";
import { env } from "@/lib/env";
import { requireRole, tenantIdDeSession } from "@/lib/session";
import { purgerAuditAction } from "./actions";

export const instant = false;

const LIMITE = 50;

const formateurDate = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "short",
  timeStyle: "medium",
  timeZone: "Europe/Paris",
});

function couleurAction(action: string): string {
  if (action.startsWith("utilisateur.")) {
    return "bg-violet-100 text-violet-900";
  }
  if (action.startsWith("paiement.") || action.startsWith("facture.")) {
    return "bg-accent-douce text-accent";
  }
  if (action.startsWith("caution.")) {
    return "bg-alerte-douce text-alerte";
  }
  if (action.startsWith("mission.")) {
    return "bg-accent-douce text-accent";
  }
  if (action.startsWith("ticket.")) {
    return "bg-rose-100 text-rose-900";
  }
  return "bg-surface-2 text-encre-douce";
}

export default async function PageAudit({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    q?: string;
    jours?: string;
    famille?: string;
    ok?: string;
    n?: string;
    erreur?: string;
  }>;
}) {
  await connection();

  const session = await requireRole(["admin"]);
  const tenantId = tenantIdDeSession(session);
  const params = await searchParams;

  const recherche = (params.q ?? "").trim().slice(0, 100);
  const joursDemandes = Number.parseInt(params.jours ?? "", 10);
  const jours = joursAuditValide(joursDemandes)
    ? joursDemandes
    : JOURS_AUDIT_DEFAUT;
  const famille = params.famille && familleAuditValide(params.famille)
    ? params.famille
    : null;
  const depuis = depuisJours(jours);
  const pageDemandee = Number.parseInt(params.page ?? "1", 10);
  const page =
    Number.isFinite(pageDemandee) && pageDemandee > 0 ? pageDemandee : 1;

  const repo = new DrizzleAuditRepository();
  const total = await repo.compter(tenantId, {
    recherche: recherche || undefined,
    depuis,
    prefixe: famille ?? undefined,
  });
  const pages = Math.max(1, Math.ceil(total / LIMITE));
  const pageCourante = Math.min(page, pages);
  const entrees = await repo.lister(tenantId, {
    limite: LIMITE,
    decalage: (pageCourante - 1) * LIMITE,
    recherche: recherche || undefined,
    depuis,
    prefixe: famille ?? undefined,
  });

  const limiteRetention = dateLimiteRetention(env.AUDIT_RETENTION_JOURS);
  const anciennes = await repo.compter(tenantId, { avant: limiteRetention });
  const purgeOk = params.ok === "purge";
  const nombrePurges = Number.parseInt(params.n ?? "0", 10);

  function lien(numero: number): string {
    const query = new URLSearchParams();
    if (recherche) query.set("q", recherche);
    if (famille) query.set("famille", famille);
    query.set("jours", String(jours));
    query.set("page", String(numero));
    return `/hote/audit?${query.toString()}`;
  }

  const queryExport = new URLSearchParams({ jours: String(jours) });
  if (recherche) queryExport.set("q", recherche);
  if (famille) queryExport.set("famille", famille);

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-6 py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-widest text-encre-faine">
            Espace hôte
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Journal d’audit
          </h1>
          <p className="text-encre-douce">
            {total} action{total > 1 ? "s" : ""} sur les {jours} derniers jours
            {famille
              ? ` · ${LIBELLES_FAMILLE_AUDIT[famille]}`
              : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <a
            className="rounded-full border border-bordure px-4 py-2 text-sm font-medium"
            href={`/api/exports/audit?${queryExport.toString()}`}
          >
            Exporter le journal CSV
          </a>
          <Link className="text-sm underline" href="/hote">
            Retour au tableau de bord
          </Link>
        </div>
      </header>

      {purgeOk ? (
        <p className="rounded-2xl border border-accent bg-accent-douce p-4 text-sm text-accent">
          {Number.isFinite(nombrePurges) && nombrePurges > 0
            ? `${nombrePurges} entrée${nombrePurges > 1 ? "s" : ""} de plus de ${env.AUDIT_RETENTION_JOURS} jours supprimée${nombrePurges > 1 ? "s" : ""}.`
            : "Aucune entrée à purger."}
        </p>
      ) : null}
      {params.erreur ? (
        <p className="rounded-2xl border border-danger bg-danger-douce p-4 text-sm text-danger">
          {params.erreur.slice(0, 300)}
        </p>
      ) : null}

      <form
        action="/hote/audit"
        className="flex flex-wrap items-end gap-3 rounded-2xl border border-bordure bg-surface p-5 shadow-sm"
      >
        <label className="min-w-0 flex-1 space-y-1 text-sm font-medium">
          <span>Rechercher</span>
          <input
            className="w-full rounded-xl border border-bordure p-3 text-base"
            defaultValue={recherche}
            maxLength={100}
            name="q"
            placeholder="action, auteur, cible ou référence"
            type="search"
          />
        </label>
        <label className="space-y-1 text-sm font-medium">
          <span>Période</span>
          <select
            className="rounded-xl border border-bordure p-3 text-sm"
            defaultValue={String(jours)}
            name="jours"
          >
            {JOURS_AUDIT.map((option) => (
              <option key={option} value={option}>
                {option} jours
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm font-medium">
          <span>Famille</span>
          <select
            className="rounded-xl border border-bordure p-3 text-sm"
            defaultValue={famille ?? ""}
            name="famille"
          >
            <option value="">Toutes</option>
            {FAMILLES_AUDIT.map((option) => (
              <option key={option} value={option}>
                {LIBELLES_FAMILLE_AUDIT[option]}
              </option>
            ))}
          </select>
        </label>
        <button
          className="rounded-full bg-encre px-5 py-3 text-sm font-medium text-fond"
          type="submit"
        >
          Filtrer
        </button>
        {recherche || famille || jours !== JOURS_AUDIT_DEFAUT ? (
          <Link className="text-sm underline" href="/hote/audit">
            Effacer les filtres
          </Link>
        ) : null}
      </form>

      {entrees.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-bordure p-6 text-encre-douce">
          Aucune action sur cette période.
        </p>
      ) : (
        <ul className="divide-y divide-bordure rounded-2xl border border-bordure bg-surface">
          {entrees.map((entree) => (
            <li className="p-4" key={entree.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="flex flex-wrap items-center gap-2 font-medium">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${couleurAction(entree.action)}`}
                    >
                      {libelleActionAudit(entree.action)}
                    </span>
                    <code className="text-xs text-encre-faine">
                      {entree.action}
                    </code>
                  </p>
                  <p className="break-words text-sm text-encre-douce">
                    Par <span className="font-medium">{entree.qui}</span>
                    {entree.cible ? ` · cible ${entree.cible}` : ""}
                    {entree.ref ? ` · réf ${entree.ref}` : ""}
                  </p>
                </div>
                <time
                  className="text-xs text-encre-faine"
                  dateTime={entree.createdAt.toISOString()}
                >
                  {formateurDate.format(entree.createdAt)}
                </time>
              </div>

              {Object.keys(entree.payload).length > 0 ? (
                <details className="mt-2 text-xs text-encre-douce">
                  <summary className="cursor-pointer underline">
                    Détails
                  </summary>
                  <pre className="mt-2 overflow-x-auto rounded-lg bg-fond p-3">
                    {JSON.stringify(entree.payload, null, 2)}
                  </pre>
                </details>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {pages > 1 ? (
        <nav
          aria-label="Pagination du journal"
          className="flex flex-wrap items-center gap-3 text-sm"
        >
          {pageCourante > 1 ? (
            <Link
              className="rounded-full border border-bordure px-4 py-2"
              href={lien(pageCourante - 1)}
            >
              ← Précédent
            </Link>
          ) : null}
          <span className="text-encre-faine">
            Page {pageCourante} / {pages}
          </span>
          {pageCourante < pages ? (
            <Link
              className="rounded-full border border-bordure px-4 py-2"
              href={lien(pageCourante + 1)}
            >
              Suivant →
            </Link>
          ) : null}
        </nav>
      ) : null}

      <section className="space-y-3 rounded-2xl border border-bordure bg-surface p-5 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Rétention</h2>
          <p className="text-sm text-encre-douce">
            Conservation {env.AUDIT_RETENTION_JOURS} jours.{" "}
            {anciennes > 0
              ? `${anciennes} entrée${anciennes > 1 ? "s" : ""} dépasse${anciennes > 1 ? "nt" : ""} cette durée.`
              : "Aucune entrée au-delà de cette durée."}
          </p>
        </div>
        {anciennes > 0 ? (
          <form action={purgerAuditAction} className="flex flex-wrap items-end gap-3">
            <label className="space-y-1 text-sm font-medium">
              <span>
                Saisissez « {CONFIRMATION_PURGE_AUDIT} » pour supprimer
                définitivement ces entrées
              </span>
              <input
                autoComplete="off"
                className="rounded-xl border border-bordure p-3 text-base"
                name="confirmation"
                placeholder={CONFIRMATION_PURGE_AUDIT}
                required
              />
            </label>
            <button
              className="rounded-full border border-danger px-4 py-2 text-sm font-medium text-danger"
              type="submit"
            >
              Purger définitivement
            </button>
          </form>
        ) : null}
      </section>

      <Link className="text-sm underline" href="/hote">
        Tableau de bord
      </Link>
    </main>
  );
}
