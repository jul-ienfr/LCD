import Link from "next/link";
import { connection } from "next/server";
import {
  dateIsoValide,
  decalerMois,
  grilleMois,
  joursDuMois,
  moisCourant,
  moisEnFrancais,
  moisValide,
} from "@/domain/calendrier";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleTarifRepository } from "@/infrastructure/db/repositories/tarif-repository";
import { formaterEuros } from "@/lib/format";
import { requireRole, tenantIdDeSession } from "@/lib/session";
import { FormulairePrix } from "./formulaire";

export const instant = false;

const JOURS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export default async function PagePrix({
  searchParams,
}: {
  searchParams: Promise<{ mois?: string; logement?: string; date?: string }>;
}) {
  await connection();

  const session = await requireRole(["admin", "hote"]);
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
        <h1 className="text-3xl font-semibold tracking-tight">Prix</h1>
        <p className="text-encre-douce">
          Créez d’abord un logement pour définir des prix.
        </p>
        <Link className="underline" href="/hote/logements">
          Gérer les logements
        </Link>
      </main>
    );
  }

  const logement =
    logements.find((l) => l.id === params.logement) ?? logements[0];
  if (!logement) throw new Error("Aucun logement disponible.");

  const jours = joursDuMois(mois);
  const premier = jours[0];
  const dernier = jours[jours.length - 1];
  if (!premier || !dernier) throw new Error("Mois vide.");

  const tarifs = await new DrizzleTarifRepository().listerParMois(
    tenantId,
    logement.id,
    premier,
    dernier,
  );
  const prixParDate = new Map(tarifs.map((t) => [t.date, t.prixCentimes]));

  const aujourdHui = new Date().toISOString().slice(0, 10);
  const dateDefaut =
    params.date && dateIsoValide(params.date) && params.date.startsWith(mois)
      ? params.date
      : mois === aujourdHui.slice(0, 7)
        ? aujourdHui
        : premier;

  const lienMois = (m: string) =>
    `/hote/prix?mois=${m}&logement=${logement.id}`;

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-6 py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-widest text-encre-faine">
            Espace hôte
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Prix — {moisEnFrancais(mois)}
          </h1>
          <p className="text-encre-douce">
            {logement.nom} ({logement.code}) · {tarifs.length} jour
            {tarifs.length > 1 ? "s" : ""} tarifé
            {tarifs.length > 1 ? "s" : ""}
          </p>
        </div>
        <Link className="text-sm underline" href="/hote">
          Retour au tableau de bord
        </Link>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <Link
          className="rounded-full border border-bordure px-4 py-2 text-sm"
          href={lienMois(decalerMois(mois, -1))}
        >
          ← Mois précédent
        </Link>
        <Link
          className="rounded-full border border-bordure px-4 py-2 text-sm"
          href={`/hote/prix?mois=${moisCourant()}&logement=${logement.id}`}
        >
          Mois courant
        </Link>
        <Link
          className="rounded-full border border-bordure px-4 py-2 text-sm"
          href={lienMois(decalerMois(mois, 1))}
        >
          Mois suivant →
        </Link>

        <form className="ml-auto flex items-center gap-2" method="get">
          <input name="mois" type="hidden" value={mois} />
          <label className="text-sm" htmlFor="logement">
            Logement
          </label>
          <select
            className="rounded-xl border border-bordure p-2 text-sm"
            defaultValue={logement.id}
            id="logement"
            name="logement"
          >
            {logements.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nom}
              </option>
            ))}
          </select>
          <button className="rounded-full border border-bordure px-3 py-2 text-sm" type="submit">
            Afficher
          </button>
        </form>
      </div>

      <section className="rounded-2xl border border-bordure bg-surface p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Définir un prix</h2>
        <p className="mt-1 text-sm text-encre-douce">
          Le prix est par nuit et par logement. Une nouvelle saisie remplace
          le prix existant pour cette date.
        </p>
        <div className="mt-5">
          <FormulairePrix
            dateDefaut={dateDefaut}
            logementId={logement.id}
            logements={logements}
          />
        </div>
      </section>

      <section className="overflow-x-auto rounded-2xl border border-bordure bg-surface">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-bordure bg-fond">
              {JOURS.map((jour) => (
                <th className="p-2 text-left font-medium" key={jour}>
                  {jour}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grilleMois(mois).map((semaine, index) => (
              <tr className="border-b border-bordure" key={index}>
                {semaine.map((date, i) => {
                  if (!date) {
                    return <td className="p-2" key={`vide-${index}-${i}`} />;
                  }
                  const prix = prixParDate.get(date);
                  return (
                    <td className="p-2 align-top" key={date}>
                      <Link
                        className="block rounded-lg p-2 hover:bg-surface-2"
                        href={`/hote/prix?mois=${mois}&logement=${logement.id}&date=${date}`}
                      >
                        <span className="block text-xs text-encre-faine">
                          {date.slice(8)}
                        </span>
                        <span className="mt-1 block font-medium">
                          {prix === undefined ? "—" : formaterEuros(prix)}
                        </span>
                      </Link>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <nav className="flex flex-wrap gap-4 text-sm">
        <Link className="underline" href="/hote/planning">
          Planning
        </Link>
        <Link className="underline" href="/hote/logements">
          Logements
        </Link>
        <Link className="underline" href="/hote">
          Tableau de bord
        </Link>
      </nav>
    </main>
  );
}
