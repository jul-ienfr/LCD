import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import {
  TRANSITIONS_FACTURE,
  type StatutFacture,
} from "@/domain/facture";
import {
  LIBELLES_MODE_PAIEMENT,
  resteAPayer,
  totalPaiements,
} from "@/domain/paiement";
import { ObtenirParametresFiscaux } from "@/application/use-cases/parametres-fiscaux";
import { DrizzleFactureRepository } from "@/infrastructure/db/repositories/facture-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzlePaiementRepository } from "@/infrastructure/db/repositories/paiement-repository";
import { DrizzleParametresFiscauxRepository } from "@/infrastructure/db/repositories/parametres-fiscaux-repository";
import { DrizzleTenantRepository } from "@/infrastructure/db/repositories/tenant-repository";
import { env } from "@/lib/env";
import { creerTokenFacture } from "@/lib/facture-token";
import { formaterEuros } from "@/lib/format";
import { requireRole, tenantIdDeSession } from "@/lib/session";
import { BoutonImprimer } from "../bouton-imprimer";
import { FormulaireEnvoiFacture } from "../formulaire-envoi";
import { FormulairePaiement } from "../formulaire-paiement";
import { changerStatutFactureAction } from "../statut-actions";

export const instant = false;

const LIBELLES_STATUT: Record<StatutFacture, string> = {
  brouillon: "Remettre en brouillon",
  emise: "Marquer émise",
  payee: "Marquer payée",
  annulee: "Annuler la facture",
};

