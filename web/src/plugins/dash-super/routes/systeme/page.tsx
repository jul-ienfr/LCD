// Page /systeme (dash-super) — pilotage groupe F5 §S3.5 : santé passerelle,
// box prêtes, métriques, hébergement P1/P2/P3. Rendu SANS JS, dégradé si la
// passerelle est injoignable (jamais de page blanche).
export const instant = false;
import { gwGet } from "@/lib/gateway";
import type { Langue } from "@/lib/i18n";
import { t } from "../../i18n";
import { languePage } from "@/lib/langue";
import { Onglets } from "@/app/onglets";

type Health = { ok?: boolean };
type Ready = { ok?: boolean; boxes?: { box_id?: string; site?: string; logements?: unknown[]; last_seen?: string }[]; erreurs?: string[] };
type Metrics = {
  fanout_p95_ms?: number; ecritures?: number; ecritures_refusees?: number;
  nb_boxes?: number; nb_logements?: number; comptes_humains?: number;
  cache_hits?: number;
};
type Statut = {
  phase_conseillee?: string; motif?: string; outbox_total?: number;
  etat?: { uptime_s?: number; nb_logements?: number; nb_boxes?: number };
};

async function donnees() {
  const [santé, pret, met, heberg] = await Promise.all([
    gwGet<Health>("/health").catch(() => null),
    gwGet<Ready>("/ready").catch(() => null),
    gwGet<Metrics>("/metrics").catch(() => null),
    gwGet<Statut>("/v1/statut").catch(() => null),
  ]);
  return { santé, pret, met, heberg };
}

function duree(s?: number): string {
  if (s === undefined || s === null) return "—";
  const j = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600),
    m = Math.floor((s % 3600) / 60);
  return `${j}j ${h}h ${m}m`;
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const sp = await searchParams;
  const lang: Langue = languePage(sp);
  let d: Awaited<ReturnType<typeof donnees>> | null = null;
  let erreur = "";
  try {
    d = await donnees();
  } catch (e) {
    erreur = e instanceof Error ? e.message : String(e);
  }

  if (!d || (!d.santé && !d.pret && !d.met)) {
    return (
      <div className="flex flex-col gap-4">
        <Onglets lang={lang} ici="/systeme" />
        <div className="carte border-[var(--danger)] p-6" role="alert">
          <h1 className="text-xl font-extrabold">{t("super.injoignable", lang)}</h1>
          {erreur && <p className="mt-2 text-xs text-[var(--danger)]">{erreur}</p>}
        </div>
      </div>
    );
  }

  const boxes = d.pret?.boxes || [];
  const pret = d.pret?.ok ?? false;
  const st = d.heberg;

  return (
    <div className="flex flex-col gap-5">
      <Onglets lang={lang} ici="/systeme" />

      <section className="hero" aria-label={t("super.titre_systeme", lang)}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] opacity-80">
              {t("super.titre_systeme", lang)}
            </p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight md:text-4xl">
              {t("super.sante", lang)}
            </h1>
          </div>
          <span className={`badge ${pret ? "" : "badge-danger"}`} style={{ background: "rgb(255 255 255 / .18)", color: "#fff" }}>
            <span aria-hidden>●</span> {pret ? "OK" : "DEGRADÉ"}
          </span>
        </div>
        <div className="kpis mt-5">
          <div className="kpi">
            <div className="kpi-valeur">{d.santé?.ok ? "●" : "○"}</div>
            <div className="kpi-etiquette">{t("super.sante", lang)}</div>
          </div>
          <div className="kpi">
            <div className="kpi-valeur">{boxes.length}</div>
            <div className="kpi-etiquette">{t("super.nb_boxes", lang)}</div>
          </div>
          <div className="kpi">
            <div className="kpi-valeur">{d.met?.nb_logements ?? st?.etat?.nb_logements ?? "—"}</div>
            <div className="kpi-etiquette">{t("super.nb_logements", lang)}</div>
          </div>
          <div className="kpi">
            <div className="kpi-valeur">{d.met?.fanout_p95_ms ?? "—"}<span className="text-sm font-semibold opacity-80"> ms</span></div>
            <div className="kpi-etiquette">{t("super.p95", lang)}</div>
          </div>
          <div className="kpi">
            <div className="kpi-valeur">{duree(st?.etat?.uptime_s)}</div>
            <div className="kpi-etiquette">{t("super.uptime", lang)}</div>
          </div>
          <div className="kpi">
            <div className="kpi-valeur">
              {d.met?.ecritures ?? 0}
              <span className="text-sm font-semibold opacity-80"> / {d.met?.ecritures_refusees ?? 0}</span>
            </div>
            <div className="kpi-etiquette">{t("super.ecritures", lang)}</div>
          </div>
        </div>
      </section>

      <section className="carte p-5 md:p-6" aria-label={t("super.hebergement", lang)}>
        <h2 className="text-xl font-extrabold tracking-tight">{t("super.hebergement", lang)}</h2>
        <dl className="mt-4 grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
          <div className="rounded-xl bg-[var(--surface-2)] p-3">
            <dt className="text-xs text-[var(--encre-faine)]">Phase</dt>
            <dd className="mt-0.5 text-lg font-bold uppercase">{st?.phase_conseillee || "—"}</dd>
          </div>
          <div className="rounded-xl bg-[var(--surface-2)] p-3">
            <dt className="text-xs text-[var(--encre-faine)]">Motif</dt>
            <dd className="mt-0.5 truncate text-lg font-bold">{st?.motif || "—"}</dd>
          </div>
          <div className="rounded-xl bg-[var(--surface-2)] p-3">
            <dt className="text-xs text-[var(--encre-faine)]">Outbox</dt>
            <dd className="mt-0.5 text-lg font-bold tabular-nums">{st?.outbox_total ?? 0}</dd>
          </div>
          <div className="rounded-xl bg-[var(--surface-2)] p-3">
            <dt className="text-xs text-[var(--encre-faine)]">{t("super.comptes_humains", lang) || "Comptes"}</dt>
            <dd className="mt-0.5 text-lg font-bold tabular-nums">{d.met?.comptes_humains ?? "—"}</dd>
          </div>
        </dl>
      </section>

      <section className="carte p-5 md:p-6" aria-label={t("super.pret", lang)}>
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xl font-extrabold tracking-tight">{t("super.pret", lang)}</h2>
          <span className={`badge ${pret ? "badge-ok" : "badge-danger"}`}>{pret ? "OK" : "DEGRADÉ"}</span>
        </div>
        {(d.pret?.erreurs || []).length > 0 && (
          <ul className="mt-3 flex flex-col gap-1.5" role="list">
            {d.pret!.erreurs!.map((e, i) => (
              <li key={i} className="rounded-xl bg-[var(--danger-douce)] px-3 py-2 text-sm text-[var(--danger)]">⚠ {e}</li>
            ))}
          </ul>
        )}
        <div className="table-defilante mt-4 border border-[var(--bordure)]">
          <table>
            <thead>
              <tr>
                <th>Box</th>
                <th>Site</th>
                <th>{t("super.nb_logements", lang)}</th>
                <th>last_seen</th>
              </tr>
            </thead>
            <tbody>
              {boxes.map((b, i) => (
                <tr key={i}>
                  <td>{b.box_id || "—"}</td>
                  <td>{b.site || "—"}</td>
                  <td className="tabular-nums">{(b.logements || []).length}</td>
                  <td className="tabular-nums">{b.last_seen || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
