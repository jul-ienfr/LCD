// Section « Design » du dashboard super_admin (/systeme) : le super_admin
// choisit un thème COMPLET (palette clair + sombre) et l'applique à tout le
// site en quelques secondes. Formulaire natif <form action> : il fonctionne
// SANS JavaScript, comme le reste de l'app (L0/L1).
//
// Sécurité : la section est visible par tous (elle explique qui peut), mais
// les contrôles sont désactivés pour les autres rôles et l'action serveur
// re-vérifie l'autorisation (défense en profondeur, jamais une seule garde).
import { lireIdentite } from "@/lib/identite";
import { lireDesignId, peutChoisirDesign } from "@/lib/design";
import { DESIGNS, designParId } from "@/lib/themes";
import { choisirDesignAction } from "@/app/actions";

export async function SectionDesign({
  choix,
}: {
  /** Paramètre `?design=` renvoyé par l'action (retour utilisateur). */
  choix?: string;
}) {
  const identite = await lireIdentite();
  const superAdmin = peutChoisirDesign(identite.quiReel);
  const courant = lireDesignId();
  const courantDesign = designParId(courant);

  const message = (() => {
    if (!choix) return "";
    if (choix === "refuse") return "Seul un super_admin peut changer le design.";
    if (choix === "erreur") return "Écriture impossible : vérifier le montage de custom/design.yaml.";
    const d = designParId(choix);
    return d ? `Design appliqué : ${d.nom}.` : "";
  })();
  const ok = Boolean(choix && choix !== "refuse" && choix !== "erreur");

  return (
    <section
      id="design"
      className="carte p-5 md:p-6"
      aria-label="Design du site"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xl font-extrabold tracking-tight">Design du site</h2>
        <span className="badge badge-ok">
          Actif : {courantDesign?.nom ?? courant}
        </span>
      </div>
      <p className="mt-2 text-sm text-[var(--encre-douce)]">
        Change l&apos;apparence de <strong>tout le site</strong> (couleurs,
        surfaces, accents) en quelques secondes — sans rebuild ni redémarrage.
        Chaque thème est vérifié pour le contraste (WCAG 2.2 AA).
      </p>
      {message && (
        <p
          role="status"
          className={`mt-3 rounded-xl px-3 py-2 text-sm ${
            ok
              ? "bg-[var(--ok-douce)] text-[var(--ok)]"
              : "bg-[var(--danger-douce)] text-[var(--danger)]"
          }`}
        >
          {message}
        </p>
      )}
      <form action={choisirDesignAction} className="mt-4">
        <fieldset disabled={!superAdmin} className="min-w-0">
          <legend className="sr-only">Choisir un design</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {DESIGNS.map((d) => (
              <label
                key={d.id}
                className="carte flex cursor-pointer items-center gap-3 p-3 has-[:checked]:ring-2 has-[:checked]:ring-[var(--accent)]"
              >
                <input
                  type="radio"
                  name="design"
                  value={d.id}
                  defaultChecked={d.id === courant}
                  className="h-4 w-4 accent-[var(--accent)]"
                />
                <span className="flex flex-none gap-1" aria-hidden>
                  {[d.clair.accent, d.clair.fond, d.clair.surface, d.sombre.fond, d.sombre.accent].map(
                    (c, i) => (
                      <span
                        key={i}
                        className="h-6 w-4 rounded-sm border border-[var(--bordure)]"
                        style={{ background: c }}
                      />
                    ),
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold">{d.nom}</span>
                  <span className="block text-xs text-[var(--encre-faine)]">
                    {d.description}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="bouton bouton-principal"
            disabled={!superAdmin}
          >
            Appliquer ce design
          </button>
          <p className="text-xs text-[var(--encre-faine)]">
            {superAdmin
              ? "Réservé au super_admin — vous l'êtes."
              : "Réservé au super_admin (votre rôle ne le permet pas)."}
          </p>
        </div>
      </form>
    </section>
  );
}
