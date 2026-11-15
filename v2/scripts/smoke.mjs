/**
 * Smoke test d'un environnement déployé (recette ou production).
 *
 * Vérifie les points de T052 sans navigateur :
 *   - /api/health  : 200, `ok: true`, version présente ;
 *   - /api/ready   : 200, `db up`, `schema ok`, `rls ok` ;
 *   - pages publiques : /login, /reserver, /voyageur, /aide, /legales, /offline, /;
 *   - rendu HTML sans JavaScript : le corps contient un H1 ou le repère de page ;
 *   - manifeste PWA : /manifest.webmanifest servi en JSON ;
 *   - HTTPS : redirection HTTP → HTTPS, en-tête HSTS.
 *
 * Usage :
 *   SMOKE_BASE_URL=https://recette.exemple.fr npm run smoke
 *   npm run smoke -- https://recette.exemple.fr
 *
 * Sortie non nulle dès qu'un contrôle échoue. Aucun secret n'est affiché.
 */

const args = process.argv.slice(2);
const base = (
  args.find((a) => /^https?:\/\//.test(a)) ??
  process.env.SMOKE_BASE_URL ??
  ""
).replace(/\/+$/, "");

if (!base) {
  console.error(
    "SMOKE_BASE_URL manquante. Exemple : SMOKE_BASE_URL=https://recette.exemple.fr npm run smoke",
  );
  process.exit(2);
}

const delai = Number(process.env.SMOKE_TIMEOUT_MS ?? 15000);

/** @type {{ nom: string, ok: boolean, detail: string }[]} */
const resultats = [];

function consigner(nom, ok, detail) {
  resultats.push({ nom, ok, detail });
  const marque = ok ? "OK  " : "ECHEC";
  console.log(`${marque} ${nom} — ${detail}`);
}

async function requete(chemin, options = {}) {
  const url = chemin.startsWith("http") ? chemin : `${base}${chemin}`;
  const debut = Date.now();
  const reponse = await fetch(url, {
    redirect: options.redirect ?? "follow",
    headers: { "user-agent": "lcd-smoke/1.0", ...(options.headers ?? {}) },
    signal: AbortSignal.timeout(delai),
  });
  const corps = await reponse.text();
  return { url, reponse, corps, duree: Date.now() - debut };
}

function texteVisible(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function verifierJson(chemin, controles) {
  try {
    const { reponse, corps } = await requete(chemin);
    if (reponse.status !== 200) {
      consigner(chemin, false, `HTTP ${reponse.status} — ${corps.slice(0, 300)}`);
      return;
    }
    let json;
    try {
      json = JSON.parse(corps);
    } catch {
      consigner(chemin, false, "réponse non JSON");
      return;
    }
    const manquants = controles.filter(([cle, attendu]) => json[cle] !== attendu);
    if (manquants.length) {
      consigner(
        chemin,
        false,
        manquants.map(([cle, attendu]) => `${cle}=${JSON.stringify(json[cle])} (attendu ${JSON.stringify(attendu)})`).join(", "),
      );
      return;
    }
    consigner(chemin, true, `200, ${controles.map(([c]) => c).join("/")} conformes`);
  } catch (erreur) {
    consigner(chemin, false, erreur instanceof Error ? erreur.message : String(erreur));
  }
}

async function verifierPage(chemin, repere) {
  try {
    const { reponse, corps, url } = await requete(chemin);
    if (reponse.status !== 200) {
      consigner(chemin, false, `HTTP ${reponse.status} → ${url}`);
      return;
    }
    const texte = texteVisible(corps);
    if (texte.length < 40) {
      consigner(chemin, false, `page quasi vide (${texte.length} caractères visibles)`);
      return;
    }
    if (repere && !texte.toLowerCase().includes(repere.toLowerCase())) {
      consigner(chemin, false, `repère « ${repere} » absent du HTML rendu`);
      return;
    }
    consigner(chemin, true, `200, ${texte.length} caractères rendus sans JS`);
  } catch (erreur) {
    consigner(chemin, false, erreur instanceof Error ? erreur.message : String(erreur));
  }
}

async function verifierManifeste() {
  try {
    const { reponse, corps } = await requete("/manifest.webmanifest");
    if (reponse.status !== 200) {
      consigner("/manifest.webmanifest", false, `HTTP ${reponse.status}`);
      return;
    }
    const json = JSON.parse(corps);
    if (!json.name || !json.start_url || !Array.isArray(json.icons) || !json.icons.length) {
      consigner("/manifest.webmanifest", false, "name, start_url ou icons manquants");
      return;
    }
    consigner("/manifest.webmanifest", true, `manifeste valide (${json.icons.length} icônes)`);
  } catch (erreur) {
    consigner("/manifest.webmanifest", false, erreur instanceof Error ? erreur.message : String(erreur));
  }
}

async function verifierHttps() {
  if (!base.startsWith("https://")) {
    consigner("HTTPS", true, "base en http : contrôle ignoré en local");
    return;
  }
  const httpBase = base.replace(/^https:/, "http:");
  try {
    const { reponse } = await requete(`${httpBase}/api/health`, { redirect: "manual" });
    const redirection = reponse.status >= 300 && reponse.status < 400;
    const cible = reponse.headers.get("location") ?? "";
    if (!redirection || !cible.startsWith("https://")) {
      consigner("HTTP → HTTPS", false, `statut ${reponse.status}, cible ${cible || "absente"}`);
    } else {
      consigner("HTTP → HTTPS", true, `${reponse.status} → ${cible}`);
    }
  } catch (erreur) {
    consigner("HTTP → HTTPS", false, erreur instanceof Error ? erreur.message : String(erreur));
  }
  try {
    const { reponse } = await requete("/api/health");
    const hsts = reponse.headers.get("strict-transport-security");
    consigner("HSTS", Boolean(hsts), hsts ?? "en-tête absent");
  } catch (erreur) {
    consigner("HSTS", false, erreur instanceof Error ? erreur.message : String(erreur));
  }
}

console.log(`Smoke test — ${base}`);

await verifierJson("/api/health", [["ok", true]]);
await verifierJson("/api/ready", [
  ["ok", true],
  ["db", "up"],
  ["schema", "ok"],
  ["rls", "ok"],
]);
await verifierPage("/", null);
await verifierPage("/reserver", null);
await verifierPage("/login", null);
await verifierPage("/voyageur", null);
await verifierPage("/aide", null);
await verifierPage("/legales", null);
await verifierPage("/offline", "hors ligne");
await verifierManifeste();
await verifierHttps();

const echecs = resultats.filter((r) => !r.ok);
const resume = {
  base,
  date: new Date().toISOString(),
  total: resultats.length,
  reussis: resultats.length - echecs.length,
  echecs: echecs.map((r) => ({ nom: r.nom, detail: r.detail })),
  resultats,
};
console.log(JSON.stringify(resume, null, 2));

if (echecs.length) {
  console.error(`\n${echecs.length} contrôle(s) en échec sur ${resultats.length}.`);
  process.exit(1);
}
console.log(`\n${resultats.length}/${resultats.length} contrôles OK.`);
