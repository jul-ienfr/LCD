// lib/design.ts — LE CHOIX DE DESIGN, côté serveur (pas un cookie : le
// super_admin change l'apparence de TOUT le site, pour tous les visiteurs).
//
// Source de vérité : UN fichier de configuration runtime
// (`custom/design.yaml`, monté dans le conteneur web), à côté de
// `custom/acces.yaml`. Il n'est PAS versionné (état runtime, comme les
// registres lab) ; `custom/design.yaml.example` documente la forme et
// `custom/design.yaml` sert de repli tant qu'il n'existe pas.
//
// Pourquoi un fichier et pas l'env : changer l'env exige un redémarrage —
// le cahier dit « en quelques secondes ». Pourquoi pas un cookie : il ne
// suivrait que le navigateur du super_admin.
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { PROFILS } from "./profils";
import {
  DESIGN_DEFAUT,
  designParId,
  estDesignValide,
  type Design,
} from "./themes";

/** Chemin du fichier de choix (surchargeable pour les tests/batteries). */
export function fichierDesign(): string {
  const force = process.env.LCD_DESIGN_FICHIER?.trim();
  return force || join(process.cwd(), "custom", "design.yaml");
}

/** Id du design courant ; tout fichier absent, illisible ou invalide retombe
 *  sur le défaut — un design inconnu ne doit jamais casser une page. */
export function lireDesignId(): string {
  try {
    const texte = readFileSync(fichierDesign(), "utf8");
    const m = texte.match(/^\s*design:\s*([a-z0-9_-]+)\s*$/m);
    return m && estDesignValide(m[1]) ? m[1] : DESIGN_DEFAUT;
  } catch {
    return DESIGN_DEFAUT;
  }
}

/** Design courant (objet complet, jamais undefined). */
export function lireDesign(): Design {
  return designParId(lireDesignId()) ?? designParId(DESIGN_DEFAUT)!;
}

/**
 * Écrit le choix, atomiquement (tmp + rename) : une page rendue pendant
 * l'écriture ne lit jamais un fichier à moitié écrit.
 * Refuse un id inconnu (liste fermée : pas d'injection de CSS arbitraire).
 */
export function ecrireDesignId(id: string): { ok: boolean; erreur?: string } {
  if (!estDesignValide(id)) {
    return { ok: false, erreur: `design inconnu : ${id || "(vide)"}` };
  }
  const cible = fichierDesign();
  const contenu =
    `# Design du site — écrit par le dashboard super_admin (/systeme).\n` +
    `# Jamais édité à la main : le formulaire remplace ce fichier.\n` +
    `design: ${id}\n`;
  try {
    mkdirSync(dirname(cible), { recursive: true });
  } catch {
    /* le dossier du volume peut exister déjà et ne pas nous appartenir */
  }
  try {
    const tmp = `${cible}.${process.pid}.tmp`;
    writeFileSync(tmp, contenu, "utf8");
    renameSync(tmp, cible);
    return { ok: true };
  } catch (e) {
    // Écriture atomique impossible (typiquement : le dossier du bind mount
    // appartient à root, on ne peut pas y créer de fichier temporaire, mais
    // le fichier monté lui-même est inscriptible) → écriture directe.
    // Le contenu fait < 200 octets : une page concurrente ne peut pas lire
    // un fichier « à moitié » de façon durable, et le parseur retombe sur le
    // défaut en cas de doute.
    try {
      writeFileSync(cible, contenu, "utf8");
      return { ok: true };
    } catch (e2) {
      console.warn(
        "ecrireDesignId : écriture impossible",
        e instanceof Error ? e.message : e,
        e2 instanceof Error ? e2.message : e2,
      );
      return {
        ok: false,
        erreur: e2 instanceof Error ? e2.message : String(e2),
      };
    }
  }
}

/**
 * Garde d'autorisation : seul le super_admin RÉEL peut changer le design.
 * On lit `quiReel` (jamais `qui`) : un admin qui « voit comme » un
 * super_admin ne doit pas hériter du droit de re-thémer le site.
 */
export function peutChoisirDesign(quiReel: string): boolean {
  return PROFILS[quiReel]?.role === "super_admin";
}
