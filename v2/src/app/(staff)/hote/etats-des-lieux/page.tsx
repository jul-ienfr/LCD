import Link from "next/link";
import { connection } from "next/server";
import { aujourdHuiIso } from "@/application/use-cases/inventaire";
import {
  analyserEtatDesLieux,
  TYPES_ETAT_DES_LIEUX,
  type TypeEtatDesLieux,
} from "@/domain/etat-des-lieux";
import { ETATS_BIEN, LIBELLES_ETAT } from "@/domain/inventaire";
import { DrizzleBiensRepository } from "@/infrastructure/db/repositories/biens-repository";
import { DrizzleEtatsDesLieuxRepository } from "@/infrastructure/db/repositories/etats-des-lieux-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleReservationRepository } from "@/infrastructure/db/repositories/reservation-repository";
import { formaterEuros } from "@/lib/format";
import { requireRole, tenantIdDeSession } from "@/lib/session";
import { enregistrerEtatDesLieuxAction } from "./actions";

export const instant = false;

const LIBELLES_TYPE: Record<TypeEtatDesLieux, string> = {
  entree: "Entrée",
  sortie: "Sortie",
};

export default async function PageEtatsDesLieux({
  searchParams,
}: {
  searchParams: Promise<{
    logement?: string;
    ok?: string;
    erreur?: string;
  }>;
}) {
  await connection();
  const session = await requireRole(["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const params = await searchParams;

  const logements = await new DrizzleLogementRepository().listerParTenant(
    tenantId,
  );
  const logement =
    logements.find((l) => l.id === params.logement) ?? logements[0];

  const biens = logement
    ? await new DrizzleBiensRepository().listerParLogement(
        tenantId,
        logement.id,
      )
    : [];
  const reservations = logement
    ? (await new DrizzleReservationRepository().listerTous(tenantId))
        .filter((reservation) => reservation.logementId === logement.id)
        .sort((a, b) => b.debut.localeCompare(a.debut))
        .slice(0, 50)
    : [];
  const etats = await new DrizzleEtatsDesLieuxRepository().listerParTenant(
    tenantId,
  );
  const nomsLogements = new Map(logements.map((l) => [l.id, l.nom]));

  if (!logement) {
    return (
      <main className="mx-auto max-w-3xl space-y-6 px-6 py-12">
        <h1 className="text-3xl font-semibold tracking-tight">
          États des lieux
        </h1>
        <p className="rounded-2xl border border-dashed border-bordure p-6 text-encre-douce">
          Créez d’abord un logement pour réaliser un état des lieux.
        </p>
        <Link className="text-sm underline" href="/hote/logements">
          Créer un logement
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-6 py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-widest text-encre-faine">
            Espace hôte · Exploitation
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            États des lieux
          </h1>
          <p className="text-encre-douce">
            Constat d’entrée ou de sortie à partir de l’inventaire durable :
            manquants, dégradations et coût de remplacement.
          </p>
        </div>
        <Link className="text-sm underline" href="/hote">
          Retour au tableau de bord
        </Link>
      </header>

      {logements.length > 1 ? (
        <nav className="flex flex-wrap gap-2" aria-label="Choisir un logement">
          {logements.map((l) => (
            <Link
              key={l.id}
              className={`rounded-full border px-4 py-2 text-sm ${
                l.id === logement.id
                  ? "border-accent bg-accent-douce font-semibold text-accent"
                  : "border-bordure bg-surface"
              }`}
              href={`/hote/etats-des-lieux?logement=${l.id}`}
            >
              {l.nom}
            </Link>
          ))}
        </nav>
      ) : null}

      {params.erreur ? (
        <p
          className="rounded-xl border border-danger bg-danger-douce p-3 text-sm text-danger"
          role="alert"
        >
          {params.erreur === "inattendu"
            ? "Erreur inattendue. Réessayez."
            : params.erreur}
        </p>
      ) : null}

      <section className="space-y-4 rounded-2xl border border-bordure bg-surface p-6 shadow-sm">
        <h2 className="text-lg font-semibold">
          Nouvel état des lieux — {logement.nom}
        </h2>
        {biens.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-bordure p-6 text-sm text-encre-douce">
            Aucun bien inventorié pour ce logement. Ajoutez d’abord le linge et
            l’équipement durable dans l’inventaire.
          </p>
        ) : (
          <form action={enregistrerEtatDesLieuxAction} className="space-y-4">
            <input type="hidden" name="logementId" value={logement.id} />
            <input
              type="hidden"
              name="ref"
              value={`edl-${crypto.randomUUID()}`}
            />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="block space-y-1 text-sm font-medium">
                <span>Type</span>
                <select
                  className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
                  defaultValue="sortie"
                  name="type"
                >
                  {TYPES_ETAT_DES_LIEUX.map((type) => (
                    <option key={type} value={type}>
                      {LIBELLES_TYPE[type]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1 text-sm font-medium">
                <span>Date</span>
                <input
                  className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
                  defaultValue={aujourdHuiIso()}
                  name="date"
                  required
                  type="date"
                />
              </label>
              <label className="block space-y-1 text-sm font-medium">
                <span>Séjour lié (optionnel)</span>
                <select
                  className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
                  defaultValue=""
                  name="reservationId"
                >
                  <option value="">Aucun séjour</option>
                  {reservations.map((reservation) => (
                    <option key={reservation.id} value={reservation.id}>
                      {reservation.ref} · {reservation.debut} →{" "}
                      {reservation.fin}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1 text-sm font-medium">
                <span>Notes</span>
                <input
                  className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
                  name="notes"
                  placeholder="Contexte, remarques générales"
                />
              </label>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-bordure">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-bordure bg-surface-2 text-xs uppercase tracking-wide text-encre-faine">
                  <tr>
                    <th className="p-3">Bien</th>
                    <th className="p-3">État de référence</th>
                    <th className="p-3">État constaté</th>
                    <th className="p-3">Manquant</th>
                    <th className="p-3">Commentaire</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-bordure">
                  {biens.map((bien) => (
                    <tr key={bien.id}>
                      <td className="p-3">
                        <p className="font-medium">{bien.label}</p>
                        <p className="text-xs text-encre-faine">
                          {bien.categorie} ·{" "}
                          <span className="font-mono">{bien.qr}</span>
                        </p>
                      </td>
                      <td className="p-3">
                        {bien.etat}/5 · {LIBELLES_ETAT[bien.etat]}
                      </td>
                      <td className="p-3">
                        <select
                          aria-label={`État constaté de ${bien.label}`}
                          className="rounded-lg border border-bordure bg-surface p-2 text-xs"
                          defaultValue={bien.etat}
                          name={`etat-${bien.qr}`}
                        >
                          {ETATS_BIEN.map((etat) => (
                            <option key={etat} value={etat}>
                              {etat} · {LIBELLES_ETAT[etat]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3">
                        <input
                          aria-label={`${bien.label} manquant`}
                          name={`manquant-${bien.qr}`}
                          type="checkbox"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          aria-label={`Commentaire pour ${bien.label}`}
                          className="w-full min-w-40 rounded-lg border border-bordure bg-surface p-2 text-xs"
                          name={`commentaire-${bien.qr}`}
                          placeholder="Optionnel"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-fond"
              type="submit"
            >
              Enregistrer l’état des lieux
            </button>
          </form>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Historique</h2>
        {etats.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-bordure p-6 text-encre-douce">
            Aucun état des lieux enregistré.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-bordure bg-surface">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="border-b border-bordure bg-surface-2 text-xs uppercase tracking-wide text-encre-faine">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Logement</th>
                  <th className="p-3">Réf</th>
                  <th className="p-3">Manquants</th>
                  <th className="p-3">Dégradés</th>
                  <th className="p-3">Remplacement</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-bordure">
                {etats.map((etat) => {
                  const analyse = analyserEtatDesLieux(etat.lignes);
                  return (
                    <tr key={etat.id}>
                      <td className="p-3">{etat.date}</td>
                      <td className="p-3">{LIBELLES_TYPE[etat.type]}</td>
                      <td className="p-3">
                        {nomsLogements.get(etat.logementId) ?? "—"}
                      </td>
                      <td className="p-3 font-mono text-xs">{etat.ref}</td>
                      <td className="p-3">{analyse.manquants.length}</td>
                      <td className="p-3">{analyse.degrades.length}</td>
                      <td className="p-3">
                        {formaterEuros(analyse.coutRemplacementCentimes)}
                      </td>
                      <td className="p-3">
                        <Link
                          className="text-sm underline"
                          href={`/hote/etats-des-lieux/${etat.id}`}
                        >
                          Voir
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <nav className="flex flex-wrap gap-4 text-sm">
        <Link className="underline" href={`/hote/inventaire?logement=${logement.id}`}>
          Inventaire
        </Link>
        <Link className="underline" href="/hote">
          Tableau de bord
        </Link>
      </nav>
    </main>
  );
}
