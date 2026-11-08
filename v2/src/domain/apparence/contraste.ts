function composantes(hex: string): [number, number, number] {
  const propre = hex.replace("#", "");
  return [
    Number.parseInt(propre.slice(0, 2), 16),
    Number.parseInt(propre.slice(2, 4), 16),
    Number.parseInt(propre.slice(4, 6), 16),
  ];
}

function hex(r: number, g: number, b: number): string {
  return `#${[r, g, b]
    .map((valeur) =>
      Math.max(0, Math.min(255, Math.round(valeur)))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

export function couleurHexValide(valeur: string): boolean {
  return /^#[0-9a-f]{6}$/i.test(valeur);
}

export function melangerCouleur(
  base: string,
  cible: string,
  partCible: number,
): string {
  const [r1, g1, b1] = composantes(base);
  const [r2, g2, b2] = composantes(cible);
  return hex(
    r1 + (r2 - r1) * partCible,
    g1 + (g2 - g1) * partCible,
    b1 + (b2 - b1) * partCible,
  );
}

export function luminanceRelative(couleur: string): number {
  const [rouge, vert, bleu] = composantes(couleur).map((valeur) => {
    const canal = valeur / 255;
    return canal <= 0.03928
      ? canal / 12.92
      : ((canal + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * (rouge ?? 0) + 0.7152 * (vert ?? 0) + 0.0722 * (bleu ?? 0);
}

export function contraste(couleurA: string, couleurB: string): number {
  const a = luminanceRelative(couleurA);
  const b = luminanceRelative(couleurB);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

export function couleurSurAccent(accent: string): string {
  const clair = contraste(accent, "#ffffff");
  const sombre = contraste(accent, "#0b0e14");
  return clair >= sombre ? "#ffffff" : "#0b0e14";
}
