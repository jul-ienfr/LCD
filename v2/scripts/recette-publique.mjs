/**
 * Recette publique — partie automatisable, sans navigateur.
 *
 * Couvre les cases de `docs/ops/recette-2026-11/journal.md` qui se vérifient
 * en lecture seule sur un environnement déployé :
 *   - pré-requis : /api/health, /api/ready, refus d'inscription, en-têtes,
 *     cron protégé ;
 *   - parcours publics anonymes : /, /reserver, /login, /design, /aide,
 *     /legales, /tarifs, /offline, /voyageur, /facture.
 *
 * Chaque case porte l'identifiant du journal. Quand seule une partie de la
 * case est vérifiable sans compte ni écriture, le champ `portee` le dit.
 *
 * Les cases qui écrivent en base, exigent un compte, une 2FA, un jeton réel ou
 * un paiement restent manuelles : elles sont listées avec leur motif, sans être
 * exécutées.
 *
 * Usage :
 *   RECETTE_BASE_URL=https://recette.exemple.fr npm run recette:publique
 *   npm run recette:publique -- https://recette.exemple.fr --sortie resultat.json
 *   npm run recette:publique -- --lister
 *
 * Sortie non nulle dès qu'un contrôle automatique échoue. Aucun secret n'est
 * affiché ni transmis.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const ARGS = process.argv.slice(2);
const LISTER = ARGS.includes("--lister");
const option = (nom) => {
  const i = ARGS.indexOf(nom);
  return i >= 0 ? ARGS[i + 1] : undefined;
};

const BASE = (
  option("--base") ??
  ARGS.find((a) => /^https?:\/\//.test(a)) ??
  process.env.RECETTE_BASE_URL ??
  ""
).replace(/\/+$/, "");

const DELAI = Number(process.env.RECETTE_TIMEOUT_MS ?? 15000);
const HORODATAGE = new Date().toISOString().replace(/[:.]/g, "-");
const SORTIE =
  option("--sortie") ??
  join(".artifacts", "recette", `recette-publique-${HORODATAGE}.json`);

/** @typedef {{ ok: boolean, preuve: string, detail?: string }} Verdict */

