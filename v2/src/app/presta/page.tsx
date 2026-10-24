import Link from "next/link";
import { connection } from "next/server";
import {
  TRANSITIONS_MISSION,
  type StatutMission,
} from "@/domain/mission";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleMissionRepository } from "@/infrastructure/db/repositories/mission-repository";
import { requireRole, tenantIdDeSession } from "@/lib/session";
import { BoutonDeconnexion } from "@/components/bouton-deconnexion";
import { changerStatutMissionAction } from "./actions";

export const instant = false;

const LIBELLES: Record<StatutMission, string> = {
  planifiee: "Planifiée",
  en_cours: "Commencer",
  terminee: "Terminer",
  annulee: "Annuler",
};

export default async function PagePresta() {
  await connection();
  const session = await requireRole(["presta", "admin", "hote"]);
  const tenantId = tenantIdDeSession(session);

  const repo = new DrizzleMissionRepository();
  const missions =
    session.user.role === "presta"
      ? await repo.listerParPrestataire(tenantId, session.user.id)
      : await repo.listerParMois(
          tenantId,
          new Date().toISOString().slice(0, 10),
          "2100-12-31",
        );

  const logements = await new DrizzleLogementRepository().listerParTenant(
    tenantId,
  );
  const parLogement = new Map(logements.map((l) => [l.id, l]));

  return (
    <main className="mx-auto max-w-3xl space-y-8 px-6 py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-widest text-stone-500">
            Espace prestataire
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Bonjour {session.user.name}
          </h1>
          <p className="text-stone-600">
            {missions.length} mission{missions.length > 1 ? "s" : ""} ·{" "}
            {session.user.email}
          </p>
        </div>
        <BoutonDeconnexion />
      </header>

      {missions.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-stone-300 p-6 text-stone-600">
          Aucune mission assignée pour le moment.
        </p>
      ) : (
        <ul className="space-y-3">
          {missions.map((mission) => (
            <li
              className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
              key={mission.id}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">
                  {mission.ref} — {mission.type}
                </p>
                <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">
                  {mission.statut}
                </span>
              </div>
              <p className="mt-1 text-sm text-stone-600">
                {mission.date}
                {mission.heure ? ` ${mission.heure}` : ""} ·{" "}
                {parLogement.get(mission.logementId)?.nom ??
                  mission.logementId}
              </p>
              {mission.notes ? (
                <p className="mt-1 text-sm text-stone-500">{mission.notes}</p>
              ) : null}

              {TRANSITIONS_MISSION[mission.statut].length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {TRANSITIONS_MISSION[mission.statut].map((statut) => (
                    <form action={changerStatutMissionAction} key={statut}>
                      <input name="missionId" type="hidden" value={mission.id} />
                      <input name="statut" type="hidden" value={statut} />
                      <button
                        className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium"
                        type="submit"
                      >
                        {LIBELLES[statut]}
                      </button>
                    </form>
                  ))}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <nav className="flex flex-wrap gap-4 text-sm">
        {session.user.role !== "presta" ? (
          <Link className="underline" href="/hote/missions">
            Gérer les missions
          </Link>
        ) : null}
        <Link className="underline" href="/support">
          Support
        </Link>
        <Link className="underline" href="/">
          Retour à l’accueil
        </Link>
      </nav>
    </main>
  );
}
