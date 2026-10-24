import Link from "next/link";
import { connection } from "next/server";
import { nuitsSejour } from "@/domain/planning";
import { DrizzleCommandeExtraRepository } from "@/infrastructure/db/repositories/commande-extra-repository";
import { DrizzleExtraRepository } from "@/infrastructure/db/repositories/extra-repository";
import { DrizzleIncidentRepository } from "@/infrastructure/db/repositories/incident-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleReservationRepository } from "@/infrastructure/db/repositories/reservation-repository";
import { formaterEuros } from "@/lib/format";
import { verifierTokenVoyageur } from "@/lib/voyageur-token";
import { commanderExtraAction } from "./actions";
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
  searchParams: Promise<{ t?: string; incident?: string; extras?: string }>;
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
  const extras = (
    await new DrizzleExtraRepository().listerActifs(payload.tenantId)
  ).filter(
    (extra) =>
      extra.logementId === null || extra.logementId === logement.id,
  );
  const commandes =
    await new DrizzleCommandeExtraRepository().listerParReservation(
      payload.tenantId,
      reservation.id,
    );
  const parExtra = new Map(extras.map((extra) => [extra.id, extra]));

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
        <h2 className="text-lg font-semibold">Guide du logement</h2>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          {logement.checkinHeure ? (
            <div>
              <dt className="text-stone-500">Check-in</dt>
              <dd className="font-medium">{logement.checkinHeure}</dd>
            </div>
          ) : null}
          {logement.wifiSsid ? (
            <div>
              <dt className="text-stone-500">WiFi</dt>
              <dd className="font-medium">{logement.wifiSsid}</dd>
            </div>
          ) : null}
          {logement.wifiPassword ? (
            <div>
              <dt className="text-stone-500">Mot de passe WiFi</dt>
              <dd className="font-mono font-medium">{logement.wifiPassword}</dd>
            </div>
          ) : null}
          {logement.urgenceTel ? (
            <div>
              <dt className="text-stone-500">Urgence</dt>
              <dd className="font-medium">{logement.urgenceTel}</dd>
            </div>
          ) : null}
        </dl>
        {logement.checkinInstructions ? (
          <div className="mt-4">
            <h3 className="text-sm font-semibold">Arrivée</h3>
            <p className="mt-1 whitespace-pre-line text-sm text-stone-600">
              {logement.checkinInstructions}
            </p>
          </div>
        ) : null}
        {logement.regles ? (
          <div className="mt-4">
            <h3 className="text-sm font-semibold">Règles</h3>
            <p className="mt-1 whitespace-pre-line text-sm text-stone-600">
              {logement.regles}
            </p>
          </div>
        ) : null}
        {logement.guideTexte ? (
          <div className="mt-4">
            <h3 className="text-sm font-semibold">Bonnes adresses</h3>
            <p className="mt-1 whitespace-pre-line text-sm text-stone-600">
              {logement.guideTexte}
            </p>
          </div>
        ) : null}
        {!logement.checkinHeure &&
        !logement.wifiSsid &&
        !logement.checkinInstructions &&
        !logement.regles &&
        !logement.guideTexte ? (
          <p className="mt-3 text-sm text-stone-600">
            Le guide sera complété par votre hôte.
          </p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Extras</h2>
        {params.extras === "ok" ? (
          <p className="mt-2 rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900">
            Commande enregistrée. Votre hôte la confirmera.
          </p>
        ) : null}
        {params.extras === "erreur" ? (
          <p className="mt-2 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-800">
            La commande n’a pas pu être enregistrée.
          </p>
        ) : null}

        {extras.length === 0 ? (
          <p className="mt-3 text-sm text-stone-600">
            Aucun extra disponible pour ce séjour.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-stone-100">
            {extras.map((extra) => (
              <li className="py-3" key={extra.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{extra.nom}</p>
                    {extra.description ? (
                      <p className="text-sm text-stone-600">
                        {extra.description}
                      </p>
                    ) : null}
                  </div>
                  <p className="font-medium">
                    {formaterEuros(extra.prixCentimes)}
                  </p>
                </div>
                <form
                  action={commanderExtraAction}
                  className="mt-2 flex flex-wrap items-center gap-2"
                >
                  <input name="token" type="hidden" value={params.t} />
                  <input name="extraId" type="hidden" value={extra.id} />
                  <input
                    name="ref"
                    type="hidden"
                    value={crypto.randomUUID()}
                  />
                  <label className="text-sm text-stone-600">
                    Quantité
                    <input
                      className="ml-2 w-16 rounded-lg border border-stone-300 p-1 text-center"
                      defaultValue={1}
                      max={20}
                      min={1}
                      name="quantite"
                      type="number"
                    />
                  </label>
                  <button
                    className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium"
                    type="submit"
                  >
                    Commander
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}

        {commandes.length > 0 ? (
          <div className="mt-5 border-t border-stone-200 pt-4">
            <h3 className="text-sm font-semibold">Vos commandes</h3>
            <ul className="mt-2 space-y-2 text-sm">
              {commandes.map((commande) => (
                <li
                  className="flex flex-wrap items-center justify-between gap-2"
                  key={commande.id}
                >
                  <span>
                    {parExtra.get(commande.extraId)?.nom ??
                      commande.extraId}{" "}
                    × {commande.quantite}
                  </span>
                  <span className="text-stone-500">
                    {commande.statut} · {formaterEuros(commande.totalCentimes)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
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
