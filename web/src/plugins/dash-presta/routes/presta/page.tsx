// Dash-prestataire (V4) : missions reçues (todos réels de la passerelle) +
// dispatch + clôture ménage. SANS JavaScript — formulaires natifs.
// Honnêteté : pas de route photos/pointage dédiée côté gateway — c'est
// affiché (badge "pointage photos pas encore branché"), jamais simulé.
export const instant = false;
import type { Metadata } from "next";
import { gwGet } from "@/lib/gateway";
import { t, type Langue } from "../../i18n";
import { languePage } from "@/lib/langue";
import { Onglets } from "@/app/onglets";
import { FormulaireAction } from "@/app/formulaire-action";
import { PwaDashboard } from "@/lib/pwa";

export const metadata: Metadata = { title: "Prestataire" };

type Logement = {
  box_id?: string;
  logement_id?: string;
  nom?: string;
  todos?: { dossier?: string; statut?: string; deadline?: string }[];
};
type Apercu = { logements?: Logement[] };

const HUMAINS: [string, string][] = [
  ["personne_03", "personne_03 (operateur)"],
  ["personne_01", "personne_01 (super_admin)"],
];

export default async function PagePresta({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string; logement?: string }>;
}) {
  const sp = await searchParams;
  const lang: Langue = languePage(sp);
  const logement = typeof sp.logement === "string" ? sp.logement : "log1";

  const ap = await gwGet<Apercu>("/api/apercu-parc").catch(
    (e: Error) => ({ erreur: e.message }) as Apercu,
  );
  const liste = ap.logements || [];
  const carte = liste.find((l) => l.logement_id === logement) || liste[0] || null;
  const todos = carte?.todos || [];
  const aFaire = todos.filter((x) => x.statut === "a_faire").length;

  return (
    <div className="flex flex-col gap-5">
      <Onglets lang={lang} ici="/presta" />
      <PwaDashboard lang={lang} />

      <section className="hero" aria-label={t("prestataire", lang)}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] opacity-80">
              {t("presta.prestation", lang)} · runbook 3 h
            </p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight md:text-4xl">
              {carte?.nom || logement}
            </h1>
          </div>
          <span className={`badge ${aFaire > 0 ? "badge-alerte" : ""}`}>
            {aFaire} mission{aFaire > 1 ? "s" : ""} à faire
          </span>
        </div>
        <p className="mt-2 max-w-4xl text-sm opacity-90">
          Runbook ménage 3 h : 6 étapes + protocoles incidents (fuite, bruit,
          serrure, net, double-résa, trouvés). Checkout : réassort + seuils +
          photos avant/après — score 1-5 + temps portés à la box.
        </p>
      </section>

      <form method="get" action="/presta" className="carte flex flex-wrap items-end gap-2 p-3 text-sm">
        <input type="hidden" name="lang" value={lang} />
        <label className="font-medium">
          {t("choisir_logement", lang)}{" "}
          <select name="logement" defaultValue={carte?.logement_id || logement} className="champ mt-1 w-auto">
            {liste.map((l) => (
              <option key={l.logement_id} value={String(l.logement_id)}>{l.nom || l.logement_id}</option>
            ))}
          </select>
        </label>
        <button type="submit" className="bouton bouton-secondaire px-4 py-2">OK</button>
      </form>

      <section className="carte p-5 md:p-6" aria-label="Missions">
        <h2 className="text-lg font-extrabold">Missions {carte?.logement_id}</h2>
        {todos.length === 0 ? (
          <p className="mt-3 rounded-xl bg-(--ok-douce) px-3 py-2 text-sm text-(--ok)">
            Aucune mission en attente pour ce logement.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2" role="list">
            {todos.map((x) => (
              <li key={x.dossier} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-(--surface-2) px-3 py-2 text-sm">
                <span className="font-mono text-xs">{x.dossier}</span>
                <span className={`badge ${x.statut === "a_faire" ? "badge-alerte" : ""}`}>
                  {x.statut}
                </span>
                <span className="text-xs tabular-nums text-(--encre-douce)">
                  deadline {x.deadline?.slice(0, 16).replace("T", " ") || "—"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="carte p-5 md:p-6" aria-label="Dispatch">
          <h2 className="text-lg font-extrabold">Créer mission (dispatch)</h2>
          <p className="text-sm text-[var(--encre-douce)]">
            presta_id + motif — geste humain tracé, la box refuse si DST.
            Le presta_id doit figurer dans l&apos;annuaire de ce logement :
            sinon la passerelle répond « presta … inconnu annuaire » (404).
            La valeur pré-remplie n&apos;est qu&apos;un exemple, valide pour le
            logement qui la porte.
          </p>
          <div className="mt-4">
            <FormulaireAction
              actionId="mission"
              libelle="Créer mission ménage"
              champs={["presta_id", "motif"]}
              exemples={{ presta_id: "lab_menage_01", motif: "Ménage J+1" }}
              boxId={carte?.box_id || "box-lab"}
              logementId={carte?.logement_id || logement}
              refBase="WEB-PRESTA"
              humains={HUMAINS}
              envoyer={t("envoyer", lang)}
              choisirQui={t("qui", lang)}
              horsLigne
            />
          </div>
        </section>
        <section className="carte p-5 md:p-6" aria-label="Clôture">
          <h2 className="text-lg font-extrabold">Clôturer ménage</h2>
          <p className="text-sm text-[var(--encre-douce)]">
            dossier id (copie depuis la liste) — sans photos = alerte PILOTAGE.
          </p>
          <div className="mt-4">
            <FormulaireAction
              actionId="cloture_menage"
              libelle="Clôturer le ménage"
              champs={["dossier"]}
              exemples={{ dossier: todos[0]?.dossier || "menage/log1/M-001" }}
              boxId={carte?.box_id || "box-lab"}
              logementId={carte?.logement_id || logement}
              refBase="WEB-PRESTA"
              humains={HUMAINS}
              envoyer={t("envoyer", lang)}
              choisirQui={t("qui", lang)}
              horsLigne
            />
          </div>
        </section>
      </div>

      <p className="carte p-4 text-sm" role="note">
        ⚠ <strong>Pointage photos / score / temps :</strong> je n&apos;ai pas
        encore branché de route dédiée côté passerelle (pas de fake).
        En attendant, le runbook 3 h reste tracé à la main via la clôture + le
        dossier placé dans la liste des missions.
      </p>
    </div>
  );
}
