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
import { verifierTokenFacture } from "@/lib/facture-token";
import { formaterEuros } from "@/lib/format";

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
      <p className="text-sm font-medium uppercase tracking-widest text-stone-500">
        LCD Parc
      </p>
      <h1 className="text-2xl font-semibold tracking-tight">
        Lien indisponible
      </h1>
      <p className="text-stone-600">{children}</p>
      <Link className="text-sm underline" href="/">
        Retour à l&apos;accueil
      </Link>
    </main>
  );
}

export default async function PageFacturePublique({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  await connection();

  const { token } = await params;
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

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6 sm:py-12">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-stone-500">
            Facture
          </p>
          <h1 className="mt-1 font-mono text-xl font-semibold break-all sm:text-2xl">
            {facture.numero}
          </h1>
          <p className="mt-2 text-sm text-stone-600">
            Émise le {facture.dateEmission}
            {facture.echeance ? ` · échéance ${facture.echeance}` : ""}
          </p>
        </div>
        <div className="text-left text-sm text-stone-600 sm:text-right">
          <p className="font-semibold text-stone-900">
            {tenant?.nom ?? "LCD Parc"}
          </p>
          <p>Conciergerie locative</p>
          <p className="mt-1">{logement?.nom ?? ""}</p>
          <p>{logement?.adresse ?? ""}</p>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-stone-200 bg-white p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
            Client
          </h2>
          <p className="mt-1 font-medium">{facture.clientNom}</p>
          {facture.clientEmail ? (
            <p className="text-sm break-all text-stone-600">
              {facture.clientEmail}
            </p>
          ) : null}
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
            Statut
          </h2>
          <p className="mt-1 font-medium">{LIBELLES_STATUT[facture.statut]}</p>
          <p className="text-sm text-stone-600">
            Reste à payer : {formaterEuros(reste)}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-6">
        <h2 className="text-lg font-semibold">Détail</h2>
        <ul className="mt-3 divide-y divide-stone-100">
          {facture.lignes.map((ligne) => (
            <li className="py-3" key={ligne.id}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{ligne.designation}</p>
                  <p className="text-sm text-stone-600">
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

        <dl className="mt-4 ml-auto max-w-xs space-y-1 border-t border-stone-200 pt-4 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-stone-600">Total HT</dt>
            <dd>{formaterEuros(facture.montantHtCentimes)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-stone-600">TVA</dt>
            <dd>{formaterEuros(facture.tvaCentimes)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-stone-600">Taxe de séjour</dt>
            <dd>{formaterEuros(facture.taxeSejourCentimes)}</dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-stone-200 pt-2 text-base font-semibold">
            <dt>Total TTC</dt>
            <dd>{formaterEuros(facture.montantTtcCentimes)}</dd>
          </div>
          {paiements.length > 0 ? (
            <>
              <div className="flex justify-between gap-4 pt-2">
                <dt className="text-stone-600">Déjà payé</dt>
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
        <section className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-6">
          <h2 className="text-lg font-semibold">Paiements reçus</h2>
          <ul className="mt-3 divide-y divide-stone-100">
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

      <footer className="border-t border-stone-200 pt-4 text-xs text-stone-500">
        <p>
          Document consultable sans compte. La taxe de séjour est suivie
          séparément du chiffre d&apos;affaires.
        </p>
        {fiscal.mentionsLegales ? (
          <p className="mt-2 whitespace-pre-line">{fiscal.mentionsLegales}</p>
        ) : null}
      </footer>
    </main>
  );
}
