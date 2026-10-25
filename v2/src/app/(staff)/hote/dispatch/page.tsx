import Link from "next/link";
import { connection } from "next/server";
import { ajouterJours } from "@/domain/calendrier";
import {
  dispatchActif,
  LIBELLES_STATUT_DISPATCH,
} from "@/domain/dispatch";
import type { Mission } from "@/domain/mission";
import { aujourdHuiIso } from "@/domain/objet-trouve";
import { DrizzleDispatchRepository } from "@/infrastructure/db/repositories/dispatch-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleMissionRepository } from "@/infrastructure/db/repositories/mission-repository";
import { DrizzleUserRepository } from "@/infrastructure/db/repositories/user-repository";
import { requireRole, tenantIdDeSession } from "@/lib/session";
import { proposerDispatchAction, retirerDispatchAction } from "./actions";

export const instant = false;

const LIBELLES_TYPE: Record<Mission["type"], string> = {
  menage: "Ménage",
  maintenance: "Maintenance",
  accueil: "Accueil",
  autre: "Autre",
};

const CLASSES_STATUT: Record<string, string> = {
  proposee: "bg-alerte-douce text-alerte",
  acceptee: "bg-accent-douce text-accent",
  refusee: "bg-danger-douce text-danger",
  retiree: "bg-surface-2 text-encre-faine",
};

