import { describe, expect, it } from "vitest";
import {
  ListerPreuvesProprietaire,
  type PreuvesLogement,
} from "@/application/use-cases/preuves-proprietaire";
import type {
  AssignationProprietaire,
  LogementProprietaireRepository,
  MandatData,
} from "@/application/ports/logement-proprietaire-repository";
import type {
  CreerPhotoPreuveData,
  PhotoPreuve,
  PhotoPreuveRepository,
} from "@/application/ports/photo-preuve-repository";
import type { Logement } from "@/domain/logement";
import type { VisibilitePreuves } from "@/domain/visibilite-proprietaire";
import { MissionRepositoryMemoire } from "../helpers/mission-repository-memoire";

const TENANT = "tenant-1";
const PROPRIO = "user-proprio-1";
const AUTRE = "user-proprio-2";
const LOGEMENT_A = "logement-a";
const LOGEMENT_B = "logement-b";

function logement(id: string): Logement {
  return {
    id,
    tenantId: TENANT,
    code: id,
    nom: `Logement ${id}`,
    coproVerifiee: true,
    strategiePrix: "equilibre",
    publication: "publiee",
    statut: "actif",
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
  };
}

class MandatsMemoire implements LogementProprietaireRepository {
  constructor(
    private readonly mandats: {
      logementId: string;
      userId: string;
      visibilite: VisibilitePreuves;
    }[] = [],
  ) {}

  async listerLogements(_tenantId: string, userId: string): Promise<Logement[]> {
    return this.mandats
      .filter((mandat) => mandat.userId === userId)
      .map((mandat) => logement(mandat.logementId));
  }

  async listerAssignations(_tenantId: string): Promise<AssignationProprietaire[]> {
    return this.mandats.map((mandat) => ({
      logementId: mandat.logementId,
      userId: mandat.userId,
      commissionBp: 2000,
      chargesMensuellesCentimes: 0,
      mode: "mandat_tiers",
      statut: "actif",
      dateDebut: null,
      dateFin: null,
      notes: null,
      visibilitePreuves: mandat.visibilite,
    }));
  }

  async assigner(
    _tenantId: string,
    _logementId: string,
    _userId: string,
    _data: MandatData,
  ): Promise<void> {}

  async retirer(
    _tenantId: string,
    _logementId: string,
    _userId: string,
  ): Promise<void> {}
}

class PhotosMemoire implements PhotoPreuveRepository {
  readonly photos: PhotoPreuve[] = [];
  private compteur = 0;

  async listerParMenage(tenantId: string, menageId: string) {
    return this.photos.filter(
      (photo) => photo.tenantId === tenantId && photo.menageId === menageId,
    );
  }

