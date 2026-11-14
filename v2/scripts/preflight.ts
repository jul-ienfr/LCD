/**
 * Contrôle avant déploiement / démarrage en production.
 *
 * Vérifie, dans l'ordre et en s'arrêtant au premier échec :
 *   1. la version de Node ;
 *   2. la cohérence de l'environnement (mêmes règles que `env-production.ts`) ;
 *   3. la connexion à la base et le rôle applicatif (RLS non contournée) ;
 *   4. les migrations appliquées vs le journal Drizzle ;
 *   5. l'espace disque et l'écriture réelle dans le volume photos.
 *
 * Usage :
 *   npm run preflight                  # lit .env.prod puis .env.local
 *   PREFLIGHT_ENV_FILE=.env.staging npm run preflight
 *
 * Sortie non nulle au premier contrôle en échec. Aucun secret n'est affiché.
 */
import { existsSync, mkdirSync, readFileSync, statfsSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { config } from "dotenv";
import postgres from "postgres";
import {
  validerEnvironnementProduction,
  type ConstatEnvironnement,
} from "../src/lib/server/env-production";

const racine = process.cwd();
const fichierEnv =
  process.env.PREFLIGHT_ENV_FILE ?? (existsSync(".env.prod") ? ".env.prod" : ".env.local");
config({ path: [fichierEnv], quiet: true });

const OK = "✓";
const KO = "✗";
const ATTENTION = "!";

const echec = (etape: string, message: string): never => {
  console.error(`${KO} ${etape} : ${message}`);
  process.exit(1);
};

const etape = async <T>(nom: string, action: () => T | Promise<T>): Promise<T> => {
  try {
    const resultat = await action();
    const detail = typeof resultat === "string" ? ` — ${resultat}` : "";
    console.log(`${OK} ${nom}${detail}`);
    return resultat;
  } catch (erreur) {
    return echec(nom, erreur instanceof Error ? erreur.message : String(erreur));
  }
};

const nombre = (valeur: string | undefined, defaut: number): number => {
  const parsed = Number(valeur);
  return Number.isFinite(parsed) ? parsed : defaut;
};

const versionsNode = (): { minimum: number; maximumExclu: number } => {
  try {
    const pkg = JSON.parse(readFileSync(join(racine, "package.json"), "utf8")) as {
      engines?: { node?: string };
    };
    const plage = pkg.engines?.node ?? ">=24 <27";
    const minimum = Number(plage.match(/>=\s*(\d+)/)?.[1] ?? 24);
    const maximumExclu = Number(plage.match(/<\s*(\d+)/)?.[1] ?? 27);
    return { minimum, maximumExclu };
  } catch {
    return { minimum: 24, maximumExclu: 27 };
  }
};

const verifierNode = (): string => {
  const { minimum, maximumExclu } = versionsNode();
  const majeure = Number(process.versions.node.split(".")[0]);
  if (majeure < minimum || majeure >= maximumExclu) {
    throw new Error(
      `Node ${process.versions.node} incompatible : attendu >=${minimum} <${maximumExclu}.`,
    );
  }
  return `v${process.versions.node}`;
};

const verifierEnvironnement = (): string => {
  if (!existsSync(fichierEnv) && !process.env.PREFLIGHT_ENV_FILE) {
    console.log(
      `${ATTENTION} Aucun fichier ${fichierEnv} : utilisation des variables déjà présentes.`,
    );
  }
  const constats: ConstatEnvironnement[] = validerEnvironnementProduction(process.env);
  const erreurs = constats.filter((constat) => constat.niveau === "erreur");
  const avertissements = constats.filter(
    (constat) => constat.niveau === "avertissement",
  );

  for (const constat of avertissements) {
    console.log(`${ATTENTION} ${constat.variable} : ${constat.message}`);
  }
  if (erreurs.length > 0) {
    throw new Error(
      `\n${erreurs
        .map((constat) => `  - ${constat.variable} : ${constat.message}`)
        .join("\n")}`,
    );
  }

  const cle = process.env.BACKUP_ENCRYPTION_KEY?.trim();
  if (cle) {
    const octets = Buffer.from(cle, "base64").length;
    if (octets !== 32) {
      throw new Error(
        `BACKUP_ENCRYPTION_KEY doit décoder 32 octets (obtenu ${octets}).`,
      );
    }
  }

  if (!process.env.LCD_VERSION?.trim()) {
    console.log(
      `${ATTENTION} LCD_VERSION absente : /api/health affichera la version du code, pas le tag déployé (utiliser scripts/deployer.sh).`,
    );
  }

  return "aucune erreur bloquante";
};

const optionsPostgres = (url: string) => ({
  max: 1,
  prepare: false,
  connect_timeout: 10,
  idle_timeout: 5,
  ssl: url.includes("sslmode=require") ? ("require" as const) : false,
  onnotice: () => {},
});

const verifierBase = async (): Promise<string> => {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) throw new Error("DATABASE_URL absente.");

  const sql = postgres(url, optionsPostgres(url));
  try {
    const [ligne] = await sql<{ utilisateur: string; superuser: boolean; bypass: boolean }[]>`
      select current_user as utilisateur,
             r.rolsuper as superuser,
             r.rolbypassrls as bypass
      from pg_roles r
      where r.rolname = current_user
    `;
    if (!ligne) throw new Error("rôle applicatif introuvable dans pg_roles.");
    if (ligne.superuser || ligne.bypass) {
      throw new Error(
        `le rôle ${ligne.utilisateur} contourne la RLS (superuser ou bypassrls) : utiliser le rôle applicatif.`,
      );
    }
    return `rôle ${ligne.utilisateur}, RLS appliquée`;
  } finally {
    await sql.end({ timeout: 5 });
  }
};

