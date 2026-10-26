import Link from "next/link";
import { connection } from "next/server";
import { aujourdHuiIso } from "@/application/use-cases/inventaire";
import {
  avancementMenage,
  LIBELLES_STATUT_MENAGE,
  statistiquesMenage,
  type Menage,
} from "@/domain/menage";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleMenagesRepository } from "@/infrastructure/db/repositories/menages-repository";
import { DrizzleReservationRepository } from "@/infrastructure/db/repositories/reservation-repository";
import { requireRole, tenantIdDeSession } from "@/lib/session";
import { formaterEuros } from "@/lib/format";
import { planifierMenageAction } from "./actions";

export const instant = false;

function resumeSejour(menage: Menage): string {
  return menage.reservationId ? "Séjour lié" : "Sans séjour";
}

export default async function PageMenage({
  searchParams,
}: {
  searchParams: Promise<{
    logement?: string;
    reservation?: string;
    ok?: string;
    erreur?: string;
  }>;
}) {
  await connection();
  const session = await requireRole(["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const params = await searchParams;

  const logements = await new DrizzleLogementRepository().listerParTenant(
    tenantId,
  );
  const logement =
    logements.find((l) => l.id === params.logement) ?? logements[0];
  const menages = logement
    ? await new DrizzleMenagesRepository().listerParLogement(
        tenantId,
        logement.id,
      )
    : [];

  if (!logement) {
    return (
      <main className="mx-auto max-w-3xl space-y-6 px-6 py-12">
        <h1 className="text-3xl font-semibold tracking-tight">Ménage</h1>
        <p className="rounded-2xl border border-dashed border-bordure p-6 text-encre-douce">
          Créez d’abord un logement pour planifier ses ménages.
        </p>
        <Link className="text-sm underline" href="/hote/logements">
          Créer un logement
        </Link>
      </main>
    );
  }

  const aujourdHui = aujourdHuiIso();
  const sejours = (await new DrizzleReservationRepository().listerTous(tenantId))
    .filter((r) => r.logementId === logement.id && r.fin >= aujourdHui)
    .sort((a, b) => a.fin.localeCompare(b.fin))
    .slice(0, 8);
  const sejourChoisi = sejours.find((r) => r.id === params.reservation);
  const statistiques = statistiquesMenage(menages);

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-6 py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-widest text-encre-faine">
            Espace hôte · Exploitation
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Ménage</h1>
          <p className="text-encre-douce">
            Checklists de remise en état, avancement et réassort au départ.
          </p>
        </div>
        <Link className="text-sm underline" href="/hote">
          Retour au tableau de bord
        </Link>
      </header>

      {logements.length > 1 ? (
        <nav className="flex flex-wrap gap-2" aria-label="Choisir un logement">
          {logements.map((l) => (
            <Link
              key={l.id}
              className={`rounded-full border px-4 py-2 text-sm ${
                l.id === logement.id
                  ? "border-accent bg-accent-douce font-semibold text-accent"
                  : "border-bordure bg-surface"
              }`}
              href={`/hote/menage?logement=${l.id}`}
            >
              {l.nom}
            </Link>
          ))}
        </nav>
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

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-bordure bg-surface p-5 shadow-sm">
          <p className="text-sm text-encre-faine">Score qualité moyen</p>
          <p className="mt-1 text-3xl font-semibold">
            {statistiques.scoreMoyen === null
              ? "—"
              : `${statistiques.scoreMoyen.toFixed(1)} / 5`}
          </p>
          {statistiques.alerteQualite ? (
            <p className="mt-2 inline-block rounded-full bg-danger-douce px-2 py-1 text-xs font-semibold text-danger">
              Alerte : sous 3,5 / 5
            </p>
          ) : null}
        </div>
        <div className="rounded-2xl border border-bordure bg-surface p-5 shadow-sm">
          <p className="text-sm text-encre-faine">Coût moyen de rotation</p>
          <p className="mt-1 text-3xl font-semibold">
            {statistiques.coutMoyenCentimes === null
              ? "—"
              : formaterEuros(statistiques.coutMoyenCentimes)}
          </p>
        </div>
        <div className="rounded-2xl border border-bordure bg-surface p-5 shadow-sm">
          <p className="text-sm text-encre-faine">Durée moyenne</p>
          <p className="mt-1 text-3xl font-semibold">
            {statistiques.dureeMoyenneMinutes === null
              ? "—"
              : `${Math.round(statistiques.dureeMoyenneMinutes)} min`}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-bordure bg-surface p-6 shadow-sm">
        <h2 className="text-lg font-semibold">
          Planifier un ménage — {logement.nom}
        </h2>
        <form action={planifierMenageAction} className="mt-4 space-y-3">
          <input type="hidden" name="logementId" value={logement.id} />
          <input
            type="hidden"
            name="ref"
            value={`men-${crypto.randomUUID()}`}
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block space-y-1 text-sm font-medium">
              <span>Date</span>
              <input
                className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
                defaultValue={sejourChoisi?.fin ?? aujourdHui}
                name="date"
                required
                type="date"
              />
            </label>
            <label className="block space-y-1 text-sm font-medium">
              <span>Séjour</span>
              <select
                className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
                defaultValue={sejourChoisi?.id ?? ""}
                name="reservationId"
              >
                <option value="">Aucun séjour lié</option>
                {sejours.map((sejour) => (
                  <option key={sejour.id} value={sejour.id}>
                    {sejour.clientNom ?? sejour.ref} · {sejour.debut} →{" "}
                    {sejour.fin}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1 text-sm font-medium">
              <span>Notes</span>
              <input
                className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
                name="notes"
                placeholder="Optionnel"
              />
            </label>
          </div>
          <button
            className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-fond"
            type="submit"
          >
            Planifier le ménage
          </button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Ménages</h2>
        {menages.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-bordure p-6 text-encre-douce">
            Aucun ménage planifié pour ce logement.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-bordure bg-surface">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-bordure bg-surface-2 text-xs uppercase tracking-wide text-encre-faine">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Séjour</th>
                  <th className="p-3">Avancement</th>
                  <th className="p-3">Statut</th>
                  <th className="p-3">Notes</th>
                  <th className="p-3">Qualité</th>
                  <th className="p-3">Coût</th>
                  <th className="p-3">Durée</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bordure">
                {menages.map((menage) => {
                  const avancement = avancementMenage(menage.taches);
                  return (
                    <tr key={menage.id}>
                      <td className="p-3">{menage.date}</td>
                      <td className="p-3">{resumeSejour(menage)}</td>
                      <td className="p-3">
                        {avancement.faites} / {avancement.total}
                      </td>
                      <td className="p-3">
                        {LIBELLES_STATUT_MENAGE[menage.statut]}
                      </td>
                      <td className="p-3">{menage.notes || "—"}</td>
                      <td className="p-3">
                        {menage.score === null ? "—" : `${menage.score} / 5`}
                      </td>
                      <td className="p-3">
                        {menage.coutCentimes === null
                          ? "—"
                          : formaterEuros(menage.coutCentimes)}
                      </td>
                      <td className="p-3">
                        {menage.dureeMinutes === null
                          ? "—"
                          : `${menage.dureeMinutes} min`}
                      </td>
                      <td className="p-3">
                        <Link
                          className="underline"
                          href={`/hote/menage/${menage.id}`}
                        >
                          Ouvrir
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <nav className="flex flex-wrap gap-4 text-sm">
        <Link
          className="underline"
          href={`/hote/etats-des-lieux?logement=${logement.id}`}
        >
          États des lieux
        </Link>
        <Link
          className="underline"
          href={`/hote/entretien?logement=${logement.id}`}
        >
          Entretien
        </Link>
        <Link className="underline" href={`/hote/stocks?logement=${logement.id}`}>
          Stocks
        </Link>
      </nav>
    </main>
  );
}
