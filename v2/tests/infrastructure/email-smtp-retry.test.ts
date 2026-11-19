import { describe, expect, it } from "vitest";
import { erreurSmtpTransitoire } from "@/infrastructure/adapters/email-smtp";

function erreurSmtp(detail: {
  code?: string;
  command?: string;
  responseCode?: number;
}): Error {
  return Object.assign(new Error("SMTP"), detail);
}

describe("classification des erreurs SMTP (FR-022)", () => {
  it("rejoue un refus temporaire 4xx du serveur", () => {
    expect(erreurSmtpTransitoire(erreurSmtp({ responseCode: 421 }))).toBe(true);
    expect(erreurSmtpTransitoire(erreurSmtp({ responseCode: 450 }))).toBe(true);
    expect(erreurSmtpTransitoire(erreurSmtp({ responseCode: 451 }))).toBe(true);
  });

  it("ne rejoue jamais un refus définitif 5xx", () => {
    expect(erreurSmtpTransitoire(erreurSmtp({ responseCode: 550 }))).toBe(false);
    expect(erreurSmtpTransitoire(erreurSmtp({ responseCode: 554 }))).toBe(false);
  });

  it("rejoue une connexion qui n'a jamais abouti", () => {
    expect(
      erreurSmtpTransitoire(
        erreurSmtp({ code: "ECONNECTION", command: "CONN" }),
      ),
    ).toBe(true);
    expect(
      erreurSmtpTransitoire(erreurSmtp({ code: "ETIMEDOUT", command: "CONN" })),
    ).toBe(true);
    expect(
      erreurSmtpTransitoire(erreurSmtp({ code: "ENOTFOUND", command: "EHLO" })),
    ).toBe(true);
  });

  it("ne rejoue pas une coupure pendant DATA (envoi peut-être partiel)", () => {
    expect(
      erreurSmtpTransitoire(erreurSmtp({ code: "ECONNRESET", command: "DATA" })),
    ).toBe(false);
    expect(
      erreurSmtpTransitoire(erreurSmtp({ code: "ESOCKET", command: "DATA" })),
    ).toBe(false);
  });

  it("ne rejoue pas une erreur inconnue", () => {
    expect(erreurSmtpTransitoire(new Error("boum"))).toBe(false);
    expect(erreurSmtpTransitoire("boum")).toBe(false);
    expect(
      erreurSmtpTransitoire(erreurSmtp({ code: "EUNKNOWN", command: "CONN" })),
    ).toBe(false);
  });
});
