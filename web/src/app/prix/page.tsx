// Grille de prix (§14.3 « prix 1-tap ») : 7 jours x logements depuis
// /api/apercu-parc, édition ligne par ligne via prix 1-tap (pricing).
// Un prix inconnu s'affiche "—" (jamais 0), bornes du registre revérifiées
// par la passerelle. Sans JavaScript : chaque ligne POSTe de façon native.
export const instant = false;
import type { Metadata } from "next";
import Link from "next/link";
import { gwGet } from "@/lib/gateway";
import { t, type Langue } from "@/lib/i18n";
import { languePage } from "@/lib/langue";
import { Onglets } from "../onglets";
import { PrixJour, QuiListe } from "./editeur-jour";

export const metadata: Metadata = { title: "Grille de prix" };

type Logement = {
  box_id?: string;
  logement_id?: string;
  nom?: string;
  prix_7j?: unknown[];
  alertes?: string[];
};
type Apercu = { erreur?: string; logements?: Logement[] };

const QUI_PRIX = ["personne_01", "personne_02", "personne_03"];

export default async function PagePrix({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string; depuis?: string }>;
}) {
  const sp = await searchParams;
  const lang: Langue = languePage(sp);
  // Navigation semaine sans JS : depuis=YYYY-MM-DD (bornes 90 j, gw).
  const c = /^(\d{4}-\d{2}-\d{2})$/.exec(sp.depuis || "");
  let base = c ? new Date(c[1] + "T00:00:00Z") : new Date();
  const auj = new Date();
  const MAXJ = 90;
  if (isNaN(base.getTime()) ||
      Math.abs((base.getTime() - auj.getTime()) / 86400000) > MAXJ) {
    base = auj;
  }
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const depuis = iso(base);
  const decaler = (n: number) => {
    const d = new Date(base);
    d.setUTCDate(d.getUTCDate() + n);
    return iso(d);
  };
  const navUrl = (d: string) =>
    d === iso(auj) ? `/prix?lang=${lang}` : `/prix?lang=${lang}&depuis=${d}`;
  const ap = await gwGet<Apercu>(
    depuis === iso(auj)
      ? "/api/apercu-parc"
      : `/api/apercu-parc?depuis=${encodeURIComponent(depuis)}`,
  ).catch((e: Error) => ({ erreur: e.message }) as Apercu);
  const liste = ap.logements || [];

  // Les prix sont des tableaux [date, direct, {canal:valeur}] — on normalise.
  function ligne(j: unknown): { date: string; direct: number | null } {
    if (Array.isArray(j) && j.length >= 2) {
      const date = String(j[0]);
      const v = j[1];
      const direct =
        typeof v === "number" || typeof v === "string"
          ? Number(v)
          : Number((v as { direct?: number })?.direct);
      return { date, direct: Number.isFinite(direct) ? direct : null };
    }
    if (j && typeof j === "object") {
      const o = j as { value?: unknown[] };
      if (Array.isArray(o.value) && o.value.length >= 2) {
        const date = String(o.value[0]);
        const v2 = o.value[1];
        const d =
          typeof v2 === "number" || typeof v2 === "string"
            ? Number(v2)
            : Number((v2 as { direct?: number })?.direct);
        return { date, direct: Number.isFinite(d) ? d : null };
      }
    }
    return { date: "", direct: null };
  }

  return (
    <div className="flex flex-col gap-5">
      <Onglets lang={lang} ici="/prix" />

      <section className="hero" aria-label={t("grille_prix", lang)}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] opacity-80">
              {t("planning", lang)} · pricing
            </p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight md:text-4xl">
              Grille de prix 7 jours
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <Link rel="prev" href={navUrl(decaler(-7))} className="bouton bouton-secondaire px-3 py-1.5">
                ← 7 j
              </Link>
              <span className="rounded-xl bg-(--surface-2) px-3 py-1.5 font-mono text-xs tabular-nums">
                {depuis} → {decaler(6)}
              </span>
              <Link rel="next" href={navUrl(decaler(7))} className="bouton bouton-secondaire px-3 py-1.5">
                7 j →
              </Link>
              {depuis !== iso(auj) && (
                <Link href={navUrl(iso(auj))} className="text-xs underline decoration-dotted underline-offset-2">
                  aujourd&#39;hui
                </Link>
              )}
            </div>
          </div>
          <Link href="/planning" className="bouton bouton-secondaire px-3 py-2">
            Voir les conflits ⚔ →
          </Link>
        </div>
        {ap.erreur && (
          <p className="mt-3 rounded-xl bg-white/15 px-3 py-2 text-sm">{ap.erreur}</p>
        )}
      </section>

      <QuiListe ids={QUI_PRIX} />

      {liste.map((l) => {
        const jours = (l.prix_7j || []).map(ligne).filter((j) => j.date);
        return (
          <section key={l.logement_id} className="carte p-5 md:p-6" aria-label={`Prix ${l.nom}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-extrabold">{l.nom || l.logement_id}</h2>
              <span className="badge">{l.box_id}</span>
            </div>
            <div className="mt-3 flex flex-col gap-1.5">
              {jours.map((j) => (
                <div
                  key={j.date}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-(--surface-2) px-3 py-2"
                >
                  <PrixJour
                    date={j.date}
                    actuel={j.direct}
                    boxId={l.box_id || ""}
                    logementId={l.logement_id || ""}
                  />
                  {j.direct !== null && (
                    <span className="text-xs tabular-nums text-(--encre-faine)">
                      actuel : {j.direct} €
                    </span>
                  )}
                </div>
              ))}
              {jours.length === 0 && (
                <p className="rounded-xl bg-(--alerte-douce) px-3 py-2 text-sm text-(--alerte)">
                  Prix 7 j indisponible pour ce logement (box injoignable ou stale).
                </p>
              )}
            </div>
          </section>
        );
      })}

      <p className="text-xs text-(--encre-faine)">
        Trancher un ⚔ split-brain se fait sur <Link href="/planning" className="underline">/planning</Link>{" "}
        (motif tracé) — ici on ordonne le prix DIRECT ; la passerelle vérifie
        les bornes prix_min/prix_max du registre à chaque écriture.
      </p>
    </div>
  );
}
