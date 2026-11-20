/**
 * Garde-fous de la chaîne d'intégration (FR-030, spec 006).
 *
 * Ces tests lisent les workflows GitHub Actions et la configuration de
 * couverture : ils empêchent la régression silencieuse qui a laissé la CI
 * rouge pendant des semaines (tests lancés avant le build, seuil de
 * couverture non appliqué, recette e2e non planifiée, workflows planifiés
 * morts parce qu'ils ne vivent que sur une branche non principale).
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";

const dossierWorkflows = new URL("../../../.github/workflows/", import.meta.url);
const racineV2 = new URL("../../", import.meta.url);

interface Etape {
  name?: string;
  run?: string;
  uses?: string;
  if?: string;
}

interface Job {
  if?: string;
  steps?: Etape[];
}

interface Workflow {
  on?: Record<string, unknown>;
  jobs?: Record<string, Job>;
}

function lireWorkflow(nom: string): Workflow {
  return parse(
    readFileSync(new URL(nom, dossierWorkflows), "utf8"),
  ) as Workflow;
}

function job(workflow: Workflow, nom: string): Job {
  const trouve = workflow.jobs?.[nom];
  if (!trouve) throw new Error(`Job "${nom}" introuvable.`);
  return trouve;
}

function indexEtape(steps: Etape[], motif: RegExp): number {
  return steps.findIndex((etape) => motif.test(etape.run ?? ""));
}

/**
 * Position d'une commande dans le script concaténé de toutes les étapes :
 * deux commandes d'une même étape multi-lignes gardent un ordre mesurable.
 */
function positionCommande(steps: Etape[], motif: RegExp): number {
  let position = 0;
  for (const etape of steps) {
    const script = etape.run ?? "";
    const trouve = script.search(motif);
    if (trouve >= 0) return position + trouve;
    position += script.length + 1;
  }
  return -1;
}

describe("v2-ci : build avant tests et couverture mesurée", () => {
  const workflow = lireWorkflow("v2-ci.yml");
  const web = job(workflow, "web");

  it("le build précède les tests (garde de budget JS, constitution III)", () => {
    const steps = web.steps ?? [];
    const iBuild = indexEtape(steps, /npm run build/);
    const iTests = indexEtape(steps, /npm run test:coverage/);
    expect(iBuild).toBeGreaterThanOrEqual(0);
    expect(iTests).toBeGreaterThanOrEqual(0);
    expect(iBuild).toBeLessThan(iTests);
  });

  it("la couverture est mesurée avec un seuil de 80 % (SC-013)", () => {
    const config = readFileSync(new URL("vitest.config.mts", racineV2), "utf8");
    expect(config).toContain("thresholds");
    expect(config).toMatch(/lines:\s*80/);
    expect(config).toMatch(/functions:\s*80/);
    expect(config).toMatch(/statements:\s*80/);
    expect(config).toMatch(/branches:\s*80/);
    expect(config).toContain("src/domain");
    expect(config).toContain("src/application");
  });

  it("le job release rejoue les tests après le build", () => {
    const release = job(workflow, "release");
    const steps = release.steps ?? [];
    const iBuild = indexEtape(steps, /npm run build/);
    const iTests = indexEtape(steps, /npm run test:coverage/);
    expect(iBuild).toBeGreaterThanOrEqual(0);
    expect(iTests).toBeGreaterThanOrEqual(0);
    expect(iBuild).toBeLessThan(iTests);
  });
});

