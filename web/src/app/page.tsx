// Page pilotage hote : bandeau + cartes logements + 14 actions 1-tap.
// Rendu serveur (SSR) : lisible et ACTIONNABLE sans JavaScript.
// Les formulaires POSTent en natif vers les Server Actions.
// Navigation non-instantanée assumée : données gateway à la requête.
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
  // Page dynamique (instant=false) : pas de Suspense nécessaire, le HTML
  // est rendu à la requête avec les données gateway (sans-JS : complet).
  return <Pilotage lang={lang} />;
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
  const refBase = (ap?.generated_at || new Date().toISOString())
    .replace(/[:.\-+]/g, "")
    .replace("T", "-")
    .slice(0, 20);
  const L = (id: ActionId) => LIBELLES_ACTION[id]?.[lang] ?? id;

  if (!ap)
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950">
        <h1 className="text-xl font-bold">Passerelle injoignable</h1>
        <p className="mt-2 text-sm">
          Vérifiez <code>LCD_GATEWAY_URL</code> (défaut 127.0.0.1:8443) ou le
          mode démo.
        </p>
        {erreur && <p className="mt-2 text-xs text-red-600">Détail : {erreur}</p>}
      </div>
    );

  return (
    <div className="flex flex-col gap-4">
      <Onglets lang={lang} />
      <section className="rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 p-5 text-white shadow">
        <h1 className="text-2xl font-bold">{t("pilotage", lang)} — {t("titre", lang)}</h1>
        <p className="mt-1 text-sm text-teal-50">
          {logements.length} logement(s) · {joignables} {t("joignables", lang)} ·
          fan-out {ap.fanout_ms ?? "?"} ms · {met?.ecritures ?? 0} écriture(s) relayée(s) /{" "}
          {met?.ecritures_refusees ?? 0} refus(s)
        </p>
      </section>

      {logements.map((r) => {
        const lid = String(r.logement_id || "?");
        const stale = !!r.stale;
        return (
          <section key={`${r.box_id}-${lid}`} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex flex-wrap items-baseline gap-2">
              <h2 className="text-lg font-semibold">{r.nom || lid}</h2>
              <span className="text-xs text-zinc-500">{lid} · {r.box_id}</span>
              {stale ? (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950 dark:text-red-300">
                  {t("ecritures_off", lang)}
                </span>
              ) : (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  {t("joignables", lang)}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Journal : {r.journal_total ?? 0} entrées · Occupation J+30 :{" "}
              {String(r.occupation?.occ_j30 ?? "—")} · Routage : {r.routage_primaire || "—"} ·
              HA : {r.ha_vivante ? "vivante" : "injoignable"} · Copro :{" "}
              {r.copro_verifiee ? "oui" : "non (BLOQUÉE)"}
            </p>
            {(r.alertes || []).length > 0 && (
              <ul className="mt-2 list-disc pl-5 text-sm text-amber-700 dark:text-amber-300">
                {r.alertes!.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            )}
            {stale ? (
              <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
                {t("ecritures_off", lang)}
              </p>
            ) : (
              <div className="mt-3 grid gap-3 md:grid-cols-2">
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
            )}
          </section>
        );
      })}
    </div>
  );
}
