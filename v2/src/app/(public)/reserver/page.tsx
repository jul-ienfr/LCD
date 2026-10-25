import Link from "next/link";
import { connection } from "next/server";
import { moyenneAvis, type Avis } from "@/domain/avis";
import { ErreurMetier } from "@/domain/erreurs";
import { sejourValide } from "@/domain/planning";
import {
  devisDirect,
  referenceDirecte,
  type DevisDirect,
} from "@/domain/reservation-directe";
import { DrizzleAvisRepository } from "@/infrastructure/db/repositories/avis-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleReservationRepository } from "@/infrastructure/db/repositories/reservation-repository";
import { DrizzleTarifRepository } from "@/infrastructure/db/repositories/tarif-repository";
import { DrizzleTenantRepository } from "@/infrastructure/db/repositories/tenant-repository";
import { formaterEuros } from "@/lib/format";
import { creerTokenVoyageur } from "@/lib/voyageur-token";
import { demanderReservationAction } from "./actions";

export const instant = false;

export default async function PageReserver({
  searchParams,
}: {
  searchParams: Promise<{
    tenant?: string;
    logement?: string;
    debut?: string;
    fin?: string;
    voyageurs?: string;
    ok?: string;
    erreur?: string;
  }>;
}) {
  await connection();
  const params = await searchParams;
  const slug = params.tenant?.trim() || "lcd";
  const tenant = await new DrizzleTenantRepository().trouverParSlug(slug);

  if (!tenant || tenant.statut !== "actif") {
    return (
      <main className="mx-auto max-w-2xl space-y-6 px-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight">
          Réservation indisponible
        </h1>
        <p className="text-encre-douce">
          Cet espace de réservation n’existe pas ou n’est pas ouvert.
        </p>
        <Link className="text-sm underline" href="/">
          Retour à l’accueil
        </Link>
      </main>
    );
  }

  const logements = (
    await new DrizzleLogementRepository().listerParTenant(tenant.id)
  ).filter((logement) => logement.statut === "actif");
  const logement = logements.find((l) => l.id === params.logement);

  const avisPublies = (
    await new DrizzleAvisRepository().listerParTenant(tenant.id)
  ).filter((avis) => avis.statut === "publie");
  const avisParLogement = new Map<string, Avis[]>();
  for (const avis of avisPublies) {
    const liste = avisParLogement.get(avis.logementId) ?? [];
    liste.push(avis);
    avisParLogement.set(avis.logementId, liste);
  }
  const avisDuLogement = logement
    ? (avisParLogement.get(logement.id) ?? [])
    : [];

  const voyageurs = Math.min(
    20,
    Math.max(1, Number(params.voyageurs) || 2),
  );
  const datesFournies = Boolean(params.debut && params.fin);
  let devis: DevisDirect | null = null;
  let erreurDevis: string | null = null;

  if (logement && datesFournies) {
    if (!sejourValide(params.debut ?? "", params.fin ?? "")) {
      erreurDevis = "Les dates du séjour sont invalides.";
    } else {
      try {
        const tarifs = await new DrizzleTarifRepository().listerParMois(
          tenant.id,
          logement.id,
          params.debut ?? "",
          params.fin ?? "",
        );
        devis = devisDirect(
          params.debut ?? "",
          params.fin ?? "",
          tarifs
            .filter((tarif) => tarif.date < (params.fin ?? ""))
            .map((tarif) => ({
              date: tarif.date,
              prixCentimes: tarif.prixCentimes,
            })),
        );
      } catch (error) {
        if (error instanceof ErreurMetier) {
          erreurDevis =
            error.code === "TARIF_MANQUANT"
              ? "Les tarifs ne sont pas encore ouverts sur cette période. Choisissez d’autres dates ou contactez l’hôte."
              : error.message;
        } else {
          throw error;
        }
      }
    }
  }

  const reservationOk = params.ok
    ? await new DrizzleReservationRepository().trouverParRef(
        tenant.id,
        params.ok,
      )
    : null;
  const tokenOk = reservationOk
    ? creerTokenVoyageur({
        tenantId: tenant.id,
        logementId: reservationOk.logementId,
        reservationId: reservationOk.id,
      })
    : null;
  const refFormulaire = referenceDirecte(crypto.randomUUID());

  return (
    <main className="mx-auto max-w-4xl space-y-10 px-6 py-12">
      <header className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-widest text-encre-faine">
          {tenant.nom} · Réservation directe
        </p>
        <h1 className="text-4xl font-semibold tracking-tight">
          Réservez votre séjour
        </h1>
        <p className="max-w-2xl text-encre-douce">
          Demande sans paiement en ligne. L’hôte confirme la disponibilité et
          vous envoie ensuite les instructions d’arrivée.
        </p>
      </header>

      {params.ok ? (
        <section
          className="rounded-2xl border border-accent bg-accent-douce p-6 text-accent"
          role="status"
        >
          <h2 className="text-lg font-semibold">Demande enregistrée</h2>
          {reservationOk ? (
            <>
              <p className="mt-2 text-sm">
                Référence <strong>{reservationOk.ref}</strong> ·{" "}
                {reservationOk.debut} → {reservationOk.fin} ·{" "}
                {formaterEuros(reservationOk.montantCentimes)}
              </p>
              <p className="mt-2 text-sm">
                Un email de confirmation vous sera envoyé après validation par
                l’hôte.
              </p>
              {tokenOk ? (
                <Link
                  className="mt-4 inline-block rounded-full bg-encre px-5 py-3 text-sm font-semibold text-fond"
                  href={`/voyageur?t=${encodeURIComponent(tokenOk)}`}
                >
                  Ouvrir mon espace séjour
                </Link>
              ) : null}
            </>
          ) : (
            <p className="mt-2 text-sm">Votre demande a bien été transmise.</p>
          )}
        </section>
      ) : null}

      {params.erreur ? (
        <p
          className="rounded-xl border border-danger bg-danger-douce p-4 text-sm text-danger"
          role="alert"
        >
          {params.erreur}
        </p>
      ) : null}

      {!logement ? (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Nos logements</h2>
          {logements.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-bordure p-6 text-encre-douce">
              Aucun logement n’est ouvert à la réservation pour le moment.
            </p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {logements.map((l) => {
                const avisLogement = avisParLogement.get(l.id) ?? [];
                const moyenne = moyenneAvis(
                  avisLogement.map((avis) => avis.note),
                );
                return (
                  <li
                    className="rounded-2xl border border-bordure bg-surface p-6 shadow-sm"
                    key={l.id}
                  >
                    <h3 className="text-lg font-semibold">{l.nom}</h3>
                    {l.adresse ? (
                      <p className="mt-1 text-sm text-encre-douce">
                        {l.adresse}
                      </p>
                    ) : null}
                    {moyenne !== null ? (
                      <p className="mt-2 text-sm">
                        <span className="text-accent">★</span> {moyenne}/5 ·{" "}
                        {avisLogement.length} avis
                      </p>
                    ) : null}
                    <Link
                      className="mt-4 inline-block rounded-full border border-bordure px-4 py-2 text-sm font-medium"
                      href={`/reserver?tenant=${encodeURIComponent(slug)}&logement=${l.id}`}
                    >
                      Voir les disponibilités
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ) : (
        <>
          <section className="rounded-2xl border border-bordure bg-surface p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">{logement.nom}</h2>
                {logement.adresse ? (
                  <p className="mt-1 text-sm text-encre-douce">
                    {logement.adresse}
                  </p>
                ) : null}
              </div>
              <Link
                className="text-sm underline"
                href={`/reserver?tenant=${encodeURIComponent(slug)}`}
              >
                Changer de logement
              </Link>
            </div>

            <form className="mt-5 grid gap-3 sm:grid-cols-4" method="get">
              <input type="hidden" name="tenant" value={slug} />
              <input type="hidden" name="logement" value={logement.id} />
              <label className="block space-y-1 text-sm font-medium">
                <span>Arrivée</span>
                <input
                  className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
                  defaultValue={params.debut ?? ""}
                  name="debut"
                  required
                  type="date"
                />
              </label>
              <label className="block space-y-1 text-sm font-medium">
                <span>Départ</span>
                <input
                  className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
                  defaultValue={params.fin ?? ""}
                  name="fin"
                  required
                  type="date"
                />
              </label>
              <label className="block space-y-1 text-sm font-medium">
                <span>Voyageurs</span>
                <input
                  className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
                  defaultValue={voyageurs}
                  max={20}
                  min={1}
                  name="voyageurs"
                  type="number"
                />
              </label>
              <div className="flex items-end">
                <button
                  className="w-full rounded-full bg-encre px-5 py-3 text-sm font-semibold text-fond"
                  type="submit"
                >
                  Calculer le prix
                </button>
              </div>
            </form>

            {erreurDevis ? (
              <p className="mt-4 rounded-xl border border-alerte bg-alerte-douce p-3 text-sm text-alerte">
                {erreurDevis}
              </p>
            ) : null}

            {devis ? (
              <div className="mt-5 rounded-2xl border border-bordure bg-surface-2 p-5">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-encre-faine">
                  Votre estimation
                </h3>
                <p className="mt-2 text-sm">
                  {devis.nuits} nuit{devis.nuits > 1 ? "s" : ""} ·{" "}
                  {formaterEuros(devis.totalCentimes)} estimés
                </p>
                <ul className="mt-3 divide-y divide-bordure text-sm">
                  {devis.lignes.map((ligne) => (
                    <li
                      className="flex justify-between py-2"
                      key={ligne.date}
                    >
                      <span>{ligne.date}</span>
                      <span>{formaterEuros(ligne.prixCentimes)}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 flex justify-between text-base font-semibold">
                  <span>Total TTC</span>
                  <span>{formaterEuros(devis.totalCentimes)}</span>
                </p>
                <p className="mt-2 text-xs text-encre-faine">
                  Taxe de séjour et extras éventuels seront précisés sur la
                  facture.
                </p>

                <form
                  action={demanderReservationAction}
                  className="mt-5 space-y-3"
                >
                  <input type="hidden" name="tenant" value={slug} />
                  <input type="hidden" name="logementId" value={logement.id} />
                  <input type="hidden" name="debut" value={params.debut} />
                  <input type="hidden" name="fin" value={params.fin} />
                  <input type="hidden" name="voyageurs" value={voyageurs} />
                  <input type="hidden" name="ref" value={refFormulaire} />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block space-y-1 text-sm font-medium">
                      <span>Nom complet</span>
                      <input
                        autoComplete="name"
                        className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
                        name="nom"
                        required
                      />
                    </label>
                    <label className="block space-y-1 text-sm font-medium">
                      <span>Email</span>
                      <input
                        autoComplete="email"
                        className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
                        name="email"
                        required
                        type="email"
                      />
                    </label>
                  </div>
                  <label className="hidden">
                    <span>Site</span>
                    <input name="site" tabIndex={-1} />
                  </label>
                  <button
                    className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-fond"
                    type="submit"
                  >
                    Envoyer la demande
                  </button>
                  <p className="text-xs text-encre-faine">
                    Aucun paiement n’est demandé maintenant. La demande devient
                    une réservation après confirmation de l’hôte.
                  </p>
                </form>
              </div>
            ) : null}
          </section>

          <p className="text-sm text-encre-faine">
            Un doute sur les dates ou le tarif ? Contactez directement l’hôte
            avant d’envoyer la demande.
          </p>

          {avisDuLogement.length > 0 ? (
            <section className="space-y-4" id="avis">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-lg font-semibold">Avis voyageurs</h2>
                <p className="text-sm text-encre-douce">
                  {moyenneAvis(avisDuLogement.map((avis) => avis.note))}/5 ·{" "}
                  {avisDuLogement.length} avis
                </p>
              </div>
              <ul className="space-y-3">
                {avisDuLogement.slice(0, 5).map((avis) => (
                  <li
                    className="rounded-2xl border border-bordure bg-surface p-5 shadow-sm"
                    key={avis.id}
                  >
                    <p className="font-medium">{avis.nom}</p>
                    <p className="text-sm">
                      {"★".repeat(avis.note)}
                      <span className="text-encre-faine">
                        {"★".repeat(5 - avis.note)}
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-encre-faine">
                      {avis.createdAt.toISOString().slice(0, 10)}
                    </p>
                    {avis.commentaire ? (
                      <p className="mt-2 whitespace-pre-line text-sm text-encre-douce">
                        {avis.commentaire}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      )}

      <nav className="flex flex-wrap gap-4 text-sm">
        <Link className="underline" href="/">
          Accueil
        </Link>
        <Link className="underline" href="/voyageur">
          Espace voyageur
        </Link>
      </nav>
    </main>
  );
}
