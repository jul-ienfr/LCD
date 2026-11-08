import { and, desc, eq, sql } from "drizzle-orm";
import type {
  ApparenceRepository,
  StatutVersionApparence,
  VersionApparence,
} from "@/application/ports/apparence-repository";
import type { Apparence } from "@/domain/apparence/types";
import { db } from "../client";
import { apparenceVersions } from "../schema";

type Ligne = typeof apparenceVersions.$inferSelect;

function versVersion(ligne: Ligne): VersionApparence {
  return {
    id: ligne.id,
    version: ligne.version,
    configuration: ligne.configuration as Apparence,
    schemaVersion: ligne.schemaVersion,
    statut: ligne.statut as StatutVersionApparence,
    creeLe: ligne.creeLe,
    creePar: ligne.creePar,
    publieLe: ligne.publieLe,
    publiePar: ligne.publiePar,
    motif: ligne.motif,
  };
}

export class DrizzleApparenceRepository implements ApparenceRepository {
  async lirePubliee(): Promise<VersionApparence | null> {
    const [ligne] = await db
      .select()
      .from(apparenceVersions)
      .where(eq(apparenceVersions.statut, "publie"))
      .limit(1);
    return ligne ? versVersion(ligne) : null;
  }

  async lireBrouillon(): Promise<VersionApparence | null> {
    const [ligne] = await db
      .select()
      .from(apparenceVersions)
      .where(eq(apparenceVersions.statut, "brouillon"))
      .limit(1);
    return ligne ? versVersion(ligne) : null;
  }

  async listerVersions(limite = 20): Promise<VersionApparence[]> {
    const lignes = await db
      .select()
      .from(apparenceVersions)
      .where(
        sql`${apparenceVersions.statut} in ('publie', 'archive')`,
      )
      .orderBy(desc(apparenceVersions.version))
      .limit(Math.max(1, Math.min(limite, 100)));
    return lignes.map(versVersion);
  }

  async enregistrerBrouillon(
    apparence: Apparence,
    acteur: string,
  ): Promise<VersionApparence> {
    return db.transaction(async (tx) => {
      const [existant] = await tx
        .select()
        .from(apparenceVersions)
        .where(eq(apparenceVersions.statut, "brouillon"))
        .limit(1)
        .for("update");
      const valeurs = {
        configuration: apparence,
        schemaVersion: apparence.schemaVersion,
        creePar: acteur,
        motif: null,
      };
      if (existant) {
        const [ligne] = await tx
          .update(apparenceVersions)
          .set(valeurs)
          .where(eq(apparenceVersions.id, existant.id))
          .returning();
        return versVersion(ligne!);
      }
      const [ligne] = await tx
        .insert(apparenceVersions)
        .values({ ...valeurs, version: 0, statut: "brouillon" })
        .returning();
      return versVersion(ligne!);
    });
  }

  async publier(
    apparence: Apparence,
    acteur: string,
    motif: string | null = null,
  ): Promise<VersionApparence> {
    return db.transaction(async (tx) => {
      const maintenant = new Date();
      await tx
        .update(apparenceVersions)
        .set({ statut: "archive" })
        .where(eq(apparenceVersions.statut, "publie"));
      await tx
        .delete(apparenceVersions)
        .where(eq(apparenceVersions.statut, "brouillon"));
      const [agregat] = await tx
        .select({
          maximum: sql<number>`coalesce(max(${apparenceVersions.version}), 0)`,
        })
        .from(apparenceVersions);
      const [ligne] = await tx
        .insert(apparenceVersions)
        .values({
          version: Number(agregat?.maximum ?? 0) + 1,
          configuration: apparence,
          schemaVersion: apparence.schemaVersion,
          statut: "publie",
          creePar: acteur,
          publieLe: maintenant,
          publiePar: acteur,
          motif,
        })
        .returning();
      return versVersion(ligne!);
    });
  }

  async revenir(
    versionId: string,
    acteur: string,
    motif: string | null = null,
  ): Promise<VersionApparence> {
    const [ligne] = await db
      .select()
      .from(apparenceVersions)
      .where(
        and(
          eq(apparenceVersions.id, versionId),
          sql`${apparenceVersions.statut} in ('publie', 'archive')`,
        ),
      )
      .limit(1);
    if (!ligne) {
      throw new Error(`Version d’apparence introuvable : ${versionId}`);
    }
    return this.publier(
      ligne.configuration as Apparence,
      acteur,
      motif ?? `Retour à la version ${ligne.version}`,
    );
  }
}
