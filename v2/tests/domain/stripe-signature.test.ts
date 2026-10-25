import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifierSignatureStripe } from "@/infrastructure/adapters/paiement-stripe";

const secret = "whsec_test_123456789";

function signer(payload: string, timestamp: number): string {
  const signature = createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`)
    .digest("hex");
  return `t=${timestamp},v1=${signature}`;
}

describe("signature Stripe", () => {
  it("accepte une signature valide", () => {
    const payload = '{"id":"evt_1"}';
    const maintenant = 1_700_000_000_000;
    const signature = signer(payload, Math.floor(maintenant / 1000));
    expect(
      verifierSignatureStripe(payload, signature, secret, 300, maintenant),
    ).toBe(true);
  });

  it("refuse un payload altéré", () => {
    const maintenant = 1_700_000_000_000;
    const signature = signer('{"id":"evt_1"}', Math.floor(maintenant / 1000));
    expect(
      verifierSignatureStripe(
        '{"id":"evt_2"}',
        signature,
        secret,
        300,
        maintenant,
      ),
    ).toBe(false);
  });

  it("refuse une signature trop ancienne", () => {
    const payload = '{"id":"evt_1"}';
    const signature = signer(payload, 1_600_000_000);
    expect(
      verifierSignatureStripe(payload, signature, secret, 300, 1_700_000_000_000),
    ).toBe(false);
  });

  it("accepte une signature parmi plusieurs", () => {
    const payload = '{"id":"evt_1"}';
    const maintenant = 1_700_000_000_000;
    const timestamp = Math.floor(maintenant / 1000);
    const valide = signer(payload, timestamp);
    expect(
      verifierSignatureStripe(
        payload,
        `t=${timestamp},v1=deadbeef,${valide.split(",")[1]}`,
        secret,
        300,
        maintenant,
      ),
    ).toBe(true);
  });

  it("refuse une signature mal formée", () => {
    expect(verifierSignatureStripe("{}", "nimportequoi", secret)).toBe(false);
  });
});
