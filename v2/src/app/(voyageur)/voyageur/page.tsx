import Link from "next/link";
import { connection } from "next/server";
import { nuitsSejour } from "@/domain/planning";
import { ListerLieuxTourisme } from "@/application/use-cases/tourisme";
import { LireMemoireVoyageur } from "@/application/use-cases/memoire";
import {
  CATEGORIES_LIEU,
  LIBELLES_CATEGORIE,
  filtrerLieux,
} from "@/domain/tourisme";
import { DrizzleAvisRepository } from "@/infrastructure/db/repositories/avis-repository";
import { DrizzleCommandeExtraRepository } from "@/infrastructure/db/repositories/commande-extra-repository";
import { DrizzleExtraRepository } from "@/infrastructure/db/repositories/extra-repository";
import { DrizzleIncidentRepository } from "@/infrastructure/db/repositories/incident-repository";
import { DrizzleLieuxTourismeRepository } from "@/infrastructure/db/repositories/lieux-tourisme-repository";
import { DrizzleMemoireRepository } from "@/infrastructure/db/repositories/memoire-repository";
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
import { avisVoyageurAction, commanderExtraAction, memoireVoyageurAction } from "./actions";
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
              ? "rounded-full bg-encre px-3 py-1 text-xs font-medium text-fond"
              : "rounded-full border border-bordure px-3 py-1 text-xs font-medium"
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
        <p className="text-sm font-medium uppercase tracking-widest text-encre-faine">
          {d.espaceVoyageur}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          {d.votreSejour}
        </h1>
        <p className="text-encre-douce">{d.ouvrirLien}</p>
        <SelecteurLangue label={d.langue} langue={langue} />
      </header>

      <section className="rounded-2xl border border-bordure bg-surface p-6 shadow-sm">
        <h2 className="text-lg font-semibold">{d.besoinAide}</h2>
        <p className="mt-2 text-encre-douce">{d.aideTexte}</p>
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
        <p className="text-sm font-medium uppercase tracking-widest text-encre-faine">
          {d.espaceVoyageur}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          {d.votreSejour}
        </h1>
        <p className="rounded-xl border border-alerte bg-alerte-douce p-4 text-alerte">
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
    cat?: string;
    memoire?: string;
    avis?: string;
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
  const lieux = await new ListerLieuxTourisme(
    new DrizzleLieuxTourismeRepository(),
  ).executer(payload.tenantId, logement.id);
  const lieuxAffiches = filtrerLieux(lieux, params.cat);
  const categoriesPresentes = CATEGORIES_LIEU.filter((categorie) =>
    lieux.some((lieu) => lieu.categorie === categorie),
  );
  const baseLieux = `/voyageur?t=${encodeURIComponent(params.t)}&lang=${langue}`;
  const memoire = await new LireMemoireVoyageur(
    new DrizzleMemoireRepository(),
  ).executer(payload.tenantId, reservation.clientEmail);
  const avisExistant =
    await new DrizzleAvisRepository().trouverParReservation(
      payload.tenantId,
      reservation.id,
    );

  const nuits = nuitsSejour(reservation.debut, reservation.fin);
  const refInitial = crypto.randomUUID();

  return (
    <main className="mx-auto max-w-2xl space-y-8 px-6 py-12">
      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-widest text-encre-faine">
          {d.espaceVoyageur}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          {d.votreSejour}
        </h1>
        <p className="text-encre-douce">
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
        <p className="rounded-xl border border-accent bg-accent-douce p-4 text-sm text-accent">
          {d.incidentOk}
        </p>
      ) : null}
      {params.incident === "erreur" ? (
        <p className="rounded-xl border border-danger bg-danger-douce p-4 text-sm text-danger">
          {d.incidentErreur}
        </p>
      ) : null}

      <section className="rounded-2xl border border-bordure bg-surface p-6 shadow-sm">
        <h2 className="text-lg font-semibold">
          {d.sejour} {reservation.ref}
        </h2>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-encre-faine">{d.arrivee}</dt>
            <dd className="font-medium">{reservation.debut}</dd>
          </div>
          <div>
            <dt className="text-encre-faine">{d.depart}</dt>
            <dd className="font-medium">{reservation.fin}</dd>
          </div>
          <div>
            <dt className="text-encre-faine">{d.nuits}</dt>
            <dd className="font-medium">{nuits}</dd>
          </div>
          <div>
            <dt className="text-encre-faine">{d.voyageurs}</dt>
            <dd className="font-medium">{reservation.voyageurs}</dd>
          </div>
        </dl>
        {reservation.clientNom ? (
          <p className="mt-3 text-sm text-encre-douce">
            {d.auNomDe} {reservation.clientNom}.
          </p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-bordure bg-surface p-6 shadow-sm">
        <h2 className="text-lg font-semibold">{d.guideLogement}</h2>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          {logement.checkinHeure ? (
            <div>
              <dt className="text-encre-faine">{d.checkin}</dt>
              <dd className="font-medium">{logement.checkinHeure}</dd>
            </div>
          ) : null}
          {logement.wifiSsid ? (
            <div>
              <dt className="text-encre-faine">WiFi</dt>
              <dd className="font-medium">{logement.wifiSsid}</dd>
            </div>
          ) : null}
          {logement.wifiPassword ? (
            <div>
              <dt className="text-encre-faine">{d.motDePasseWifi}</dt>
              <dd className="font-mono font-medium">{logement.wifiPassword}</dd>
            </div>
          ) : null}
          {logement.urgenceTel ? (
            <div>
              <dt className="text-encre-faine">{d.urgence}</dt>
              <dd className="font-medium">{logement.urgenceTel}</dd>
            </div>
          ) : null}
        </dl>
        {logement.checkinInstructions ? (
          <div className="mt-4">
            <h3 className="text-sm font-semibold">{d.arrivee}</h3>
            <p className="mt-1 whitespace-pre-line text-sm text-encre-douce">
              {logement.checkinInstructions}
            </p>
          </div>
        ) : null}
        {logement.regles ? (
          <div className="mt-4">
            <h3 className="text-sm font-semibold">{d.regles}</h3>
            <p className="mt-1 whitespace-pre-line text-sm text-encre-douce">
              {logement.regles}
            </p>
          </div>
        ) : null}
        {logement.guideTexte ? (
          <div className="mt-4">
            <h3 className="text-sm font-semibold">{d.bonnesAdresses}</h3>
            <p className="mt-1 whitespace-pre-line text-sm text-encre-douce">
              {logement.guideTexte}
            </p>
          </div>
        ) : null}
        {!logement.checkinHeure &&
        !logement.wifiSsid &&
        !logement.checkinInstructions &&
        !logement.regles &&
        !logement.guideTexte ? (
          <p className="mt-3 text-sm text-encre-douce">{d.guideACompleter}</p>
        ) : null}
      </section>

      {lieux.length > 0 ? (
        <section
          className="rounded-2xl border border-bordure bg-surface p-6 shadow-sm"
          id="tourisme"
        >
          <h2 className="text-lg font-semibold">{d.tourisme}</h2>
          <nav aria-label={d.tourisme} className="mt-3 flex flex-wrap gap-2">
            <Link
              aria-current={!params.cat ? "page" : undefined}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${
                !params.cat
                  ? "border-accent bg-accent-douce text-accent"
                  : "border-bordure"
              }`}
              href={baseLieux}
            >
              {d.tousLesLieux}
            </Link>
            {categoriesPresentes.map((categorie) => (
              <Link
                aria-current={params.cat === categorie ? "page" : undefined}
                className={`rounded-full border px-3 py-1 text-xs font-medium ${
                  params.cat === categorie
                    ? "border-accent bg-accent-douce text-accent"
                    : "border-bordure"
                }`}
                href={`${baseLieux}&cat=${categorie}`}
                key={categorie}
              >
                {LIBELLES_CATEGORIE[categorie]}
              </Link>
            ))}
          </nav>
          {lieuxAffiches.length === 0 ? (
            <p className="mt-3 text-sm text-encre-douce">{d.aucunLieu}</p>
          ) : (
            <ul className="mt-4 divide-y divide-bordure">
              {lieuxAffiches.map((lieu) => (
                <li className="py-3" key={lieu.id}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{lieu.nom}</p>
                      <p className="text-xs text-encre-faine">
                        {LIBELLES_CATEGORIE[lieu.categorie]}
                        {lieu.commune ? ` · ${lieu.commune}` : ""}
                      </p>
                      {lieu.acces ? (
                        <p className="mt-1 text-sm text-encre-douce">
                          {lieu.acces}
                        </p>
                      ) : null}
                    </div>
                    {lieu.prixIndicatif ? (
                      <p className="text-sm font-medium">
                        {lieu.prixIndicatif}
                      </p>
                    ) : null}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-3 text-sm">
                    {lieu.lien ? (
                      <a
                        className="underline"
                        href={lieu.lien}
                        rel="noreferrer noopener"
                        target="_blank"
                      >
                        {lieu.nom}
                      </a>
                    ) : null}
                    {lieu.extraId ? (
                      <a className="underline" href="#extras">
                        {d.reserverExtra}
                      </a>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {reservation.clientEmail ? (
        <section
          className="rounded-2xl border border-bordure bg-surface p-6 shadow-sm"
          id="memoire"
        >
          <h2 className="text-lg font-semibold">{d.memoire}</h2>
          <p className="mt-2 text-sm text-encre-douce">{d.memoireTexte}</p>
          {params.memoire === "ok" ? (
            <p className="mt-3 rounded-xl border border-accent bg-accent-douce p-3 text-sm text-accent">
              {d.memoireOk}
            </p>
          ) : null}
          {params.memoire === "oublie" ? (
            <p className="mt-3 rounded-xl border border-accent bg-accent-douce p-3 text-sm text-accent">
              {d.memoireOublie}
            </p>
          ) : null}
          {params.memoire === "erreur" ? (
            <p className="mt-3 rounded-xl border border-danger bg-danger-douce p-3 text-sm text-danger">
              {d.memoireErreur}
            </p>
          ) : null}
          {memoire ? (
            <p className="mt-3 text-xs text-encre-faine">
              {d.memoireOk} {memoire.expireAt.toISOString().slice(0, 10)}
            </p>
          ) : null}
          <form action={memoireVoyageurAction} className="mt-4 space-y-3">
            <input name="token" type="hidden" value={params.t} />
            <input name="langue" type="hidden" value={langue} />
            <input name="intention" type="hidden" value="memoriser" />
            <label className="block space-y-1 text-sm font-medium">
              <span>{d.memoireNom}</span>
              <input
                className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
                defaultValue={memoire?.nom ?? reservation.clientNom ?? ""}
                name="nom"
                required
              />
            </label>
            <label className="block space-y-1 text-sm font-medium">
              <span>{d.memoireChamp}</span>
              <textarea
                className="min-h-24 w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
                defaultValue={memoire?.preferences ?? ""}
                name="preferences"
              />
            </label>
            {memoire ? (
              <input name="consentement" type="hidden" value="on" />
            ) : (
              <label className="flex items-start gap-2 text-sm text-encre-douce">
                <input
                  className="mt-1"
                  name="consentement"
                  required
                  type="checkbox"
                />
                <span>{d.memoireConsentement}</span>
              </label>
            )}
            <button
              className="rounded-full bg-encre px-5 py-3 text-sm font-semibold text-fond"
              type="submit"
            >
              {memoire ? d.memoireMettreAJour : d.memoireEnregistrer}
            </button>
          </form>
          {memoire ? (
            <form action={memoireVoyageurAction} className="mt-3">
              <input name="token" type="hidden" value={params.t} />
              <input name="langue" type="hidden" value={langue} />
              <input name="intention" type="hidden" value="oublier" />
              <button
                className="text-sm text-danger underline"
                type="submit"
              >
                {d.memoireOublier}
              </button>
            </form>
          ) : null}
        </section>
      ) : null}

      <section
        className="rounded-2xl border border-bordure bg-surface p-6 shadow-sm"
        id="avis"
      >
        <h2 className="text-lg font-semibold">{d.avis}</h2>
        <p className="mt-2 text-sm text-encre-douce">{d.avisTexte}</p>
        {params.t ? (
          <p className="mt-2 text-sm">
            <Link
              className="underline"
              href={`/questionnaire/${encodeURIComponent(params.t)}`}
            >
              {d.questionnaireLien}
            </Link>
          </p>
        ) : null}
        {params.avis === "ok" ? (
          <p className="mt-3 rounded-xl border border-accent bg-accent-douce p-3 text-sm text-accent">
            {d.avisOk}
          </p>
        ) : null}
        {params.avis === "erreur" ? (
          <p className="mt-3 rounded-xl border border-danger bg-danger-douce p-3 text-sm text-danger">
            {d.avisErreur}
          </p>
        ) : null}
        {avisExistant ? (
          <div className="mt-4 rounded-xl border border-bordure bg-surface-2 p-4 text-sm">
            <p>{d.avisDeja}</p>
            <p className="mt-1 font-medium">
              {"★".repeat(avisExistant.note)}
              <span className="text-encre-faine">
                {"★".repeat(5 - avisExistant.note)}
              </span>
            </p>
            {avisExistant.commentaire ? (
              <p className="mt-1 whitespace-pre-line text-encre-douce">
                {avisExistant.commentaire}
              </p>
            ) : null}
          </div>
        ) : (
          <form action={avisVoyageurAction} className="mt-4 space-y-3">
            <input name="token" type="hidden" value={params.t} />
            <input name="langue" type="hidden" value={langue} />
            <input name="ref" type="hidden" value={crypto.randomUUID()} />
            <label className="block space-y-1 text-sm font-medium">
              <span>{d.memoireNom}</span>
              <input
                className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
                defaultValue={reservation.clientNom ?? ""}
                name="nom"
                required
              />
            </label>
            <label className="block space-y-1 text-sm font-medium">
              <span>{d.avisNote}</span>
              <select
                className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
                defaultValue="5"
                name="note"
              >
                <option value="5">5 — excellent</option>
                <option value="4">4 — très bien</option>
                <option value="3">3 — correct</option>
                <option value="2">2 — moyen</option>
                <option value="1">1 — à améliorer</option>
              </select>
            </label>
            <label className="block space-y-1 text-sm font-medium">
              <span>{d.avisCommentaire}</span>
              <textarea
                className="min-h-24 w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
                name="commentaire"
              />
            </label>
            <button
              className="rounded-full bg-encre px-5 py-3 text-sm font-semibold text-fond"
              type="submit"
            >
              {d.avisEnvoyer}
            </button>
          </form>
        )}
      </section>

      <section
        className="rounded-2xl border border-bordure bg-surface p-6 shadow-sm"
        id="extras"
      >
        <h2 className="text-lg font-semibold">{d.extras}</h2>
        {params.extras === "ok" ? (
          <p className="mt-2 rounded-xl border border-accent bg-accent-douce p-3 text-sm text-accent">
            {d.commandeEnregistree}
          </p>
        ) : null}
        {params.extras === "erreur" ? (
          <p className="mt-2 rounded-xl border border-danger bg-danger-douce p-3 text-sm text-danger">
            {d.commandeErreur}
          </p>
        ) : null}

        {extras.length === 0 ? (
          <p className="mt-3 text-sm text-encre-douce">{d.aucunExtra}</p>
        ) : (
          <ul className="mt-4 divide-y divide-bordure">
            {extras.map((extra) => (
              <li className="py-3" key={extra.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{extra.nom}</p>
                    {extra.description ? (
                      <p className="text-sm text-encre-douce">
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
                  <label className="text-sm text-encre-douce">
                    {d.quantite}
                    <input
                      className="ml-2 w-16 rounded-lg border border-bordure p-1 text-center"
                      defaultValue={1}
                      max={20}
                      min={1}
                      name="quantite"
                      type="number"
                    />
                  </label>
                  <button
                    className="rounded-full border border-bordure px-4 py-2 text-sm font-medium"
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
          <div className="mt-5 border-t border-bordure pt-4">
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
                  <span className="text-encre-faine">
                    {d.statutsCommande[commande.statut]} ·{" "}
                    {formaterEuros(commande.totalCentimes)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-bordure bg-surface p-6 shadow-sm">
        <h2 className="text-lg font-semibold">{d.signalerIncident}</h2>
        <p className="mt-1 mb-4 text-sm text-encre-douce">{d.incidentTexte}</p>
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
          <p className="text-sm text-encre-douce">{d.aucunSignalement}</p>
        ) : (
          <ul className="divide-y divide-bordure rounded-2xl border border-bordure bg-surface">
            {incidents.map((incident) => (
              <li className="p-4" key={incident.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{incident.ref}</p>
                  <span className="rounded-full bg-surface-2 px-3 py-1 text-xs text-encre-douce">
                    {d.statutsIncident[incident.statut]}
                  </span>
                </div>
                <p className="mt-1 whitespace-pre-line text-sm text-encre-douce">
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
