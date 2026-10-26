import Link from "next/link";
import { connection } from "next/server";
import {
  ajouterJours,
  decalerMois,
  joursDuMois,
  moisCourant,
  moisEnFrancais,
  moisValide,
} from "@/domain/calendrier";
import { prochainNumeroFacture } from "@/domain/facture";
import { ObtenirParametresFiscaux } from "@/application/use-cases/parametres-fiscaux";
import { DrizzleFactureRepository } from "@/infrastructure/db/repositories/facture-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleParametresFiscauxRepository } from "@/infrastructure/db/repositories/parametres-fiscaux-repository";
import { DrizzleRelanceFactureRepository } from "@/infrastructure/db/repositories/relance-facture-repository";
import { DrizzleReservationRepository } from "@/infrastructure/db/repositories/reservation-repository";
import { jourParis } from "@/lib/date-paris";
import { formaterEuros } from "@/lib/format";
import { requireRole, tenantIdDeSession } from "@/lib/session";
import { FormulaireFacture } from "./formulaire";
import { FormulaireRelances } from "./relances";

export const instant = false;

export default async function PageFactures({
  searchParams,
}: {
  searchParams: Promise<{ mois?: string }>;
}) {
  await connection();

  const session = await requireRole(["admin", "hote", "comptable"]);
  const tenantId = tenantIdDeSession(session);
  const params = await searchParams;
  const mois =
    params.mois && moisValide(params.mois) ? params.mois : moisCourant();

  const logements = await new DrizzleLogementRepository().listerParTenant(
    tenantId,
  );
  if (logements.length === 0) {
    return (
      <main className="mx-auto max-w-2xl space-y-4 px-6 py-12">
        <h1 className="text-3xl font-semibold tracking-tight">Factures</h1>
        <p className="text-encre-douce">
          Créez d’abord un logement pour facturer.
        </p>
        <Link className="underline" href="/hote/logements">
          Gérer les logements
        </Link>
      </main>
    );
  }

  const jours = joursDuMois(mois);
  const premier = jours[0];
  const dernier = jours[jours.length - 1];
  if (!premier || !dernier) throw new Error("Mois invalide.");
  const finMois = ajouterJours(dernier, 1);

  const reservations = await new DrizzleReservationRepository().listerParMois(
    tenantId,
    premier,
    finMois,
  );
  const factures = await new DrizzleFactureRepository().listerParMois(
    tenantId,
    premier,
    dernier,
  );

  const aujourdHui = jourParis();
  const dateDefaut =
    mois === aujourdHui.slice(0, 7) ? aujourdHui : premier;
  const annee = Number(mois.slice(0, 4));
  const fiscal = await new ObtenirParametresFiscaux(
    new DrizzleParametresFiscauxRepository(),
  ).executer(tenantId);

  const [facturesEchues, relanceesJour] = await Promise.all([
    new DrizzleFactureRepository().listerAEcheance(tenantId, aujourdHui),
    new DrizzleRelanceFactureRepository().listerFactureIds(
      tenantId,
      aujourdHui,
    ),
  ]);
  const relancees = new Set(relanceesJour);
  const aRelancer = facturesEchues.filter(
    (facture) =>
      !relancees.has(facture.id) &&
      Boolean(facture.clientEmail?.trim()),
  ).length;

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-6 py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-widest text-encre-faine">
            Espace hôte
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Factures — {moisEnFrancais(mois)}
          </h1>
          <p className="text-encre-douce">
            {factures.length} facture{factures.length > 1 ? "s" : ""} ·{" "}
            {formaterEuros(
              factures.reduce((total, f) => total + f.montantTtcCentimes, 0),
            )}{" "}
            TTC
          </p>
        </div>
        <Link className="text-sm underline" href="/hote">
          Retour au tableau de bord
        </Link>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <Link
          className="rounded-full border border-bordure px-4 py-2 text-sm"
          href={`/hote/factures?mois=${decalerMois(mois, -1)}`}
        >
          ← Mois précédent
        </Link>
        <Link
          className="rounded-full border border-bordure px-4 py-2 text-sm"
          href={`/hote/factures?mois=${moisCourant()}`}
        >
          Mois courant
        </Link>
        <Link
          className="rounded-full border border-bordure px-4 py-2 text-sm"
          href={`/hote/factures?mois=${decalerMois(mois, 1)}`}
        >
          Mois suivant →
        </Link>
        <Link
          className="rounded-full border border-bordure px-4 py-2 text-sm"
          href={`/api/exports/factures?mois=${mois}`}
        >
          Export CSV factures
        </Link>
        <Link
          className="rounded-full border border-bordure px-4 py-2 text-sm"
          href="/hote/compta/parametres"
        >
          Paramètres fiscaux
        </Link>
        <Link className="text-sm underline" href="/hote/compta">
          Compta
        </Link>
      </div>

      <FormulaireRelances nombre={aRelancer} />

      <section className="rounded-2xl border border-bordure bg-surface p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Créer une facture</h2>
        <p className="mt-1 text-sm text-encre-douce">
          Les totaux HT/TTC sont calculés à partir des lignes. Laisser la TVA
          et la taxe de séjour vides pour appliquer automatiquement les
          paramètres fiscaux. La facture est créée en brouillon.
        </p>
        <div className="mt-5">
          <FormulaireFacture
            dateDefaut={dateDefaut}
            fiscal={fiscal}
            logements={logements}
            numeroDefaut={prochainNumeroFacture(
              factures.map((f) => f.numero),
              annee,
              fiscal.prefixeFacture,
            )}
            reservations={reservations}
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Factures du mois</h2>
        {factures.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-bordure p-6 text-encre-douce">
            Aucune facture sur ce mois.
          </p>
        ) : (
          <ul className="divide-y divide-bordure rounded-2xl border border-bordure bg-surface">
            {factures.map((facture) => (
              <li
                className="flex flex-wrap items-center justify-between gap-3 p-4"
                key={facture.id}
              >
                <div>
                  <Link
                    className="font-medium underline"
                    href={`/hote/factures/${facture.id}`}
                  >
                    {facture.numero}
                  </Link>
                  <p className="text-sm text-encre-douce">
                    {facture.clientNom} · {facture.dateEmission} ·{" "}
                    {facture.statut}
                  </p>
                </div>
                <p className="font-medium">
                  {formaterEuros(facture.montantTtcCentimes)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <nav className="flex flex-wrap gap-4 text-sm">
        <Link className="underline" href="/hote/compta">
          Compta
        </Link>
        <Link className="underline" href="/hote/planning">
          Planning
        </Link>
        <Link className="underline" href="/hote">
          Tableau de bord
        </Link>
      </nav>
    </main>
  );
}
