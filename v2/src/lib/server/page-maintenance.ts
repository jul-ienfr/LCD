import type { EtatMaintenance } from "@/domain/maintenance";
import type { Apparence } from "@/domain/apparence/types";
import { themeResolu, styleTheme } from "@/lib/apparence";
import { traductionsMaintenance } from "@/lib/i18n/public/maintenance";
import type { Langue } from "@/lib/i18n";

/**
 * FR-017 (spec 006) — page de maintenance globale, rendue par le serveur.
 *
 * Elle est produite dans le hook, pas par une route SvelteKit : la suspension
 * s'applique avant tout routage, y compris aux chemins qui n'existent pas, et
 * la page reste identique quel que soit le chemin demandé. Elle reprend le
 * thème publié (accent, polices) et la langue de la requête, sans JavaScript.
 *
 * Statut 503 + `Retry-After` : les moteurs et la supervision externe
 * comprennent « temporairement indisponible, revenez plus tard », ce qu'un 200
 * ou un 404 ne diraient pas.
 */
const echapper = (valeur: string): string =>
  valeur
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

export function pageMaintenance(input: {
  etat: EtatMaintenance;
  apparence: Apparence;
  langue: Langue;
  requestId: string;
}): string {
  const t = traductionsMaintenance(input.langue);
  const theme = themeResolu(input.apparence);
  const css = styleTheme(theme);
  const nom = input.apparence.identite.nom;
  const message = input.etat.message ?? t.texteDefaut;
  const depuis = input.etat.debutLe
    ? `<p class="quand">Depuis le ${echapper(
        new Intl.DateTimeFormat("fr-FR", {
          dateStyle: "short",
          timeStyle: "short",
        }).format(new Date(input.etat.debutLe)),
      )}</p>`
    : "";

  return `<!doctype html>
<html lang="${input.langue}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
<title>${echapper(t.metaTitre)} — ${echapper(nom)}</title>
<meta name="description" content="${echapper(t.metaDescription)}" />
<style>${css}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:1rem;padding:2rem;background:var(--fond);color:var(--encre);font-family:var(--police-texte);line-height:1.55}
main{max-width:34rem;width:100%;display:flex;flex-direction:column;gap:1rem}
.surtitre{margin:0;text-transform:uppercase;letter-spacing:.18em;font-size:.8rem;color:var(--encre-faine)}
h1{margin:0;font-family:var(--police-titre);font-size:clamp(1.6rem,4vw,2.2rem);letter-spacing:var(--interlettrage-titre)}
.message{margin:0;color:var(--encre-douce);font-size:1.05rem;white-space:pre-line}
.quand{margin:0;color:var(--encre-faine);font-size:.85rem}
.consigne{margin:0;color:var(--encre-douce)}
.pied{display:flex;flex-wrap:wrap;gap:.75rem;align-items:center;margin-top:.5rem}
a.bouton{display:inline-flex;align-items:center;justify-content:center;min-height:var(--hauteur-controle,44px);padding:.5rem 1.1rem;border-radius:var(--rayon-bouton);background:var(--accent);color:var(--sur-accent);text-decoration:none;font-weight:600}
.reference{margin:0;color:var(--encre-faine);font-size:.75rem}
</style>
</head>
<body>
<main id="contenu">
<p class="surtitre">${echapper(t.surtitre)}</p>
<h1>${echapper(t.titre)}</h1>
<p class="message">${echapper(message)}</p>
${depuis}
<p class="consigne">${echapper(t.consigne)}</p>
<p class="pied"><a class="bouton" href="/aide">${echapper(t.lienAide)}</a></p>
<p class="reference">Référence : <code>${echapper(input.requestId)}</code></p>
</main>
</body>
</html>`;
}