  async listerParLogement(tenantId: string, logementId: string) {
    return this.photos
      .filter(
        (photo) =>
          photo.tenantId === tenantId && photo.logementId === logementId,
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async trouverParId(tenantId: string, id: string) {
    return (
      this.photos.find(
        (photo) => photo.tenantId === tenantId && photo.id === id,
      ) ?? null
    );
  }

  async totalOctetsParLogement() {
    return 0;
  }

  async listerPlusAnciennes() {
    return [];
  }

  async creer(data: CreerPhotoPreuveData) {
    this.compteur += 1;
    const photo: PhotoPreuve = {
      ...data,
      id: `photo-${this.compteur}`,
      createdAt: new Date(`2026-11-2${this.compteur}T12:00:00Z`),
    };
    this.photos.push(photo);
    return photo;
  }

  async supprimer(_tenantId: string, id: string) {
    const index = this.photos.findIndex((photo) => photo.id === id);
    if (index < 0) return false;
    this.photos.splice(index, 1);
    return true;
  }
}

/** Une mission clôturée, pointée et validée, prête pour la lecture. */
async function missionTerminee(
  missions: MissionRepositoryMemoire,
  options: {
    logementId: string;
    ref: string;
    date: string;
    horsLigne?: boolean;
    motifRefus?: string;
  },
) {
  const mission = await missions.creer({
    tenantId: TENANT,
    logementId: options.logementId,
    reservationId: null,
    assignedUserId: "presta-1",
    ref: options.ref,
    type: "menage",
    date: options.date,
    heure: "10:00",
    notes: "Détail interne jamais transmis au propriétaire",
  });
  await missions.pointerDebut(TENANT, mission.id, {
    at: new Date(`${options.date}T09:00:00Z`),
    source: "serveur",
    recuLe: new Date(`${options.date}T09:00:30Z`),
  });
  await missions.pointerFin(TENANT, mission.id, {
    at: new Date(`${options.date}T10:30:00Z`),
    source: options.horsLigne ? "hors_ligne" : "serveur",
    recuLe: new Date(`${options.date}T11:00:00Z`),
  });
  await missions.soumettrePreuve(TENANT, mission.id, {
    le: new Date(`${options.date}T11:05:00Z`),
  });
  if (options.motifRefus) {
    await missions.refuserPreuve(TENANT, mission.id, {
      le: new Date(`${options.date}T11:30:00Z`),
      par: "admin-1",
      motif: options.motifRefus,
    });
  } else {
    await missions.validerPreuve(TENANT, mission.id, {
      le: new Date(`${options.date}T11:30:00Z`),
      par: "admin-1",
    });
  }
  return mission;
}

function lister(
  mandats: MandatsMemoire,
  missions: MissionRepositoryMemoire,
  photos: PhotosMemoire,
): ListerPreuvesProprietaire {
  return new ListerPreuvesProprietaire(mandats, missions, photos);
}

function parLogement(
  resultats: PreuvesLogement[],
  logementId: string,
): PreuvesLogement {
  const trouve = resultats.find((entree) => entree.logementId === logementId);
  if (!trouve) throw new Error(`Logement ${logementId} absent du résultat.`);
  return trouve;
}

describe("lecture des preuves par un propriétaire (FR-037)", () => {
  it("ne lit que les logements de son mandat", async () => {
    const mandats = new MandatsMemoire([
      { logementId: LOGEMENT_A, userId: PROPRIO, visibilite: "resume" },
      { logementId: LOGEMENT_B, userId: AUTRE, visibilite: "complete" },
    ]);
    const resultats = await lister(
      mandats,
      new MissionRepositoryMemoire(),
      new PhotosMemoire(),
    ).executer(TENANT, PROPRIO);

    expect(resultats.map((entree) => entree.logementId)).toEqual([LOGEMENT_A]);
  });

  it("ne renvoie rien quand le mandat masque les preuves", async () => {
    const missions = new MissionRepositoryMemoire();
    await missionTerminee(missions, {
      logementId: LOGEMENT_A,
      ref: "MIS-0001",
      date: "2026-11-20",
    });
    const photos = new PhotosMemoire();
    await photos.creer({
      tenantId: TENANT,
      menageId: "menage-1",
      logementId: LOGEMENT_A,
      ref: "PHO-1",
      phase: "apres",
      piece: "Séjour",
      chemin: "photos/a.jpg",
      contentType: "image/jpeg",
      tailleOctets: 1000,
    });

    const resultats = await lister(
      new MandatsMemoire([
        { logementId: LOGEMENT_A, userId: PROPRIO, visibilite: "masquee" },
      ]),
      missions,
      photos,
    ).executer(TENANT, PROPRIO);

    const entree = parLogement(resultats, LOGEMENT_A);
    expect(entree.visible).toBe(false);
    expect(entree.interventions).toEqual([]);
    expect(entree.photos).toEqual([]);
    expect(entree.visibilite).toBe("masquee");
  });

  it("au niveau résumé : les interventions sans pointage ni photos", async () => {
    const missions = new MissionRepositoryMemoire();
    await missionTerminee(missions, {
      logementId: LOGEMENT_A,
      ref: "MIS-0001",
      date: "2026-11-20",
      motifRefus: "Photos floues, à reprendre",
    });
    const photos = new PhotosMemoire();
    await photos.creer({
      tenantId: TENANT,
      menageId: "menage-1",
      logementId: LOGEMENT_A,
      ref: "PHO-1",
      phase: "avant",
      piece: "Séjour",
      chemin: "photos/a.jpg",
      contentType: "image/jpeg",
      tailleOctets: 1000,
    });

    const entree = parLogement(
      await lister(
        new MandatsMemoire([
          { logementId: LOGEMENT_A, userId: PROPRIO, visibilite: "resume" },
        ]),
        missions,
        photos,
      ).executer(TENANT, PROPRIO),
      LOGEMENT_A,
    );

    expect(entree.visible).toBe(true);
    expect(entree.interventions).toHaveLength(1);
    const intervention = entree.interventions[0];
    expect(intervention?.ref).toBe("MIS-0001");
    expect(intervention?.preuveStatut).toBe("refusee");
    expect(intervention?.motifRefus).toBeNull();
    expect(intervention?.debutReel).toBeNull();
    expect(intervention?.dureeReelleMinutes).toBeNull();
    expect(intervention?.pointageHorsLigne).toBe(false);
    expect(entree.photos).toEqual([]);
  });

  it("au niveau complet : détail, pointage hors ligne et photos", async () => {
    const missions = new MissionRepositoryMemoire();
    await missionTerminee(missions, {
      logementId: LOGEMENT_A,
      ref: "MIS-0001",
      date: "2026-11-19",
      horsLigne: true,
    });
    await missionTerminee(missions, {
      logementId: LOGEMENT_A,
      ref: "MIS-0002",
      date: "2026-11-21",
      motifRefus: "Photo du séjour manquante",
    });
    const photos = new PhotosMemoire();
    const premiere = await photos.creer({
      tenantId: TENANT,
      menageId: "menage-1",
      logementId: LOGEMENT_A,
      ref: "PHO-1",
      phase: "avant",
      piece: "Cuisine",
      chemin: "photos/a.jpg",
      contentType: "image/jpeg",
      tailleOctets: 1000,
    });
    const seconde = await photos.creer({
      tenantId: TENANT,
      menageId: "menage-1",
      logementId: LOGEMENT_A,
      ref: "PHO-2",
      phase: "apres",
      piece: "Cuisine",
      chemin: "photos/b.jpg",
      contentType: "image/jpeg",
      tailleOctets: 2000,
    });

    const entree = parLogement(
      await lister(
        new MandatsMemoire([
          { logementId: LOGEMENT_A, userId: PROPRIO, visibilite: "complete" },
        ]),
        missions,
        photos,
      ).executer(TENANT, PROPRIO),
      LOGEMENT_A,
    );

    expect(entree.interventions.map((i) => i.ref)).toEqual([
      "MIS-0002",
      "MIS-0001",
    ]);
    const ancienne = entree.interventions[1];
    expect(ancienne?.dureeReelleMinutes).toBe(90);
    expect(ancienne?.pointageHorsLigne).toBe(true);
    const refusee = entree.interventions[0];
    expect(refusee?.motifRefus).toBe("Photo du séjour manquante");

    expect(entree.photos.map((photo) => photo.id)).toEqual([
      seconde.id,
      premiere.id,
    ]);
    expect(entree.photos[0]?.url).toBe(`/api/photos/${seconde.id}`);
    expect(entree.photos[0]?.piece).toBe("Cuisine");
    expect(entree.photos[0]?.creeLe).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    // Aucune donnée d'intervenant ne sort du cas d'usage.
    expect(JSON.stringify(entree)).not.toContain("presta-1");
    expect(JSON.stringify(entree)).not.toContain("Détail interne");
  });

  it("replie sur le résumé quand le réglage du mandat est inconnu", async () => {
    const missions = new MissionRepositoryMemoire();
    await missionTerminee(missions, {
      logementId: LOGEMENT_A,
      ref: "MIS-0001",
      date: "2026-11-20",
    });
    const mandats = new MandatsMemoire([
      {
        logementId: LOGEMENT_A,
        userId: PROPRIO,
        visibilite: "public" as VisibilitePreuves,
      },
    ]);

    const entree = parLogement(
      await lister(mandats, missions, new PhotosMemoire()).executer(
        TENANT,
        PROPRIO,
      ),
      LOGEMENT_A,
    );

    // Le port normalise déjà ; sans mandat reconnu, le défaut est le résumé.
    expect(entree.visible).toBe(true);
    expect(entree.photos).toEqual([]);
  });

  it("ne lit aucun logement sans mandat", async () => {
    const resultats = await lister(
      new MandatsMemoire(),
      new MissionRepositoryMemoire(),
      new PhotosMemoire(),
    ).executer(TENANT, PROPRIO);
    expect(resultats).toEqual([]);
  });
});
