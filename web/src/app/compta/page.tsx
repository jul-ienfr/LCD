// Dash-comptable (V7) — compta + Chorus : lecture seule + gestes humains.
// La clôture comptable reste un GESTE HUMAIN tracé, jamais automatique.
// Un SIREN émetteur manquant est affiché BLOQUANT (Chorus Pro refuse).
export const instant = false;
import type { Metadata } from "next";
import { gwGet, type ActionId } from "@/lib/gateway";
import { LIBELLES_ACTION, t, type Langue } from "@/lib/i18n";
import { languePage } from "@/lib/langue";
import { Onglets } from "../onglets";
import { FormulaireAction } from "../formulaire-action";

export const metadata: Metadata = { title: "Compta" };

type Facture = {
  entite_id?: string;
  logement_id?: string;
  ref?: string;
  montant_ttc?: number;
  tva?: string;
  emetteur_siren?: string | null;
  siren_manquant?: boolean;
  pdp_ref?: string | null;
  sans_pdp?: boolean;
  exporte_le?: string;
};
type Export = {
  erreur?: string;
  generated_at?: string;
  note?: string;
  par_entite?: Record<string, Facture[]>;
  sans_entite?: Facture[];
};
type Apercu = {
  logements?: { logement_id?: string; box_id?: string; nom?: string }[];
};

const HUMAINS: [string, string][] = [
  ["personne_04", "personne_04 (comptable)"],
  ["personne_01", "personne_01 (super_admin)"],
];

export default async function PageCompta({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string; entite?: string }>;
}) {
  const sp = await searchParams;
  const lang: Langue = languePage(sp);
  const entite = typeof sp.entite === "string" ? sp.entite : "";

  const [ex, ap] = await Promise.all([
    gwGet<Export>("/export-compta").catch((e: Error) => ({ erreur: e.message }) as Export),
    gwGet<Apercu>("/api/apercu-parc").catch(() => ({}) as Apercu),
  ]);
  const cartes = (ap.logements || []).map((l) => ({
    logement_id: l.logement_id || "",
    box_id: l.box_id || "",
    nom: l.nom || "",
  }));

  const entites = Object.entries(ex.par_entite || {}).filter(
    ([k]) => !entite || k === entite,
  );
  const factures = entites.flatMap(([e, fs]) => fs.map((f) => ({ ...f, entite: e })));
  const totalTTc = factures.reduce((n, f) => n + Number(f.montant_ttc || 0), 0);
  const sirenesManquants = factures.filter(
    (f) => f.siren_manquant || !f.emetteur_siren,
  ).length;

  return (
    <div className="flex flex-col gap-5">
      <Onglets lang={lang} ici="/compta" />

      <section className="hero" aria-label={t("compta", lang)}>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] opacity-80">
          {t("compta", lang)} · export Chorus Pro / PDP
        </p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight md:text-4xl">
          1 plan par SIREN — jamais de mélange
        </h1>
        {ex.erreur ? (
          <p className="mt-3 rounded-xl bg-white/15 px-3 py-2 text-sm">{ex.erreur}</p>
        ) : (
          <div className="kpis mt-5">
            <div className="kpi">
              <div className="kpi-valeur tabular-nums">{factures.length}</div>
              <div className="kpi-etiquette">factures exportables</div>
            </div>
            <div className="kpi">
              <div className="kpi-valeur tabular-nums">
                {totalTTc.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} €
              </div>
              <div className="kpi-etiquette">montant TTC cumulé</div>
            </div>
            <div className="kpi">
              <div className="kpi-valeur tabular-nums">{sirenesManquants}</div>
              <div className="kpi-etiquette">SIREN émetteur manquants</div>
            </div>
            <div className="kpi">
              <div className="kpi-valeur tabular-nums">
                {factures.filter((f) => f.sans_pdp || !f.pdp_ref).length}
              </div>
              <div className="kpi-etiquette">sans référence PDP</div>
            </div>
          </div>
        )}
      </section>

      <section className="carte p-5 md:p-6" aria-label="Factures par entité">
        <h2 className="text-lg font-extrabold">Factures par entité (SIREN)</h2>
        {ex.note && <p className="mt-1 text-xs text-(--encre-faine)">{ex.note}</p>}
        <a
          href="/api/compta/export"
          className="bouton bouton-secondaire mt-2 inline-block px-4 py-2"
          download
        >
          ⬇ Télécharger le CSV (Excel / Chorus)
        </a>
        <div className="table-defilante mt-3 border border-[var(--bordure)]">
          <table>
            <thead>
              <tr>
                <th scope="col">Entité (SIREN)</th>
                <th scope="col">Logement</th>
                <th scope="col">Ref</th>
                <th scope="col">TTC</th>
                <th scope="col">TVA</th>
                <th scope="col">SIREN émetteur</th>
                <th scope="col">PDP</th>
              </tr>
            </thead>
            <tbody>
              {factures.map((f) => (
                <tr key={`${f.entite}-${f.ref}-${f.logement_id}`}>
                  <td className="font-semibold">{f.entite}</td>
                  <td>{f.logement_id}</td>
                  <td className="whitespace-nowrap font-mono text-xs">{f.ref}</td>
                  <td className="text-right font-bold tabular-nums">
                    {Number(f.montant_ttc || 0).toLocaleString("fr-FR", { maximumFractionDigits: 0 })} €
                  </td>
                  <td>{f.tva || "—"}</td>
                  <td>
                    {f.siren_manquant ? (
                      <span className="badge badge-alerte">SIREN manquant (bloquant Chorus)</span>
                    ) : (
                      f.emetteur_siren || "—"
                    )}
                  </td>
                  <td>{f.sans_pdp ? <span className="badge">sans PDP</span> : f.pdp_ref}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-3">
        {(
          [
            { id: "facture_valider", titre: "Valider une facture", sous: "facture_id + rubrique — geste humain tracé", champs: ["facture_id", "rubrique"] },
            { id: "payout", titre: "Payout propriétaire", sous: "canal + montant + date + ref_resa", champs: ["canal", "montant", "date", "ref_resa"] },
            { id: "cloture_compta", titre: "Clôture comptable", sous: "annee + mois — JAMAIS automatique", champs: ["annee", "mois"] },
          ] as { id: ActionId; titre: string; sous: string; champs: string[] }[]
        ).map(({ id, titre, sous, champs }) => (
          <section key={id} className="carte p-5 md:p-6">
            <h2 className="text-lg font-extrabold">{titre}</h2>
            <p className="text-sm text-[var(--encre-douce)]">{sous}</p>
            <div className="mt-4">
              <FormulaireAction
                actionId={id}
                libelle={LIBELLES_ACTION[id]?.[lang] || id}
                champs={champs}
                exemples={{}}
                boxId={cartes[0]?.box_id || "box-lab"}
                logementId={cartes[0]?.logement_id || "log1"}
                refBase="WEB-COMPTA"
                humains={HUMAINS}
                envoyer={t("envoyer", lang)}
                choisirQui={t("qui", lang)}
              />
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
