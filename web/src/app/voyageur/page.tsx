// Page voyageur : mon séjour (devis public via hôte-relay), commander des
// extras, déclarer un incident. Tout fonctionne SANS JavaScript.
// Le voyageur n'a pas de compte : l'hôte relaye avec SON `qui` (tracé),
// la ref voyageur voyage dans `data` — jamais d'écriture anonyme.
export const instant = false;
import { gwGet } from "@/lib/gateway";
import { t, type Langue } from "@/lib/i18n";
import { languePage } from "@/lib/langue";
import { Onglets } from "../onglets";
import { FormulaireAction } from "../formulaire-action";

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
  const exemples: Record<string, string> = { ref_resa: "", extras: "linge-lit:1,parking:1", arrivee: "2027-11-10", motif: "dégât des eaux", description: "" };
  const refVoyageur = `WEB-VOY-${logement.toUpperCase()}`;

  return (
    <div className="flex flex-col gap-4">
      <Onglets lang={lang} />
      <section className="rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 p-5 text-white shadow">
        <h1 className="text-2xl font-bold">{t("voyageur", lang)} — {carte?.nom || logement}</h1>
        <p className="mt-1 text-sm text-sky-50">
          {(carte?.prix_7j || []).length > 0
            ? `Prix du jour : ${String(carte!.prix_7j![0][1])} €`
            : "Prix : nous consulter"}
        </p>
      </section>

      <form method="get" action="/voyageur" className="flex items-center gap-2 text-sm">
        <input type="hidden" name="lang" value={lang} />
        <label>Logement :{" "}
          <select name="logement" defaultValue={logement} className="rounded-full border border-zinc-300 px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900">
            {(ap?.logements || []).map((l) => (
              <option key={l.logement_id} value={String(l.logement_id)}>{l.nom || l.logement_id}</option>
            ))}
          </select>
        </label>
        <button type="submit" className="rounded-full border border-zinc-300 px-3 py-1.5">OK</button>
      </form>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="font-semibold">Commander des extras</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Relayé par l&apos;hôte, tracé au journal. Format : id:qte,id:qte.</p>
        <div className="mt-3">
          <FormulaireAction actionId="commande_extras" libelle="Commander" champs={["ref_resa", "extras", "arrivee"]} exemples={exemples} boxId={boxId} logementId={logement} refBase={refVoyageur} humains={HUMAINS} envoyer={t("envoyer", lang)} choisirQui={t("qui", lang)} />
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="font-semibold">Déclarer un incident</h2>
        <div className="mt-3">
          <FormulaireAction actionId="sinistre_declarer" libelle="Déclarer" champs={["motif", "description"]} exemples={exemples} boxId={boxId} logementId={logement} refBase={refVoyageur} humains={HUMAINS} envoyer={t("envoyer", lang)} choisirQui={t("qui", lang)} />
        </div>
      </section>
    </div>
  );
}
