import { describe, expect, it } from "vitest";
import {
  creerChallengeCaptcha,
  verifierChallengeCaptcha,
} from "@/domain/captcha";

const SECRET = "secret-de-test-suffisamment-long-32";

function reponseDe(question: string): string {
  const nombres = question.match(/\d+/g)?.map(Number) ?? [];
  const [a, b] = nombres;
  if (a === undefined || b === undefined) throw new Error("question invalide");
  return String(question.includes("×") ? a * b : a + b);
}

describe("CAPTCHA auto-hébergé", () => {
  it("accepte la bonne réponse avec le bon nonce", () => {
    const challenge = creerChallengeCaptcha(SECRET);
    expect(
      verifierChallengeCaptcha({
        secret: SECRET,
        token: challenge.token,
        nonce: challenge.nonce,
        reponse: reponseDe(challenge.question),
      }),
    ).toBe(true);
  });

  it("refuse une mauvaise réponse", () => {
    const challenge = creerChallengeCaptcha(SECRET);
    const bonne = Number(reponseDe(challenge.question));
    expect(
      verifierChallengeCaptcha({
        secret: SECRET,
        token: challenge.token,
        nonce: challenge.nonce,
        reponse: String(bonne + 1),
      }),
    ).toBe(false);
  });

  it("refuse un jeton expiré", () => {
    const challenge = creerChallengeCaptcha(SECRET, Date.now() - 11 * 60 * 1000);
    expect(
      verifierChallengeCaptcha({
        secret: SECRET,
        token: challenge.token,
        nonce: challenge.nonce,
        reponse: reponseDe(challenge.question),
      }),
    ).toBe(false);
  });

  it("refuse un jeton altéré ou signé avec un autre secret", () => {
    const challenge = creerChallengeCaptcha(SECRET);
    const reponse = reponseDe(challenge.question);
    expect(
      verifierChallengeCaptcha({
        secret: "autre-secret",
        token: challenge.token,
        nonce: challenge.nonce,
        reponse,
      }),
    ).toBe(false);
    expect(
      verifierChallengeCaptcha({
        secret: SECRET,
        token: `${challenge.token}x`,
        nonce: challenge.nonce,
        reponse,
      }),
    ).toBe(false);
  });

  it("refuse un nonce qui ne correspond pas au cookie", () => {
    const challenge = creerChallengeCaptcha(SECRET);
    expect(
      verifierChallengeCaptcha({
        secret: SECRET,
        token: challenge.token,
        nonce: "nonce-inexistant",
        reponse: reponseDe(challenge.question),
      }),
    ).toBe(false);
  });

  it("ne place jamais la réponse en clair dans le jeton", () => {
    const challenge = creerChallengeCaptcha(SECRET);
    const reponse = reponseDe(challenge.question);
    const charge = Buffer.from(challenge.token.split(".")[0]!, "base64url").toString("utf8");
    expect(charge).not.toContain(`"${reponse}"`);
  });
});
