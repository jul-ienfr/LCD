import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { construireContrat } from "@/domain/contrat";
import { DrizzleCautionRepository } from "@/infrastructure/db/repositories/caution-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleReservationRepository } from "@/infrastructure/db/repositories/reservation-repository";
import { DrizzleTenantRepository } from "@/infrastructure/db/repositories/tenant-repository";
import { formaterEuros } from "@/lib/format";
import { verifierTokenVoyageur } from "@/lib/voyageur-token";
import { BoutonImprimer } from "@/app/(staff)/hote/factures/bouton-imprimer";

export const instant = false;

export const metadata: Metadata = {
  title: "Contrat de séjour",
  robots: { index: false, follow: false },
};

function dateLongue(iso: string): string {
  return new Date(`${iso}T00:00:00.000Z`).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function Message({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-md space-y-4 px-4 py-16 text-center">
      <p className="text-sm font-medium uppercase tracking-widest text-encre-faine">
        LCD Parc
      </p>
      <h1 className="text-2xl font-semibold tracking-tight">
        Lien indisponible
      </h1>
      <p className="text-encre-douce">{children}</p>
      <Link className="text-sm underline" href="/">
        Retour à l&apos;accueil
      </Link>
    </main>
  );
}

export default async function PageContrat({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  await connection();
  const { token } = await params;
  const payload = verifierTokenVoyageur(token);
  if (!payload) {
    return (
      <Message>
        Ce lien est invalide ou expiré. Demandez un nouveau lien à votre hôte.
      </Message>
    );
  }

  const reservation = await new DrizzleReservationRepository().trouverParId(
    payload.tenantId,
    payload.reservationId,
  );
  if (!reservation || reservation.logementId !== payload.logementId) {
    return (
      <Message>
        Cette réservation n&apos;est plus disponible. Contactez votre hôte.
      </Message>
    );
  }

  const [logement, tenant, caution] = await Promise.all([
    new DrizzleLogementRepository().trouverParId(
      payload.tenantId,
      reservation.logementId,
    ),
    new DrizzleTenantRepository().trouver(payload.tenantId),
    new DrizzleCautionRepository().trouverParReservation(
      payload.tenantId,
      reservation.id,
    ),
  ]);
  if (!logement || !tenant) {
    return (
      <Message>
        Ce logement n&apos;est plus disponible. Contactez votre hôte.
      </Message>
    );
  }

  const contrat = construireContrat({
    refReservation: reservation.ref,
    hoteNom: tenant.nom,
    hoteAdresse: tenant.adresse,
    voyageurNom: reservation.clientNom,
    voyageurEmail: reservation.clientEmail,
    logementNom: logement.nom,
    logementAdresse: logement.adresse,
    debut: reservation.debut,
    fin: reservation.fin,
    voyageurs: reservation.voyageurs,
    montantCentimes: reservation.montantCentimes,
    cautionCentimes: caution?.montantCentimes ?? null,
  });

  return (
    <main className="mx-auto max-w-3xl space-y-8 px-6 py-12 print:max-w-none print:px-0">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-bordure pb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">
            Contrat de séjour
          </h1>
          <p className="text-lg font-medium">{contrat.logement.nom}</p>
          <p className="text-sm text-encre-douce">
            Référence {contrat.reference}
          </p>
        </div>
        <BoutonImprimer />
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-bordure bg-surface p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-encre-faine">
            L’hôte
          </h2>
          <p className="mt-2 font-medium">{contrat.hote.nom}</p>
          {contrat.hote.adresse ? (
            <p className="text-sm text-encre-douce">{contrat.hote.adresse}</p>
          ) : null}
        </div>
        <div className="rounded-2xl border border-bordure bg-surface p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-encre-faine">
            Le voyageur
          </h2>
          <p className="mt-2 font-medium">{contrat.voyageur.nom}</p>
          {contrat.voyageur.email ? (
            <p className="text-sm text-encre-douce">
              {contrat.voyageur.email}
            </p>
          ) : null}
        </div>
      </section>

      <section className="rounded-2xl border border-bordure bg-surface p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-encre-faine">
          Le logement
        </h2>
        <p className="mt-2 font-medium">{contrat.logement.nom}</p>
        {contrat.logement.adresse ? (
          <p className="text-sm text-encre-douce">
            {contrat.logement.adresse}
          </p>
        ) : null}
        <dl className="mt-4 grid gap-3 sm:grid-cols-4">
          <div>
            <dt className="text-xs uppercase tracking-wide text-encre-faine">
              Arrivée
            </dt>
            <dd>{dateLongue(contrat.sejour.debut)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-encre-faine">
              Départ
            </dt>
            <dd>{dateLongue(contrat.sejour.fin)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-encre-faine">
              Nuits
            </dt>
            <dd>{contrat.sejour.nuits}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-encre-faine">
              Voyageurs
            </dt>
            <dd>{contrat.sejour.voyageurs}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-2xl border border-bordure bg-surface p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-encre-faine">
          Conditions financières
        </h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt>Montant du séjour</dt>
            <dd className="font-medium">
              {formaterEuros(contrat.montantCentimes)}
            </dd>
          </div>
          {contrat.cautionCentimes !== null ? (
            <div className="flex justify-between">
              <dt>Dépôt de garantie</dt>
              <dd className="font-medium">
                {formaterEuros(contrat.cautionCentimes)}
              </dd>
            </div>
          ) : null}
        </dl>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Clauses du séjour</h2>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-encre-douce">
          {contrat.clauses.map((clause) => (
            <li key={clause}>{clause}</li>
          ))}
        </ol>
        <p className="text-xs text-encre-faine">
          Les conditions générales de vente et le règlement intérieur remis
          avec ce contrat en font partie intégrante.
        </p>
      </section>

      <section className="grid gap-6 border-t border-bordure pt-6 sm:grid-cols-2">
        <div className="space-y-8">
          <p className="text-sm font-semibold">Le voyageur — bon pour accord</p>
          <p className="text-xs text-encre-douce">
            Nom, date et signature :
          </p>
          <div className="h-16 border-b border-bordure" />
        </div>
        <div className="space-y-8">
          <p className="text-sm font-semibold">L’hôte</p>
          <p className="text-xs text-encre-douce">
            Nom, date et signature :
          </p>
          <div className="h-16 border-b border-bordure" />
        </div>
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-3 text-xs text-encre-faine">
        <p>
          Contrat généré le{" "}
          {new Date().toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}
          .
        </p>
        <Link className="underline print:hidden" href="/">
          LCD Parc
        </Link>
      </footer>
    </main>
  );
}
