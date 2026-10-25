import Link from "next/link";
import { connection } from "next/server";
import { nuitsSejour } from "@/domain/planning";
import { DrizzleCommandeExtraRepository } from "@/infrastructure/db/repositories/commande-extra-repository";
import { DrizzleExtraRepository } from "@/infrastructure/db/repositories/extra-repository";
import { DrizzleIncidentRepository } from "@/infrastructure/db/repositories/incident-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleReservationRepository } from "@/infrastructure/db/repositories/reservation-repository";
import { formaterEuros } from "@/lib/format";
import {
  LANGUES,
  dictionnaire,
  langueDepuisParam,
  type Langue,
  type Traductions,
} from "@/lib/i18n";
import { verifierTokenVoyageur } from "@/lib/voyageur-token";
import { commanderExtraAction } from "./actions";
import { FormulaireIncident } from "./formulaire-incident";

export const instant = false;

function SelecteurLangue({
  token,
  langue,
  label,
}: {
  token?: string;
  langue: Langue;
  label: string;
}) {
  const base = token
    ? `/voyageur?t=${encodeURIComponent(token)}&lang=`
    : "/voyageur?lang=";

  return (
    <nav aria-label={label} className="flex flex-wrap gap-2 pt-2">
      {LANGUES.map((code) => (
        <Link
          aria-current={code === langue ? "true" : undefined}
          className={
            code === langue
              ? "rounded-full bg-stone-900 px-3 py-1 text-xs font-medium text-white"
              : "rounded-full border border-stone-300 px-3 py-1 text-xs font-medium"
          }
          href={`${base}${code}`}
          key={code}
        >
          {code.toUpperCase()}
        </Link>
      ))}
    </nav>
  );
}

function PageGenerique({
  d,
  langue,
}: {
  d: Traductions;
  langue: Langue;
}) {
  return (
    <main className="mx-auto max-w-2xl space-y-8 px-6 py-12">
      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-widest text-stone-500">
          {d.espaceVoyageur}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          {d.votreSejour}
        </h1>
        <p className="text-stone-600">{d.ouvrirLien}</p>
        <SelecteurLangue label={d.langue} langue={langue} />
      </header>

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">{d.besoinAide}</h2>
        <p className="mt-2 text-stone-600">{d.aideTexte}</p>
      </section>

      <Link className="text-sm underline" href="/">
        {d.retourAccueil}
      </Link>
    </main>
  );
}

function PageInvalide({
  d,
  langue,
}: {
  d: Traductions;
  langue: Langue;
}) {
  return (
    <main className="mx-auto max-w-2xl space-y-8 px-6 py-12">
      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-widest text-stone-500">
          {d.espaceVoyageur}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          {d.votreSejour}
        </h1>
        <p className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900">
          {d.lienInvalide}
        </p>
        <SelecteurLangue label={d.langue} langue={langue} />
      </header>
      <Link className="text-sm underline" href="/">
        {d.retourAccueil}
      </Link>
    </main>
  );
}

