/**
 * FR-016 (spec 006) — persistance des journaux applicatifs.
 *
 * Le logger reste la source stdout ; la persistance est branchée par le
 * serveur (`brancherPersistanceJournaux`) et testée ici par injection :
 * masquage, bornes, jamais bloquant, jamais récursif, débranchable.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

// L'insertion est interceptée : le branchement réel est testé sans base.
const { insertions } = vi.hoisted(() => ({
  insertions: [] as Record<string, unknown>[],
}));
vi.mock("@/infrastructure/db/client", () => ({
  db: {
    insert: () => ({
      values: async (valeurs: Record<string, unknown>) => {
        insertions.push(valeurs);
      },
    }),
  },
}));

import {
  configurerPersistanceJournal,
  logErreur,
  logInfo,
} from "@/lib/logger";
import {
  brancherPersistanceJournaux,
  creerPersistanceJournal,
  preparerLigneJournal,
  TAILLE_MAX_CONTEXTE,
  TAILLE_MAX_MESSAGE,
} from "@/lib/server/journaux";

afterEach(() => {
  configurerPersistanceJournal(null);
  insertions.length = 0;
  vi.restoreAllMocks();
});

describe("preparerLigneJournal (FR-016)", () => {
  it("masque les clés sensibles du contexte", () => {
    const ligne = preparerLigneJournal("info", "sync.terminee", {
      token: "secret-abc",
      password: "hunter2",
      logementId: "abc-123",
    });

    expect(ligne.contexte.token).toBe("[masqué]");
    expect(ligne.contexte.password).toBe("[masqué]");
    expect(ligne.contexte.logementId).toBe("abc-123");
  });

  it("borne le message et le contexte", () => {
    // Chaque valeur est déjà tronquée à 1 000 caractères par le masquage ;
    // c'est la somme des clés qui dépasse la borne du contexte.
    const contexte: Record<string, unknown> = {};
    for (let i = 0; i < 8; i += 1) {
      contexte[`cle${i}`] = "y".repeat(1_000);
    }
    const ligne = preparerLigneJournal(
      "error",
      "x".repeat(TAILLE_MAX_MESSAGE + 500),
      contexte,
    );

    expect(ligne.message.length).toBe(TAILLE_MAX_MESSAGE);
    expect(ligne.contexte.tronque).toBe(true);
    expect(String(ligne.contexte.resume).length).toBeLessThanOrEqual(
      TAILLE_MAX_CONTEXTE,
    );
  });

  it("extrait requestId du contexte, borné", () => {
    const ligne = preparerLigneJournal("error", "erreur.page", {
      requestId: "r".repeat(200),
    });

    expect(ligne.requestId).toBe("r".repeat(64));
  });

  it("survit à un contexte non sérialisable", () => {
    const ligne = preparerLigneJournal("info", "evenement", {
      compteur: BigInt(10),
    });

    expect(ligne.message).toBe("evenement");
    expect(ligne.contexte).toBeDefined();
  });
});

describe("logger → persistance (FR-016)", () => {
  it("transmet chaque ligne au canal de persistance branché", () => {
    const ecrites: { niveau: string; message: string }[] = [];
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    configurerPersistanceJournal((niveau, message) => {
      ecrites.push({ niveau, message });
    });

    logInfo("sync.terminee", { canal: "beds24" });
    logErreur("sync.echec", new Error("timeout"), { canal: "beds24" });

    expect(ecrites).toEqual([
      { niveau: "info", message: "sync.terminee" },
      { niveau: "error", message: "sync.echec" },
    ]);
  });

  it("écrit toujours sur stdout, même persistance branchée", () => {
    const stdout = vi.spyOn(console, "log").mockImplementation(() => {});
    configurerPersistanceJournal(() => {});

    logInfo("toujours.stdout");

    expect(stdout).toHaveBeenCalledTimes(1);
    expect(String(stdout.mock.calls[0]?.[0])).toContain("toujours.stdout");
  });

  it("une persistance qui jette ne casse jamais l'appelant", () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    configurerPersistanceJournal(() => {
      throw new Error("base indisponible");
    });

    expect(() => logInfo("ligne.robuste")).not.toThrow();
  });

  it("débranchée, le logger n'appelle plus la persistance", () => {
    const persistance = vi.fn();
    vi.spyOn(console, "log").mockImplementation(() => {});
    configurerPersistanceJournal(persistance);
    logInfo("avant");
    configurerPersistanceJournal(null);
    logInfo("apres");

    expect(persistance).toHaveBeenCalledTimes(1);
  });
});

describe("creerPersistanceJournal (FR-016)", () => {
  it("n'attend pas l'écriture et avale les erreurs d'écriture", async () => {
    const echec = vi.fn().mockRejectedValue(new Error("insert refuse"));
    const persister = creerPersistanceJournal(echec);

    expect(() => persister("info", "ligne", {})).not.toThrow();
    await vi.waitFor(() => expect(echec).toHaveBeenCalledTimes(1));
  });

  it("passe niveau, message et contexte à l'écriture", async () => {
    const ecrire = vi.fn().mockResolvedValue(undefined);
    const persister = creerPersistanceJournal(ecrire);

    persister("error", "boom", { chemin: "/hote" });

    await vi.waitFor(() =>
      expect(ecrire).toHaveBeenCalledWith("error", "boom", { chemin: "/hote" }),
    );
  });
});

describe("brancherPersistanceJournaux (FR-016)", () => {
  it("actif=false débranche : la ligne ne part pas en base", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    brancherPersistanceJournaux(false);

    logInfo("sans.persistance");
    await new Promise((r) => setTimeout(r, 10));

    expect(insertions).toHaveLength(0);
  });

  it("actif=true persiste la ligne suivante (contexte masqué, borné)", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    brancherPersistanceJournaux(true);

    logInfo("avec.persistance", { token: "secret", chemin: "/hote" });

    await vi.waitFor(() => expect(insertions).toHaveLength(1));
    expect(insertions[0]).toMatchObject({
      niveau: "info",
      message: "avec.persistance",
      contexte: { token: "[masqué]", chemin: "/hote" },
    });
  });
});
