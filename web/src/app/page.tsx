// Page pilotage hôte : hero KPIs + cartes logements + 14 actions 1-tap.
// Rendu serveur (SSR) : lisible et ACTIONNABLE sans JavaScript.
// Les formulaires POSTent en natif vers les Server Actions.
export const instant = false;
import { gwGet, ACTIONS, type ActionId } from "@/lib/gateway";
import { LIBELLES_ACTION, t, type Langue } from "@/lib/i18n";
import { languePage } from "@/lib/langue";
import { Onglets } from "./onglets";
import { FormulaireAction } from "./formulaire-action";

type Logement = {
  box_id?: string;
  logement_id?: string;
  nom?: string;
  stale?: boolean;
  prix_7j?: [string, number | string][];
  journal_total?: number;
  occupation?: { occ_j30?: unknown };
  dernieres?: { ts?: string; ref?: string; qui?: string; quoi?: string }[];
  todos?: { dossier?: string; statut?: string; deadline?: string }[];
  routage_primaire?: string;
  ha_vivante?: boolean;
  copro_verifiee?: boolean;
  alertes?: string[];
  erreurs?: string[];
};
type Apercu = {
  boxes?: { box_id: string; site?: string; last_seen?: string }[];
  logements?: Logement[];
  fanout_ms?: number;
  generated_at?: string;
};
type Metriques = { ecritures?: number; ecritures_refusees?: number };

const HUMAINS: [string, string][] = [
  ["personne_01", "personne_01 (super_admin)"],
  ["personne_02", "personne_02 (admin)"],
  ["personne_03", "personne_03 (operateur)"],
  ["personne_04", "personne_04 (comptable)"],
  ["commercial_01", "commercial_01 (commercial)"],
];

const EXEMPLES: Record<string, string> = {
  debut: "2027-11-10",
  fin: "2027-11-12",
  voyageurs: "2",
  date: "2027-12-01",
  prix: "150",
  presta_id: "lab_menage_01",
  motif: "Ménage J+1",
  dossier: "menage/log1/M-001",
  facture_id: "F-2027-001",
  rubrique: "menage",
  canal: "virement",
  montant: "450",
  ref_resa: "",
  annee: "2027",
  mois: "11",
  justificatifs: "photo-canape.jpg,facture.pdf",
  b2b: "non",
  type_doc: "facture_b2c",
  extras: "linge-lit:1,parking:1",
  arrivee: "2027-11-10",
  description: "Fuite sous l'évier de la cuisine",
};

async function donnees() {
  const [ap, met] = await Promise.all([
    gwGet<Apercu>("/api/apercu-parc").catch(() => null),
    gwGet<Metriques>("/metrics").catch(() => null),
  ]);
  return { ap, met };
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const sp = await searchParams;
  const lang: Langue = languePage(sp);
  return <Pilotage lang={lang} />;
}

function maxPrix(prix: [string, number | string][]): number {
  let m = 0;
  for (const [, p] of prix) {
    const n = Number(p);
    if (Number.isFinite(n) && n > m) m = n;
  }
  return m || 1;
}

