import { createHash, timingSafeEqual } from "node:crypto";

export function cronSecretValide(
  header: string | null,
  attendu: string | undefined,
): boolean {
  if (!attendu) return false;
  const recu = header?.replace(/^Bearer\s+/i, "").trim() ?? "";
  const a = createHash("sha256").update(recu).digest();
  const b = createHash("sha256").update(attendu).digest();
  return timingSafeEqual(a, b);
}