const migrationsAttendues = (): number => {
  const chemin = join(racine, "drizzle", "meta", "_journal.json");
  if (!existsSync(chemin)) {
    throw new Error(
      "drizzle/meta/_journal.json introuvable : lancer le préflight depuis le dossier v2 (image tools).",
    );
  }
  const journal = JSON.parse(readFileSync(chemin, "utf8")) as {
    entries?: unknown[];
  };
  return journal.entries?.length ?? 0;
};

const verifierMigrations = async (): Promise<string> => {
  const attendues = migrationsAttendues();
  const url = (process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL)?.trim();
  if (!url) throw new Error("MIGRATION_DATABASE_URL et DATABASE_URL absentes.");

  const sql = postgres(url, optionsPostgres(url));
  try {
    const [ligne] = await sql<{ appliquees: number }[]>`
      select count(*)::int as appliquees from drizzle.__drizzle_migrations
    `;
    const appliquees = ligne?.appliquees ?? 0;
    if (appliquees < attendues) {
      throw new Error(
        `${appliquees}/${attendues} migrations appliquées : lancer npm run db:migrate.`,
      );
    }
    if (appliquees > attendues) {
      throw new Error(
        `${appliquees} migrations en base pour ${attendues} attendues : base plus récente que le code.`,
      );
    }
    return `${appliquees}/${attendues} migrations`;
  } catch (erreur) {
    const message = erreur instanceof Error ? erreur.message : String(erreur);
    if (message.includes("does not exist") || message.includes("n'existe pas")) {
      throw new Error("schéma drizzle absent : aucune migration n'a été appliquée.");
    }
    throw erreur;
  } finally {
    await sql.end({ timeout: 5 });
  }
};

const dossierPhotos = (): string => {
  const configure = process.env.STOCKAGE_LOCAL_DIR?.trim();
  if (!configure) throw new Error("STOCKAGE_LOCAL_DIR absente.");
  return resolve(configure);
};

const verifierDisque = (): string => {
  const dossier = dossierPhotos();
  // Le volume peut ne pas encore exister : on mesure le premier parent existant.
  let cible = dossier;
  while (!existsSync(cible) && dirname(cible) !== cible) {
    cible = dirname(cible);
  }
  const stats = statfsSync(cible);
  const libreGo = (stats.bavail * stats.bsize) / 1024 ** 3;
  const seuilGo = nombre(process.env.ALERTE_DISQUE_GO, 2);
  if (libreGo < seuilGo) {
    throw new Error(
      `${libreGo.toFixed(1)} Go libres sur ${cible} : seuil ${seuilGo} Go.`,
    );
  }
  return `${libreGo.toFixed(1)} Go libres (seuil ${seuilGo} Go)`;
};

const verifierEcriturePhotos = (): string => {
  const dossier = dossierPhotos();
  mkdirSync(dossier, { recursive: true });
  const temoin = join(dossier, `.preflight-${process.pid}`);
  writeFileSync(temoin, "ok", { mode: 0o600 });
  unlinkSync(temoin);
  return `${dossier} inscriptible`;
};

const principal = async (): Promise<void> => {
  console.log(`Préflight production — ${new Date().toISOString()}`);
  console.log(`Environnement : ${fichierEnv}`);
  await etape("Version de Node", verifierNode);
  await etape("Environnement", verifierEnvironnement);
  await etape("Connexion base de données", verifierBase);
  await etape("Migrations", verifierMigrations);
  await etape("Espace disque", verifierDisque);
  await etape("Volume photos", verifierEcriturePhotos);
  console.log("\nPréflight réussi : le déploiement peut démarrer.");
};

principal().catch((erreur) => {
  echec("Préflight", erreur instanceof Error ? erreur.message : String(erreur));
});
