import { createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";

export interface ChallengeCaptcha {
  question: string;
  token: string;
  nonce: string;
  expireLe: number;
}

const DUREE_MS = 10 * 60 * 1000;

function base64url(valeur: string): string {
  return Buffer.from(valeur, "utf8").toString("base64url");
}

function depuisBase64url(valeur: string): string {
  return Buffer.from(valeur, "base64url").toString("utf8");
}

function signer(secret: string, charge: string): string {
  return createHmac("sha256", secret).update(charge).digest("base64url");
}

function empreinteReponse(
  secret: string,
  nonce: string,
  reponse: string,
): string {
  return createHmac("sha256", secret)
    .update(`captcha:${nonce}:${reponse.trim()}`)
    .digest("base64url");
}

function egalConstant(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

/**
 * CAPTCHA arithmétique auto-hébergé : aucune dépendance externe, aucun
 * traceur, lisible sans JavaScript. La réponse n'est jamais dans le jeton :
 * seul son HMAC (lié au nonce et au secret serveur) y figure.
 */
export function creerChallengeCaptcha(
  secret: string,
  maintenant: number = Date.now(),
): ChallengeCaptcha {
  const a = randomInt(2, 10);
  const b = randomInt(2, 10);
  const multiplication = randomInt(0, 2) === 0;
  const resultat = multiplication ? a * b : a + b;
  const nonce = randomBytes(16).toString("base64url");
  const expireLe = maintenant + DUREE_MS;
  const charge = base64url(
    JSON.stringify({
      v: 1,
      q: `${a} ${multiplication ? "×" : "+"} ${b}`,
      e: expireLe,
      n: nonce,
      h: empreinteReponse(secret, nonce, String(resultat)),
    }),
  );

  return {
    question: `Combien font ${a} ${multiplication ? "×" : "+"} ${b} ?`,
    token: `${charge}.${signer(secret, charge)}`,
    nonce,
    expireLe,
  };
}

export function verifierChallengeCaptcha(input: {
  secret: string;
  token: string;
  nonce: string;
  reponse: string;
  maintenant?: number;
}): boolean {
  const maintenant = input.maintenant ?? Date.now();
  const [charge, signature, ...reste] = input.token.split(".");
  if (!charge || !signature || reste.length > 0) return false;
  if (!egalConstant(signature, signer(input.secret, charge))) return false;

  let payload: { q?: unknown; e?: unknown; n?: unknown; h?: unknown };
  try {
    payload = JSON.parse(depuisBase64url(charge));
  } catch {
    return false;
  }
  if (
    typeof payload.e !== "number" ||
    typeof payload.n !== "string" ||
    typeof payload.h !== "string"
  ) {
    return false;
  }
  if (payload.e < maintenant) return false;
  if (!egalConstant(payload.n, input.nonce)) return false;

  return egalConstant(
    payload.h,
    empreinteReponse(input.secret, payload.n, input.reponse),
  );
}
