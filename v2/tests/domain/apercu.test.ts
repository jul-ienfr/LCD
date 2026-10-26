import { describe, expect, it } from "vitest";
import { roleApercuValide, ROLES_APERCU } from "@/domain/apercu";
import {
  signerApercu,
  verifierApercuValeur,
} from "@/lib/apercu-signature";

const SECRET = "a".repeat(40);
const MAINTENANT = 1_800_000_000;

function jeton(exp = MAINTENANT + 600) {
  return signerApercu(
    { email: "Owner@LCD.test", role: "comptable", exp },
    SECRET,
  );
}

describe("aperçu staff", () => {
  it("n'autorise que les rôles staff prévus", () => {
    expect(ROLES_APERCU).toEqual(["admin", "hote", "comptable"]);
    expect(roleApercuValide("comptable")).toBe(true);
    expect(roleApercuValide("super_admin")).toBe(false);
    expect(roleApercuValide("proprietaire")).toBe(false);
  });

  it("vérifie signature, expiration et propriétaire du cookie", () => {
    expect(
      verifierApercuValeur(jeton(), SECRET, {
        email: "owner@lcd.test",
        maintenant: MAINTENANT,
      }),
    ).toEqual({ email: "owner@lcd.test", role: "comptable", exp: MAINTENANT + 600 });
    expect(
      verifierApercuValeur(jeton(), SECRET, {
        email: "autre@lcd.test",
        maintenant: MAINTENANT,
      }),
    ).toBeNull();
    expect(
      verifierApercuValeur(jeton(MAINTENANT - 1), SECRET, {
        maintenant: MAINTENANT,
      }),
    ).toBeNull();
    expect(verifierApercuValeur(jeton(), "b".repeat(40), {
      maintenant: MAINTENANT,
    })).toBeNull();
  });

  it("rejette un jeton altéré ou un rôle injecté", () => {
    const valeur = jeton();
    expect(verifierApercuValeur(`${valeur}x`, SECRET)).toBeNull();
    expect(verifierApercuValeur("charge.signature", SECRET)).toBeNull();
    const faux = Buffer.from(
      JSON.stringify({
        email: "owner@lcd.test",
        role: "super_admin",
        exp: MAINTENANT + 600,
      }),
    ).toString("base64url");
    expect(verifierApercuValeur(`${faux}.${valeur.split(".")[1]}`, SECRET)).toBeNull();
  });
});
