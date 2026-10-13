// Page proprio : relevé lecture seule du mandat (portail tiers §3bis).
// Lecture seule : aucun formulaire d'écriture ici, par construction.
// Montants structurés (cartes + table), jamais de JSON brut.
export const instant = false;
import { gwGet } from "@/lib/gateway";
import { t, type Langue } from "@/lib/i18n";
import { Onglets } from "../onglets";
import { languePage } from "@/lib/langue";

type Releve = {
  erreur?: string;
  logement_id?: string;
  brut_recolte?: number;
  charges_totales?: number;
  net_reverse?: number;
  commission_conciergerie?: number;
  commission_pct_applique?: number;
  nuits?: number;
  menage?: number;
  par_canal?: Record<string, number>;
  periode?: { annee?: string; mois?: string };
  reversement?: string;
  lecture_seule?: boolean;
};

function eur(n: unknown): string {
  const v = Number(n);
  if (!Number.isFinite(v)) return "—";
  return `${v.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} €`;
}

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
  const releve = await gwGet<Releve>(
    `/parc/portail/${encodeURIComponent(logement)}?qui=${encodeURIComponent(qui)}`,
  ).catch((e: Error) => ({ erreur: e.message }) as Releve);
  const canaux = Object.entries(releve.par_canal || {});
  const totalCanaux = canaux.reduce((n, [, v]) => n + Number(v || 0), 0) || 1;

  return (
    <div className="flex flex-col gap-5">
      <Onglets lang={lang} ici="/proprio" />

      <section className="hero hero-proprio" aria-label={t("releve_titre", lang)}>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] opacity-80">
          {t("proprio", lang)} · {t("lecture_seule", lang)}
        </p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight md:text-4xl">
          {t("releve_titre", lang)} — {logement}
        </h1>
        <div className="kpis mt-5">
          <div className="kpi">
            <div className="kpi-valeur">{eur(releve.brut_recolte)}</div>
            <div className="kpi-etiquette">{t("releve_brut", lang)}</div>
          </div>
          <div className="kpi">
            <div className="kpi-valeur">{eur(releve.charges_totales)}</div>
            <div className="kpi-etiquette">{t("releve_charges", lang)}</div>
          </div>
          <div className="kpi">
            <div className="kpi-valeur">{eur(releve.net_reverse)}</div>
            <div className="kpi-etiquette">{t("releve_net", lang)}</div>
          </div>
          <div className="kpi">
            <div className="kpi-valeur">
              {releve.nuits ?? "—"}
              <span className="text-sm font-semibold opacity-80"> {t("releve_nuits", lang)}</span>
            </div>
            <div className="kpi-etiquette">
              {t("releve_commission", lang)} : {releve.commission_pct_applique ?? "—"} %
            </div>
          </div>
        </div>
      </section>

      <form method="get" action="/proprio" className="carte flex flex-wrap items-end gap-2 p-3 text-sm">
        <input type="hidden" name="lang" value={lang} />
        <label className="font-medium">{t("choisir_logement", lang)}
          <input name="logement" defaultValue={logement} className="champ mt-1" autoComplete="off" />
        </label>
        <label className="font-medium">{t("qui", lang)}
          <input name="qui" defaultValue={qui} className="champ mt-1" autoComplete="off" />
        </label>
        <button type="submit" className="bouton bouton-secondaire px-4 py-2">OK</button>
      </form>

      {releve.erreur ? (
        <div className="carte p-5" role="alert">
          <p className="text-sm text-[var(--danger)]">{releve.erreur}</p>
        </div>
      ) : (
        <>
          {canaux.length > 0 && (
            <section className="carte p-5 md:p-6" aria-label={t("releve_canaux", lang)}>
              <h2 className="text-lg font-extrabold">{t("releve_canaux", lang)}</h2>
              <ul className="mt-3 flex flex-col gap-2">
                {canaux.map(([canal, montant]) => (
                  <li key={canal}>
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="font-semibold capitalize">{canal}</span>
                      <span className="tabular-nums">{eur(montant)}</span>
                    </div>
                    <div
                      className="mt-1 h-2 overflow-hidden rounded-full bg-[var(--surface-2)]"
                      role="img"
                      aria-label={`${canal} : ${eur(montant)}`}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.max(3, Math.round((Number(montant) / totalCanaux) * 100))}%`,
                          background: "linear-gradient(90deg, #b45309, #f59e0b)",
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <section className="carte p-5 md:p-6" aria-label={t("releve_detail", lang)}>
            <h2 className="text-lg font-extrabold">{t("releve_detail", lang)}</h2>
            <div className="table-defilante mt-3 border border-[var(--bordure)]">
              <table>
                <tbody>
                  {[
                    [t("releve_brut", lang), eur(releve.brut_recolte)],
                    [t("releve_charges", lang), eur(releve.charges_totales)],
                    [t("releve_menage", lang), eur(releve.menage)],
                    [t("releve_commission", lang), `${eur(releve.commission_conciergerie)} (${releve.commission_pct_applique ?? "—"} %)`],
                    [t("releve_net", lang), eur(releve.net_reverse)],
                    [t("releve_reversement", lang), releve.reversement || "—"],
                  ].map(([k, v]) => (
                    <tr key={k}>
                      <th scope="row" className="font-semibold normal-case tracking-normal">{k}</th>
                      <td className="text-right font-bold tabular-nums">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
