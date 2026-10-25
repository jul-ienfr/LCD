import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import {
  avancementMenage,
  LIBELLES_STATUT_MENAGE,
  STATUTS_MENAGE,
} from "@/domain/menage";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleMenagesRepository } from "@/infrastructure/db/repositories/menages-repository";
import { requireRole, tenantIdDeSession } from "@/lib/session";
import { enregistrerMenageAction } from "../actions";

export const instant = false;

export default async function PageMenageDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  await connection();
  const session = await requireRole(["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const { id } = await params;
  const query = await searchParams;

  const menage = await new DrizzleMenagesRepository().trouverParId(
    tenantId,
    id,
  );
  if (!menage) notFound();

  const logements = await new DrizzleLogementRepository().listerParTenant(
    tenantId,
  );
  const logement = logements.find((l) => l.id === menage.logementId);
  const avancement = avancementMenage(menage.taches);

  return (
    <main className="mx-auto max-w-3xl space-y-8 px-6 py-12">
      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-widest text-encre-faine">
          Espace hôte · Ménage
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Ménage — {logement?.nom ?? "Logement"}
        </h1>
        <p className="text-encre-douce">
          {menage.date} · {LIBELLES_STATUT_MENAGE[menage.statut]} ·{" "}
          {avancement.faites} / {avancement.total} tâches ({avancement.pourcentage}
          %)
        </p>
      </header>

      {query.ok ? (
        <p
          className="rounded-xl border border-accent bg-accent-douce p-3 text-sm text-accent"
          role="status"
        >
          Ménage enregistré.
        </p>
      ) : null}
      {query.erreur ? (
        <p
          className="rounded-xl border border-danger bg-danger-douce p-3 text-sm text-danger"
          role="alert"
        >
          {query.erreur === "inattendu"
            ? "Erreur inattendue. Réessayez."
            : query.erreur}
        </p>
      ) : null}

      <form
        action={enregistrerMenageAction}
        className="space-y-4 rounded-2xl border border-bordure bg-surface p-6 shadow-sm"
      >
        <input type="hidden" name="id" value={menage.id} />

        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold">Checklist</legend>
          {menage.taches.map((tache, index) => (
            <label
              key={`${tache.libelle}-${index}`}
              className="flex items-center gap-3 rounded-xl border border-bordure p-3 text-sm"
            >
              <input
                defaultChecked={tache.fait}
                name={`tache-${index}`}
                type="checkbox"
              />
              <input
                className="flex-1 bg-transparent"
                defaultValue={tache.libelle}
                name={`libelle-${index}`}
              />
            </label>
          ))}
        </fieldset>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1 text-sm font-medium">
            <span>Statut</span>
            <select
              className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
              defaultValue={menage.statut}
              name="statut"
            >
              {STATUTS_MENAGE.map((statut) => (
                <option key={statut} value={statut}>
                  {LIBELLES_STATUT_MENAGE[statut]}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1 text-sm font-medium">
            <span>Notes</span>
            <input
              className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
              defaultValue={menage.notes}
              name="notes"
            />
          </label>
        </div>

        <p className="text-xs text-encre-douce">
          Passer le ménage à « Fait » consomme la rotation de consommables du
          logement, une seule fois par ménage.
        </p>

        <button
          className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-fond"
          type="submit"
        >
          Enregistrer le ménage
        </button>
      </form>

      <nav className="flex flex-wrap gap-4 text-sm">
        <Link
          className="underline"
          href={`/hote/menage?logement=${menage.logementId}`}
        >
          Tous les ménages
        </Link>
        <Link
          className="underline"
          href={`/hote/stocks?logement=${menage.logementId}`}
        >
          Stocks
        </Link>
      </nav>
    </main>
  );
}
