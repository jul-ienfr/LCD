// Page proprio : relevé lecture seule du mandat (portail tiers §3bis).
// Lecture seule : aucun formulaire d'écriture ici, par construction.
export const instant = false;
import { gwGet } from "@/lib/gateway";
import { Onglets } from "../onglets";
import { languePage } from "@/lib/langue";
import type { Langue } from "@/lib/i18n";

export default async function PageProprio({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string; logement?: string; qui?: string }>;
}) {
  const sp = await searchParams;
  const lang: Langue = languePage(sp);
  const logement = typeof sp.logement === "string" ? sp.logement : "log1";
  const qui = typeof sp.qui === "string" ? sp.qui : "personne_05";
  return <Releve lang={lang} logement={logement} qui={qui} />;
}

async function Releve({ lang, logement, qui }: { lang: Langue; logement: string; qui: string }) {
  const releve = await gwGet<Record<string, unknown>>(
    `/parc/portail/${encodeURIComponent(logement)}?qui=${encodeURIComponent(qui)}`,
  ).catch((e: Error) => ({ erreur: e.message }));

  return (
    <div className="flex flex-col gap-4">
      <Onglets lang={lang} />
      <section className="rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 p-5 text-white shadow">
        <h1 className="text-2xl font-bold">Relevé — {logement}</h1>
        <p className="mt-1 text-sm text-amber-50">Lecture seule · source : compta du logement</p>
      </section>
      <form method="get" action="/proprio" className="flex flex-wrap items-center gap-2 text-sm">
        <input type="hidden" name="lang" value={lang} />
        <label>Logement : <input name="logement" defaultValue={logement} className="rounded-full border border-zinc-300 px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900" /></label>
        <label>Qui : <input name="qui" defaultValue={qui} className="rounded-full border border-zinc-300 px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900" /></label>
        <button type="submit" className="rounded-full border border-zinc-300 px-3 py-1.5">OK</button>
      </form>
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <pre className="overflow-auto text-xs">{JSON.stringify(releve, null, 2)}</pre>
      </section>
    </div>
  );
}
