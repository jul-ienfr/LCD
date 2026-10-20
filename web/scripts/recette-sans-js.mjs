#!/usr/bin/env node
// recette-sans-js.mjs — POST NATIF REEL SANS JAVASCRIPT (cahier 70 §F9 :
// « POST natif complet sur 1 ecriture par plugin »).
//
// Edge headless reel via playwright-core (channel msedge, aucun navigateur
// telecharge = 0 outil payant) avec javaScriptEnabled:false : le navigateur
// soumet le <form method=POST> par la voie HTML pure, exactement comme le
// promet le mode degrade L0/L1 (REQ-S-008).
//
// Preuve d'ecriture : le journal de la PASSERELLE (/journal, servi par le
// front) doit gagner une ligne portant la ref de CE soumissionnement. On
// compte les occurrences de "<action> <ref>" avant/apres : la ref des
// formulaires 1-tap est unique par rendu, celle des ecritures presta/voyageur
// est constante — dans les deux cas une occurrence de PLUS prouve que le
// round-trip front -> server action -> passerelle -> journal a eu lieu.
//
// Usage : node scripts/recette-sans-js.mjs [url-front]
// Sortie : lignes [OK]/[KO] + exit code = nombre d'echecs.
import { chromium } from "playwright-core";

const BASE = (process.argv[2] || "http://127.0.0.1:3101").replace(/\/+$/, "");
let KO = 0;
const verif = (label, ok, detail = "") => {
  console.log(`[${ok ? "OK" : "KO"}] ${label}${detail ? " - " + detail : ""}`);
  if (!ok) KO += 1;
};

// Texte visible d'une page (scripts/styles etoiles) : les cellules du
// tableau journal adjacentes deviennent "action ref" avec une espace.
const texteVisible = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ");

const compter = (txt, aiguille) => txt.split(aiguille).length - 1;

const navigateur = await chromium.launch({ channel: "msedge", headless: true });
const context = await navigateur.newContext({
  baseURL: BASE,
  javaScriptEnabled: false, // LE point : aucun JavaScript du tout
});
await context.addCookies([
  { name: "lcd_qui", value: "personne_01", domain: "127.0.0.1", path: "/" },
]);
const page = await context.newPage();

const lireJournal = async () => {
  const r = await context.request.get(`${BASE}/journal`, { timeout: 30000 });
  return texteVisible(await r.text());
};

// Une cible = une ecriture nommee au cahier 70 §F9.
//
// Choix des cibles : on juge au JOURNAL DE LA PASSERELLE, ce qui exige une
// ref qui progresse a chaque passage. Les refs des formulaires 1-tap de /hote
// sont uniques par rendu (20261020-145923Z-log3-confirmer) : chaque passage
// ecrit une ligne neuve. Sur /presta les refs sont constantes MAIS ces deux
// actions reviennent en moteur_code 404 (jamais mis en cache d'idempotence),
// donc elles journalisent aussi a chaque passage. /voyageur est volontairement
// absente : sa ref a deja reussi en 201, la passerelle rejoue la reponse en
// cache SANS ecrire de ligne — un compteur y mentirait.
const cibles = [
  { page: "/hote", action: "confirmer", nom: "action 1-tap (confirmer)" },
  { page: "/hote", action: "sinistre_declarer", nom: "incident (sinistre_declarer)" },
  { page: "/presta", action: "cloture_menage", nom: "depart (cloture_menage)" },
  { page: "/presta", action: "mission", nom: "mission (mission)" },
];

let soumissions = 0;

for (const c of cibles) {
  await page.goto(c.page, { waitUntil: "domcontentloaded" });

  const form = page.locator(
    `form:has(input[name="action"][value="${c.action}"])`,
  );
  const nb = await form.count();
  verif(`${c.nom} : formulaire present`, nb >= 1, `trouves=${nb}`);
  if (nb === 0) continue;

  // Le formulaire est loge dans un <details> FERME : on l'ouvre par son
  // <summary>, du HTML natif — 0 JavaScript (c'est tout l'interet de L0/L1).
  const detail = page.locator("details").filter({ has: form.first() }).first();
  if (await detail.count()) {
    if (!(await detail.evaluate((d) => d.open))) {
      await detail.locator("summary").first().click().catch(() => {});
    }
    verif(
      `${c.nom} : <details> ouvert par <summary> natif`,
      await detail.evaluate((d) => d.open),
    );
  }

  // Ref exacte de CE soumissionnement (unique par rendu sur les 1-tap).
  const ref = await form
    .first()
    .locator('input[name="ref"]')
    .inputValue()
    .catch(() => "");
  verif(`${c.nom} : ref lue dans le formulaire`, ref.length > 0, `ref=${ref || "(vide)"}`);
  if (!ref) continue;

  // Champ obligatoire « qui » (obligatoire, journalise) : sans selection le
  // navigateur bloque la soumission native et aucun POST ne part. On le
  // remplit comme un utilisateur, en HTML pur.
  const selQui = form.first().locator('select[name="qui"]');
  if (await selQui.count()) {
    const v = await selQui.evaluate((s) => {
      const o = [...s.options].find((x) => x.value !== "");
      return o ? o.value : "";
    });
    if (v) await selQui.selectOption(v);
  }
  const valide = await form.first().evaluate((f) => f.checkValidity());
  verif(`${c.nom} : formulaire valide (prerequis d'une soumission native)`, valide);

  const avant = await lireJournal();

  // On attend LE POST reel : click() ne bloque pas sur la navigation.
  const attendu = page
    .waitForResponse(
      (r) => r.request().method() === "POST" && r.url().includes(c.page),
      { timeout: 30000 },
    )
    .catch(() => null);
  let statut = 0;
  let erreur = null;
  try {
    await form.first().locator('button[type="submit"]').first().click({ timeout: 20000 });
    const rep = await attendu;
    statut = rep ? rep.status() : 0;
    soumissions += 1;
  } catch (e) {
    erreur = e.message.split("\n")[0];
  }
  if (erreur) console.log(`      erreur : ${erreur}`);

  verif(
    `${c.nom} : POST natif accepte (ni 400 action-inconnue, ni 5xx)`,
    statut !== 0 && statut !== 400 && statut < 500,
    `statut=${statut}`,
  );

  const apres = await lireJournal();
  const cle = `${c.action} ${ref}`;
  const nAvant = compter(avant, cle);
  const nApres = compter(apres, cle);
  verif(
    `${c.nom} : ecriture journalisee (front -> server action -> passerelle)`,
    nApres >= nAvant + 1,
    `avant=${nAvant} apres=${nApres} cle="${cle}"`,
  );
}

await navigateur.close();
console.log(
  KO === 0
    ? `SANS-JS OK (${soumissions} ecritures natives soumises)`
    : `SANS-JS : ${KO} ECHEC(S)`,
);
process.exit(KO);
