// Page commercial : pipeline + prospect + simulateur (scope strict §14.5).
export const instant = false;
import { gwGet } from "@/lib/gateway";
import { t, type Langue } from "@/lib/i18n";
import { languePage } from "@/lib/langue";
import { Onglets } from "../onglets";
import { FormProspect, FormSimulateur } from "./formulaires";

export default async function PageCommercial({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const sp = await searchParams;
  const lang: Langue = languePage(sp);
  return <EspaceCommercial lang={lang} />;
}

async function EspaceCommercial({ lang }: { lang: Langue }) {
  const pipe = await gwGet<{ par_statut?: Record<string, string[]>; pipeline?: string[] }>(
    "/v1/pipeline?qui=commercial_01",
  ).catch(() => ({ par_statut: {}, pipeline: [] }) as { par_statut?: Record<string, string[]>; pipeline?: string[] });
  const statuts: Record<string, string[]> = pipe.par_statut || {};
  const etapes: string[] = pipe.pipeline || [];

  return (
    <div className="flex flex-col gap-4">
      <Onglets lang={lang} />
      <section className="rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 p-5 text-white shadow">
        <h1 className="text-2xl font-bold">{t("commercial", lang)}</h1>
        <p className="mt-1 text-sm text-violet-100">Prospects + simulateur + offres seuls (jamais prix/coûts)</p>
      </section>
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="font-semibold">Pipeline</h2>
        <div className="mt-2 flex flex-wrap gap-2 text-sm">
          {etapes.map((etape) => (
            <span key={etape} className="rounded-full bg-violet-100 px-3 py-1 text-violet-800 dark:bg-violet-950 dark:text-violet-200">
              {etape} ({(statuts[etape] || []).length})
            </span>
          ))}
        </div>
      </section>
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="font-semibold">Nouveau prospect</h2>
        <div className="mt-3"><FormProspect envoyer={t("envoyer", lang)} /></div>
      </section>
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="font-semibold">Simulateur (indicatif)</h2>
        <div className="mt-3"><FormSimulateur envoyer={t("envoyer", lang)} /></div>
      </section>
    </div>
  );
}
