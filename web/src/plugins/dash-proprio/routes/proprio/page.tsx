// Portail propriétaire (V2 §S3.5) : relevé lecture seule du mandat (§3bis).
// Lecture seule par CONSTRUCTION : aucun formulaire d'écriture ici.
// Transparence totale : attention[], inconnu[] et la note « indicatif » du
// moteur sont AFFICHÉS — un montant inconnu se voit, jamais maquillé en 0.
export const instant = false;
import { gwGet } from "@/lib/gateway";
import { cookies } from "next/headers";
import { t, type Langue } from "../../i18n";
import { Onglets } from "@/app/onglets";
import { languePage } from "@/lib/langue";

type Releve = {
  erreur?: string;
  logement_id?: string;
  entite_id?: string;
  mode?: string;
  statut?: string;
  brut_recolte?: number | null;
  charges_totales?: number | null;
  net_reverse?: number | null;
  commission_conciergerie?: number | null;
  commission_pct_applique?: number | null;
  menage?: number | null;
  autres_charges?: number | null;
  nuits?: number | null;
  par_canal?: Record<string, number>;
  periode?: { annee?: string; mois?: string };
  reversement?: string;
  menage_a_charge?: string;
  lien?: string;
  note?: string;
  attention?: string[];
  inconnu?: string[];
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
  searchParams: Promise<{ lang?: string; logement?: string; qui?: string; annee?: string; mois?: string }>;
}) {
  const sp = await searchParams;
  const lang: Langue = languePage(sp);
  const jar = await cookies();
  const logement = typeof sp.logement === "string" ? sp.logement : "log1";
  const qui =
    (typeof sp.qui === "string" && sp.qui) ||
    jar.get("lcd_qui")?.value ||
    "personne_05";
  const annee = typeof sp.annee === "string" ? sp.annee : "";
  const mois = typeof sp.mois === "string" ? sp.mois : "";
  return <Releve lang={lang} logement={logement} qui={qui} annee={annee} mois={mois} />;
}

