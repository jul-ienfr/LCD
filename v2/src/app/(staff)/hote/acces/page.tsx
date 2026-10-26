import Link from "next/link";
import { connection } from "next/server";
import {
  libelleDuree,
  minutesDepuis,
  sessionActive,
} from "@/domain/acces";
import { libelleRole } from "@/domain/utilisateur";
import { DrizzleSessionsRepository } from "@/infrastructure/db/repositories/sessions-repository";
import { DrizzleUserRepository } from "@/infrastructure/db/repositories/user-repository";
import { requireRole, tenantIdDeSession } from "@/lib/session";
import { revoquerSessionAction } from "./actions";

export const instant = false;

function formaterDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export default async function PageAcces({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  await connection();
  const session = await requireRole(["admin"]);
  const tenantId = tenantIdDeSession(session);
  const params = await searchParams;

  const sessions = await new DrizzleSessionsRepository().listerParTenant(
    tenantId,
    50,
  );
  const parUtilisateur =
    await new DrizzleSessionsRepository().compterActivesParUtilisateur(tenantId);
  const utilisateurs = await new DrizzleUserRepository().listerParTenant(
    tenantId,
  );

  const totalActives = Object.values(parUtilisateur).reduce(
    (total, nombre) => total + nombre,
    0,
  );
  const comptesActifs = utilisateurs.filter((u) => u.actif).length;
  const admins = utilisateurs.filter(
    (u) => u.actif && u.role === "admin",
  ).length;
  const sansSession = utilisateurs.filter(
    (u) => u.actif && !(parUtilisateur[u.id] ?? 0),
  ).length;

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-6 py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-widest text-encre-faine">
            Espace hôte · Sécurité
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Registre des accès
          </h1>
          <p className="text-encre-douce">
            Sessions nominatives de l’équipe — révoquez un accès en un geste,
            jamais le vôtre.
          </p>
        </div>
        <Link className="text-sm underline" href="/hote">
          Retour au tableau de bord
        </Link>
      </header>

      {params.ok === "revoque" ? (
        <p
          className="rounded-xl border border-accent bg-accent-douce p-3 text-sm text-accent"
          role="status"
        >
          Session révoquée.
        </p>
      ) : null}
      {params.erreur ? (
        <p
          className="rounded-xl border border-danger bg-danger-douce p-3 text-sm text-danger"
          role="alert"
        >
          {params.erreur === "inattendu"
            ? "Erreur inattendue. Réessayez."
            : params.erreur}
        </p>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-bordure bg-surface p-5 shadow-sm">
          <p className="text-sm text-encre-faine">Sessions actives</p>
          <p className="mt-1 text-3xl font-semibold">{totalActives}</p>
        </div>
        <div className="rounded-2xl border border-bordure bg-surface p-5 shadow-sm">
          <p className="text-sm text-encre-faine">Comptes actifs</p>
          <p className="mt-1 text-3xl font-semibold">{comptesActifs}</p>
        </div>
        <div className="rounded-2xl border border-bordure bg-surface p-5 shadow-sm">
          <p className="text-sm text-encre-faine">Administrateurs</p>
          <p className="mt-1 text-3xl font-semibold">{admins}</p>
        </div>
        <div className="rounded-2xl border border-bordure bg-surface p-5 shadow-sm">
          <p className="text-sm text-encre-faine">Actifs sans session</p>
          <p className="mt-1 text-3xl font-semibold">{sansSession}</p>
        </div>
      </section>

      <section className="overflow-x-auto rounded-2xl border border-bordure bg-surface shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-bordure text-xs uppercase tracking-wide text-encre-faine">
            <tr>
              <th className="p-3">Utilisateur</th>
              <th className="p-3">Rôle</th>
              <th className="p-3">Appareil</th>
              <th className="p-3">IP</th>
              <th className="p-3">Dernière activité</th>
              <th className="p-3">Expire</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {sessions.length === 0 ? (
              <tr>
                <td className="p-6 text-encre-douce" colSpan={7}>
                  Aucune session enregistrée.
                </td>
              </tr>
            ) : (
              sessions.map((ligne) => {
                const active = sessionActive(ligne.expiresAt);
                const estSoi = ligne.userId === session.user.id;
                return (
                  <tr className="border-b border-bordure/60" key={ligne.id}>
                    <td className="p-3">
                      <p className="font-medium">{ligne.userName}</p>
                      <p className="text-xs text-encre-faine">
                        {ligne.userEmail}
                      </p>
                    </td>
                    <td className="p-3">{libelleRole(ligne.role)}</td>
                    <td className="max-w-[16rem] truncate p-3 text-xs text-encre-douce">
                      {ligne.userAgent ?? "Inconnu"}
                    </td>
                    <td className="p-3 font-mono text-xs">
                      {ligne.ipAddress ?? "—"}
                    </td>
                    <td className="p-3">
                      {libelleDuree(minutesDepuis(ligne.updatedAt))}
                    </td>
                    <td className="p-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          active
                            ? "bg-accent-douce text-accent"
                            : "bg-surface-2 text-encre-faine"
                        }`}
                      >
                        {active ? "Active" : "Expirée"}
                      </span>
                      <p className="mt-1 text-xs text-encre-faine">
                        {formaterDate(ligne.expiresAt)}
                      </p>
                    </td>
                    <td className="p-3">
                      {estSoi ? (
                        <span className="text-xs text-encre-faine">
                          Session courante
                        </span>
                      ) : (
                        <form action={revoquerSessionAction}>
                          <input type="hidden" name="id" value={ligne.id} />
                          <button
                            className="rounded-full border border-danger px-3 py-1 text-xs font-medium text-danger"
                            type="submit"
                          >
                            Révoquer
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </section>

      <section className="rounded-2xl border border-bordure bg-surface p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Comptes et sessions actives</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {utilisateurs
            .filter((u) => u.actif)
            .map((u) => (
              <li
                className="flex items-center justify-between gap-3 rounded-xl border border-bordure px-3 py-2 text-sm"
                key={u.id}
              >
                <span>
                  {u.name}{" "}
                  <span className="text-xs text-encre-faine">
                    · {libelleRole(u.role)}
                  </span>
                </span>
                <span className="text-xs font-medium">
                  {parUtilisateur[u.id] ?? 0} session
                  {(parUtilisateur[u.id] ?? 0) > 1 ? "s" : ""}
                </span>
              </li>
            ))}
        </ul>
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <Link className="underline" href="/hote/utilisateurs">
            Gérer les utilisateurs
          </Link>
          <Link className="underline" href="/hote/audit">
            Journal d’audit
          </Link>
        </div>
      </section>
    </main>
  );
}
