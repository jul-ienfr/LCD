import { APP_VERSION } from "@/lib/version";

/**
 * Version réellement déployée : `LCD_VERSION` est injecté au démarrage par le
 * script de déploiement (tag git ou commit). `APP_VERSION` reste le repli pour
 * un build local ou une exécution hors script.
 */
export const versionDeployee = (): string =>
  process.env.LCD_VERSION?.trim() || APP_VERSION;
