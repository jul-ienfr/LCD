import { describe, expect, it } from "vitest";
import {
  AjouterPhotoReference,
  ComparerPhotosIntervention,
  SupprimerPhotoReference,
} from "@/application/use-cases/inventaire-photos";
import type { MenagesRepository } from "@/application/ports/menages-repository";
import type {
  CreerPhotoPreuveData,
  PhotoPreuve,
  PhotoPreuveRepository,
} from "@/application/ports/photo-preuve-repository";
import type { StockageFichiers } from "@/application/ports/stockage";
import { PHOTOS_REFERENCE_PAR_PIECE_MAX } from "@/domain/photo-reference";
import type { Menage } from "@/domain/menage";
import { PhotoReferenceRepositoryMemoire } from "../helpers/photo-reference-repository-memoire";

const TENANT = "11111111-1111-4111-8111-111111111111";
const LOGEMENT = "22222222-2222-4222-8222-222222222222";
const MENAGE = "33333333-3333-4333-8333-333333333333";
const OCTETS = new Uint8Array([0xff, 0xd8, 0xff]);

function menage(): Menage {
  return {
    id: MENAGE,
    tenantId: TENANT,
    logementId: LOGEMENT,
    reservationId: null,
    ref: "MEN-0001",
    date: "2026-11-01",
    statut: "fait",
    notes: "",
    score: null,
    coutCentimes: null,
    dureeMinutes: null,
    taches: [
      { piece: "Cuisine", libelle: "Sols", fait: true },
      { piece: "Séjour", libelle: "Canapé", fait: false },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

class StockageMemoire implements StockageFichiers {
  readonly fichiers = new Map<string, Uint8Array>();

  async put(key: string, body: Uint8Array) {
    this.fichiers.set(key, body);
  }
  async get(key: string) {
    const body = this.fichiers.get(key);
    if (!body) throw new Error("absent");
    return body;
  }
  async signedUrl(key: string) {
    return `/api/photos-reference/${key}`;
  }
  async delete(key: string) {
    this.fichiers.delete(key);
  }
}

class PhotosPreuveMemoire implements PhotoPreuveRepository {
  readonly photos: PhotoPreuve[] = [];

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
    const photo: PhotoPreuve = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date(),
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

function preparer() {
  const photos = new PhotoReferenceRepositoryMemoire();
  const preuve = new PhotosPreuveMemoire();
  const stockage = new StockageMemoire();
  const menages = {
    trouverParId: async (tenantId: string, id: string) =>
      tenantId === TENANT && id === MENAGE ? menage() : null,
  } as unknown as MenagesRepository;
  return {
    photos,
    preuve,
    stockage,
    menages,
    ajouter: new AjouterPhotoReference(photos, stockage),
    supprimer: new SupprimerPhotoReference(photos, stockage),
    comparer: new ComparerPhotosIntervention(menages, photos, preuve),
  };
}

describe("cas d'usage inventaire photo de référence (FR-036)", () => {
  it("stocke la photo, la légende et la pièce", async () => {
    const { photos, stockage, ajouter } = preparer();
    const photo = await ajouter.executer({
      tenantId: TENANT,
      logementId: LOGEMENT,
      piece: "  Cuisine  ",
      legende: "  Plan de travail  ",
      contentType: "image/jpeg",
      octets: OCTETS,
    });

    expect(photo.piece).toBe("Cuisine");
    expect(photo.legende).toBe("Plan de travail");
    expect(photo.chemin).toBe(
      `${TENANT}/${LOGEMENT}/reference/${photo.ref}.jpg`,
    );
    expect(stockage.fichiers.get(photo.chemin)).toEqual(OCTETS);
    expect(photos.photos).toHaveLength(1);
  });

  it("refuse une pièce absente et un format non accepté", async () => {
    const { photos, stockage, ajouter } = preparer();
    await expect(
      ajouter.executer({
        tenantId: TENANT,
        logementId: LOGEMENT,
        piece: " ",
        contentType: "image/jpeg",
        octets: OCTETS,
      }),
    ).rejects.toMatchObject({ code: "PHOTO_INVALIDE" });
    await expect(
      ajouter.executer({
        tenantId: TENANT,
        logementId: LOGEMENT,
        piece: "Cuisine",
        contentType: "application/pdf",
        octets: OCTETS,
      }),
    ).rejects.toMatchObject({ code: "PHOTO_INVALIDE" });
    expect(photos.photos).toHaveLength(0);
    expect(stockage.fichiers.size).toBe(0);
  });

  it("refuse au-delà de la contenance d'une pièce", async () => {
    const { photos, stockage, ajouter } = preparer();
    for (let index = 0; index < PHOTOS_REFERENCE_PAR_PIECE_MAX; index += 1) {
      await ajouter.executer({
        tenantId: TENANT,
        logementId: LOGEMENT,
        piece: "Cuisine",
        contentType: "image/jpeg",
        octets: OCTETS,
      });
    }

    await expect(
      ajouter.executer({
        tenantId: TENANT,
        logementId: LOGEMENT,
        piece: "Cuisine",
        contentType: "image/jpeg",
        octets: OCTETS,
      }),
    ).rejects.toMatchObject({ code: "PHOTO_INVALIDE" });
    expect(photos.photos).toHaveLength(PHOTOS_REFERENCE_PAR_PIECE_MAX);
    // Rien n'a été écrit pour la photo refusée.
    expect(stockage.fichiers.size).toBe(PHOTOS_REFERENCE_PAR_PIECE_MAX);

    // Une autre pièce reste ouverte.
    await expect(
      ajouter.executer({
        tenantId: TENANT,
        logementId: LOGEMENT,
        piece: "Séjour",
        contentType: "image/jpeg",
        octets: OCTETS,
      }),
    ).resolves.toMatchObject({ piece: "Séjour" });
  });

  it("supprime la photo et son fichier, refuse celle d'un autre logement", async () => {
    const { photos, stockage, ajouter, supprimer } = preparer();
    const photo = await ajouter.executer({
      tenantId: TENANT,
      logementId: LOGEMENT,
      piece: "Cuisine",
      contentType: "image/jpeg",
      octets: OCTETS,
    });

    await expect(
      supprimer.executer({
        tenantId: TENANT,
        logementId: "autre-logement",
        id: photo.id,
      }),
    ).rejects.toMatchObject({ code: "PHOTO_INVALIDE" });
    expect(photos.photos).toHaveLength(1);

    await supprimer.executer({
      tenantId: TENANT,
      logementId: LOGEMENT,
      id: photo.id,
    });
    expect(photos.photos).toHaveLength(0);
    expect(stockage.fichiers.has(photo.chemin)).toBe(false);
  });

  it("compare l'inventaire et les preuves pièce par pièce", async () => {
    const { photos, preuve, comparer } = preparer();
    photos.definir(TENANT, LOGEMENT, "Cuisine", "ref-cuisine");
    photos.definir(TENANT, LOGEMENT, "Sanitaires", "ref-sanitaires");
    await preuve.creer({
      tenantId: TENANT,
      menageId: MENAGE,
      logementId: LOGEMENT,
      ref: "photo-1",
      phase: "apres",
      piece: "Cuisine",
      chemin: "photo-1.jpg",
      contentType: "image/jpeg",
      tailleOctets: 10,
    });

    const comparaison = await comparer.executer(TENANT, MENAGE);

    // Pièces du ménage (Cuisine, Séjour) puis celles de l'inventaire seul.
    expect(comparaison.pieces.map((entree) => entree.piece)).toEqual([
      "Cuisine",
      "Séjour",
      "Sanitaires",
    ]);
    expect(comparaison.pieces[0]).toMatchObject({
      piece: "Cuisine",
      etat: "comparaison",
    });
    expect(comparaison.pieces[0]?.references).toHaveLength(1);
    expect(comparaison.pieces[0]?.preuves).toHaveLength(1);
    expect(comparaison.pieces[1]).toMatchObject({
      piece: "Séjour",
      etat: "vide",
    });
    expect(comparaison.pieces[2]).toMatchObject({
      piece: "Sanitaires",
      etat: "preuve_manquante",
    });
  });

  it("refuse la comparaison d'un ménage inconnu", async () => {
    const { comparer } = preparer();
    await expect(comparer.executer(TENANT, "inconnu")).rejects.toMatchObject({
      code: "MENAGE_INVALIDE",
    });
  });
});
