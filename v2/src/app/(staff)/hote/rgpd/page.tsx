import Link from "next/link";
import { connection } from "next/server";
import {
  completudeRegistre,
  DUREE_RGPD_MAX_MOIS,
  entreesParDefaut,
  TRAITEMENTS_RGPD,
  type EntreeRegistre,
} from "@/domain/rgpd";
import { DrizzleRegistresRgpdRepository } from "@/infrastructure/db/repositories/registres-rgpd-repository";
import { requireRole, tenantIdDeSession } from "@/lib/session";
import { enregistrerRegistreAction } from "./actions";

export const instant = false;

export default async function PageRgpd({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  await connection();
  const session = await requireRole(["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const params = await searchParams;

  const registre = await new DrizzleRegistresRgpdRepository().trouver(
    tenantId,
  );
  const defauts = entreesParDefaut();
  const entrees: Record<string, EntreeRegistre> = {};
  for (const traitement of TRAITEMENTS_RGPD) {
    entrees[traitement.code] =
      registre?.entrees?.[traitement.code] ?? defauts[traitement.code]!;
  }
  const resume = completudeRegistre({
    dpoContact: registre?.dpoContact ?? null,
    hebergement: registre?.hebergement ?? "Union européenne",
    entrees,
  });

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-6 py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-widest text-encre-faine">
            Espace hôte · Conformité
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Registre RGPD
          </h1>
          <p className="text-encre-douce">
            Sept traitements, leurs finalités, bases légales et durées de
            conservation.
          </p>
        </div>
        <div className="flex gap-4 text-sm">
          <Link className="underline" href="/api/exports/tenant">
            Export JSON
          </Link>
          <Link className="underline" href="/hote">
            Tableau de bord
          </Link>
        </div>
      </header>

      {params.ok ? (
        <p
          className="rounded-xl border border-accent bg-accent-douce p-3 text-sm text-accent"
          role="status"
        >
          Registre enregistré.
        </p>
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

      <section className="rounded-2xl border border-bordure bg-surface p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Avancement</h2>
            <p className="mt-1 text-sm text-encre-douce">
              {resume.documentes} / {resume.actifs} traitements actifs
              documentés · {resume.pourcentage} %
            </p>
          </div>
          {resume.complet ? (
            <span className="rounded-full bg-accent-douce px-3 py-1 text-xs font-semibold text-accent">
              Registre complet
            </span>
          ) : (
            <span className="rounded-full bg-alerte-douce px-3 py-1 text-xs font-semibold text-alerte">
              À compléter
            </span>
          )}
        </div>
        {resume.manquants.length > 0 ? (
          <p className="mt-3 text-sm text-alerte">
            Durée de conservation manquante :{" "}
            {resume.manquants.map((t) => t.finalite).join(", ")}.
          </p>
        ) : null}
        {!registre?.dpoContact ? (
          <p className="mt-2 text-sm text-encre-douce">
            Renseignez le contact du DPO (ou du référent) pour compléter le
            registre.
          </p>
        ) : null}
      </section>

      <form
        action={enregistrerRegistreAction}
        className="space-y-6 rounded-2xl border border-bordure bg-surface p-6 shadow-sm"
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block space-y-1 text-sm font-medium">
            <span>DPO / référent</span>
            <input
              className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
              defaultValue={registre?.dpoNom ?? ""}
              name="dpoNom"
              placeholder="Camille Martin"
            />
          </label>
          <label className="block space-y-1 text-sm font-medium">
            <span>Contact DPO</span>
            <input
              className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
              defaultValue={registre?.dpoContact ?? ""}
              name="dpoContact"
              placeholder="dpo@exemple.fr"
            />
          </label>
          <label className="block space-y-1 text-sm font-medium">
            <span>Hébergement des données</span>
            <input
              className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
              defaultValue={registre?.hebergement ?? "Union européenne"}
              name="hebergement"
            />
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className="border-b border-bordure bg-surface-2 text-xs uppercase tracking-wide text-encre-faine">
              <tr>
                <th className="p-3">Traitement</th>
                <th className="p-3">Base légale</th>
                <th className="p-3">Données</th>
                <th className="p-3">Destinataires</th>
                <th className="p-3">Actif</th>
                <th className="p-3">Conservation (mois)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bordure">
              {TRAITEMENTS_RGPD.map((traitement) => {
                const entree = entrees[traitement.code]!;
                return (
                  <tr key={traitement.code}>
                    <td className="p-3">
                      <p className="font-medium">{traitement.finalite}</p>
                      <input
                        className="mt-2 w-full rounded-lg border border-bordure bg-surface p-2 text-xs"
                        defaultValue={entree.notes}
                        name={`notes-${traitement.code}`}
                        placeholder="Mesures, sous-traitants, remarques"
                      />
                    </td>
                    <td className="p-3 text-encre-douce">
                      {traitement.baseLegale}
                    </td>
                    <td className="p-3 text-encre-douce">
                      {traitement.donnees.join(", ")}
                    </td>
                    <td className="p-3 text-encre-douce">
                      {traitement.destinataires}
                    </td>
                    <td className="p-3">
                      <label className="flex items-center gap-2">
                        <input
                          defaultChecked={entree.actif}
                          name={`actif-${traitement.code}`}
                          type="checkbox"
                        />
                        <span className="sr-only">
                          {traitement.finalite} actif
                        </span>
                      </label>
                    </td>
                    <td className="p-3">
                      <input
                        className="w-24 rounded-lg border border-bordure bg-surface p-2 text-sm"
                        defaultValue={entree.dureeMois}
                        max={DUREE_RGPD_MAX_MOIS}
                        min={1}
                        name={`duree-${traitement.code}`}
                        type="number"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-encre-douce">
          Les durées peuvent être ajustées entre 1 et {DUREE_RGPD_MAX_MOIS}{" "}
          mois. L’export JSON reprend l’ensemble des données du tenant pour
          répondre à une demande d’accès.
        </p>

        <button
          className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-fond"
          type="submit"
        >
          Enregistrer le registre
        </button>
      </form>

      <nav className="flex flex-wrap gap-4 text-sm">
        <Link className="underline" href="/hote/audit">
          Journal d’audit
        </Link>
        <Link className="underline" href="/hote/annonce">
          Conformité de l’annonce
        </Link>
        <Link className="underline" href="/hote">
          Tableau de bord
        </Link>
      </nav>
    </main>
  );
}
