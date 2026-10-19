// Page /supervision (dash-admin) — supervision système V6 §S3.5 : comme
// /systeme SAUF secrets/rotation, qui n'apparaissent NULLEMENT ici (admin ne
// lit ni ne déclare une rotation — 403 prouvé par la batterie V6). Santé,
// box prêtes, métriques, hébergement.
export const instant = false;
import { gwGet } from "@/lib/gateway";
import type { Langue } from "@/lib/i18n";
import { t } from "../../i18n";
import { languePage } from "@/lib/langue";
import { Onglets } from "@/app/onglets";

type Health = { ok?: boolean };
type Ready = { ok?: boolean; boxes?: { box_id?: string; site?: string; logements?: unknown[]; last_seen?: string }[]; erreurs?: string[] };
type Metrics = { fanout_p95_ms?: number; ecritures?: number; ecritures_refusees?: number; nb_boxes?: number; nb_logements?: number };
type Statut = { phase_conseillee?: string; motif?: string; outbox_total?: number; etat?: { uptime_s?: number } };

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

  let s: Health | null = null, p: Ready | null = null,
    met: Metrics | null = null, st: Statut | null = null;
  let erreur = "";
  try {
    [s, p, met, st] = await Promise.all([
      gwGet<Health>("/health").catch(() => null),
      gwGet<Ready>("/ready").catch(() => null),
      gwGet<Metrics>("/metrics").catch(() => null),
      gwGet<Statut>("/v1/statut").catch(() => null),
    ]);
  } catch (e) {
    erreur = e instanceof Error ? e.message : String(e);
  }

  if (!s && !p && !met) {
    return (
      <div className="flex flex-col gap-4">
        <Onglets lang={lang} ici="/supervision" />
        <div className="carte border-[var(--danger)] p-6" role="alert">
          <h1 className="text-xl font-extrabold">{t("admin.injoignable", lang)}</h1>
          {erreur && <p className="mt-2 text-xs text-[var(--danger)]">{erreur}</p>}
        </div>
      </div>
    );
  }

  const boxes = p?.boxes || [];

  return (
    <div className="flex flex-col gap-5">
      <Onglets lang={lang} ici="/supervision" />

      <section className="hero" aria-label={t("admin.titre", lang)}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] opacity-80">
              {t("admin.titre", lang)}
            </p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight md:text-4xl">
              {t("admin.sante", lang)}
            </h1>
          </div>
          <span className="badge" style={{ background: "rgb(255 255 255 / .18)", color: "#fff" }}>
            <span aria-hidden>●</span> {p?.ok ? "OK" : "DEGRADÉ"}
          </span>
        </div>
        <div className="kpis mt-5">
          <div className="kpi">
            <div className="kpi-valeur">{s?.ok ? "●" : "○"}</div>
            <div className="kpi-etiquette">{t("admin.sante", lang)}</div>
          </div>
          <div className="kpi">
            <div className="kpi-valeur">{boxes.length}</div>
            <div className="kpi-etiquette">{t("admin.nb_boxes", lang)}</div>
          </div>
          <div className="kpi">
            <div className="kpi-valeur">{met?.nb_logements ?? "—"}</div>
            <div className="kpi-etiquette">{t("admin.nb_logements", lang)}</div>
          </div>
          <div className="kpi">
            <div className="kpi-valeur">{met?.fanout_p95_ms ?? "—"}<span className="text-sm font-semibold opacity-80"> ms</span></div>
            <div className="kpi-etiquette">{t("admin.p95", lang)}</div>
          </div>
          <div className="kpi">
            <div className="kpi-valeur">{duree(st?.etat?.uptime_s)}</div>
            <div className="kpi-etiquette">{t("admin.uptime", lang)}</div>
          </div>
          <div className="kpi">
            <div className="kpi-valeur">
              {met?.ecritures ?? 0}
              <span className="text-sm font-semibold opacity-80"> / {met?.ecritures_refusees ?? 0}</span>
            </div>
            <div className="kpi-etiquette">{t("admin.ecritures", lang)}</div>
          </div>
        </div>
        <p className="mt-4 rounded-xl bg-[var(--surface-2)] p-3 text-xs text-[var(--encre-douce)]">
          🔒 {t("admin.pas_secrets", lang)}
        </p>
      </section>

      <section className="carte p-5 md:p-6" aria-label={t("admin.pret", lang)}>
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xl font-extrabold tracking-tight">{t("admin.pret", lang)}</h2>
          <span className={`badge ${p?.ok ? "badge-ok" : "badge-danger"}`}>{p?.ok ? "OK" : "DEGRADÉ"}</span>
        </div>
        <div className="table-defilante mt-4 border border-[var(--bordure)]">
          <table>
            <thead>
              <tr>
                <th>Box</th>
                <th>Site</th>
                <th>{t("admin.nb_logements", lang)}</th>
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