async function Pilotage({ lang }: { lang: Langue }) {
  let ap: Apercu | null = null;
  let met: Metriques | null = null;
  let erreur = "";
  try {
    ({ ap, met } = await donnees());
  } catch (e) {
    erreur = e instanceof Error ? e.message : String(e);
  }
  const logements = ap?.logements || [];
  const joignables = logements.filter((l) => !l.stale).length;
  const todosOuverts = logements.reduce(
    (n, l) => n + (l.todos || []).filter((x) => x.statut !== "fait").length,
    0,
  );
  const refBase = (ap?.generated_at || new Date().toISOString())
    .replace(/[:.\-+]/g, "")
    .replace("T", "-")
    .slice(0, 20);
  const L = (id: ActionId) => LIBELLES_ACTION[id]?.[lang] ?? id;

  if (!ap)
    return (
      <div className="flex flex-col gap-4">
        <Onglets lang={lang} ici="/" />
        <div className="carte border-[var(--danger)] p-6" role="alert">
          <h1 className="text-xl font-extrabold">Passerelle injoignable</h1>
          <p className="mt-2 text-sm text-[var(--encre-douce)]">
            Vérifiez <code>LCD_GATEWAY_URL</code> (défaut 127.0.0.1:8443) ou le
            mode démo.
          </p>
          {erreur && <p className="mt-2 text-xs text-[var(--danger)]">Détail : {erreur}</p>}
        </div>
      </div>
    );

  return (
    <div className="flex flex-col gap-5">
      <Onglets lang={lang} ici="/" />

      <section className="hero" aria-label={t("pilotage", lang)}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] opacity-80">
              {t("titre", lang)}
            </p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight md:text-4xl">
              {t("pilotage", lang)}
            </h1>
          </div>
          <span className="badge" style={{ background: "rgb(255 255 255 / .18)", color: "#fff" }}>
            <span aria-hidden>●</span> {joignables}/{logements.length} {t("joignables", lang)}
          </span>
        </div>
        <div className="kpis mt-5">
          <div className="kpi">
            <div className="kpi-valeur">{logements.length}</div>
            <div className="kpi-etiquette">{t("kpi_logements", lang)}</div>
          </div>
          <div className="kpi">
            <div className="kpi-valeur">{todosOuverts}</div>
            <div className="kpi-etiquette">{t("kpi_todos", lang)}</div>
          </div>
          <div className="kpi">
            <div className="kpi-valeur">
              {met?.ecritures ?? 0}
              <span className="text-sm font-semibold opacity-80">
                {" "}/ {met?.ecritures_refusees ?? 0} {t("kpi_refus", lang)}
              </span>
            </div>
            <div className="kpi-etiquette">{t("kpi_ecritures", lang)}</div>
          </div>
          <div className="kpi">
            <div className="kpi-valeur">
              {ap.fanout_ms ?? "—"}
              <span className="text-sm font-semibold opacity-80"> ms</span>
            </div>
            <div className="kpi-etiquette">{t("kpi_fanout", lang)}</div>
          </div>
        </div>
      </section>

      {logements.map((r) => {
        const lid = String(r.logement_id || "?");
        const stale = !!r.stale;
        const prix = r.prix_7j || [];
        const plafond = maxPrix(prix);
        const todos = (r.todos || []).filter((x) => x.statut !== "fait");
        return (
          <section key={`${r.box_id}-${lid}`} className="carte p-5 md:p-6" aria-label={r.nom || lid}>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-extrabold tracking-tight">{r.nom || lid}</h2>
              <span className="text-xs text-[var(--encre-faine)]">{lid} · {r.box_id}</span>
              <span className="ml-auto flex flex-wrap gap-1.5">
                {stale ? (
                  <span className="badge badge-danger">{t("ecritures_off", lang)}</span>
                ) : (
                  <span className="badge badge-ok">● {t("joignables", lang)}</span>
                )}
                <span className={`badge ${r.copro_verifiee ? "badge-accent" : "badge-alerte"}`}>
                  {t("copro", lang)} : {r.copro_verifiee ? t("oui", lang) : t("non_bloquee", lang)}
                </span>
                <span className={`badge ${r.ha_vivante ? "badge-accent" : "badge-alerte"}`}>
                  HA : {r.ha_vivante ? t("ha_vivante", lang) : t("ha_morte", lang)}
                </span>
              </span>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
              <div className="rounded-xl bg-[var(--surface-2)] p-3">
                <dt className="text-xs text-[var(--encre-faine)]">{t("kpi_journal", lang)}</dt>
                <dd className="mt-0.5 text-lg font-bold tabular-nums">{r.journal_total ?? 0}</dd>
              </div>
              <div className="rounded-xl bg-[var(--surface-2)] p-3">
                <dt className="text-xs text-[var(--encre-faine)]">{t("kpi_occupation", lang)}</dt>
                <dd className="mt-0.5 text-lg font-bold tabular-nums">{String(r.occupation?.occ_j30 ?? "—")}</dd>
              </div>
              <div className="rounded-xl bg-[var(--surface-2)] p-3">
                <dt className="text-xs text-[var(--encre-faine)]">{t("kpi_routage", lang)}</dt>
                <dd className="mt-0.5 truncate text-lg font-bold">{r.routage_primaire || "—"}</dd>
              </div>
              <div className="rounded-xl bg-[var(--surface-2)] p-3">
                <dt className="text-xs text-[var(--encre-faine)]">{t("kpi_todos", lang)}</dt>
                <dd className="mt-0.5 text-lg font-bold tabular-nums">{todos.length}</dd>
              </div>
            </dl>

            {prix.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-semibold text-[var(--encre-faine)]">
                  {t("prix_7j", lang)} · {String(prix[0][1])} € {t("aujourd_hui", lang)}
                </p>
                <div className="prix-7j" role="img" aria-label={`${t("prix_7j", lang)} : ${prix.map((p) => String(p[1])).join(", ")}`}>
                  {prix.map(([jour, p], i) => (
                    <span
                      key={`${jour}-${i}`}
                      title={`${jour} : ${String(p)} €`}
                      style={{ height: `${Math.max(8, Math.round((Number(p) / plafond) * 100))}%` }}
                    />
                  ))}
                </div>
              </div>
            )}

            {(r.alertes || []).length > 0 && (
              <ul className="mt-3 flex flex-col gap-1.5" role="list" aria-label={t("alertes", lang)}>
                {r.alertes!.map((a, i) => (
                  <li key={i} className="rounded-xl bg-[var(--alerte-douce)] px-3 py-2 text-sm text-[var(--alerte)]">
                    ⚠ {a}
                  </li>
                ))}
              </ul>
            )}

            {todos.length > 0 && (
              <div className="table-defilante mt-3 border border-[var(--bordure)]">
                <table>
                  <thead>
                    <tr>
                      <th>{t("th_dossier", lang)}</th>
                      <th>{t("th_statut", lang)}</th>
                      <th>{t("th_echeance", lang)}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todos.slice(0, 8).map((x, i) => (
                      <tr key={i}>
                        <td>{x.dossier || "—"}</td>
                        <td>{x.statut || "—"}</td>
                        <td className="tabular-nums">{x.deadline || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {stale ? (
              <p className="mt-4 rounded-xl bg-[var(--danger-douce)] p-3 text-sm text-[var(--danger)]" role="status">
                {t("ecritures_off", lang)}
              </p>
            ) : (
              <>
                <h3 className="mt-5 text-sm font-bold uppercase tracking-wide text-[var(--encre-faine)]">
                  {t("actions_1tap", lang)}
                </h3>
                <div className="mt-2 grid gap-3 lg:grid-cols-2">
                  {ACTIONS.map((a) => (
                    <FormulaireAction
                      key={a.id}
                      actionId={a.id}
                      libelle={L(a.id)}
                      champs={[...a.champs]}
                      exemples={EXEMPLES}
                      boxId={String(r.box_id || "")}
                      logementId={lid}
                      refBase={`${refBase}-${lid}`}
                      humains={HUMAINS}
                      envoyer={t("envoyer", lang)}
                      choisirQui={t("qui", lang)}
                    />
                  ))}
                </div>
              </>
            )}
          </section>
        );
      })}
    </div>
  );
}
