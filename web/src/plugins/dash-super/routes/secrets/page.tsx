// Page /secrets (dash-super) — inventaire des slots de rotation (F5 §S3.5-V5).
// super_admin SEUL lit la page (la gateway renvoie 403 aux autres). AFFICHE
// UNIQUEMENT des métadonnées : id, source (env:/vault:), cadence, date, statut.
// AUCUNE valeur de secret n'est affichée ni transmise — le registre la refuse.
export const instant = false;
import { gwGet } from "@/lib/gateway";
import type { Langue } from "@/lib/i18n";
import { t } from "../../i18n";
import { languePage } from "@/lib/langue";
import { lireIdentite } from "@/lib/identite";
import { Onglets } from "@/app/onglets";
import { FormulaireRotation } from "./formulaire-rotation";

type Slot = {
  id?: string; source?: string; cadence_j?: number;
  derniere_rotation?: string | null; statut_rotation?: string;
  jours_depuis?: number | null; alerte?: boolean; note?: string;
};
type Reponse = { slots?: Slot[]; total?: number; alertes?: number; valeurs_incluses?: boolean };

const LIB: Record<string, string> = {
  a_jour: "super.a_jour", jamais_declaree: "super.jamais_declaree",
  due_j30: "super.due_j30", due_j7: "super.due_j7", perimee: "super.perimee",
};

function badge(statut?: string): string {
  if (statut === "a_jour") return "badge-ok";
  if (statut === "perimee" || statut === "jamais_declaree") return "badge-danger";
  return "badge-alerte";
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const sp = await searchParams;
  const lang: Langue = languePage(sp);
  const qui = (await lireIdentite()).qui;

  let rep: Reponse | null = null;
  let erreur = "";
  try {
    rep = await gwGet<Reponse>(`/v1/secrets?qui=${encodeURIComponent(qui)}`);
  } catch (e) {
    erreur = e instanceof Error ? e.message : String(e);
  }

  if (!rep) {
    return (
      <div className="flex flex-col gap-4">
        <Onglets lang={lang} ici="/secrets" />
        <div className="carte border-[var(--danger)] p-6" role="alert">
          <h1 className="text-xl font-extrabold">{t("super.injoignable", lang)}</h1>
          <p className="mt-2 text-sm text-[var(--encre-douce)]">
            {erreur || t("super.aucune_valeur", lang)}
          </p>
        </div>
      </div>
    );
  }

  const slots = rep.slots || [];
  const ids = slots.map((s) => String(s.id || "")).filter(Boolean);

  return (
    <div className="flex flex-col gap-5">
      <Onglets lang={lang} ici="/secrets" />

      <section className="hero" aria-label={t("super.titre_secrets", lang)}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] opacity-80">
              {t("super.titre_secrets", lang)}
            </p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight md:text-4xl">
              {rep.total ?? slots.length} {t("super.nb_slots", lang)}
            </h1>
          </div>
          <span className="badge badge-danger" style={{ background: "rgb(255 255 255 / .18)", color: "#fff" }}>
            <span aria-hidden>⚠</span> {rep.alertes ?? 0} {t("super.alertes", lang)}
          </span>
        </div>
        <p className="mt-3 text-sm opacity-90">{t("super.aucune_valeur", lang)}</p>
      </section>

      <section className="carte p-5 md:p-6">
        <div className="table-defilante border border-[var(--bordure)]">
          <table>
            <thead>
              <tr>
                <th>{t("super.slot", lang)}</th>
                <th>{t("super.source", lang)}</th>
                <th>{t("super.cadence", lang)}</th>
                <th>{t("super.derniere", lang)}</th>
                <th>{t("super.statut", lang)}</th>
              </tr>
            </thead>
            <tbody>
              {slots.map((s, i) => (
                <tr key={i}>
                  <td className="font-semibold">{s.id || "—"}</td>
                  <td><code className="text-xs">{s.source || "—"}</code></td>
                  <td className="tabular-nums">{s.cadence_j ?? "—"}</td>
                  <td className="tabular-nums">{s.derniere_rotation || t("super.jamais_declaree", lang)}</td>
                  <td>
                    <span className={`badge ${badge(s.statut_rotation)}`}>
                      {t(LIB[s.statut_rotation || ""] || "super.statut", lang)}
                      {s.jours_depuis !== null && s.jours_depuis !== undefined ? ` (${s.jours_depuis}j)` : ""}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <FormulaireRotation slots={ids} quiDefaut={qui} lang={lang} />
      </section>
    </div>
  );
}
