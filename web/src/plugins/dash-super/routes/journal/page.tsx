// Page /journal (dash-super) — journal du parc 90 j (F5 §S3.5). Lit les
// gestes voir-comme + écritures tracées. admin requis (la gateway renvoie
// 403 aux non-admins). Lecture seule, métadonnées + refs — jamais de montant
// ni de secret.
export const instant = false;
import { gwGet } from "@/lib/gateway";
import type { Langue } from "@/lib/i18n";
import { t } from "../../i18n";
import { languePage } from "@/lib/langue";
import { lireIdentite } from "@/lib/identite";
import { Onglets } from "@/app/onglets";

type Entree = {
  ts?: string; quoi?: string; qui?: string; qui_reel?: string;
  vu_comme?: string; action?: string; ref?: string; slot?: string;
  [k: string]: unknown;
};
type Reponse = { entrees?: Entree[]; total?: number; jours?: number };
type Recherche = {
  ref?: string; total?: number;
  journal?: Entree[];
  idempotence?: { cle?: string; box_id?: string; logement_id?: string;
                  action?: string; moteur_code?: number; ts?: string }[];
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string; quoi?: string; jours?: string; ref?: string }>;
}) {
  const sp = await searchParams;
  const lang: Langue = languePage(sp);
  const qui = (await lireIdentite()).qui;
  const quoi = (sp.quoi || "").trim();
  const jours = (sp.jours || "90").trim();
  const ref = (sp.ref || "").trim();

  // Branche recherche §P8 : `?ref=` → dossier croisé (journal + idempotence).
  if (ref) {
    let res: Recherche | null = null;
    let errR = "";
    try {
      res = await gwGet<Recherche>(
        `/v1/recherche?qui=${encodeURIComponent(qui)}&ref=${encodeURIComponent(ref)}`,
      );
    } catch (e) {
      errR = e instanceof Error ? e.message : String(e);
    }
    return (
      <div className="flex flex-col gap-5">
        <Onglets lang={lang} ici="/journal" />
        <section className="hero">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] opacity-80">
            {t("super.recherche", lang)} · <code>{ref}</code>
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight md:text-4xl">
            {res ? `${res.total ?? 0} ${t("super.entrer", lang)}` : t("super.ref_introuvable", lang)}
          </h1>
          <a className="onglet mt-3 inline-block" href={`/journal?lang=${lang}`}>
            ← {t("super.titre_journal", lang)}
          </a>
        </section>
        {!res ? (
          <div className="carte border-[var(--danger)] p-6" role="alert">
            <p className="text-sm text-[var(--danger)]">{errR || t("super.ref_introuvable", lang)}</p>
          </div>
        ) : (
          <section className="carte p-5 md:p-6">
            {(res.idempotence || []).length > 0 && (
              <div className="table-defilante border border-[var(--bordure)]">
                <table>
                  <thead>
                    <tr><th>action</th><th>box</th><th>logement</th><th>code</th><th>ts</th></tr>
                  </thead>
                  <tbody>
                    {res.idempotence!.map((d, i) => (
                      <tr key={i}>
                        <td>{d.action || "—"}</td>
                        <td>{d.box_id || "—"}</td>
                        <td>{d.logement_id || "—"}</td>
                        <td className="tabular-nums">{d.moteur_code ?? "—"}</td>
                        <td className="tabular-nums text-xs">{d.ts || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {(res.journal || []).length > 0 && (
              <div className="table-defilante mt-4 border border-[var(--bordure)]">
                <table>
                  <thead>
                    <tr><th>ts</th><th>quoi</th><th>qui</th><th>ref</th></tr>
                  </thead>
                  <tbody>
                    {res.journal!.map((e, i) => (
                      <tr key={i}>
                        <td className="tabular-nums text-xs">{e.ts || "—"}</td>
                        <td><span className="badge">{e.quoi || "—"}</span></td>
                        <td>{e.qui || "—"}</td>
                        <td className="text-xs">{e.ref || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </div>
    );
  }

  let rep: Reponse | null = null;
  let erreur = "";
  try {
    const q = new URLSearchParams({ qui, jours });
    if (quoi) q.set("quoi", quoi);
    rep = await gwGet<Reponse>(`/v1/journal?${q.toString()}`);
  } catch (e) {
    erreur = e instanceof Error ? e.message : String(e);
  }

  if (!rep) {
    return (
      <div className="flex flex-col gap-4">
        <Onglets lang={lang} ici="/journal" />
        <div className="carte border-[var(--danger)] p-6" role="alert">
          <h1 className="text-xl font-extrabold">{t("super.injoignable", lang)}</h1>
          <p className="mt-2 text-sm text-[var(--encre-douce)]">{erreur}</p>
        </div>
      </div>
    );
  }

  const entrees = rep.entrees || [];

  return (
    <div className="flex flex-col gap-5">
      <Onglets lang={lang} ici="/journal" />

      <section className="hero" aria-label={t("super.titre_journal", lang)}>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] opacity-80">
          {t("super.titre_journal", lang)}
        </p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight md:text-4xl">
          {rep.total ?? entrees.length} {t("super.entrer", lang)}
          <span className="ml-2 text-base font-semibold opacity-80">· {rep.jours ?? jours} j</span>
        </h1>
        <div className="mt-4 flex flex-wrap gap-2">
          <a className={`onglet ${!quoi ? "" : ""}`} href={`/journal?lang=${lang}`}>Tout</a>
          <a className="onglet" href={`/journal?lang=${lang}&quoi=voir_comme`}>{t("super.voir_comme", lang)}</a>
          <a className="onglet" href={`/journal?lang=${lang}&quoi=secret_rotate`}>{t("super.titre_secrets", lang)}</a>
        </div>
        {/* Recherche par ref (§P8) : GET natif, fonctionne sans JS. */}
        <form method="get" action="/journal" className="mt-4 flex flex-wrap gap-2">
          <input type="hidden" name="lang" value={lang} />
          <label className="champ flex-1 min-w-[16rem]">
            <span className="text-xs text-[var(--encre-faine)]">{t("super.recherche", lang)}</span>
            <input type="text" name="ref" placeholder={t("super.chercher_ref", lang)} />
          </label>
          <button type="submit" className="bouton bouton-principal self-end">
            {t("super.recherche", lang)}
          </button>
        </form>
      </section>

      <section className="carte p-5 md:p-6">
        {entrees.length === 0 ? (
          <p className="text-sm text-[var(--encre-douce)]">{t("super.aucune_entree", lang)}</p>
        ) : (
          <div className="table-defilante border border-[var(--bordure)]">
            <table>
              <thead>
                <tr>
                  <th>ts</th>
                  <th>quoi</th>
                  <th>qui</th>
                  <th>{t("super.voir_comme", lang)}</th>
                  <th>ref</th>
                </tr>
              </thead>
              <tbody>
                {entrees.map((e, i) => (
                  <tr key={i}>
                    <td className="tabular-nums text-xs">{e.ts || "—"}</td>
                    <td><span className="badge">{e.quoi || "—"}</span></td>
                    <td>{e.qui || "—"}</td>
                    <td>{e.vu_comme || e.action || "—"}</td>
                    <td className="text-xs">{e.ref || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