export default async function PageDispatch({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  await connection();
  const session = await requireRole(["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const params = await searchParams;

  const debut = aujourdHuiIso();
  const fin = ajouterJours(debut, 90);
  const [missions, logements, prestataires, dispatches] = await Promise.all([
    new DrizzleMissionRepository().listerParMois(tenantId, debut, fin),
    new DrizzleLogementRepository().listerParTenant(tenantId),
    new DrizzleUserRepository().listerParRole(tenantId, "presta"),
    new DrizzleDispatchRepository().listerParTenant(tenantId),
  ]);

  const parLogement = new Map(logements.map((l) => [l.id, l]));
  const parUser = new Map(prestataires.map((p) => [p.id, p]));
  const parMission = new Map(missions.map((m) => [m.id, m]));
  const actives = new Map<string, (typeof dispatches)[number]>();
  for (const dispatch of dispatches) {
    if (dispatchActif(dispatch.statut)) {
      actives.set(dispatch.missionId, dispatch);
    }
  }

  const messageOk =
    params.ok === "propose"
      ? "Offre envoyée au prestataire."
      : params.ok === "retire"
        ? "Offre retirée."
        : null;

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-6 py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-widest text-encre-faine">
            Espace hôte · Prestataires
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Dispatch prestataires
          </h1>
          <p className="text-encre-douce">
            Proposez une mission, suivez les réponses et réassignez sans
            chevauchement.
          </p>
        </div>
        <Link className="text-sm underline" href="/hote">
          Retour au tableau de bord
        </Link>
      </header>

      {messageOk ? (
        <p
          className="rounded-xl border border-accent bg-accent-douce p-3 text-sm text-accent"
          role="status"
        >
          {messageOk}
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

      {prestataires.length === 0 ? (
        <p className="rounded-2xl border border-alerte bg-alerte-douce p-4 text-sm text-alerte">
          Aucun prestataire actif. Créez un utilisateur de rôle{" "}
          <code>presta</code> avant de dispatcher.
        </p>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          Missions à venir ({missions.length})
        </h2>
        {missions.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-bordure p-6 text-encre-douce">
            Aucune mission sur les 90 prochains jours. Créez-en une depuis «
            Missions ».
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-bordure bg-surface">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead className="border-b border-bordure bg-surface-2 text-xs uppercase tracking-wide text-encre-faine">
                <tr>
                  <th className="p-3">Mission</th>
                  <th className="p-3">Logement</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Assigné</th>
                  <th className="p-3">Offre en cours</th>
                  <th className="p-3">Dispatcher</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bordure">
                {missions.map((mission) => {
                  const active = actives.get(mission.id);
                  const dispatchable =
                    mission.statut === "planifiee" ||
                    mission.statut === "en_cours";
                  return (
                    <tr key={mission.id}>
                      <td className="p-3">
                        <p className="font-mono text-xs">{mission.ref}</p>
                        <p className="mt-1 text-xs text-encre-douce">
                          {LIBELLES_TYPE[mission.type]} · {mission.statut}
                        </p>
                      </td>
                      <td className="p-3">
                        {parLogement.get(mission.logementId)?.nom ?? "—"}
                      </td>
                      <td className="p-3">
                        {mission.date}
                        {mission.heure ? ` ${mission.heure}` : ""}
                      </td>
                      <td className="p-3">
                        {parUser.get(mission.assignedUserId)?.name ??
                          mission.assignedUserId}
                      </td>
                      <td className="p-3">
                        {active ? (
                          <div className="space-y-1">
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-semibold ${CLASSES_STATUT[active.statut]}`}
                            >
                              {LIBELLES_STATUT_DISPATCH[active.statut]}
                            </span>
                            <p className="text-xs text-encre-douce">
                              {parUser.get(active.prestataireId)?.name ??
                                active.prestataireId}
                            </p>
                            {active.statut === "proposee" ? (
                              <form action={retirerDispatchAction}>
                                <input
                                  type="hidden"
                                  name="id"
                                  value={active.id}
                                />
                                <button
                                  className="text-xs text-danger underline"
                                  type="submit"
                                >
                                  Retirer l’offre
                                </button>
                              </form>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-xs text-encre-faine">
                            Aucune
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        {dispatchable && !active ? (
                          <form
                            action={proposerDispatchAction}
                            className="space-y-2"
                          >
                            <input
                              type="hidden"
                              name="missionId"
                              value={mission.id}
                            />
                            <input
                              type="hidden"
                              name="ref"
                              value={`DSP-${crypto.randomUUID()}`}
                            />
                            <select
                              className="w-full rounded-lg border border-bordure bg-surface p-2 text-xs"
                              name="prestataireId"
                              required
                            >
                              <option value="">Choisir…</option>
                              {prestataires.map((prestataire) => (
                                <option
                                  key={prestataire.id}
                                  value={prestataire.id}
                                >
                                  {prestataire.name}
                                </option>
                              ))}
                            </select>
                            <input
                              className="w-full rounded-lg border border-bordure bg-surface p-2 text-xs"
                              name="message"
                              placeholder="Créneau, consignes…"
                            />
                            <button
                              className="rounded-full border border-bordure px-3 py-1 text-xs font-medium"
                              type="submit"
                            >
                              Proposer
                            </button>
                          </form>
                        ) : (
                          <span className="text-xs text-encre-faine">
                            {dispatchable ? "En cours" : "Non dispatchable"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Historique des offres</h2>
        {dispatches.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-bordure p-6 text-encre-douce">
            Aucune offre pour le moment.
          </p>
        ) : (
          <ul className="space-y-2">
            {dispatches.map((dispatch) => (
              <li
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-bordure bg-surface p-4 text-sm"
                key={dispatch.id}
              >
                <div>
                  <p className="font-mono text-xs text-encre-faine">
                    {dispatch.ref} ·{" "}
                    {parMission.get(dispatch.missionId)?.ref ??
                      dispatch.missionId.slice(0, 8)}
                  </p>
                  <p className="mt-1">
                    {parUser.get(dispatch.prestataireId)?.name ??
                      dispatch.prestataireId}
                    {dispatch.message ? ` — ${dispatch.message}` : ""}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-semibold ${CLASSES_STATUT[dispatch.statut]}`}
                >
                  {LIBELLES_STATUT_DISPATCH[dispatch.statut]}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <nav className="flex flex-wrap gap-4 text-sm">
        <Link className="underline" href="/hote/missions">
          Missions
        </Link>
        <Link className="underline" href="/hote/audit">
          Journal d’audit
        </Link>
        <Link className="underline" href="/hote">
          Tableau de bord
        </Link>
      </nav>
    </main>
  );
}