async function requete(chemin, options = {}) {
  const url = chemin.startsWith("http") ? chemin : `${BASE}${chemin}`;
  const debut = Date.now();
  const reponse = await fetch(url, {
    method: options.method ?? "GET",
    redirect: options.redirect ?? "follow",
    headers: {
      "user-agent": "lcd-recette-publique/1.0",
      ...(options.body ? { "content-type": "application/json" } : {}),
      ...(options.headers ?? {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    signal: AbortSignal.timeout(DELAI),
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

function compter(texte, motif) {
  return (texte.match(motif) ?? []).length;
}

async function page(chemin, verifier) {
  try {
    const { reponse, corps, url, duree } = await requete(chemin, {
      redirect: "manual",
    });
    const redirige = reponse.status >= 300 && reponse.status < 400;
    const destination = reponse.headers.get("location") ?? "";
    const texte = texteVisible(corps);
    const verdict = await verifier({
      statut: reponse.status,
      redirige,
      destination,
      corps,
      texte,
      entetes: reponse.headers,
      url,
    });
    return { ...verdict, preuve: `${verdict.preuve} (${duree} ms)` };
  } catch (erreur) {
    return {
      ok: false,
      preuve: `${chemin} : ${erreur instanceof Error ? erreur.message : String(erreur)}`,
    };
  }
}

/** @type {{ id: string, section: string, libelle: string, executer: () => Promise<Verdict> }[]} */
const AUTOMATIQUES = [
  {
    id: "REC-006",
    section: "0. Pré-requis",
    libelle: "/api/health et /api/ready sains (base, schéma, RLS)",
    executer: async () => {
      const sante = await requete("/api/health");
      if (sante.reponse.status !== 200) {
        return { ok: false, preuve: `/api/health → HTTP ${sante.reponse.status}` };
      }
      const jsonSante = JSON.parse(sante.corps);
      if (jsonSante.ok !== true) {
        return { ok: false, preuve: `/api/health → ok=${JSON.stringify(jsonSante.ok)}` };
      }
      const pret = await requete("/api/ready");
      const jsonPret = JSON.parse(pret.corps);
      const attendus = { ok: true, db: "up", schema: "ok", rls: "ok" };
      const ecarts = Object.entries(attendus).filter(
        ([cle, valeur]) => jsonPret[cle] !== valeur,
      );
      if (pret.reponse.status !== 200 || ecarts.length) {
        return {
          ok: false,
          preuve: `/api/ready → HTTP ${pret.reponse.status}, ${ecarts
            .map(([cle]) => `${cle}=${JSON.stringify(jsonPret[cle])}`)
            .join(", ") || "corps inattendu"}`,
        };
      }
      return { ok: true, preuve: "/api/health et /api/ready 200, db up, schema ok, rls ok" };
    },
  },
  {
    id: "REC-013",
    section: "1. Auth, rôles et sécurité",
    libelle: "Inscription publique refusée",
    executer: async () => {
      const essai = await requete("/api/auth/sign-up/email", {
        method: "POST",
        body: {
          email: `recette-${Date.now()}@exemple.invalid`,
          password: "Recette!publique-2026",
          name: "Recette publique",
        },
      });
      if (essai.reponse.status === 200) {
        return { ok: false, preuve: "inscription acceptée (HTTP 200) : défaut S1" };
      }
      if (essai.reponse.status >= 500) {
        return { ok: false, preuve: `inscription → HTTP ${essai.reponse.status}` };
      }
      return { ok: true, preuve: `inscription refusée (HTTP ${essai.reponse.status})` };
    },
  },
  {
    id: "REC-026",
    section: "1. Auth, rôles et sécurité",
    portee: "partiel : en-têtes et CSP ; HSTS à constater au proxy",
    libelle: "En-têtes de sécurité présents",
    executer: async () => {
      const { reponse } = await requete("/");
      const entetes = reponse.headers;
      const attendus = [
        ["content-security-policy", /base-uri|default-src|script-src/i],
        ["x-content-type-options", /nosniff/i],
        ["x-frame-options", /deny/i],
        ["referrer-policy", /./],
        ["permissions-policy", /./],
      ];
      const absents = attendus
        .filter(([nom, motif]) => {
          const valeur = entetes.get(nom);
          return !valeur || !motif.test(valeur);
        })
        .map(([nom]) => nom);
      if (absents.length) {
        return { ok: false, preuve: `en-têtes absents ou faibles : ${absents.join(", ")}` };
      }
      const csp = entetes.get("content-security-policy") ?? "";
      if (!/script-src/i.test(csp) || !/default-src/i.test(csp)) {
        return {
          ok: false,
          preuve: `CSP sans script-src/default-src : ${csp || "absente"}`,
        };
      }
      const nonce = /'nonce-[^']+'/i.test(csp);
      const hsts = entetes.get("strict-transport-security");
      const hstsNote = hsts
        ? "HSTS présent"
        : BASE.startsWith("https://")
          ? "HSTS absent (à poser au proxy)"
          : "HSTS ignoré en http";
      return {
        ok: true,
        preuve: `5 en-têtes conformes, CSP avec script-src et default-src${nonce ? " (+ nonce)" : ""}, ${hstsNote}`,
      };
    },
  },
  {
    id: "REC-048",
    section: "2. Gestion locative",
    libelle: "Cron de secours protégé",
    executer: async () => {
      const essai = await requete("/api/cron/sync-ota?force=1", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: {},
      });
      const statut = essai.reponse.status;
      if (statut === 401 || statut === 403) {
        return { ok: true, preuve: `${statut} sans CRON_SECRET` };
      }
      if (statut === 503) {
        return {
          ok: false,
          preuve: "503 : CRON_SECRET non configuré sur cet environnement",
        };
      }
      if (statut >= 200 && statut < 300) {
        return { ok: false, preuve: `cron déclenché sans authentification (HTTP ${statut}) : défaut S1` };
      }
      return { ok: false, preuve: `réponse inattendue (HTTP ${statut})` };
    },
  },
  {
    id: "QA-001",
    section: "1. Public, sans JavaScript",
    portee: "partiel : H1 et contenu ; rendu visuel et thème non vérifiés",
    libelle: "Page d'accueil rendue sans JS",
    executer: () =>
      page("/", ({ statut, corps, texte }) => {
        if (statut !== 200) return { ok: false, preuve: `HTTP ${statut}` };
        if (!/<h1[\s>]/i.test(corps)) return { ok: false, preuve: "aucun H1 dans le HTML" };
        if (texte.length < 200) {
          return { ok: false, preuve: `texte rendu trop court (${texte.length} car.)` };
        }
        return { ok: true, preuve: `200, H1 présent, ${texte.length} car. rendus sans JS` };
      }),
  },
  {
    id: "QA-002",
    section: "1. Public, sans JavaScript",
    portee: "partiel : liste et formulaire GET ; « 3 logements de démo avec tarif » exige un environnement seedé",
    libelle: "/reserver : liste des logements et formulaire GET",
    executer: async () => {
      const liste = await requete("/reserver", { redirect: "manual" });
      if (liste.reponse.status !== 200) {
        return { ok: false, preuve: `liste HTTP ${liste.reponse.status}` };
      }
      const liens = compter(liste.corps, /logement=/g);
      if (liens < 3) {
        return {
          ok: false,
          preuve: `${liens} lien(s) de logement : seeds de démonstration absents ?`,
        };
      }
      const premier = liste.corps.match(
        /href="([^"]*\/reserver\?[^"]*logement=[^"]*)"/i,
      )?.[1];
      if (!premier) return { ok: false, preuve: "aucun lien de logement exploitable" };
      const chemin = premier.replace(/&amp;/g, "&");
      const detail = await requete(chemin, { redirect: "manual" });
      if (detail.reponse.status !== 200) {
        return { ok: false, preuve: `${chemin} → HTTP ${detail.reponse.status}` };
      }
      const formulaireGet = /<form[^>]*method=["']?get/i.test(detail.corps);
      if (!formulaireGet) {
        return { ok: false, preuve: `${chemin} : aucun formulaire GET de dates` };
      }
      return {
        ok: true,
        preuve: `200, ${liens} liens de logement, formulaire GET sur le détail`,
      };
    },
  },
  {
    id: "QA-003",
    section: "1. Public, sans JavaScript",
    portee: "partiel : formulaire natif ; connexion réelle à faire à la main",
    libelle: "/login : formulaire POST natif présent",
    executer: () =>
      page("/login", ({ statut, corps }) => {
        if (statut !== 200) return { ok: false, preuve: `HTTP ${statut}` };
        const formulairePost = /<form[^>]*method=["']?post/i.test(corps);
        const email = /name=["']email["']/i.test(corps);
        const motDePasse = /name=["']password["']/i.test(corps);
        if (!formulairePost || !email || !motDePasse) {
          return {
            ok: false,
            preuve: `formulaire POST incomplet (post=${formulairePost}, email=${email}, password=${motDePasse})`,
          };
        }
        return { ok: true, preuve: "200, formulaire POST avec email et mot de passe" };
      }),
  },
  {
    id: "QA-004",
    section: "1. Public, sans JavaScript",
    libelle: "/design : galerie « Design system » rendue",
    executer: () =>
      page("/design", ({ statut, texte }) => {
        if (statut !== 200) return { ok: false, preuve: `HTTP ${statut}` };
        if (!/design/i.test(texte)) return { ok: false, preuve: "titre « Design » absent" };
        if (texte.length < 400) {
          return { ok: false, preuve: `galerie trop courte (${texte.length} car.)` };
        }
        return { ok: true, preuve: `200, galerie rendue (${texte.length} car.)` };
      }),
  },
  {
    id: "REC-125",
    section: "6. Observabilité, sauvegardes et exploitation",
    portee: "partiel : refus anonyme ; accès super-admin réel non couvert",
    libelle: "/supervision/apparence inaccessible sans session",
    executer: () =>
      page("/supervision/apparence", ({ statut, redirige, destination, corps }) => {
        if (redirige) {
          return {
            ok: true,
            preuve: `${statut} → ${destination || "redirection"} : accès refusé`,
          };
        }
        if (statut === 401 || statut === 403) {
          return { ok: true, preuve: `HTTP ${statut} : accès refusé` };
        }
        if (statut === 200) {
          const versLogin = /\/login/.test(corps);
          return {
            ok: false,
            preuve: `HTTP 200${versLogin ? " (page de connexion rendue)" : ""} : accès non refusé`,
          };
        }
        return { ok: false, preuve: `HTTP ${statut}` };
      }),
  },
  {
    id: "QA-005",
    section: "1. Public, sans JavaScript",
    libelle: "/aide, /legales, /tarifs, /offline rendues",
    executer: async () => {
      const chemins = ["/aide", "/legales", "/tarifs", "/offline"];
      const echecs = [];
      for (const chemin of chemins) {
        try {
          const { reponse, corps } = await requete(chemin, { redirect: "manual" });
          const texte = texteVisible(corps);
          if (reponse.status !== 200 || texte.length < 80) {
            echecs.push(`${chemin} (HTTP ${reponse.status}, ${texte.length} car.)`);
          }
        } catch (erreur) {
          echecs.push(`${chemin} (${erreur instanceof Error ? erreur.message : erreur})`);
        }
      }
      if (echecs.length) return { ok: false, preuve: `échecs : ${echecs.join(", ")}` };
      return { ok: true, preuve: "4/4 pages 200 avec contenu rendu" };
    },
  },
  {
    id: "QA-006",
    section: "2. Voyageur, HTML-first",
    portee: "partiel : refus d'un jeton invalide ; lien réel à ouvrir à la main",
    libelle: "/voyageur : jeton invalide refusé proprement",
    executer: () =>
      page("/voyageur?t=jeton-de-recette-invalide", ({ statut, texte }) => {
        if (statut !== 200) return { ok: false, preuve: `HTTP ${statut}` };
        if (!/invalide/i.test(texte)) {
          return { ok: false, preuve: "message de lien invalide absent" };
        }
        return { ok: true, preuve: "200, message de lien invalide affiché" };
      }),
  },
  {
    id: "QA-009",
    section: "2. Voyageur, HTML-first",
    portee: "partiel : refus d'un jeton invalide ; facture réelle à ouvrir à la main",
    libelle: "/facture : jeton invalide refusé proprement",
    executer: () =>
      page("/facture/jeton-de-recette-invalide", ({ statut, texte }) => {
        if (statut !== 200) return { ok: false, preuve: `HTTP ${statut}` };
        if (!/indisponible/i.test(texte) || !/invalide/i.test(texte)) {
          return { ok: false, preuve: "écran « lien indisponible » absent" };
        }
        return { ok: true, preuve: "200, écran « lien indisponible » affiché" };
      }),
  },
];

/** Cases qui exigent une écriture, un compte, une 2FA ou un jeton réel. */
const MANUELS = [
  ["QA-003", "Connexion réelle : le POST déclenche captcha et anti-bruteforce."],
  ["QA-006", "Séjour réel : exige un jeton voyageur émis par `/hote`."],
  ["QA-007", "Préférences relues depuis la base : écriture par le voyageur."],
  ["QA-008", "Incident et avis : écriture sans JS, unicité à vérifier."],
  ["QA-009", "Facture réelle : exige un jeton de facture émis et une facture émise."],
  ["QA-010", "Routage par rôle et 2FA : un compte par rôle."],
  ["QA-011", "Assistant : génération et enregistrement d'un brouillon."],
  ["QA-012", "Inventaire : changement d'état et relecture du tableau."],
  ["QA-013", "Factures : création, envoi, relance (Mailpit en recette)."],
  ["QA-014", "Phrases : substitution des variables dans l'aperçu."],
  ["QA-015", "Annonce : DPE/GES, publication et retour brouillon."],
  ["QA-016", "Audit : période 90 jours, filtre famille, export CSV."],
  ["QA-017", "Publication d'un thème et application immédiate sur `/`."],
  ["QA-018", "Quota assistant : 100 brouillons/mois, remise à zéro encadrée."],
  ["QA-019", "Seeds : `db:seed` puis `db:seed-demo` idempotents (écriture)."],
  ["QA-020", "Nettoyage : dry-run puis `--appliquer` avec confirmation."],
  ["QA-021", "Piles V1 : ne jamais lancer `deploy/demarrer.ps1` ni `lab-run.ps1`."],
  ["REC-001…REC-155", "Hors pré-requis automatisables : voir le journal de recette pour le détail."],
];

function ligne(prefixe, id, libelle, detail) {
  console.log(`${prefixe} ${id.padEnd(16)} ${libelle}`);
  if (detail) console.log(`${" ".repeat(5)}${detail}`);
}

if (LISTER) {
  console.log("Recette publique — cases automatisables :\n");
  for (const cas of AUTOMATIQUES) {
    ligne("AUTO ", cas.id, cas.libelle);
    if (cas.portee) console.log(`${" ".repeat(5)}${cas.portee}`);
  }
  console.log("\nCases manuelles :\n");
  for (const [id, motif] of MANUELS) ligne("MANUEL", id, motif);
  process.exit(0);
}

if (!BASE) {
  console.error(
    "RECETTE_BASE_URL manquante. Exemple : RECETTE_BASE_URL=https://recette.exemple.fr npm run recette:publique",
  );
  process.exit(2);
}

console.log(`Recette publique — ${BASE}\n`);

const resultats = [];
for (const cas of AUTOMATIQUES) {
  let verdict;
  try {
    verdict = await cas.executer();
  } catch (erreur) {
    verdict = {
      ok: false,
      preuve: erreur instanceof Error ? erreur.message : String(erreur),
    };
  }
  resultats.push({
    id: cas.id,
    section: cas.section,
    libelle: cas.libelle,
    portee: cas.portee ?? "complet sur l'environnement ciblé",
    resultat: verdict.ok ? "OK" : "KO",
    preuve: verdict.preuve,
  });
  ligne(verdict.ok ? "OK  " : "ECHEC", cas.id, cas.libelle, verdict.preuve);
}

const echecs = resultats.filter((r) => r.resultat === "KO");
const resume = {
  modele: "recette-publique/1.0",
  base: BASE,
  date: new Date().toISOString(),
  automatiques: {
    total: resultats.length,
    ok: resultats.length - echecs.length,
    ko: echecs.length,
  },
  manuels: MANUELS.map(([id, motif]) => ({ id, motif })),
  cases: resultats,
};

mkdirSync(dirname(SORTIE), { recursive: true });
writeFileSync(SORTIE, `${JSON.stringify(resume, null, 2)}\n`, "utf8");
console.log(`\nPreuve écrite : ${SORTIE}`);
console.log(
  `\n${resume.automatiques.ok}/${resume.automatiques.total} cases automatiques OK, ${MANUELS.length} entrées manuelles listées.`,
);

if (echecs.length) {
  console.error(`${echecs.length} case(s) en échec : ${echecs.map((r) => r.id).join(", ")}.`);
  process.exit(1);
}
