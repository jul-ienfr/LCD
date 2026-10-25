import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import {
  TRANSITIONS_OFFRE,
  type StatutOffre,
} from "@/domain/offre";
import {
  TRANSITIONS_PROSPECT,
  type StatutProspect,
} from "@/domain/prospect";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleOffreRepository } from "@/infrastructure/db/repositories/offre-repository";
import { DrizzleProspectRepository } from "@/infrastructure/db/repositories/prospect-repository";
import { formaterEuros } from "@/lib/format";
import { requireRole, tenantIdDeSession } from "@/lib/session";
import {
  changerStatutOffreAction,
  changerStatutProspectAction,
} from "../../actions";
import { FormulaireOffre } from "../../formulaire-offre";

export const instant = false;

const LIBELLES_PROSPECT: Record<StatutProspect, string> = {
  nouveau: "Nouveau",
  qualifie: "Qualifier",
  visite: "Visite faite",
  offre: "Passer en offre",
  gagne: "Gagné",
  perdu: "Perdu",
};

const LIBELLES_OFFRE: Record<StatutOffre, string> = {
  brouillon: "Brouillon",
  envoyee: "Envoyer",
  acceptee: "Accepter",
  refusee: "Refuser",
};

export default async function PageProspect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();

  const session = await requireRole(["commercial", "admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const { id } = await params;

  const prospect = await new DrizzleProspectRepository().trouverParId(
    tenantId,
    id,
  );
  if (!prospect) notFound();

  const offres = await new DrizzleOffreRepository().listerParProspect(
    tenantId,
    prospect.id,
  );
  const logements = await new DrizzleLogementRepository().listerParTenant(
    tenantId,
  );
  const parLogement = new Map(logements.map((l) => [l.id, l]));

  return (
    <main className="mx-auto max-w-3xl space-y-8 px-6 py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-widest text-encre-faine">
            Prospect
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            {prospect.nom}
          </h1>
          <p className="text-encre-douce">
            {prospect.source}
            {prospect.email ? ` · ${prospect.email}` : ""}
            {prospect.telephone ? ` · ${prospect.telephone}` : ""}
          </p>
        </div>
        <Link className="text-sm underline" href="/commercial">
          ← Pipeline
        </Link>
      </header>

      <section className="rounded-2xl border border-bordure bg-surface p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Statut</h2>
          <span className="rounded-full bg-surface-2 px-3 py-1 text-xs font-medium">
            {prospect.statut}
          </span>
        </div>
        {TRANSITIONS_PROSPECT[prospect.statut].length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {TRANSITIONS_PROSPECT[prospect.statut].map((statut) => (
              <form action={changerStatutProspectAction} key={statut}>
                <input name="prospectId" type="hidden" value={prospect.id} />
                <input name="statut" type="hidden" value={statut} />
                <button
                  className="rounded-full border border-bordure px-4 py-2 text-sm font-medium"
                  type="submit"
                >
                  {LIBELLES_PROSPECT[statut]}
                </button>
              </form>
            ))}
          </div>
        ) : null}
        {prospect.notes ? (
          <p className="mt-4 whitespace-pre-line text-sm text-encre-douce">
            {prospect.notes}
          </p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-bordure bg-surface p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Créer une offre</h2>
        <div className="mt-5">
          <FormulaireOffre
            logements={logements.map((l) => ({
              id: l.id,
              nom: l.nom,
              code: l.code,
            }))}
            prospectId={prospect.id}
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          {offres.length} offre{offres.length > 1 ? "s" : ""}
        </h2>
        {offres.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-bordure p-6 text-encre-douce">
            Aucune offre pour ce prospect.
          </p>
        ) : (
          <ul className="divide-y divide-bordure rounded-2xl border border-bordure bg-surface">
            {offres.map((offre) => (
              <li className="p-4" key={offre.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{offre.titre}</p>
                  <span className="rounded-full bg-surface-2 px-3 py-1 text-xs font-medium">
                    {offre.statut}
                  </span>
                </div>
                <p className="mt-1 text-sm text-encre-douce">
                  {formaterEuros(offre.montantCentimes)}
                  {offre.logementId
                    ? ` · ${parLogement.get(offre.logementId)?.nom ?? ""}`
                    : ""}
                </p>
                {offre.notes ? (
                  <p className="mt-1 text-sm text-encre-faine">{offre.notes}</p>
                ) : null}
                {TRANSITIONS_OFFRE[offre.statut].length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {TRANSITIONS_OFFRE[offre.statut].map((statut) => (
                      <form action={changerStatutOffreAction} key={statut}>
                        <input name="offreId" type="hidden" value={offre.id} />
                        <input
                          name="prospectId"
                          type="hidden"
                          value={prospect.id}
                        />
                        <input name="statut" type="hidden" value={statut} />
                        <button
                          className="rounded-full border border-bordure px-4 py-2 text-xs font-medium"
                          type="submit"
                        >
                          {LIBELLES_OFFRE[statut]}
                        </button>
                      </form>
                    ))}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
