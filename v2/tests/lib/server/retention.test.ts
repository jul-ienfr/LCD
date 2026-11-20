import { describe, expect, it, vi } from "vitest";
import {
  RETENTION_EVENEMENTS_CANAL_JOURS,
  RETENTION_EXECUTIONS_AUTOMATISATION_JOURS,
  RETENTION_JOURNAUX_APPLICATIFS_JOURS,
  RETENTION_LIVRAISONS_WEBHOOK_JOURS,
  RETENTION_TENTATIVES_CONNEXION_JOURS,
} from "@/domain/retention";
import { env } from "@/lib/env";
import {
  purgerRetentions,
  type PurgeRetention,
} from "@/lib/server/retention";

function espionnes() {
  return {
    audit: vi.fn<PurgeRetention>().mockResolvedValue(2),
    evenementsCanal: vi.fn<PurgeRetention>().mockResolvedValue(3),
    livraisonsWebhook: vi.fn<PurgeRetention>().mockResolvedValue(4),
    executionsAutomatisation: vi.fn<PurgeRetention>().mockResolvedValue(5),
    tentativesConnexion: vi.fn<PurgeRetention>().mockResolvedValue(6),
    journauxApplicatifs: vi.fn<PurgeRetention>().mockResolvedValue(7),
  };
}

describe("purges de rétention bornée (FR-015)", () => {
  it("purge les familles déclarées et remonte les compteurs", async () => {
    const injections = espionnes();

    const resultat = await purgerRetentions(injections);

    expect(resultat).toEqual({
      audit: 2,
      evenementsCanal: 3,
      livraisonsWebhook: 4,
      executionsAutomatisation: 5,
      tentativesConnexion: 6,
      journauxApplicatifs: 7,
      echecs: [],
    });
  });

  it("applique à chaque famille sa rétention déclarée", async () => {
    const injections = espionnes();

    await purgerRetentions(injections);

    // L'audit suit la rétention configurée (plancher 365 jours côté SQL).
    expect(injections.audit).toHaveBeenCalledWith(env.AUDIT_RETENTION_JOURS);
    expect(env.AUDIT_RETENTION_JOURS).toBeGreaterThanOrEqual(365);
    expect(injections.evenementsCanal).toHaveBeenCalledWith(
      RETENTION_EVENEMENTS_CANAL_JOURS,
    );
    expect(injections.livraisonsWebhook).toHaveBeenCalledWith(
      RETENTION_LIVRAISONS_WEBHOOK_JOURS,
    );
    expect(injections.executionsAutomatisation).toHaveBeenCalledWith(
      RETENTION_EXECUTIONS_AUTOMATISATION_JOURS,
    );
    expect(injections.tentativesConnexion).toHaveBeenCalledWith(
      RETENTION_TENTATIVES_CONNEXION_JOURS,
    );
    expect(injections.journauxApplicatifs).toHaveBeenCalledWith(
      RETENTION_JOURNAUX_APPLICATIFS_JOURS,
    );
  });

  it("une purge en échec ne bloque pas les autres familles", async () => {
    const injections = espionnes();
    injections.evenementsCanal.mockRejectedValue(new Error("verrou"));
    injections.tentativesConnexion.mockRejectedValue(new Error("timeout"));

    const resultat = await purgerRetentions(injections);

    expect(resultat.echecs).toEqual([
      "evenements_canal",
      "tentatives_connexion",
    ]);
    expect(resultat.audit).toBe(2);
    expect(resultat.livraisonsWebhook).toBe(4);
    expect(resultat.executionsAutomatisation).toBe(5);
    expect(resultat.journauxApplicatifs).toBe(7);
    expect(resultat.evenementsCanal).toBe(0);
    expect(resultat.tentativesConnexion).toBe(0);
    // Toutes les familles ont été tentées, dans l'ordre du référentiel.
    for (const injection of Object.values(injections)) {
      expect(injection).toHaveBeenCalledTimes(1);
    }
  });

  it("reste idempotent : un second passage sans lignes ne supprime rien", async () => {
    const injections = espionnes();
    for (const injection of Object.values(injections)) {
      injection.mockResolvedValue(0);
    }

    const resultat = await purgerRetentions(injections);

    expect(resultat.echecs).toEqual([]);
    expect(
      resultat.audit +
        resultat.evenementsCanal +
        resultat.livraisonsWebhook +
        resultat.executionsAutomatisation +
        resultat.tentativesConnexion +
        resultat.journauxApplicatifs,
    ).toBe(0);
  });
});

describe("rétentions déclarées (FR-015)", () => {
  it("borne chaque famille à une durée finie et positive", () => {
    for (const jours of [
      RETENTION_EVENEMENTS_CANAL_JOURS,
      RETENTION_LIVRAISONS_WEBHOOK_JOURS,
      RETENTION_EXECUTIONS_AUTOMATISATION_JOURS,
      RETENTION_TENTATIVES_CONNEXION_JOURS,
      RETENTION_JOURNAUX_APPLICATIFS_JOURS,
    ]) {
      expect(Number.isInteger(jours)).toBe(true);
      expect(jours).toBeGreaterThan(0);
      expect(jours).toBeLessThanOrEqual(365);
    }
  });

  it("garde les traces d'intégration plus longtemps que l'anti-abus", () => {
    expect(RETENTION_EVENEMENTS_CANAL_JOURS).toBeGreaterThan(
      RETENTION_TENTATIVES_CONNEXION_JOURS,
    );
  });
});
