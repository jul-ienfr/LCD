import { beforeEach, describe, expect, it } from "vitest";
import { AjouterPhotoPreuve } from "@/application/use-cases/ajouter-photo-preuve";
import type { MenagesRepository } from "@/application/ports/menages-repository";
import type {
  CreerPhotoPreuveData,
  PhotoPreuve,
  PhotoPreuveRepository,
} from "@/application/ports/photo-preuve-repository";
import type { StockageFichiers } from "@/application/ports/stockage";
import type { Menage } from "@/domain/menage";

const TENANT = "11111111-1111-4111-8111-111111111111";
const LOGEMENT = "22222222-2222-4222-8222-222222222222";
const MENAGE = "33333333-3333-4333-8333-333333333333";

function menage(): Menage {
  return {
    id: MENAGE,
    tenantId: TENANT,
    logementId: LOGEMENT,
    reservationId: null,
    ref: "MEN-0001",
    date: "2026-11-01",
    statut: "planifie",
    notes: "",
    score: null,
    coutCentimes: null,
    dureeMinutes: null,
    taches: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

class PhotosMemoire implements PhotoPreuveRepository {
  readonly photos: PhotoPreuve[] = [];

  async listerParMenage(_tenantId: string, menageId: string) {
    return this.photos.filter((photo) => photo.menageId === menageId);
  }

  async trouverParId(tenantId: string, id: string) {
    return (
      this.photos.find(
        (photo) => photo.tenantId === tenantId && photo.id === id,
      ) ?? null
    );
  }

  async totalOctetsParLogement(tenantId: string, logementId: string) {
    return this.photos
      .filter(
        (photo) =>
          photo.tenantId === tenantId && photo.logementId === logementId,
      )
      .reduce((somme, photo) => somme + photo.tailleOctets, 0);
  }

  async listerPlusAnciennes(tenantId: string, logementId: string) {
    return this.photos
      .filter(
        (photo) =>
          photo.tenantId === tenantId && photo.logementId === logementId,
      )
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
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

  async supprimer(tenantId: string, id: string) {
    const index = this.photos.findIndex(
      (photo) => photo.tenantId === tenantId && photo.id === id,
    );
    if (index < 0) return false;
    this.photos.splice(index, 1);
    return true;
  }
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
    return `/api/photos/${key}`;
  }

  async delete(key: string) {
    this.fichiers.delete(key);
  }
}

describe("ajout d’une photo de preuve", () => {
  let menages: MenagesRepository;
  let photos: PhotosMemoire;
  let stockage: StockageMemoire;
  let ajouter: AjouterPhotoPreuve;

  beforeEach(() => {
    menages = {
      trouverParId: async (tenantId: string, id: string) =>
        tenantId === TENANT && id === MENAGE ? menage() : null,
    } as unknown as MenagesRepository;
    photos = new PhotosMemoire();
    stockage = new StockageMemoire();
    ajouter = new AjouterPhotoPreuve(menages, photos, stockage);
  });

  it("valide, stocke et enregistre la photo", async () => {
    const octets = new Uint8Array([0xff, 0xd8, 0xff]);
    const resultat = await ajouter.executer({
      tenantId: TENANT,
      menageId: MENAGE,
      phase: "avant",
      contentType: "image/jpeg",
      octets,
    });

    expect(resultat.evincees).toBe(0);
    expect(resultat.photo.phase).toBe("avant");
    expect(resultat.photo.chemin).toMatch(
      new RegExp(`^${TENANT}/${LOGEMENT}/${MENAGE}/photo-.*\\.jpg$`),
    );
    expect(stockage.fichiers.get(resultat.photo.chemin)).toEqual(octets);
    expect(photos.photos).toHaveLength(1);
  });

  it("refuse un format non accepté", async () => {
    await expect(
      ajouter.executer({
        tenantId: TENANT,
        menageId: MENAGE,
        phase: "avant",
        contentType: "application/pdf",
        octets: new Uint8Array([1]),
      }),
    ).rejects.toMatchObject({ code: "PHOTO_INVALIDE" });
    expect(stockage.fichiers.size).toBe(0);
  });

  it("refuse un ménage inconnu", async () => {
    await expect(
      ajouter.executer({
        tenantId: TENANT,
        menageId: "inconnu",
        phase: "avant",
        contentType: "image/jpeg",
        octets: new Uint8Array([1]),
      }),
    ).rejects.toMatchObject({ code: "MENAGE_INVALIDE" });
  });

  it("évince les plus anciennes photos pour tenir le quota", async () => {
    const troisGo = 3 * 1024 * 1024 * 1024;
    for (const [index, phase] of ["avant", "apres", "avant"].entries()) {
      await photos.creer({
        tenantId: TENANT,
        menageId: MENAGE,
        logementId: LOGEMENT,
        ref: `ancienne-${index}`,
        phase: phase as "avant" | "apres",
        chemin: `ancienne-${index}.jpg`,
        contentType: "image/jpeg",
        tailleOctets: troisGo,
      });
      photos.photos[index]!.createdAt = new Date(2026, 0, index + 1);
    }
    for (const photo of photos.photos) {
      stockage.fichiers.set(photo.chemin, new Uint8Array([1]));
    }

    const resultat = await ajouter.executer({
      tenantId: TENANT,
      menageId: MENAGE,
      phase: "apres",
      contentType: "image/png",
      octets: new Uint8Array([1]),
    });

    expect(resultat.evincees).toBe(2);
    expect(photos.photos).toHaveLength(2);
    expect(stockage.fichiers.has("ancienne-0.jpg")).toBe(false);
    expect(stockage.fichiers.has("ancienne-1.jpg")).toBe(false);
    expect(stockage.fichiers.has("ancienne-2.jpg")).toBe(true);
  });
});
