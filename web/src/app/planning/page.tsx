// Planning opérateur (§14.3) : grille calendrier + conflits split-brain + annonces.
// Tout sans JavaScript. Le tranchement = geste HUMAIN tracé (§16.2).
// RBAC : c'est la passerelle qui revérifie `qui` (le front ne fait pas la loi).
export const instant = false;
import type { Metadata } from "next";
import Link from "next/link";
import { gwGet } from "@/lib/gateway";
import { t, type Langue } from "@/lib/i18n";
import { languePage } from "@/lib/langue";
import { Onglets } from "../onglets";
import { CarteTrancher } from "./carte-trancher";

export const metadata: Metadata = { title: "Planning" };

type Calendrier = {
  erreur?: string;
  debut?: string;
  jours?: number;
  logements?: {
    box_id?: string;
    logement_id?: string;
    nom?: string;
    jours?: { jour: string; disponible: boolean; conflit_ref: string | null }[];
  }[];
};
type Conflits = {
  conflits?: {
    box_id?: string;
    logement_id?: string;
    date?: string;
    prix_box?: string | number;
    prix_centrale?: string | number;
  }[];
  note?: string;
};
type Annonces = {
  annonces?: {
    logement_id?: string;
    annonce?: {
      titre?: string;
      statut?: string;
      publie_le?: string;
      publie_par?: string;
      preuve?: string;
      canaux?: string[];
    };
  }[];
};

