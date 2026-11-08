import { describe, expect, it, vi } from "vitest";
import {
  TraiterDemandesSync,
  type ResultatCycleDemande,
} from "@/application/use-cases/traiter-demandes-sync";
import { DemandeSyncRepositoryMemoire } from "../helpers/demande-sync-repository-memoire";

const CIBLE = { tenantId: "tenant-1", logementId: "logement-1" };

function resultat(
  valeurs: Partial<ResultatCycleDemande> = {},
): ResultatCycleDemande {
  return {
    total: 1,
    erreurs: 0,
    verrouille: false,
    ownerDisponible: true,
    details: [{ statut: "ok", message: null }],
    ...valeurs,
  };
}

describe("TraiterDemandesSync", () => {
  it("supprime la demande après une synchronisation réussie", async () => {
    const depot = new DemandeSyncRepositoryMemoire();
    await depot.enregistrer(CIBLE.tenantId, CIBLE.logementId);
    const executer = vi.fn(async () => resultat());
    const traiteur = new TraiterDemandesSync(depot, executer);

    const resultatTraitement = await traiteur.executer(CIBLE);

    expect(resultatTraitement).toMatchObject({
      total: 1,
      reussies: 1,
      echecs: 0,
      ownerDisponible: true,
    });
    expect(depot.lignes.size).toBe(0);
  });

  it("conserve la demande et applique un backoff après une erreur fournisseur", async () => {
    const depot = new DemandeSyncRepositoryMemoire();
    await depot.enregistrer(CIBLE.tenantId, CIBLE.logementId);
    const executer = vi.fn(async () =>
      resultat({
        erreurs: 1,
        details: [{ statut: "erreur", message: "API indisponible" }],
      }),
    );
    const traiteur = new TraiterDemandesSync(depot, executer);

    const resultatTraitement = await traiteur.executer(CIBLE);

    expect(resultatTraitement).toMatchObject({ total: 1, echecs: 1 });
    const ligne = [...depot.lignes.values()][0];
    expect(ligne?.tentatives).toBe(1);
    expect(ligne?.derniereErreur).toBe("API indisponible");
    expect(ligne?.disponibleA.getTime()).toBeGreaterThan(Date.now());
  });

  it("respecte le quota en reprogrammant un cycle espacé", async () => {
    const depot = new DemandeSyncRepositoryMemoire();
    await depot.enregistrer(CIBLE.tenantId, CIBLE.logementId);
    const executer = vi.fn(async () =>
      resultat({
        total: 1,
        details: [
          {
            statut: "ignore",
            message: "Cycle automatique espacé (60 min) pour préserver le quota.",
          },
        ],
      }),
    );
    const traiteur = new TraiterDemandesSync(depot, executer);

    const resultatTraitement = await traiteur.executer(CIBLE);

    expect(resultatTraitement).toMatchObject({ echecs: 1 });
    const ligne = [...depot.lignes.values()][0];
    expect(ligne?.tentatives).toBe(1);
    expect(ligne?.disponibleA.getTime()).toBeGreaterThan(
      Date.now() + 4 * 60_000,
    );
  });

  it("ne perd pas la demande si le verrou est déjà pris", async () => {
    const depot = new DemandeSyncRepositoryMemoire();
    await depot.enregistrer(CIBLE.tenantId, CIBLE.logementId);
    const executer = vi.fn(async () =>
      resultat({ total: 0, verrouille: true, details: [] }),
    );
    const traiteur = new TraiterDemandesSync(depot, executer);

    const resultatTraitement = await traiteur.executer(CIBLE);

    expect(resultatTraitement).toMatchObject({ echecs: 1 });
    expect(depot.lignes.size).toBe(1);
  });

  it("ignore une demande ciblée qui n'est pas encore due", async () => {
    const depot = new DemandeSyncRepositoryMemoire();
    await depot.enregistrer(CIBLE.tenantId, CIBLE.logementId);
    const ligne = [...depot.lignes.values()][0];
    if (ligne) ligne.disponibleA = new Date(Date.now() + 60_000);
    const executer = vi.fn(async () => resultat());
    const traiteur = new TraiterDemandesSync(depot, executer);

    const resultatTraitement = await traiteur.executer(CIBLE);

    expect(resultatTraitement).toMatchObject({
      total: 0,
      ignoree: true,
      ownerDisponible: true,
    });
    expect(executer).not.toHaveBeenCalled();
  });

  it("signale l'absence de connexion owner", async () => {
    const depot = new DemandeSyncRepositoryMemoire();
    depot.ownerDisponible = false;
    const executer = vi.fn(async () => resultat());
    const traiteur = new TraiterDemandesSync(depot, executer);

    const resultatTraitement = await traiteur.executer({});

    expect(resultatTraitement).toMatchObject({
      ownerDisponible: false,
      total: 0,
    });
    expect(executer).not.toHaveBeenCalled();
  });
});
