// Page commercial : hero + pipeline kanban + prospect + simulateur.
// Scope strict §14.5 : prospects + simulateur + offres seuls (jamais prix/coûts).
export const instant = false;
import { gwGet } from "@/lib/gateway";
import { t, type Langue } from "@/lib/i18n";
import { languePage } from "@/lib/langue";
import { Onglets } from "../onglets";
import { FormProspect, FormSimulateur, FormOffre } from "./formulaires";

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
  const total = etapes.reduce((n, e) => n + (statuts[e] || []).length, 0);

  return (
    <div className="flex flex-col gap-5">
      <Onglets lang={lang} ici="/commercial" />

      <section className="hero hero-commercial" aria-label={t("commercial", lang)}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] opacity-80">
              {t("commercial", lang)}
            </p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight md:text-4xl">
              {t("pipeline_titre", lang)}
            </h1>
          </div>
          <span className="badge" style={{ background: "rgb(255 255 255 / .18)", color: "#fff" }}>
            {total} {t("pipeline_prospects", lang)}
          </span>
        </div>
        <ol className="mt-5 flex gap-2 overflow-x-auto" aria-label={t("pipeline_titre", lang)}>
          {etapes.map((etape) => {
            const ids = statuts[etape] || [];
            return (
              <li
                key={etape}
                className="min-w-32 flex-1 rounded-xl border border-white/25 bg-white/10 px-3 py-2 text-center backdrop-blur"
              >
                <div className="text-xl font-extrabold tabular-nums">{ids.length}</div>
                <div className="truncate text-xs opacity-85">{etape}</div>
                {ids.length > 0 && (
                  <ul className="mt-1.5 flex flex-wrap justify-center gap-1" role="list">
                    {ids.map((id) => (
                      <li key={id} className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-(--encre)">
                        {id}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ol>
      </section>

      <div className="grid gap-5 lg:grid-cols-3">
        <section className="carte p-5 md:p-6" aria-label={t("prospect_titre", lang)}>
          <div className="flex items-center gap-3">
            <span aria-hidden className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--accent-douce)] text-xl">＋</span>
            <div>
              <h2 className="text-lg font-extrabold">{t("prospect_titre", lang)}</h2>
              <p className="text-sm text-[var(--encre-douce)]">{t("prospect_sous", lang)}</p>
            </div>
          </div>
          <div className="mt-4"><FormProspect envoyer={t("envoyer", lang)} /></div>
        </section>
        <section className="carte p-5 md:p-6" aria-label={t("simulateur_titre", lang)}>
          <div className="flex items-center gap-3">
            <span aria-hidden className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--alerte-douce)] text-xl">◈</span>
            <div>
              <h2 className="text-lg font-extrabold">{t("simulateur_titre", lang)}</h2>
              <p className="text-sm text-[var(--encre-douce)]">{t("simulateur_sous", lang)}</p>
            </div>
          </div>
          <div className="mt-4"><FormSimulateur envoyer={t("envoyer", lang)} /></div>
        </section>
        <section className="carte p-5 md:p-6" aria-label="Offre">
          <div className="flex items-center gap-3">
            <span aria-hidden className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--ok-douce)] text-xl">📄</span>
            <div>
              <h2 className="text-lg font-extrabold">Offre (PDF-ready)</h2>
              <p className="text-sm text-[var(--encre-douce)]">
                Texte marque blanche à partir du prospect + simulation — indicatif, mention fiscale incluse.
              </p>
            </div>
          </div>
          <div className="mt-4"><FormOffre envoyer={t("envoyer", lang)} /></div>
        </section>
      </div>
    </div>
  );
}
