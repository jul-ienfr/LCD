// Flags de fonctionnalité : permettent d'activer un changement sans deploy
// et de revenir en arrière. En production, la source pourra être la DB ou env.
export const FEATURE_FLAGS = {
  multiTenant: true,
  pwa: true,
  stripe: false,
  llm: false,
  moli: false,
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;

export function estActif(flag: FeatureFlag): boolean {
  return FEATURE_FLAGS[flag];
}
