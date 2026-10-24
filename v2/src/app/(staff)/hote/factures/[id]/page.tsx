import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import {
  TRANSITIONS_FACTURE,
  type StatutFacture,
} from "@/domain/facture";
import { DrizzleFactureRepository } from "@/infrastructure/db/repositories/facture-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { formaterEuros } from "@/lib/format";
import { requireRole, tenantIdDeSession } from "@/lib/session";
import { BoutonImprimer } from "../bouton-imprimer";
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

  const logement = await new DrizzleLogementRepository().trouverParId(
    tenantId,
    facture.logementId,
  );

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-6 py-12 print:max-w-none print:px-0 print:py-0">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link className="text-sm underline" href="/hote/factures">
          ← Retour aux factures
        </Link>
        <BoutonImprimer />
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
            <p className="font-semibold text-stone-900">LCD Parc</p>
            <p>Conciergerie locative</p>
            <p className="mt-1">{logement?.nom ?? facture.logementId}</p>
            <p>{logement?.adresse ?? ""}</p>
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
        </section>

        {facture.notes ? (
          <section className="border-t border-stone-200 pt-4 text-sm text-stone-600">
            <h2 className="font-semibold text-stone-900">Notes</h2>
            <p className="mt-1 whitespace-pre-line">{facture.notes}</p>
          </section>
        ) : null}

        <footer className="border-t border-stone-200 pt-4 text-xs text-stone-500">
          Document généré par LCD Parc. La taxe de séjour est suivie
          séparément du chiffre d’affaires.
        </footer>
      </article>
    </main>
  );
}