async function Releve({
  lang, logement, qui, annee, mois,
}: { lang: Langue; logement: string; qui: string; annee: string; mois: string }) {
  const q = new URLSearchParams({ qui });
  if (annee) q.set("annee", annee);
  if (mois) q.set("mois", mois);
  const releve = await gwGet<Releve>(
    `/parc/portail/${encodeURIComponent(logement)}?${q.toString()}`,
  ).catch((e: Error) => ({ erreur: e.message }) as Releve);
  const canaux = Object.entries(releve.par_canal || {});
  const totalCanaux = canaux.reduce((n, [, v]) => n + Number(v || 0), 0) || 1;
  const attention = releve.attention || [];
  const inconnu = releve.inconnu || [];

  return (
    <div className="flex flex-col gap-5">
      <Onglets lang={lang} ici="/proprio" />

      <section className="hero hero-proprio" aria-label={t("proprio.releve_titre", lang)}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] opacity-80">
              {t("proprio", lang)} · {t("proprio.lecture_seule", lang)}
              {releve.mode ? ` · ${releve.mode}` : ""}
            </p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight md:text-4xl">
              {t("proprio.releve_titre", lang)} — {logement}
            </h1>
          </div>
          {releve.statut && releve.statut !== "actif" && (
            <span className="badge badge-alerte">mandat {releve.statut} · état indicatif</span>
          )}
        </div>
        <div className="kpis mt-5">
          <div className="kpi">
            <div className="kpi-valeur">{eur(releve.brut_recolte)}</div>
            <div className="kpi-etiquette">{t("proprio.releve_brut", lang)}</div>
          </div>
          <div className="kpi">
            <div className="kpi-valeur">{eur(releve.charges_totales)}</div>
            <div className="kpi-etiquette">{t("proprio.releve_charges", lang)}</div>
          </div>
          <div className="kpi">
            <div className="kpi-valeur">{eur(releve.net_reverse)}</div>
            <div className="kpi-etiquette">{t("proprio.releve_net", lang)}</div>
          </div>
          <div className="kpi">
            <div className="kpi-valeur">
              {releve.nuits ?? "—"}
              <span className="text-sm font-semibold opacity-80"> {t("proprio.releve_nuits", lang)}</span>
            </div>
            <div className="kpi-etiquette">
              {t("proprio.releve_commission", lang)} : {releve.commission_pct_applique ?? "—"} %
            </div>
          </div>
        </div>
      </section>

      {/* Sélecteur de période (annee/mois passés à la compta) */}
      <form method="get" action="/proprio" className="carte flex flex-wrap items-end gap-2 p-3 text-sm">
        <input type="hidden" name="lang" value={lang} />
        <input type="hidden" name="qui" value={qui} />
        <label className="font-medium">{t("choisir_logement", lang)}
          <input name="logement" defaultValue={logement} className="champ mt-1" autoComplete="off" />
        </label>
        <label className="font-medium">Année
          <input name="annee" defaultValue={annee} placeholder="2026" inputMode="numeric" className="champ mt-1 w-24" autoComplete="off" />
        </label>
        <label className="font-medium">Mois
          <input name="mois" defaultValue={mois} placeholder="1-12 vide = année" inputMode="numeric" className="champ mt-1 w-24" autoComplete="off" />
        </label>
        <button type="submit" className="bouton bouton-secondaire px-4 py-2">OK</button>
      </form>

      {releve.erreur ? (
        <div className="carte p-5" role="alert">
          <p className="text-sm text-[var(--danger)]">{releve.erreur}</p>
        </div>
      ) : (
        <>
          {(attention.length > 0 || inconnu.length > 0) && (
            <section className="carte p-5" aria-label="Points d'attention" role="status">
              <div className="flex flex-col gap-2">
                {attention.map((a) => (
                  <p key={a} className="rounded-xl bg-(--alerte-douce) px-3 py-2 text-sm text-(--alerte)">⚠ {a}</p>
                ))}
                {inconnu.map((a) => (
                  <p key={a} className="rounded-xl bg-(--surface-2) px-3 py-2 text-sm text-(--encre-douce)">∅ {a}</p>
                ))}
              </div>
            </section>
          )}

          {canaux.length > 0 && (
            <section className="carte p-5 md:p-6" aria-label={t("proprio.releve_canaux", lang)}>
              <h2 className="text-lg font-extrabold">{t("proprio.releve_canaux", lang)}</h2>
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

          <section className="carte p-5 md:p-6" aria-label={t("proprio.releve_detail", lang)}>
            <h2 className="text-lg font-extrabold">{t("proprio.releve_detail", lang)}</h2>
            <div className="table-defilante mt-3 border border-[var(--bordure)]">
              <table>
                <tbody>
                  {[
                    [t("proprio.releve_brut", lang), eur(releve.brut_recolte)],
                    ["Ménage (contestation n°1)", eur(releve.menage)],
                    ["Autres charges", eur(releve.autres_charges)],
                    [t("proprio.releve_charges", lang), eur(releve.charges_totales)],
                    [t("proprio.releve_commission", lang), `${eur(releve.commission_conciergerie)} (${releve.commission_pct_applique ?? "—"} %)`],
                    ["Ménage à charge", releve.menage_a_charge || "—"],
                    [t("proprio.releve_net", lang), eur(releve.net_reverse)],
                    ["Reversement", releve.reversement || "—"],
                  ].map(([k, v]) => (
                    <tr key={k}>
                      <th scope="row" className="font-semibold normal-case tracking-normal">{k}</th>
                      <td className="text-right font-bold tabular-nums">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {releve.note && (
              <p className="mt-3 rounded-xl bg-(--surface-2) px-3 py-2 text-xs text-(--encre-douce)" role="note">
                {releve.note}
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
