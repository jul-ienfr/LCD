import Link from "next/link";
import { connection } from "next/server";
import { nuitsSejour } from "@/domain/planning";
import { DrizzleIncidentRepository } from "@/infrastructure/db/repositories/incident-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleReservationRepository } from "@/infrastructure/db/repositories/reservation-repository";
import { verifierTokenVoyageur } from "@/lib/voyageur-token";
import { FormulaireIncident } from "./formulaire-incident";

export const instant = false;

function PageGenerique() {
  return (
    <main className="mx-auto max-w-2xl space-y-8 px-6 py-12">
      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-widest text-stone-500">
          Espace voyageur
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Votre séjour</h1>
        <p className="text-stone-600">
          Ouvrez le lien personnel reçu par SMS ou email pour accéder à votre
          séjour, votre guide et le formulaire d’incident.
        </p>
      </header>

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Besoin d’aide ?</h2>
        <p className="mt-2 text-stone-600">
          Si vous n’avez pas reçu votre lien, contactez votre hôte. En cas
          d’urgence, utilisez le numéro d’urgence présent dans votre logement.
        </p>
      </section>

      <Link className="text-sm underline" href="/">
        Retour à l’accueil
      </Link>
    </main>
  );
}

function PageInvalide() {
  return (
    <main className="mx-auto max-w-2xl space-y-8 px-6 py-12">
      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-widest text-stone-500">
          Espace voyageur
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Votre séjour</h1>
        <p className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900">
          Ce lien est invalide ou expiré. Demandez un nouveau lien à votre hôte.
        </p>
      </header>
      <Link className="text-sm underline" href="/">
        Retour à l’accueil
      </Link>
    </main>
  );
}

export default async function PageVoyageur({
  searchParams,
}: {
  searchParams: Promise<{ t?: string; incident?: string }>;
}) {
  await connection();

  const params = await searchParams;
  if (!params.t) return <PageGenerique />;

  const payload = verifierTokenVoyageur(params.t);
  if (!payload) return <PageInvalide />;

  const reservation = await new DrizzleReservationRepository().trouverParId(
    payload.tenantId,
    payload.reservationId,
  );
  if (!reservation || reservation.logementId !== payload.logementId) {
    return <PageInvalide />;
  }

  const logement = await new DrizzleLogementRepository().trouverParId(
    payload.tenantId,
    payload.logementId,
  );
  if (!logement) return <PageInvalide />;

  const incidents = await new DrizzleIncidentRepository().listerParReservation(
    payload.tenantId,
    reservation.id,
  );

  const nuits = nuitsSejour(reservation.debut, reservation.fin);
  const refInitial = crypto.randomUUID();

  return (
    <main className="mx-auto max-w-2xl space-y-8 px-6 py-12">
      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-widest text-stone-500">
          Espace voyageur
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Votre séjour
        </h1>
        <p className="text-stone-600">
          {logement.nom}
          {logement.adresse ? ` — ${logement.adresse}` : ""}
        </p>
      </header>

      {params.incident === "ok" ? (
        <p className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900">
          Signalement envoyé. L’hôte en est informé.
        </p>
      ) : null}
      {params.incident === "erreur" ? (
        <p className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800">
          Le signalement n’a pas pu être envoyé. Réessayez ou contactez l’hôte.
        </p>
      ) : null}

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Séjour {reservation.ref}</h2>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-stone-500">Arrivée</dt>
            <dd className="font-medium">{reservation.debut}</dd>
          </div>
          <div>
            <dt className="text-stone-500">Départ</dt>
            <dd className="font-medium">{reservation.fin}</dd>
          </div>
          <div>
            <dt className="text-stone-500">Nuits</dt>
            <dd className="font-medium">{nuits}</dd>
          </div>
          <div>
            <dt className="text-stone-500">Voyageurs</dt>
            <dd className="font-medium">{reservation.voyageurs}</dd>
          </div>
        </dl>
        {reservation.clientNom ? (
          <p className="mt-3 text-sm text-stone-600">
            Au nom de {reservation.clientNom}.
          </p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Signaler un incident</h2>
        <p className="mt-1 mb-4 text-sm text-stone-600">
          Le formulaire fonctionne sans JavaScript. Si vous êtes hors ligne, il
          est mis en attente et envoyé au retour du réseau.
        </p>
        <FormulaireIncident refInitial={refInitial} token={params.t} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Vos signalements</h2>
        {incidents.length === 0 ? (
          <p className="text-sm text-stone-600">Aucun signalement pour ce séjour.</p>
        ) : (
          <ul className="divide-y divide-stone-200 rounded-2xl border border-stone-200 bg-white">
            {incidents.map((incident) => (
              <li className="p-4" key={incident.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{incident.ref}</p>
                  <span className="rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-700">
                    {incident.statut}
                  </span>
                </div>
                <p className="mt-1 whitespace-pre-line text-sm text-stone-600">
                  {incident.message}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Link className="text-sm underline" href="/">
        Retour à l’accueil
      </Link>
    </main>
  );
}