export default async function PagePlanning({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string; jours?: string }>;
}) {
  const sp = await searchParams;
  const lang: Langue = languePage(sp);
  const jours = Math.min(30, Math.max(3, Number(sp.jours) || 14));

  const [cal, confl, annon] = await Promise.all([
    gwGet<Calendrier>(`/calendrier-parc?jours=${jours}`).catch(
      (e: Error) => ({ erreur: e.message }) as Calendrier,
    ),
    gwGet<Conflits>("/parc/conflits").catch(() => ({}) as Conflits),
    gwGet<Annonces>("/parc/annonces").catch(() => ({}) as Annonces),
  ]);
  const journees = cal.logements || [];
  const teteDates: string[] = (journees.find((j) => j.jours?.length)?.jours || []).map(
    (j) => j.jour,
  );
  const listeConflits = confl.conflits || [];

  return (
    <div className="flex flex-col gap-5">
      <Onglets lang={lang} ici="/planning" />

      <section className="hero" aria-label={t("planning", lang)}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] opacity-80">
              {t("planning", lang)} · {t("operation", lang)}
            </p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight md:text-4xl">
              {t('planning_h1', lang)}
            </h1>
          </div>
          <form method="get" action="/planning" className="flex items-end gap-2 text-sm">
            <input type="hidden" name="lang" value={lang} />
            <label className="font-medium">
              Fenêtre
              <select name="jours" defaultValue={String(jours)} className="champ ml-1 w-auto">
                {[7, 14, 30].map((j) => (
                  <option key={j} value={j}>{j} j</option>
                ))}
              </select>
            </label>
            <button type="submit" className="bouton bouton-secondaire px-3 py-2">OK</button>
          </form>
        </div>
        {cal.erreur && (
          <p className="mt-3 rounded-xl bg-white/15 px-3 py-2 text-sm">{cal.erreur}</p>
        )}
      </section>

      {/* Grille calendrier : 1 ligne par logement, 1 colonne par jour */}
      <section className="carte p-5 md:p-6" aria-label="Grille calendrier">
        <h2 className="text-lg font-extrabold">
          Occupation · fenêtre {cal.debut || "?"} → {jours} j
        </h2>
        <div className="table-defilante mt-3">
          <table className="min-w-full text-xs tabular-nums">
            <thead>
              <tr>
                <th scope="col" className="text-left font-bold">Logement</th>
                {teteDates.map((d) => (
                  <th scope="col" key={d} className="px-1 text-center font-semibold">
                    {d.slice(5)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {journees.map((l) => (
                <tr key={l.logement_id}>
                  <th scope="row" className="whitespace-nowrap py-1.5 text-left font-bold">
                    <Link href={`/hote?logement=${l.logement_id}`} className="underline decoration-dotted underline-offset-2">
                      {l.nom || l.logement_id}
                    </Link>
                  </th>
                  {(l.jours || []).map((j) => (
                    <td key={j.jour} className="px-1 text-center">
                      <span
                        aria-label={`${l.logement_id} ${j.jour} : ${j.disponible ? "libre" : "occupé"}`}
                        className="inline-block h-4 w-4 rounded-md"
                        style={{
                          background: j.disponible
                            ? "var(--ok-douce)"
                            : "linear-gradient(135deg, var(--alerte) 40%, var(--alerte-douce))",
                        }}
                      >
                        {j.conflit_ref ? "⚔" : ""}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-(--encre-faine)">
          vert = libre · orange = réservé · ⚔ = jour sous conflit split-brain (tranche
          ci-dessous). Un jour que les OTA n&apos;ont pas su dire reste inconnu, jamais
          compté comme dispo.
        </p>
      </section>

      {/* Conflits split-brain : revue humaine SEULE (§16.2) */}
      <section className="carte p-5 md:p-6" aria-label={t("conflits", lang)}>
        <h2 className="text-lg font-extrabold">
          Conflits split-brain{" "}
          <span className="badge badge-alerte align-middle">{listeConflits.length}</span>
        </h2>
        <p className="mt-1 text-sm text-[var(--encre-douce)]">
          {confl.note}
        </p>
        <div className="mt-3 flex flex-col gap-3">
          {listeConflits.length === 0 ? (
            <p className="rounded-xl bg-(--ok-douce) px-3 py-2 text-sm text-(--ok)">
              Aucun conflit ouvert — le formulaire reste prêt si un jour diverge.
            </p>
          ) : (
            listeConflits.map((c, i) => (
              <div key={`${c.box_id}-${c.logement_id}-${c.date}-${i}`} className="rounded-2xl border border-[var(--bordure)] p-3">
                <p className="text-sm font-bold">
                  {c.logement_id} @ {c.date}{" "}
                  <span className="font-normal text-(--encre-faine)">sur {c.box_id}</span>
                </p>
                <CarteTrancher
                  boxId={c.box_id || ""}
                  logementId={c.logement_id || ""}
                  date={c.date || ""}
                  prixBox={String(c.prix_box ?? "?")}
                  prixCentrale={String(c.prix_centrale ?? "?")}
                  envoyer="Trancher (tracé)"
                />
              </div>
            ))
          )}
        </div>
      </section>

      {/* Annonces synchronisées : lecture seule (§6bis-b) */}
      <section className="carte p-5 md:p-6" aria-label="Annonces">
        <h2 className="text-lg font-extrabold">Vitrine (annonces sync)</h2>
        <div className="table-defilante mt-3 border border-[var(--bordure)]">
          <table>
            <thead>
              <tr>
                <th scope="col" className="text-left font-bold">Logement</th>
                <th scope="col" className="text-left font-bold">Titre</th>
                <th scope="col" className="text-left font-bold">Statut</th>
                <th scope="col" className="text-left font-bold">Canaux</th>
                <th scope="col" className="text-left font-bold">Preuve</th>
                <th scope="col" className="text-left font-bold">Publié</th>
              </tr>
            </thead>
            <tbody>
              {(annon.annonces || []).map((a) => {
                const an = a.annonce || {};
                return (
                  <tr key={a.logement_id}>
                    <td className="font-semibold">{a.logement_id}</td>
                    <td className="max-w-64 truncate">{an.titre || "—"}</td>
                    <td>
                      <span className="badge">{an.statut || "?"}</span>
                    </td>
                    <td className="text-xs">{(an.canaux || []).join(" · ") || "—"}</td>
                    <td className="text-xs">{an.preuve || "—"}</td>
                    <td className="whitespace-nowrap text-xs tabular-nums">
                      {an.publie_le ? an.publie_le.slice(0, 16).replace("T", " ") : "—"}
                      {an.publie_par ? ` (${an.publie_par})` : ""}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
