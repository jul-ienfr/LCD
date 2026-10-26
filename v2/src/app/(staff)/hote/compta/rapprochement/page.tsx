import Link from "next/link";
import { connection } from "next/server";
import {
  alerteEcart,
  orphelinesAnciennes,
  type ImportBanque,
} from "@/domain/rapprochement";
import { DrizzleImportsBanqueRepository } from "@/infrastructure/db/repositories/imports-banque-repository";
import { DrizzlePaiementRepository } from "@/infrastructure/db/repositories/paiement-repository";
import { formaterEuros } from "@/lib/format";
import { requireRole, tenantIdDeSession } from "@/lib/session";
import { importerReleveAction } from "./actions";

export const instant = false;

function decalerJours(dateIso: string, jours: number): string {
  const date = new Date(`${dateIso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + jours);
  return date.toISOString().slice(0, 10);
}

function pourcentage(ecartBp: number): string {
  return `${(ecartBp / 100).toFixed(2)} %`;
}

export default async function PageRapprochement({
  searchParams,
}: {
  searchParams: Promise<{ import?: string; erreur?: string }>;
}) {
  await connection();

  const session = await requireRole(["admin", "hote", "comptable"]);
  const tenantId = tenantIdDeSession(session);
  const params = await searchParams;
  const repo = new DrizzleImportsBanqueRepository();
  const recents = await repo.listerRecents(tenantId, 10);
  const selectionne: ImportBanque | null =
    (params.import ? (await repo.trouver(tenantId, params.import))?.import : null) ??
    recents[0] ??
    null;
  const detail = selectionne
    ? await repo.trouver(tenantId, selectionne.id)
    : null;

  const lignes = detail?.lignes ?? [];
  const matched = new Set(
    lignes.map((ligne) => ligne.paiementId).filter(Boolean) as string[],
  );
  const paiements =
    selectionne === null
      ? []
      : await new DrizzlePaiementRepository().listerParMois(
          tenantId,
          decalerJours(selectionne.periodeDebut, -3),
          decalerJours(selectionne.periodeFin, 3),
        );
  const nonRapproches = paiements.filter(
    (paiement) =>
      paiement.mode !== "especes" && !matched.has(paiement.id),
  );
  const anciennes = orphelinesAnciennes(
    lignes.map((ligne) => ({ ...ligne, reference: null })),
    new Date(),
  );
  const alerte =
    selectionne !== null &&
    (alerteEcart(selectionne.ecartBp) || anciennes.length > 0);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-12">
      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-widest text-encre-faine">
          Comptabilité
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Rapprochement bancaire
        </h1>
        <p className="text-encre-douce">
          Importez le relevé CSV de la banque : les crédits sont rapprochés des
          paiements enregistrés (±3 jours, même montant, référence si
          présente). Alerte si l’écart dépasse 2 % ou si une opération reste
          orpheline plus de 7 jours.
        </p>
      </header>

      {params.erreur ? (
        <p className="rounded-xl border border-danger bg-danger-douce p-4 text-sm text-danger">
          {params.erreur}
        </p>
      ) : null}

      <section className="rounded-2xl border border-bordure bg-surface p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Importer un relevé</h2>
        <form
          action={importerReleveAction}
          className="mt-3 flex flex-wrap items-end gap-3"
          encType="multipart/form-data"
        >
          <label className="block space-y-1 text-sm">
            <span className="font-medium">Fichier CSV (2 Mo max)</span>
            <input
              accept=".csv,text/csv,text/plain"
              className="block rounded-lg border border-bordure p-2 text-sm"
              name="fichier"
              required
              type="file"
            />
          </label>
          <button
            className="rounded-full bg-encre px-5 py-2 text-sm font-semibold text-fond"
            type="submit"
          >
            Importer et rapprocher
          </button>
          <Link
            className="text-sm underline"
            href="/api/exports/modele-rapprochement"
          >
            Modèle CSV
          </Link>
        </form>
        <p className="mt-3 text-xs text-encre-faine">
          Colonnes acceptées : <code>date;libelle;montant</code> (signé) ou{" "}
          <code>date;libelle;debit;credit</code>, avec{" "}
          <code>reference</code> facultative. Dates JJ/MM/AAAA ou AAAA-MM-JJ,
          montants avec virgule ou point.
        </p>
      </section>

      {selectionne && detail ? (
        <section className="space-y-4 rounded-2xl border border-bordure bg-surface p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">
                Import {selectionne.ref}
              </h2>
              <p className="text-sm text-encre-douce">
                {selectionne.nomFichier} · {selectionne.periodeDebut} →{" "}
                {selectionne.periodeFin} ·{" "}
                {selectionne.createdAt.toISOString().slice(0, 10)}
              </p>
            </div>
            <span
              className={
                alerte
                  ? "rounded-full bg-danger-douce px-3 py-1 text-xs font-semibold text-danger"
                  : "rounded-full bg-accent-douce px-3 py-1 text-xs font-semibold text-accent"
              }
            >
              {alerte ? "Alerte rapprochement" : "Rapproché"}
            </span>
          </div>

          <dl className="grid gap-3 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-encre-faine">Crédits</dt>
              <dd className="font-semibold tabular-nums">
                {formaterEuros(selectionne.totalCreditsCentimes)}
              </dd>
            </div>
            <div>
              <dt className="text-encre-faine">Débits</dt>
              <dd className="tabular-nums">
                {formaterEuros(selectionne.totalDebitsCentimes)}
              </dd>
            </div>
            <div>
              <dt className="text-encre-faine">Paiements attendus</dt>
              <dd className="tabular-nums">
                {formaterEuros(selectionne.attendusCentimes)}
              </dd>
            </div>
            <div>
              <dt className="text-encre-faine">Écart</dt>
              <dd
                className={
                  alerteEcart(selectionne.ecartBp)
                    ? "font-semibold tabular-nums text-danger"
                    : "tabular-nums"
                }
              >
                {pourcentage(selectionne.ecartBp)}
              </dd>
            </div>
          </dl>

          {alerte ? (
            <p className="rounded-xl border border-alerte bg-alerte-douce p-3 text-sm text-alerte">
              {alerteEcart(selectionne.ecartBp)
                ? `Écart supérieur à 2 % (${pourcentage(selectionne.ecartBp)}). `
                : ""}
              {anciennes.length > 0
                ? `${anciennes.length} opération(s) orpheline(s) de plus de 7 jours. `
                : ""}
              Vérifiez les lignes ci-dessous et les paiements non rapprochés.
            </p>
          ) : null}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-bordure text-xs uppercase tracking-wide text-encre-faine">
                <tr>
                  <th className="py-2 pr-3">Date</th>
                  <th className="py-2 pr-3">Libellé</th>
                  <th className="py-2 pr-3 text-right">Montant</th>
                  <th className="py-2">Statut</th>
                </tr>
              </thead>
              <tbody>
                {detail.lignes.map((ligne) => (
                  <tr
                    className="border-b border-bordure last:border-0"
                    key={ligne.id}
                  >
                    <td className="py-2 pr-3 tabular-nums">
                      {ligne.dateOperation}
                    </td>
                    <td className="py-2 pr-3">{ligne.libelle}</td>
                    <td
                      className={`py-2 pr-3 text-right tabular-nums ${
                        ligne.montantCentimes < 0 ? "text-encre-douce" : ""
                      }`}
                    >
                      {formaterEuros(ligne.montantCentimes)}
                    </td>
                    <td className="py-2">
                      {ligne.statut === "rapproche"
                        ? "Rapproché"
                        : ligne.statut === "orpheline"
                          ? "Orpheline"
                          : "Débit ignoré"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {nonRapproches.length > 0 ? (
            <div>
              <h3 className="font-semibold">
                Paiements enregistrés non retrouvés ({nonRapproches.length})
              </h3>
              <ul className="mt-2 space-y-1 text-sm" role="list">
                {nonRapproches.map((paiement) => (
                  <li key={paiement.id}>
                    {paiement.datePaiement} · {formaterEuros(paiement.montantCentimes)}{" "}
                    · {paiement.mode}
                    {paiement.reference ? ` · ${paiement.reference}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : (
        <p className="rounded-2xl border border-bordure bg-surface p-6 text-sm text-encre-douce">
          Aucun relevé importé pour cet espace.
        </p>
      )}

      {recents.length > 1 ? (
        <section className="rounded-2xl border border-bordure bg-surface p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Imports récents</h2>
          <ul className="mt-3 space-y-2 text-sm" role="list">
            {recents.map((entree) => (
              <li key={entree.id}>
                <Link
                  className="underline"
                  href={`/hote/compta/rapprochement?import=${entree.id}`}
                >
                  {entree.ref}
                </Link>{" "}
                · {entree.nomFichier} · écart {pourcentage(entree.ecartBp)} ·{" "}
                {entree.lignesOrphelines} orpheline(s)
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="flex flex-wrap gap-4 text-sm">
        <Link className="underline" href="/hote/compta">
          ← Comptabilité
        </Link>
        <Link className="underline" href="/hote">
          Pilotage
        </Link>
      </div>
    </main>
  );
}