describe("recette e2e quotidienne (FR-030)", () => {
  const workflow = lireWorkflow("v2-recette-quotidienne.yml");
  const steps = job(workflow, "recette").steps ?? [];

  it("est planifiée au moins une fois par jour", () => {
    const schedule = workflow.on?.schedule as { cron?: string }[] | undefined;
    const crons = (schedule ?? []).map((entree) => entree.cron ?? "");
    expect(crons.length).toBeGreaterThan(0);
    for (const cron of crons) {
      const champs = cron.trim().split(/\s+/);
      expect(champs).toHaveLength(5);
      const [minute, heure, jourMois, mois, jourSemaine] = champs;
      // Tous les jours : les champs de date restent ouverts.
      expect(jourMois).toBe("*");
      expect(mois).toBe("*");
      expect(jourSemaine).toBe("*");
      // Une exécution quotidienne : heure et minute fixes, jamais étoilées.
      expect(heure).toMatch(/^\d+$/);
      expect(minute).toMatch(/^\d+$/);
    }
  });

  it("rejoue la suite e2e contre le build de production", () => {
    const iBuild = indexEtape(steps, /npm run build/);
    const iE2e = indexEtape(steps, /npm run test:e2e/);
    expect(iBuild).toBeGreaterThanOrEqual(0);
    expect(iE2e).toBeGreaterThanOrEqual(0);
    expect(iBuild).toBeLessThan(iE2e);
  });

  it("prépare un environnement complet (migrations, rôles, seeds)", () => {
    for (const commande of [
      "npm run db:migrate",
      "npm run db:seed",
      "npm run db:role-app",
    ]) {
      expect(steps.some((etape) => (etape.run ?? "").includes(commande))).toBe(
        true,
      );
    }
  });

  it("reste déclenchable manuellement", () => {
    expect(workflow.on).toHaveProperty("workflow_dispatch");
  });
});

describe("workflows planifiés : garde-fous", () => {
  const planifies = [
    "v2-backup.yml",
    "v2-relances.yml",
    "v2-sync-ota.yml",
    "v2-webhooks.yml",
    "v2-recette-quotidienne.yml",
  ];

  it.each(planifies)("%s garde ses déclencheurs", (nom) => {
    const workflow = lireWorkflow(nom);
    expect(workflow.on).toHaveProperty("schedule");
    expect(workflow.on).toHaveProperty("workflow_dispatch");
  });

  // Avant go-live, aucune application n'est déployée : ces jobs doivent être
  // ignorés proprement (garde `vars.LCD_APP_URL`) au lieu d'échouer en boucle.
  it.each([
    "v2-backup.yml",
    "v2-relances.yml",
    "v2-sync-ota.yml",
    "v2-webhooks.yml",
  ])("%s ne s'exécute qu'une fois l'application déployée", (nom) => {
    const jobs = Object.values(lireWorkflow(nom).jobs ?? {});
    expect(jobs.length).toBeGreaterThan(0);
    for (const entree of jobs) {
      expect(entree.if ?? "").toContain("vars.LCD_APP_URL");
    }
  });
});

describe("ci (V1) : ne se déclenche plus sur les chemins de la v2", () => {
  it("filtre ses déclenchements sur les chemins de la V1", () => {
    const workflow = lireWorkflow("ci.yml");
    const push = workflow.on?.push as { paths?: string[] } | undefined;
    const paths = push?.paths ?? [];
    expect(paths.length).toBeGreaterThan(0);
    expect(paths.some((chemin) => chemin.startsWith("v2"))).toBe(false);
    expect(paths).toContain("web/**");
  });
});

describe("npm ci prépare les types (alias @/ pour tsx)", () => {
  // `tsx` résout l'alias `@/…` via `node_modules/$app/tsconfig.json`, un
  // placeholder que seul `svelte-kit sync` crée. Sans le script `prepare`,
  // un `db:seed` lancé avant tout `typecheck` échoue en CI
  // (`Cannot find package '@/lib'`) alors qu'il passe en local.
  it("le script prepare lance svelte-kit sync", () => {
    const pkg = JSON.parse(
      readFileSync(new URL("package.json", racineV2), "utf8"),
    ) as { scripts?: Record<string, string> };
    expect(pkg.scripts?.prepare ?? "").toContain("svelte-kit sync");
  });
});

