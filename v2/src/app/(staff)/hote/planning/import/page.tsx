import Link from "next/link";
import { connection } from "next/server";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { requireRole, tenantIdDeSession } from "@/lib/session";
import { FormulaireImportIcs } from "./formulaire";

export const instant = false;

export default async function PageImportIcs({
  searchParams,
}: {
  searchParams: Promise<{ logement?: string }>;
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
