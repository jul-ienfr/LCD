import { createHmac } from "node:crypto";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function decoderBase32(secret: string): Buffer {
  const propre = secret.replace(/=+$/u, "").replace(/\s+/gu, "").toUpperCase();
  const octets: number[] = [];
  let valeur = 0;
  let bits = 0;

  for (const caractere of propre) {
    const index = ALPHABET.indexOf(caractere);
    if (index < 0) {
      throw new Error(`Secret TOTP invalide : caractère « ${caractere} ».`);
    }
    valeur = (valeur << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      octets.push((valeur >>> bits) & 0xff);
      valeur &= (1 << bits) - 1;
    }
  }

  return Buffer.from(octets);
}

export function codeTotp(secret: string, date = Date.now()): string {
  const compteur = Math.floor(date / 1000 / 30);
  const message = Buffer.alloc(8);
  message.writeBigUInt64BE(BigInt(compteur));

  const digest = createHmac("sha1", decoderBase32(secret))
    .update(message)
    .digest();
  const offset = (digest[digest.length - 1] ?? 0) & 0x0f;
  const code =
    (((digest[offset] ?? 0) & 0x7f) << 24 |
      (digest[offset + 1] ?? 0) << 16 |
      (digest[offset + 2] ?? 0) << 8 |
      (digest[offset + 3] ?? 0)) %
    1_000_000;

  return code.toString().padStart(6, "0");
}

export function secretDepuisUri(uri: string): string {
  const secret = new URL(uri).searchParams.get("secret");
  if (!secret) {
    throw new Error("URI TOTP sans secret.");
  }
  return secret;
}
