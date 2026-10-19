// Mentions légales + CGV consultables (loi LCEN art. 6 III + décret séjour).
// Sources réelles : /parc/entites (SIREN/nature/régime), statut passerelle.
// Ce qui n'existe pas côté registre est affiché « à compléter » — jamais
// inventé : un numéro SIREN fictif dans une page légale serait une Fraude.
export const instant = false;
import type { Metadata } from "next";
import Link from "next/link";
import { gwGet } from "@/lib/gateway";

export const metadata: Metadata = {
  title: "Mentions légales & CGV",
};

type Entite = {
  entite_id?: string;
  libelle?: string;
  nature?: string;
  regime?: string;
  tva?: string;
  nb_logements?: number;
};
type Entites = { entites?: Entite[]; natures?: string[]; regimes?: string[] };

const NATURE_FR: Record<string, string> = {
  nom_propre: "Nom propre (personne physique)",
  indivision: "Indivision",
  sci_ir: "SCI à l'impôt sur le revenu",
  sci_is: "SCI à l'impôt sur les sociétés",
  sarl_famille: "SARL familiale",
  sas: "SAS",
  sasu: "SASU",
  holding: "Holding",
  autre: "Autre",
};
const REGIME_FR: Record<string, string> = {
  micro_bic_non_classe: "Micro-BIC non classé (tourisme)",
  micro_bic_classe: "Micro-BIC classé",
  lmnp_reel: "LMNP au réel",
  lmp: "LMP",
  foncier_2044: "Revenus fonciers (2044)",
  is_2065: "IS (2065)",
};

export default async function PageLegales() {
  const ex = await gwGet<Entites>("/parc/entites").catch(
    () => ({ entites: [] }) as Entites,
  );
  const entites = ex.entites || [];

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-(--encre-faine)">
          Transparence · LCEN art. 6 III · décret 22-1607 (tourisme)
        </p>
        <h1 className="mt-1 text-3xl font-black tracking-tight">
          Mentions légales &amp; CGV
        </h1>
      </div>

      <section className="carte p-5 md:p-7">
        <h2 className="text-xl font-extrabold">Éditeur de la plateforme</h2>
        <p className="mt-2 text-sm text-(--encre-douce)">
          La plateforme LCD Parc est exploitée par{" "}
          <strong>l&apos;entité gestionnaire</strong> du parc ci-dessous
          (registre réel de la passerelle — SIREN visibles sur développeur) :
        </p>
        {entites.length === 0 ? (
          <p className="mt-3 rounded-xl bg-(--alerte-douce) px-3 py-2 text-sm text-(--alerte)">
            Registre entités vide ou injoignable — page affichée « à compléter »
            plutôt que de présenter un faux éditeur.
          </p>
        ) : (
          <div className="table-defilante mt-3 border border-[var(--bordure)]">
            <table>
              <thead>
                <tr>
                  <th scope="col">Entité</th>
                  <th scope="col">Nature</th>
                  <th scope="col">Régime</th>
                  <th scope="col">TVA</th>
                  <th scope="col">Logements</th>
                </tr>
              </thead>
              <tbody>
                {entites.map((e) => (
                  <tr key={e.entite_id}>
                    <td className="font-semibold">{e.libelle || e.entite_id}</td>
                    <td>{NATURE_FR[e.nature || ""] || e.nature || "—"}</td>
                    <td>{REGIME_FR[e.regime || ""] || e.regime || "—"}</td>
                    <td>{e.tva === "non" ? "non assujettie" : e.tva}</td>
                    <td className="tabular-nums">{e.nb_logements ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="carte p-5 md:p-7">
        <h2 className="text-xl font-extrabold">Mandat de conciergerie</h2>
        <p className="mt-2 text-sm text-(--encre-douce)">
          Les services LCD Parc s&apos;exercent sous mandat écrit selon deux
          formes possibles (conditions générales du mandat) :
        </p>
        <ul className="mt-3 flex flex-col gap-2 list-disc pl-5 text-sm" role="list">
          <li>
            <strong>Mandat + CGV</strong> : la conciergerie est mandataire de
            l&apos;annonceur (immatriculé, n° de déclaration en mairie porté par
            le logement au registre).
          </li>
          <li>
            <strong>Vente + maintenance</strong> (« Kit » §S1) : l&apos;annonce
            reste au nom du client ; la conciergerie fournit stock, emailing
            standard, état des lieux standard, transition locataire, ménage
            facturé.
          </li>
        </ul>
        <p className="mt-3 text-sm text-(--encre-douce)">
          Forfaits (§S1, par logement/mois) : <strong>Kit 149 €</strong>{" "}
          (plancher) · <strong>Pilotage 190 €</strong> ·{" "}
          <strong>Full 290 €</strong> + extras facturés au réel, commission
          stacking interdite. Commission plateforme déjà déduite avant
          encaissement du payout.
        </p>
        <p className="mt-2 text-sm text-(--encre-douce)">
          Relevés présentés sur <Link href="/proprio" className="underline">l&apos;espace propriétaire</Link>{" "}
          = indicatifs ; le rapprochement compta et la validation restent chez
          l&apos;expert-comptable.
        </p>
      </section>

      <section className="carte p-5 md:p-7">
        <h2 className="text-xl font-extrabold">Données &amp; RGPD</h2>
        <ul className="mt-3 flex flex-col gap-2 list-disc pl-5 text-sm" role="list">
          <li>
            Aucune donnée de paiement en clair : les IBAN sont des références
            (variable d&apos;environnement), jamais stockées dans le registre
            (§16bis).
          </li>
          <li>
            Journal des écritures : qui + quoi + ref tracés ; aucun montant
            n&apos;est porté au journal (il vit chez la compta, source de
            vérité).
          </li>
          <li>
            Effacement RGPD voyageur à 90 jours (§16.3), preuves conservées
            plus longtemps (chargebacks 180 j · litiges caution) — la preuve
            n&apos;est pas une PII consommable.
          </li>
          <li>
            Le voyageur n&apos;a pas de compte : l&apos;hôte opère avec son
            <code className="mx-1 rounded bg-(--surface-2) px-1">qui</code>
            tracé, la ref voyageur voyage dans la donnée.
          </li>
        </ul>
      </section>

      <section className="carte p-5 md:p-7" role="note">
        <h2 className="text-xl font-extrabold">État de l&apos;édition (LCEN)</h2>
        <p className="mt-2 text-sm text-[var(--encre-douce)]">
          Cette édition tourne en local : connexion par IdP (1FA + TOTP pour le
          staff), registres, moteurs et états persistants réels. L&apos;éditeur
          n&apos;est pas encore constitué (SIREN, RC pro et carte G = prérequis
          hôte, chiffrés dans la checklist P0/P10) : ces mentions seront
          complétées dès leur obtention. Pas de réservation effective ni de
          décharge juridique à ce stade.
        </p>
      </section>

      <p className="text-xs text-(--encre-faine)">
        Version {new Date().toISOString().slice(0, 10)} — les CGV complètes
        (mandat 8 items §20.3) sont signées au contrat écrit, pas ici : cette
        page n&apos;est pas un mandat.
      </p>
      <p>
        <Link href="/" className="bouton bouton-secondaire px-4 py-2">
          ← Retour à l&apos;accueil
        </Link>
      </p>
    </div>
  );
}
