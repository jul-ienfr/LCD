import {
  photosAEvincer,
  quotaPhotosDepasse,
  validerPhoto,
  type PhasePhoto,
} from "@/domain/photo-preuve";
import { ErreurMetier } from "@/domain/erreurs";
import type { MenagesRepository } from "../ports/menages-repository";
import type {
  PhotoPreuve,
  PhotoPreuveRepository,
} from "../ports/photo-preuve-repository";
import type { StockageFichiers } from "../ports/stockage";

export interface AjouterPhotoPreuveInput {
  tenantId: string;
  menageId: string;
  phase: string;
  contentType: string;
  octets: Uint8Array;
}

export interface ResultatAjoutPhoto {
  photo: PhotoPreuve;
  evincees: number;
}

export class AjouterPhotoPreuve {
  constructor(
    private readonly menages: MenagesRepository,
    private readonly photos: PhotoPreuveRepository,
    private readonly stockage: StockageFichiers,
  ) {}

  async executer(input: AjouterPhotoPreuveInput): Promise<ResultatAjoutPhoto> {
    const menage = await this.menages.trouverParId(
      input.tenantId,
      input.menageId,
    );
    if (!menage) {
      throw new ErreurMetier("MENAGE_INVALIDE", "Ménage introuvable.");
    }

    const { contentType, extension } = validerPhoto({
      contentType: input.contentType,
      taille: input.octets.byteLength,
    });
    if (input.phase !== "avant" && input.phase !== "apres") {
      throw new ErreurMetier("PHOTO_INVALIDE", "Phase de photo inconnue.");
    }
    const phase: PhasePhoto = input.phase;

    const total = await this.photos.totalOctetsParLogement(
      input.tenantId,
      menage.logementId,
    );
    let evincees = 0;
    if (quotaPhotosDepasse(total, input.octets.byteLength)) {
      const anciennes = await this.photos.listerPlusAnciennes(
        input.tenantId,
        menage.logementId,
      );
      const aEvincer = photosAEvincer(anciennes, input.octets.byteLength);
      for (const id of aEvincer) {
        const victime = anciennes.find((photo) => photo.id === id);
        if (!victime) continue;
        await this.stockage.delete(victime.chemin).catch(() => undefined);
        if (await this.photos.supprimer(input.tenantId, victime.id)) {
          evincees += 1;
        }
      }
    }

    const ref = `photo-${crypto.randomUUID()}`;
    const chemin = `${input.tenantId}/${menage.logementId}/${menage.id}/${ref}.${extension}`;
    await this.stockage.put(chemin, input.octets, contentType);

    try {
      const photo = await this.photos.creer({
        tenantId: input.tenantId,
        menageId: menage.id,
        logementId: menage.logementId,
        ref,
        phase,
        chemin,
        contentType,
        tailleOctets: input.octets.byteLength,
      });
      return { photo, evincees };
    } catch (erreur) {
      await this.stockage.delete(chemin).catch(() => undefined);
      throw erreur;
    }
  }
}