export default async function PageFacture({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();

  const session = await requireRole(["admin", "hote", "comptable"]);
  const tenantId = tenantIdDeSession(session);
  const { id } = await params;

  const facture = await new DrizzleFactureRepository().trouver(tenantId, id);
  if (!facture) notFound();

  const [logement, fiscal, tenant, paiements] = await Promise.all([
    new DrizzleLogementRepository().trouverParId(
      tenantId,
      facture.logementId,
    ),
    new ObtenirParametresFiscaux(
      new DrizzleParametresFiscauxRepository(),
    ).executer(tenantId),
    new DrizzleTenantRepository().trouver(tenantId),
    new DrizzlePaiementRepository().listerParFacture(tenantId, facture.id),
  ]);

  const totalPaye = totalPaiements(paiements);
  const reste =
    facture.statut === "payee"
      ? 0
      : resteAPayer(facture.montantTtcCentimes, paiements);
  const aujourdHui = new Date().toISOString().slice(0, 10);
  const lienClient =
    facture.statut === "emise" || facture.statut === "payee"
      ? `${env.APP_URL.replace(/\/$/, "")}/facture/${encodeURIComponent(
          creerTokenFacture({ tenantId, factureId: facture.id }),
        )}`
      : null;

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-6 py-12 print:max-w-none print:px-0 print:py-0">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link className="text-sm underline" href="/hote/factures">
          ← Retour aux factures
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <a
            className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium"
            download
            href={`/api/factures/${facture.id}/pdf`}
          >
            Télécharger le PDF
          </a>
          <a
            className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium"
            download
            href={`/api/factures/${facture.id}/factur-x`}
          >
            Factur-X (XML)
          </a>
          <BoutonImprimer />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 print:hidden">
        {TRANSITIONS_FACTURE[facture.statut].map((statut) => (
          <form action={changerStatutFactureAction} key={statut}>
            <input name="factureId" type="hidden" value={facture.id} />
            <input name="statut" type="hidden" value={statut} />
            <button
              className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium"
              type="submit"
            >
              {LIBELLES_STATUT[statut]}
            </button>
          </form>
        ))}
      </div>

      <article className="space-y-8 rounded-2xl border border-stone-200 bg-white p-8 shadow-sm print:rounded-none print:border-0 print:p-0 print:shadow-none">
        <header className="flex flex-wrap items-start justify-between gap-6 border-b border-stone-200 pb-6">
          <div>
            <p className="text-sm font-medium uppercase tracking-widest text-stone-500">
              Facture
            </p>
            <h1 className="mt-1 font-mono text-2xl font-semibold">
              {facture.numero}
            </h1>
            <p className="mt-2 text-sm text-stone-600">
              Émise le {facture.dateEmission}
              {facture.echeance ? ` · échéance ${facture.echeance}` : ""}
            </p>
          </div>
          <div className="text-right text-sm text-stone-600">
            <p className="font-semibold text-stone-900">
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

        <section className="grid gap-6 sm:grid-cols-2">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
              Client
            </h2>
            <p className="mt-1 font-medium">{facture.clientNom}</p>
            {facture.clientEmail ? (
              <p className="text-sm text-stone-600">{facture.clientEmail}</p>
            ) : null}
          </div>
          <div className="sm:text-right">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
              Statut
            </h2>
            <p className="mt-1 font-medium">{facture.statut}</p>
          </div>
        </section>

        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-stone-200 text-left">
              <th className="py-2 font-medium">Désignation</th>
              <th className="py-2 text-right font-medium">Qté</th>
              <th className="py-2 text-right font-medium">P.U.</th>
              <th className="py-2 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {facture.lignes.map((ligne) => (
              <tr className="border-b border-stone-100" key={ligne.id}>
                <td className="py-2">{ligne.designation}</td>
                <td className="py-2 text-right">{ligne.quantite}</td>
                <td className="py-2 text-right">
                  {formaterEuros(ligne.prixUnitaireCentimes)}
                </td>
                <td className="py-2 text-right">
                  {formaterEuros(ligne.totalCentimes)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <section className="ml-auto max-w-xs space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-stone-600">Total HT</span>
            <span>{formaterEuros(facture.montantHtCentimes)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-600">TVA</span>
            <span>{formaterEuros(facture.tvaCentimes)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-600">Taxe de séjour</span>
            <span>{formaterEuros(facture.taxeSejourCentimes)}</span>
          </div>
          <div className="flex justify-between border-t border-stone-200 pt-2 text-base font-semibold">
            <span>Total TTC</span>
            <span>{formaterEuros(facture.montantTtcCentimes)}</span>
          </div>
          {paiements.length > 0 ? (
            <>
              <div className="flex justify-between pt-2">
                <span className="text-stone-600">Déjà payé</span>
                <span>{formaterEuros(totalPaye)}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Reste à payer</span>
                <span>{formaterEuros(reste)}</span>
              </div>
            </>
          ) : null}
        </section>

        {facture.notes ? (
          <section className="border-t border-stone-200 pt-4 text-sm text-stone-600">
            <h2 className="font-semibold text-stone-900">Notes</h2>
            <p className="mt-1 whitespace-pre-line">{facture.notes}</p>
          </section>
        ) : null}

        <footer className="border-t border-stone-200 pt-4 text-xs text-stone-500">
          <p>
            Document généré par LCD Parc. La taxe de séjour est suivie
            séparément du chiffre d’affaires.
          </p>
          {fiscal.mentionsLegales ?? tenant?.mentionsLegales ? (
            <p className="mt-2 whitespace-pre-line">
              {fiscal.mentionsLegales ?? tenant?.mentionsLegales}
            </p>
          ) : null}
          <p className="mt-2">
            Factur-X : export XML CII de préparation ; PDF/A-3 et validation
            par une plateforme de dématérialisation à venir.
          </p>
        </footer>
      </article>

      <section className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm print:hidden">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold">Paiements</h2>
            <p className="text-sm text-stone-600">
              {totalPaye > 0
                ? `${formaterEuros(totalPaye)} encaissés · ${formaterEuros(reste)} restants`
                : "Aucun encaissement enregistré."}
            </p>
          </div>
        </div>

        {paiements.length > 0 ? (
          <ul className="divide-y divide-stone-100">
            {paiements.map((paiement) => (
              <li
                className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
                key={paiement.id}
              >
                <div>
                  <p className="font-medium">
                    {LIBELLES_MODE_PAIEMENT[paiement.mode]} ·{" "}
                    {formaterEuros(paiement.montantCentimes)}
                  </p>
                  <p className="text-stone-500">
                    {paiement.datePaiement}
                    {paiement.reference ? ` · ${paiement.reference}` : ""}
                    {paiement.notes ? ` · ${paiement.notes}` : ""}
                  </p>
                </div>
                <span className="font-mono text-xs text-stone-400">
                  {paiement.ref}
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        {facture.statut === "emise" && reste > 0 ? (
          <div className="border-t border-stone-200 pt-4">
            <h3 className="text-sm font-semibold">Encaisser un paiement</h3>
            <p className="mt-1 text-sm text-stone-600">
              Le paiement est idempotent et la facture passe automatiquement
              en « payée » quand le solde est atteint.
            </p>
            <div className="mt-4">
              <FormulairePaiement
                key={reste}
                dateDefaut={aujourdHui}
                factureId={facture.id}
                resteCentimes={reste}
              />
            </div>
          </div>
        ) : null}

        {facture.statut === "brouillon" ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            Émettez la facture pour pouvoir enregistrer un paiement.
          </p>
        ) : null}

        {facture.statut === "payee" ? (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
            Facture soldée.
          </p>
        ) : null}
      </section>

      <section className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm print:hidden">
        <div>
          <h2 className="text-lg font-semibold">Partage client</h2>
          <p className="text-sm text-stone-600">
            Lien signé, valable 90 jours, consultable sans compte et sans
            JavaScript.
          </p>
        </div>

        {lienClient ? (
          <>
            <label className="block space-y-1 text-sm font-medium">
              <span>Lien de la facture</span>
              <input
                className="w-full rounded-xl border border-stone-300 bg-stone-50 p-3 font-mono text-xs"
                readOnly
                value={lienClient}
              />
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <a
                className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium"
                href={lienClient}
                rel="noreferrer"
                target="_blank"
              >
                Ouvrir la facture client
              </a>
            </div>
            <div className="border-t border-stone-200 pt-4">
              <h3 className="text-sm font-semibold">Envoyer par email</h3>
              <div className="mt-3">
                <FormulaireEnvoiFacture
                  emailDefaut={facture.clientEmail ?? ""}
                  factureId={facture.id}
                />
              </div>
            </div>
          </>
        ) : (
          <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            Émettez la facture pour générer le lien client et l&apos;envoyer
            par email.
          </p>
        )}
      </section>
    </main>
  );
}