describe("serveurs de prévisualisation : port explicite", () => {
  // adapter-node écoute sur PORT (3000 par défaut) : un workflow qui attend
  // BASE_URL (4173) sans exporter PORT voit le serveur démarrer ailleurs et
  // la sonde échoue en boucle.
  it.each(["qualite-ergonomie.yml", "v2-recette-quotidienne.yml"])(
    "%s aligne PORT sur l'URL attendue",
    (nom) => {
      const workflow = lireWorkflow(nom) as Workflow & {
        env?: Record<string, string>;
      };
      const portAttendu = (workflow.env?.BASE_URL ?? "http://127.0.0.1:4173")
        .split(":")
        .pop();
      const porteur = Object.values(workflow.jobs ?? {}).find((entree) =>
        (entree.steps ?? []).some((etape) =>
          /node build/.test(etape.run ?? ""),
        ),
      ) as (Job & { env?: Record<string, string> }) | undefined;
      if (!porteur) return;
      const etape = (porteur.steps ?? []).find((s) =>
        /node build/.test(s.run ?? ""),
      ) as (Etape & { env?: Record<string, string> }) | undefined;
      const port =
        etape?.env?.PORT ?? porteur.env?.PORT ?? workflow.env?.PORT ?? "3000";
      expect(port).toBe(portAttendu);
    },
  );
});

describe("build en CI : DATABASE_URL toujours fournie", () => {
  // `vite build` force NODE_ENV=production et le build refuse de s'exécuter
  // sans DATABASE_URL : tout workflow qui construit la v2 doit la fournir.
  const workflowsAvecBuild = [
    "v2-ci.yml",
    "v2-recette-quotidienne.yml",
    "qualite-ergonomie.yml",
  ];

  it.each(workflowsAvecBuild)("%s fournit DATABASE_URL au build", (nom) => {
    const workflow = lireWorkflow(nom) as Workflow & {
      env?: Record<string, string>;
    };
    const jobs = Object.values(workflow.jobs ?? {});
    const construit = jobs.some((entree) =>
      (entree.steps ?? []).some((etape) => /npm run build/.test(etape.run ?? "")),
    );
    expect(construit).toBe(true);
    // DATABASE_URL doit être définie au niveau du workflow ou du job porteur.
    const porteur = jobs.find((entree) =>
      (entree.steps ?? []).some((etape) => /npm run build/.test(etape.run ?? "")),
    ) as (Job & { env?: Record<string, string> }) | undefined;
    const envJob = porteur?.env ?? {};
    const envWorkflow = workflow.env ?? {};
    expect(envJob.DATABASE_URL ?? envWorkflow.DATABASE_URL).toBeTruthy();
  });
});

describe("migrations sur base neuve : le rôle applicatif existe d'abord", () => {
  // Deux migrations accordent des droits à `lcd_app` sans garde `IF EXISTS`
  // (0062, 0103) : sur une base neuve, `db:migrate` échoue si le rôle n'a pas
  // été créé avant. Tout job qui migre une base vierge doit créer le rôle
  // d'abord.
  const workflowsAvecMigrations = [
    "v2-ci.yml",
    "v2-recette-quotidienne.yml",
    "qualite-ergonomie.yml",
  ];

  it("les migrations non gardées sont bien celles connues", () => {
    const nonGardees: string[] = [];
    for (const nom of [
      "0062_lyrical_pride.sql",
      "0103_domaine_public.sql",
    ]) {
      const sql = readFileSync(
        new URL(`drizzle/${nom}`, racineV2),
        "utf8",
      );
      if (!/IF EXISTS \(SELECT 1 FROM pg_roles/.test(sql)) nonGardees.push(nom);
    }
    expect(nonGardees).toEqual([
      "0062_lyrical_pride.sql",
      "0103_domaine_public.sql",
    ]);
  });

  it.each(workflowsAvecMigrations)(
    "%s crée le rôle avant de migrer",
    (nom) => {
      const workflow = lireWorkflow(nom);
      const porteur = Object.values(workflow.jobs ?? {}).find((entree) =>
        (entree.steps ?? []).some((etape) =>
          /npm run db:migrate/.test(etape.run ?? ""),
        ),
      ) as Job | undefined;
      expect(porteur).toBeTruthy();
      const steps = porteur?.steps ?? [];
      const iRole = positionCommande(steps, /npm run db:role-app/);
      const iMigrate = positionCommande(steps, /npm run db:migrate/);
      expect(iRole).toBeGreaterThanOrEqual(0);
      expect(iMigrate).toBeGreaterThanOrEqual(0);
      expect(iRole).toBeLessThan(iMigrate);
    },
  );
});
