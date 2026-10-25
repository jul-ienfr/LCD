import Link from "next/link";
import { connection } from "next/server";
import { DrizzleFluxIcsRepository } from "@/infrastructure/db/repositories/flux-ics-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { requireRole, tenantIdDeSession } from "@/lib/session";
import { FormulaireFluxIcs } from "./formulaire-flux";
import { FormulaireImportIcs } from "./formulaire";
import { supprimerFluxAction, synchroniserFluxAction } from "./flux-actions";

export const instant = false;

export default async function PageImportIcs({
  searchParams,
}: {
  searchParams: Promise<{ logement?: string; sync?: string }>;
}) {
  await connection();

  const session = await requireRole(["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const params = await searchParams;

  const logements = await new DrizzleLogementRepository().listerParTenant(
    tenantId,
  );

  if (logements.length === 0) {
    return (
      <main className="mx-auto max-w-2xl space-y-4 px-6 py-12">
        <h1 className="text-3xl font-semibold tracking-tight">
          Importer un calendrier OTA
        </h1>
        <p className="text-stone-600">
          Créez d’abord un logement pour importer son calendrier.
        </p>
        <Link className="underline" href="/hote/logements">
          Gérer les logements
        </Link>
      </main>
    );
  }

  const logementDefaut =
    logements.find((logement) => logement.id === params.logement)?.id ??
    logements[0]?.id ??
    "";

  const flux = await new DrizzleFluxIcsRepository().listerParLogement(
    tenantId,
    logementDefaut,
  );

  return (
    <main className="mx-auto max-w-3xl space-y-8 px-6 py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-widest text-stone-500">
            Espace hôte · Planning
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Importer un calendrier OTA
          </h1>
          <p className="text-stone-600">
            Airbnb, Booking, Abritel : exportez le flux ICS du logement puis
            collez-le ici ou déposez le fichier.
          </p>
        </div>
        <Link className="text-sm underline" href="/hote/planning">
          ← Planning
        </Link>
      </header>

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <FormulaireImportIcs
          logementDefaut={logementDefaut}
          logements={logements.map((logement) => ({
            id: logement.id,
            nom: logement.nom,
            code: logement.code,
          }))}
        />
      </section>

      <section className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold">Flux OTA automatiques</h2>
          <p className="mt-1 text-sm text-stone-600">
            Enregistrez l’URL ICS du logement, puis synchronisez à la demande.
            L’URL doit être HTTPS et publique.
          </p>
        </div>

        {params.sync === "ok" ? (
          <p className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900">
            Synchronisation terminée.
          </p>
        ) : null}
        {params.sync === "erreur" ? (
          <p className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-800">
            La synchronisation a échoué. Le détail est affiché dans la liste.
          </p>
        ) : null}

        <FormulaireFluxIcs logementId={logementDefaut} />

        {flux.length === 0 ? (
          <p className="rounded-xl border border-dashed border-stone-300 p-4 text-sm text-stone-600">
            Aucun flux enregistré pour ce logement.
          </p>
        ) : (
          <ul className="divide-y divide-stone-100">
            {flux.map((item) => (
              <li className="py-3" key={item.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">{item.libelle}</p>
                    <p className="truncate text-xs text-stone-500">
                      {item.url}
                    </p>
                    <p className="mt-1 text-xs text-stone-500">
                      {item.derniereSync
                        ? `Dernière sync : ${item.derniereSync
                            .toISOString()
                            .slice(0, 16)
                            .replace("T", " ")}`
                        : "Jamais synchronisé"}
                      {item.dernierStatut
                        ? ` · ${item.dernierStatut}`
                        : ""}
                    </p>
                    {item.dernierMessage ? (
                      <p className="mt-1 text-xs text-stone-500">
                        {item.dernierMessage}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <form action={synchroniserFluxAction}>
                      <input
                        name="fluxId"
                        type="hidden"
                        value={item.id}
                      />
                      <input
                        name="logementId"
                        type="hidden"
                        value={logementDefaut}
                      />
                      <button
                        className="rounded-full border border-stone-300 px-3 py-2 text-xs font-medium"
                        type="submit"
                      >
                        Synchroniser
                      </button>
                    </form>
                    <form action={supprimerFluxAction}>
                      <input
                        name="fluxId"
                        type="hidden"
                        value={item.id}
                      />
                      <input
                        name="logementId"
                        type="hidden"
                        value={logementDefaut}
                      />
                      <button
                        className="rounded-full border border-red-300 px-3 py-2 text-xs font-medium text-red-700"
                        type="submit"
                      >
                        Supprimer
                      </button>
                    </form>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-stone-200 bg-stone-50 p-5 text-sm text-stone-700">
        <h2 className="font-semibold text-stone-900">Comment ça marche</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            Les réservations OTA sont importées en <strong>confirmé</strong>,
            avec une référence stable dérivée de l’UID.
          </li>
          <li>
            Les événements « Not available », « Blocked », « Closed »… sont
            importés en <strong>blocages</strong> : ils bloquent les dates sans
            compter dans le chiffre d’affaires.
          </li>
          <li>
            Un événement qui chevauche une réservation ou un blocage existant
            est signalé en conflit et n’est pas importé.
          </li>
          <li>
            Le montant est récupéré s’il figure dans la description
            (<code>Total: 450</code>) ; sinon il reste à 0 et peut être
            complété manuellement.
          </li>
          <li>
            Réimporter le même flux est sans risque : les UID déjà présents
            sont ignorés.
          </li>
        </ul>
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
