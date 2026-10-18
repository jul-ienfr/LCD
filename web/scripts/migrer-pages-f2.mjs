// web/scripts/migrer-pages-f2.mjs — ONE-SHOT (F2) : réécrit les imports des
// pages déplacées dans leurs plugins (cœur = @/app/*, lib = @/lib/*) et
// préfixe les appels t("cle") vers les clés migrées dans le dict du plugin.
// Idempotent (rejouable) : les clés déjà préfixées ne le sont pas 2 fois.
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const RACINE = join(dirname(fileURLToPath(import.meta.url)), "..");
const PLUGINS = [
  "dash-operateur", "dash-voyageur", "dash-presta",
  "dash-proprio", "dash-comptable", "dash-commercial",
];

let total = 0;
for (const plugin of PLUGINS) {
  const racine = join(RACINE, "src", "plugins", plugin);
  // Suffixes migrés = clés du dict moins le préfixe du manifeste.
  const dict = JSON.parse(readFileSync(join(racine, "i18n.json"), "utf8"));
  const prefixe = Object.keys(dict)[0].split(".")[0] + ".";
  const suffixes = Object.keys(dict).map((k) => k.slice(prefixe.length));

  // Parcours récursif des fichiers du plugin.
  const fichiers = [];
  (function descendre(d) {
    for (const nom of readdirSync(d)) {
      const chemin = join(d, nom);
      if (statSync(chemin).isDirectory()) descendre(chemin);
      else if (/\.tsx?$/.test(chemin) && !chemin.endsWith("i18n.ts")) fichiers.push(chemin);
    }
  })(racine);

  for (const chemin of fichiers) {
    let src = readFileSync(chemin, "utf8");
    const avant = src;

    // 1. Imports : le wrapper local du plugin fournit t ; le reste vient du cœur.
    src = src.replace(
      /import \{ LIBELLES_ACTION, t, type Langue \} from "@\/lib\/i18n";/g,
      'import { LIBELLES_ACTION, type Langue } from "@/lib/i18n";\nimport { t } from "../../i18n";',
    );
    src = src.replace(
      /import \{ t, type Langue \} from "@\/lib\/i18n";/g,
      'import { t, type Langue } from "../../i18n";',
    );
    // Composants cœur (Onglets, FormulaireAction) et actions serveur.
    src = src.replace(/from "\.\.\/onglets";/g, 'from "@/app/onglets";');
    src = src.replace(/from "\.\.\/formulaire-action";/g, 'from "@/app/formulaire-action";');
    src = src.replace(/from "\.\.\/actions";/g, 'from "@/app/actions";');

    // 2. Préfixation des clés migrées (deux styles de quotes, mot entier).
    for (const s of suffixes) {
      const echappe = s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      src = src.replace(new RegExp(`t\\("(${echappe})"`, "g"), `t("${prefixe}$1"`);
      src = src.replace(new RegExp(`t\\('(${echappe})'`, "g"), `t('${prefixe}$1'`);
    }

    if (src !== avant) {
      writeFileSync(chemin, src, "utf8");
      total += 1;
      console.log(`[OK] ${chemin.replace(RACINE + "\\", "").replace(/\\/g, "/")}`);
    }
  }
}
console.log(`RESULTAT : ${total} fichier(s) reecrit(s).`);
