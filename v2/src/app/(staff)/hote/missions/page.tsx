import Link from "next/link";
import { connection } from "next/server";
import {
  ajouterJours,
  decalerMois,
  joursDuMois,
  moisCourant,
  moisEnFrancais,
  moisValide,
} from "@/domain/calendrier";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleMissionRepository } from "@/infrastructure/db/repositories/mission-repository";
import { DrizzleReservationRepository } from "@/infrastructure/db/repositories/reservation-repository";
import { DrizzleUserRepository } from "@/infrastructure/db/repositories/user-repository";
import { requireRole, tenantIdDeSession } from "@/lib/session";
import { FormulaireMission } from "./formulaire";

export const instant = false;

function prochainRef(
  missions: { ref: string }[],
  annee: number,
): string {
  const prefixe = `MIS-${annee}-`;
  const nums = missions
    .filter((m) => m.ref.startsWith(prefixe))
    .map((m) => Number(m.ref.slice(prefixe.length)))
    .filter((n) => Number.isInteger(n) && n > 0);
  const suivant = (nums.length ? Math.max(...nums) : 0) + 1;
  return `${prefixe}${String(suivant).padStart(4, "0")}`;
}

export default async function PageMissions({
  searchParams,
}: {
  searchParams: Promise<{ mois?: string }>;
}) {
  await connection();

  const session = await requireRole(["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const params = await searchParams;
  const mois =
    params.mois && moisValide(params.mois) ? params.mois : moisCourant();

  const jours = joursDuMois(mois);
  const premier = jours[0];
  const dernier = jours[jours.length - 1];
  if (!premier || !dernier) throw new Error("Mois invalide.");

  const logements = await new DrizzleLogementRepository().listerParTenant(
    tenantId,
  );
  const prestataires = await new DrizzleUserRepository().listerParRole(
    tenantId,
    "presta",
  );
  const reservations = await new DrizzleReservationRepository().listerParMois(
    tenantId,
    premier,
    ajouterJours(dernier, 1),
  );
  const missions = await new DrizzleMissionRepository().listerParMois(
    tenantId,
    premier,
    dernier,
  );

  const parUser = new Map(prestataires.map((p) => [p.id, p]));
  const parLogement = new Map(logements.map((l) => [l.id, l]));
  const annee = Number(mois.slice(0, 4));

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-6 py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-widest text-encre-faine">
            Espace hôte
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Missions — {moisEnFrancais(mois)}
          </h1>
          <p className="text-encre-douce">
            {missions.length} mission{missions.length > 1 ? "s" : ""} ·{" "}
            {prestataires.length} prestataire
            {prestataires.length > 1 ? "s" : ""}
          </p>
        </div>
        <Link className="text-sm underline" href="/hote">
          Retour au tableau de bord
        </Link>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <Link
          className="rounded-full border border-bordure px-4 py-2 text-sm"
          href={`/hote/missions?mois=${decalerMois(mois, -1)}`}
        >
          ← Mois précédent
        </Link>
        <Link
          className="rounded-full border border-bordure px-4 py-2 text-sm"
          href={`/hote/missions?mois=${moisCourant()}`}
        >
          Mois courant
        </Link>
        <Link
          className="rounded-full border border-bordure px-4 py-2 text-sm"
          href={`/hote/missions?mois=${decalerMois(mois, 1)}`}
        >
          Mois suivant →
        </Link>
      </div>

      {prestataires.length === 0 ? (
        <p className="rounded-2xl border border-alerte bg-alerte-douce p-4 text-sm text-alerte">
          Aucun prestataire actif. Lancez le seed ou créez un utilisateur de
          rôle <code>presta</code> avant d’assigner une mission.
        </p>
      ) : (
        <section className="rounded-2xl border border-bordure bg-surface p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Créer une mission</h2>
          <p className="mt-1 text-sm text-encre-douce">
            Ménage, maintenance, accueil ou autre. Le prestataire verra la
            mission dans son espace.
          </p>
          <div className="mt-5">
            <FormulaireMission
              dateDefaut={mois === moisCourant() ? new Date().toISOString().slice(0, 10) : premier}
              logements={logements}
              prestataires={prestataires.map((p) => ({
                id: p.id,
                name: p.name,
                email: p.email,
              }))}
              refDefaut={prochainRef(missions, annee)}
              reservations={reservations}
            />
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Missions du mois</h2>
        {missions.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-bordure p-6 text-encre-douce">
            Aucune mission sur ce mois.
          </p>
        ) : (
          <ul className="divide-y divide-bordure rounded-2xl border border-bordure bg-surface">
            {missions.map((mission) => (
              <li className="p-4" key={mission.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">
                    {mission.ref} — {mission.type}
                  </p>
                  <span className="rounded-full bg-surface-2 px-3 py-1 text-xs font-medium text-encre-douce">
                    {mission.statut}
                  </span>
                </div>
                <p className="mt-1 text-sm text-encre-douce">
                  {mission.date}
                  {mission.heure ? ` ${mission.heure}` : ""} ·{" "}
                  {parLogement.get(mission.logementId)?.nom ??
                    mission.logementId}{" "}
                  ·{" "}
                  {parUser.get(mission.assignedUserId)?.name ??
                    mission.assignedUserId}
                </p>
                {mission.notes ? (
                  <p className="mt-1 text-sm text-encre-faine">
                    {mission.notes}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <nav className="flex flex-wrap gap-4 text-sm">
        <Link className="underline" href="/hote/planning">
          Planning
        </Link>
        <Link className="underline" href="/presta">
          Espace prestataire
        </Link>
        <Link className="underline" href="/hote">
          Tableau de bord
        </Link>
      </nav>
    </main>
  );
}
