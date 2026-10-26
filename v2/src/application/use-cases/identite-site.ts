import { ErreurMetier } from "@/domain/erreurs";
import {
  accentContrasteSuffisant,
  adresseContactValide,
  emailContactValide,
  nomMarqueValide,
  telephoneContactValide,
  urlLogoValide,
  type IdentiteSite,
} from "@/domain/identite-site";
import { marque } from "@/lib/branding";
import type { ParametresSiteRepository } from "../ports/parametres-site-repository";

const CLE_IDENTITE = "identite";

function texteOuNull(valeur: unknown, max = 500): string | null {
  if (typeof valeur !== "string") return null;
  const propre = valeur.trim();
  return propre && propre.length <= max ? propre : null;
}

function normaliser(valeur: unknown): IdentiteSite {
  const brut =
    valeur && typeof valeur === "object"
      ? (valeur as Record<string, unknown>)
      : {};
  const nomBrut = texteOuNull(brut.nom, 60);
  return {
    nom: nomBrut && nomMarqueValide(nomBrut) ? nomBrut : marque(),
    logoUrl:
      typeof brut.logoUrl === "string" && urlLogoValide(brut.logoUrl.trim())
        ? brut.logoUrl.trim()
        : null,
    emailContact:
      typeof brut.emailContact === "string" &&
      emailContactValide(brut.emailContact.trim())
        ? brut.emailContact.trim().toLowerCase()
        : null,
    telephoneContact:
      typeof brut.telephoneContact === "string" &&
      telephoneContactValide(brut.telephoneContact.trim())
        ? brut.telephoneContact.trim()
        : null,
    adresseContact: texteOuNull(brut.adresseContact, 200),
    accent:
      typeof brut.accent === "string" && /^#[0-9a-f]{6}$/i.test(brut.accent)
        ? brut.accent.toLowerCase()
        : null,
  };
}

export class LireIdentiteSite {
  constructor(private readonly repo: ParametresSiteRepository) {}

  async executer(): Promise<IdentiteSite> {
    try {
      const brut = await this.repo.lire(CLE_IDENTITE);
      return normaliser(brut ? JSON.parse(brut) : null);
    } catch {
      return normaliser(null);
    }
  }
}

export interface IdentiteSaisie {
  nom: string;
  logoUrl: string;
  emailContact: string;
  telephoneContact: string;
  adresseContact: string;
  accent: string;
}

export class EnregistrerIdentiteSite {
  constructor(private readonly repo: ParametresSiteRepository) {}

  async executer(saisie: IdentiteSaisie): Promise<IdentiteSite> {
    const nom = saisie.nom.trim();
    if (nom && !nomMarqueValide(nom)) {
      throw new ErreurMetier(
        "DESIGN_INVALIDE",
        "Le nom de marque doit contenir 2 à 60 caractères, sans chevrons.",
      );
    }
    const logoUrl = saisie.logoUrl.trim();
    if (logoUrl && !urlLogoValide(logoUrl)) {
      throw new ErreurMetier(
        "DESIGN_INVALIDE",
        "Logo invalide : utilisez une URL http(s) ou un chemin commençant par /.",
      );
    }
    const emailContact = saisie.emailContact.trim().toLowerCase();
    if (emailContact && !emailContactValide(emailContact)) {
      throw new ErreurMetier(
        "DESIGN_INVALIDE",
        "E-mail de contact invalide.",
      );
    }
    const telephoneContact = saisie.telephoneContact.trim();
    if (telephoneContact && !telephoneContactValide(telephoneContact)) {
      throw new ErreurMetier(
        "DESIGN_INVALIDE",
        "Téléphone de contact invalide (chiffres, espaces, +, -, parenthèses).",
      );
    }
    const adresseContact = saisie.adresseContact.trim();
    if (adresseContact && !adresseContactValide(adresseContact)) {
      throw new ErreurMetier(
        "DESIGN_INVALIDE",
        "Adresse de contact trop longue ou invalide.",
      );
    }
    const accent = saisie.accent.trim().toLowerCase();
    if (accent && !accentContrasteSuffisant(accent)) {
      throw new ErreurMetier(
        "DESIGN_INVALIDE",
        "Couleur d’accent trop claire : choisissez une teinte lisible avec du texte clair et sombre (contraste 4,5:1).",
      );
    }

    const identite: IdentiteSite = {
      nom,
      logoUrl: logoUrl || null,
      emailContact: emailContact || null,
      telephoneContact: telephoneContact || null,
      adresseContact: adresseContact || null,
      accent: accent || null,
    };
    await this.repo.ecrire(CLE_IDENTITE, JSON.stringify(identite));
    return normaliser(identite);
  }
}
