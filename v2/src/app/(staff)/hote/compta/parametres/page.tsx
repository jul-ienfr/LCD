import Link from "next/link";
import { connection } from "next/server";
import { formaterTauxTva } from "@/domain/fiscal";
import { ObtenirParametresFiscaux } from "@/application/use-cases/parametres-fiscaux";
import { DrizzleParametresFiscauxRepository } from "@/infrastructure/db/repositories/parametres-fiscaux-repository";
import { formaterEuros } from "@/lib/format";
import { requireRole, tenantIdDeSession } from "@/lib/session";
import { FormulaireParametresFiscaux } from "./formulaire";

export const instant = false;

export default async function PageParametresFiscaux() {
  await connection();

  const session = await requireRole(["admin", "hote", "comptable"]);
  const tenantId = tenantIdDeSession(session);
  const parametres = await new ObtenirParametresFiscaux(
    new DrizzleParametresFiscauxRepository(),
  ).executer(tenantId);

  return (
    <main className="mx-auto max-w-3xl space-y-8 px-6 py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-widest text-encre-faine">
            Espace hôte · Comptabilité
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Paramètres fiscaux
          </h1>
          <p className="text-encre-douce">
            TVA, taxe de séjour et numérotation des factures pour ce tenant.
          </p>
        </div>
        <Link className="text-sm underline" href="/hote/compta">
          ← Compta
        </Link>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-bordure bg-surface p-5 shadow-sm">
          <p className="text-sm text-encre-faine">TVA par défaut</p>
          <p className="mt-1 text-2xl font-semibold">
            {formaterTauxTva(parametres.tauxTvaBp)}
          </p>
        </div>
        <div className="rounded-2xl border border-bordure bg-surface p-5 shadow-sm">
          <p className="text-sm text-encre-faine">Taxe de séjour</p>
          <p className="mt-1 text-2xl font-semibold">
            {formaterEuros(parametres.taxeSejourNuitPersonneCentimes)}
          </p>
          <p className="text-xs text-encre-faine">par nuit et par personne</p>
        </div>
        <div className="rounded-2xl border border-bordure bg-surface p-5 shadow-sm">
          <p className="text-sm text-encre-faine">Numérotation</p>
          <p className="mt-1 font-mono text-lg font-semibold">
            {parametres.prefixeFacture}-2026-0001
          </p>
          <p className="text-xs text-encre-faine">
            {parametres.taxeSejourPlafondCentimes !== null
              ? `plafond ${formaterEuros(parametres.taxeSejourPlafondCentimes)}`
              : "sans plafond"}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-bordure bg-surface p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Réglages</h2>
        <p className="mt-1 text-sm text-encre-douce">
          Ces valeurs servent de défaut. Une facture peut toujours les
          remplacer manuellement, ligne par ligne.
        </p>
        <div className="mt-5">
          <FormulaireParametresFiscaux parametres={parametres} />
        </div>
      </section>

      <section className="rounded-2xl border border-alerte bg-alerte-douce p-6 text-sm text-alerte">
        <h2 className="font-semibold">Factur-X — préparation</h2>
        <p className="mt-2">
          Chaque facture expose un export XML CII depuis sa page de détail.
          Le XML reprend les montants HT, TVA, taxe de séjour et TTC. Il reste
          à intégrer dans un PDF/A-3 et à valider avec une plateforme de
          dématérialisation partenaire avant un usage fiscal complet.
        </p>
      </section>

      <nav className="flex flex-wrap gap-4 text-sm">
        <Link className="underline" href="/hote/factures">
          Factures
        </Link>
        <Link className="underline" href="/hote/compta">
          Compta
        </Link>
        <Link className="underline" href="/hote">
          Tableau de bord
        </Link>
      </nav>
    </main>
  );
}