export default async function PageVoyageur({
  searchParams,
}: {
  searchParams: Promise<{
    t?: string;
    incident?: string;
    extras?: string;
    lang?: string;
  }>;
}) {
  await connection();

  const params = await searchParams;
  const langue = langueDepuisParam(params.lang);
  const d = dictionnaire(langue);
  if (!params.t) return <PageGenerique d={d} langue={langue} />;

  const payload = verifierTokenVoyageur(params.t);
  if (!payload) return <PageInvalide d={d} langue={langue} />;

  const reservation = await new DrizzleReservationRepository().trouverParId(
    payload.tenantId,
    payload.reservationId,
  );
  if (!reservation || reservation.logementId !== payload.logementId) {
    return <PageInvalide d={d} langue={langue} />;
  }

  const logement = await new DrizzleLogementRepository().trouverParId(
    payload.tenantId,
    payload.logementId,
  );
  if (!logement) return <PageInvalide d={d} langue={langue} />;

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
          {d.espaceVoyageur}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          {d.votreSejour}
        </h1>
        <p className="text-stone-600">
          {logement.nom}
          {logement.adresse ? ` — ${logement.adresse}` : ""}
        </p>
        <SelecteurLangue
          label={d.langue}
          langue={langue}
          token={params.t}
        />
      </header>

      {params.incident === "ok" ? (
        <p className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900">
          {d.incidentOk}
        </p>
      ) : null}
      {params.incident === "erreur" ? (
        <p className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800">
          {d.incidentErreur}
        </p>
      ) : null}

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">
          {d.sejour} {reservation.ref}
        </h2>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-stone-500">{d.arrivee}</dt>
            <dd className="font-medium">{reservation.debut}</dd>
          </div>
          <div>
            <dt className="text-stone-500">{d.depart}</dt>
            <dd className="font-medium">{reservation.fin}</dd>
          </div>
          <div>
            <dt className="text-stone-500">{d.nuits}</dt>
            <dd className="font-medium">{nuits}</dd>
          </div>
          <div>
            <dt className="text-stone-500">{d.voyageurs}</dt>
            <dd className="font-medium">{reservation.voyageurs}</dd>
          </div>
        </dl>
        {reservation.clientNom ? (
          <p className="mt-3 text-sm text-stone-600">
            {d.auNomDe} {reservation.clientNom}.
          </p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">{d.guideLogement}</h2>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          {logement.checkinHeure ? (
            <div>
              <dt className="text-stone-500">{d.checkin}</dt>
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
              <dt className="text-stone-500">{d.motDePasseWifi}</dt>
              <dd className="font-mono font-medium">{logement.wifiPassword}</dd>
            </div>
          ) : null}
          {logement.urgenceTel ? (
            <div>
              <dt className="text-stone-500">{d.urgence}</dt>
              <dd className="font-medium">{logement.urgenceTel}</dd>
            </div>
          ) : null}
        </dl>
        {logement.checkinInstructions ? (
          <div className="mt-4">
            <h3 className="text-sm font-semibold">{d.arrivee}</h3>
            <p className="mt-1 whitespace-pre-line text-sm text-stone-600">
              {logement.checkinInstructions}
            </p>
          </div>
        ) : null}
        {logement.regles ? (
          <div className="mt-4">
            <h3 className="text-sm font-semibold">{d.regles}</h3>
            <p className="mt-1 whitespace-pre-line text-sm text-stone-600">
              {logement.regles}
            </p>
          </div>
        ) : null}
        {logement.guideTexte ? (
          <div className="mt-4">
            <h3 className="text-sm font-semibold">{d.bonnesAdresses}</h3>
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
          <p className="mt-3 text-sm text-stone-600">{d.guideACompleter}</p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">{d.extras}</h2>
        {params.extras === "ok" ? (
          <p className="mt-2 rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900">
            {d.commandeEnregistree}
          </p>
        ) : null}
        {params.extras === "erreur" ? (
          <p className="mt-2 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-800">
            {d.commandeErreur}
          </p>
        ) : null}

        {extras.length === 0 ? (
          <p className="mt-3 text-sm text-stone-600">{d.aucunExtra}</p>
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
                  <input name="langue" type="hidden" value={langue} />
                  <input name="extraId" type="hidden" value={extra.id} />
                  <input
                    name="ref"
                    type="hidden"
                    value={crypto.randomUUID()}
                  />
                  <label className="text-sm text-stone-600">
                    {d.quantite}
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
                    {d.commander}
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}

        {commandes.length > 0 ? (
          <div className="mt-5 border-t border-stone-200 pt-4">
            <h3 className="text-sm font-semibold">{d.vosCommandes}</h3>
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
                    {d.statutsCommande[commande.statut]} ·{" "}
                    {formaterEuros(commande.totalCentimes)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">{d.signalerIncident}</h2>
        <p className="mt-1 mb-4 text-sm text-stone-600">{d.incidentTexte}</p>
        <FormulaireIncident
          langue={langue}
          refInitial={refInitial}
          token={params.t}
          traductions={d}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{d.vosSignalements}</h2>
        {incidents.length === 0 ? (
          <p className="text-sm text-stone-600">{d.aucunSignalement}</p>
        ) : (
          <ul className="divide-y divide-stone-200 rounded-2xl border border-stone-200 bg-white">
            {incidents.map((incident) => (
              <li className="p-4" key={incident.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{incident.ref}</p>
                  <span className="rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-700">
                    {d.statutsIncident[incident.statut]}
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
        {d.retourAccueil}
      </Link>
    </main>
  );
}
