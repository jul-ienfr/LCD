// Page voyageur : mon séjour — hero logement + extras + incident.
// Tout fonctionne SANS JavaScript. Le voyageur n'a pas de compte :
// l'hôte relaye avec SON `qui` (tracé), la ref voyageur voyage dans `data`.
export const instant = false;
import { gwGet } from "@/lib/gateway";
import { t, type Langue } from "../../i18n";
import { languePage } from "@/lib/langue";
import { Onglets } from "@/app/onglets";
import { FormulaireAction } from "@/app/formulaire-action";
import { PwaDashboard } from "@/lib/pwa";

const HUMAINS: [string, string][] = [
  ["personne_03", "personne_03 (operateur)"],
  ["personne_01", "personne_01 (super_admin)"],
];

export default async function PageVoyageur({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string; logement?: string }>;
}) {
  const sp = await searchParams;
  const lang: Langue = languePage(sp);
  const logement = typeof sp.logement === "string" ? sp.logement : "log1";
  return <Sejour lang={lang} logement={logement} />;
}

async function Sejour({ lang, logement }: { lang: Langue; logement: string }) {
  const ap = await gwGet<{
    boxes?: { box_id: string }[];
    logements?: { box_id?: string; logement_id?: string; nom?: string; stale?: boolean; prix_7j?: [string, number | string][] }[];
  }>("/api/apercu-parc").catch(() => null);
  const carte = ap?.logements?.find((l) => l.logement_id === logement) || null;
  const boxId = carte?.box_id || "box-lab";
  const exemples: Record<string, string> = { ref_resa: "", extras: "petit_dej:1", arrivee: "2027-11-10", motif: "degat_eau_sdb", declarant: "Voyageur sur place", description: "" };
  const refVoyageur = `WEB-VOY-${logement.toUpperCase()}`;
  // Guide de séjour : annonce RÉELLE (horaires, équipements, description).
  const annonce = await gwGet<{
    annonce?: {
      titre?: string;
      statut?: string;
      descriptions?: Record<string, string>;
      equipements?: string[];
      regles?: { arrivee?: string; depart?: string; nuitee_min?: string };
    };
  }>(`/parc/annonces/${encodeURIComponent(logement)}`).catch(() => ({}) as {
    annonce?: {
      titre?: string;
      statut?: string;
      descriptions?: Record<string, string>;
      equipements?: string[];
      regles?: { arrivee?: string; depart?: string; nuitee_min?: string };
    };
  });
  const fiche = annonce.annonce || null;
  const descLangue =
    (fiche?.descriptions && (fiche.descriptions[lang] || fiche.descriptions.fr)) || "";
  const prixJour = carte?.prix_7j?.[0]?.[1];

  return (
    <div className="flex flex-col gap-5">
      <Onglets lang={lang} ici="/voyageur" />
      <PwaDashboard lang={lang} />

      <section className="hero hero-voyageur" aria-label={t("voyageur", lang)}>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] opacity-80">
          {t("voyageur.voyageur_bienvenue", lang)}
        </p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight md:text-4xl">
          {carte?.nom || logement}
        </h1>
        <p className="mt-2 text-lg font-semibold tabular-nums">
          {prixJour !== undefined ? `${String(prixJour)} € ${t("voyageur.par_nuit", lang)}` : t("voyageur.prix_consulter", lang)}
        </p>
      </section>

      <form method="get" action="/voyageur" className="carte flex flex-wrap items-center gap-2 p-3 text-sm">
        <input type="hidden" name="lang" value={lang} />
        <label className="font-medium">
          {t("choisir_logement", lang)}{" "}
          <select name="logement" defaultValue={logement} className="champ mt-1 w-auto">
            {(ap?.logements || []).map((l) => (
              <option key={l.logement_id} value={String(l.logement_id)}>{l.nom || l.logement_id}</option>
            ))}
          </select>
        </label>
        <button type="submit" className="bouton bouton-secondaire mt-auto px-4 py-2">OK</button>
      </form>

      <section className="carte p-5 md:p-6" aria-label={t("voyageur.guide_sejour", lang)}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-extrabold">{t("voyageur.guide_sejour", lang)}</h2>
          {fiche?.statut && <span className="badge badge-ok">annonce {fiche.statut}</span>}
        </div>
        {fiche ? (
          <div className="mt-3 flex flex-col gap-3 text-sm">
            <div className="flex flex-wrap gap-4">
              <span className="rounded-xl bg-(--accent-douce) px-3 py-2 font-semibold text-(--accent-fonce)">
                {t("voyageur.guide_arrivee", lang)} {fiche.regles?.arrivee || "—"}
              </span>
              <span className="rounded-xl bg-(--alerte-douce) px-3 py-2 font-semibold text-(--alerte)">
                {t("voyageur.guide_depart", lang)} {fiche.regles?.depart || "—"} →
              </span>
              <span className="rounded-xl bg-(--surface-2) px-3 py-2">
                {fiche.regles?.nuitee_min || "—"} {t("voyageur.guide_nuits", lang)}
              </span>
            </div>
            {(fiche.equipements || []).length > 0 && (
              <ul className="flex flex-wrap gap-1.5" role="list" aria-label={t("voyageur.guide_equipements", lang)}>
                {fiche.equipements!.map((eq) => (
                  <li key={eq} className="badge badge-accent">{eq.replace(/_/g, " ")}</li>
                ))}
              </ul>
            )}
            {descLangue && (
              <p className="whitespace-pre-line text-(--encre-douce)">{descLangue}</p>
            )}
          </div>
        ) : (
          <p className="mt-3 rounded-xl bg-(--surface-2) px-3 py-2 text-sm text-(--encre-douce)">
{t("voyageur.guide_vide", lang)}
          </p>
        )}
      </section>

      <div className="grid gap-5 md:grid-cols-2">
        <section className="carte p-5 md:p-6" aria-label={t("voyageur.extras_titre", lang)}>
          <div className="flex items-center gap-3">
            <span aria-hidden className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--accent-douce)] text-xl">✦</span>
            <div>
              <h2 className="text-lg font-extrabold">{t("voyageur.extras_titre", lang)}</h2>
              <p className="text-sm text-[var(--encre-douce)]">{t("voyageur.extras_sous", lang)}</p>
            </div>
          </div>
          <div className="mt-4">
            <FormulaireAction actionId="commande_extras" libelle={t("voyageur.extras_commander", lang)} champs={["ref_resa", "extras", "arrivee"]} exemples={exemples} boxId={boxId} logementId={logement} refBase={refVoyageur} humains={HUMAINS} envoyer={t("envoyer", lang)} choisirQui={t("qui", lang)} horsLigne />
          </div>
        </section>

        <section className="carte p-5 md:p-6" aria-label={t("voyageur.incident_titre", lang)}>
          <div className="flex items-center gap-3">
            <span aria-hidden className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--alerte-douce)] text-xl">⚠</span>
            <div>
              <h2 className="text-lg font-extrabold">{t("voyageur.incident_titre", lang)}</h2>
              <p className="text-sm text-[var(--encre-douce)]">{t("voyageur.incident_sous", lang)}</p>
            </div>
          </div>
          <div className="mt-4">
            <FormulaireAction actionId="sinistre_declarer" libelle={t("voyageur.incident_declarer", lang)} champs={["motif", "declarant", "description"]} exemples={exemples} boxId={boxId} logementId={logement} refBase={refVoyageur} humains={HUMAINS} envoyer={t("envoyer", lang)} choisirQui={t("qui", lang)} horsLigne />
          </div>
        </section>
      </div>
    </div>
  );
}
