import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import {
  LIBELLES_MODE_PAIEMENT,
  resteAPayer,
  totalPaiements,
} from "@/domain/paiement";
import type { StatutFacture } from "@/domain/facture";
import { ObtenirParametresFiscaux } from "@/application/use-cases/parametres-fiscaux";
import { DrizzleFactureRepository } from "@/infrastructure/db/repositories/facture-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzlePaiementRepository } from "@/infrastructure/db/repositories/paiement-repository";
import { DrizzleParametresFiscauxRepository } from "@/infrastructure/db/repositories/parametres-fiscaux-repository";
import { DrizzleTenantRepository } from "@/infrastructure/db/repositories/tenant-repository";
import { env } from "@/lib/env";
import { verifierTokenFacture } from "@/lib/facture-token";
import { formaterEuros } from "@/lib/format";
import { payerFactureAction } from "./payer-actions";

export const instant = false;

export const metadata: Metadata = {
  title: "Facture",
  robots: { index: false, follow: false },
};

const LIBELLES_STATUT: Record<StatutFacture, string> = {
  brouillon: "Brouillon",
  emise: "À régler",
  payee: "Payée",
  annulee: "Annulée",
};

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

export default async function PageFacturePublique({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ paiement?: string }>;
}) {
  await connection();

  const { token } = await params;
  const query = await searchParams;
  const payload = verifierTokenFacture(token);
  if (!payload) {
    return (
      <Message>
        Ce lien est invalide ou expiré. Demandez un nouveau lien à votre hôte.
      </Message>
    );
  }

  const facture = await new DrizzleFactureRepository().trouver(
    payload.tenantId,
    payload.factureId,
  );
  if (
    !facture ||
    (facture.statut !== "emise" && facture.statut !== "payee")
  ) {
    return (
      <Message>
        Cette facture n&apos;est plus disponible en ligne. Contactez votre
        hôte pour obtenir une version à jour.
      </Message>
    );
  }

  const [logement, tenant, fiscal, paiements] = await Promise.all([
    new DrizzleLogementRepository().trouverParId(
      payload.tenantId,
      facture.logementId,
    ),
    new DrizzleTenantRepository().trouver(payload.tenantId),
    new ObtenirParametresFiscaux(
      new DrizzleParametresFiscauxRepository(),
    ).executer(payload.tenantId),
    new DrizzlePaiementRepository().listerParFacture(
      payload.tenantId,
      facture.id,
    ),
  ]);

  const totalPaye = totalPaiements(paiements);
  const reste =
    facture.statut === "payee"
      ? 0
      : resteAPayer(facture.montantTtcCentimes, paiements);
  const stripeConfigured = Boolean(
    env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET,
  );

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6 sm:py-12">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-bordure pb-5">
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-encre-faine">
            Facture
          </p>
          <h1 className="mt-1 font-mono text-xl font-semibold break-all sm:text-2xl">
            {facture.numero}
          </h1>
          <p className="mt-2 text-sm text-encre-douce">
            Émise le {facture.dateEmission}
            {facture.echeance ? ` · échéance ${facture.echeance}` : ""}
          </p>
          <a
            className="mt-3 inline-block rounded-full border border-bordure px-4 py-2 text-sm font-medium"
            download
            href={`/api/factures/${facture.id}/pdf?t=${encodeURIComponent(token)}`}
          >
            Télécharger le PDF
          </a>
        </div>
        <div className="text-left text-sm text-encre-douce sm:text-right">
          <p className="font-semibold text-encre">
            {tenant?.nom ?? "LCD Parc"}
          </p>
          <p>Conciergerie locative</p>
          {tenant?.siren ? (
            <p className="font-mono text-xs">SIREN {tenant.siren}</p>
          ) : null}
          <p className="mt-1">
            {tenant?.adresse ?? logement?.adresse ?? ""}
          </p>
        </div>
      </header>

      {query.paiement === "ok" ? (
        <p className="rounded-xl border border-accent bg-accent-douce p-3 text-sm text-accent">
          Paiement reçu. La confirmation peut prendre quelques secondes ;
          rechargez la page si le statut n’est pas encore à jour.
        </p>
      ) : null}
      {query.paiement === "annule" ? (
        <p className="rounded-xl border border-alerte bg-alerte-douce p-3 text-sm text-alerte">
          Paiement annulé. Vous pouvez réessayer quand vous le souhaitez.
        </p>
      ) : null}
      {query.paiement === "erreur" ? (
        <p className="rounded-xl border border-danger bg-danger-douce p-3 text-sm text-danger">
          Le paiement en ligne n’a pas pu être ouvert. Contactez votre hôte.
        </p>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-bordure bg-surface p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-encre-faine">
            Client
          </h2>
          <p className="mt-1 font-medium">{facture.clientNom}</p>
          {facture.clientEmail ? (
            <p className="text-sm break-all text-encre-douce">
              {facture.clientEmail}
            </p>
          ) : null}
        </div>
        <div className="rounded-2xl border border-bordure bg-surface p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-encre-faine">
            Statut
          </h2>
          <p className="mt-1 font-medium">{LIBELLES_STATUT[facture.statut]}</p>
          <p className="text-sm text-encre-douce">
            Reste à payer : {formaterEuros(reste)}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-bordure bg-surface p-4 sm:p-6">
        <h2 className="text-lg font-semibold">Détail</h2>
        <ul className="mt-3 divide-y divide-bordure">
          {facture.lignes.map((ligne) => (
            <li className="py-3" key={ligne.id}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{ligne.designation}</p>
                  <p className="text-sm text-encre-douce">
                    {ligne.quantite} ×{" "}
                    {formaterEuros(ligne.prixUnitaireCentimes)}
                  </p>
                </div>
                <p className="font-medium">
                  {formaterEuros(ligne.totalCentimes)}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <dl className="mt-4 ml-auto max-w-xs space-y-1 border-t border-bordure pt-4 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-encre-douce">Total HT</dt>
            <dd>{formaterEuros(facture.montantHtCentimes)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-encre-douce">TVA</dt>
            <dd>{formaterEuros(facture.tvaCentimes)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-encre-douce">Taxe de séjour</dt>
            <dd>{formaterEuros(facture.taxeSejourCentimes)}</dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-bordure pt-2 text-base font-semibold">
            <dt>Total TTC</dt>
            <dd>{formaterEuros(facture.montantTtcCentimes)}</dd>
          </div>
          {paiements.length > 0 ? (
            <>
              <div className="flex justify-between gap-4 pt-2">
                <dt className="text-encre-douce">Déjà payé</dt>
                <dd>{formaterEuros(totalPaye)}</dd>
              </div>
              <div className="flex justify-between gap-4 font-medium">
                <dt>Reste à payer</dt>
                <dd>{formaterEuros(reste)}</dd>
              </div>
            </>
          ) : null}
        </dl>
      </section>

      {paiements.length > 0 ? (
        <section className="rounded-2xl border border-bordure bg-surface p-4 sm:p-6">
          <h2 className="text-lg font-semibold">Paiements reçus</h2>
          <ul className="mt-3 divide-y divide-bordure">
            {paiements.map((paiement) => (
              <li
                className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
                key={paiement.id}
              >
                <span>
                  {paiement.datePaiement} ·{" "}
                  {LIBELLES_MODE_PAIEMENT[paiement.mode]}
                  {paiement.reference ? ` · ${paiement.reference}` : ""}
                </span>
                <span className="font-medium">
                  {formaterEuros(paiement.montantCentimes)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {stripeConfigured && facture.statut === "emise" && reste > 0 ? (
        <section className="rounded-2xl border border-bordure bg-surface p-4 sm:p-6">
          <h2 className="text-lg font-semibold">Payer en ligne</h2>
          <p className="mt-1 text-sm text-encre-douce">
            Paiement sécurisé par carte bancaire via Stripe. Montant :{" "}
            {formaterEuros(reste)}.
          </p>
          <form action={payerFactureAction} className="mt-4">
            <input name="token" type="hidden" value={token} />
            <button
              className="rounded-full bg-encre px-5 py-3 text-sm font-medium text-fond"
              type="submit"
            >
              Payer {formaterEuros(reste)}
            </button>
          </form>
        </section>
      ) : null}

      <footer className="border-t border-bordure pt-4 text-xs text-encre-faine">
        <p>
          Document consultable sans compte. La taxe de séjour est suivie
          séparément du chiffre d&apos;affaires.
        </p>
        {fiscal.mentionsLegales ?? tenant?.mentionsLegales ? (
          <p className="mt-2 whitespace-pre-line">
            {fiscal.mentionsLegales ?? tenant?.mentionsLegales}
          </p>
        ) : null}
      </footer>
    </main>
  );
}
