import { describe, expect, it } from "vitest";
import { extraireProprieteExterne } from "@/domain/webhook-fournisseur";

describe("extraireProprieteExterne", () => {
  it("lit les variantes property_id et propertyId", () => {
    expect(
      extraireProprieteExterne(JSON.stringify({ property_id: "prop-1" })),
    ).toBe("prop-1");
    expect(
      extraireProprieteExterne(
        JSON.stringify({ booking: { propertyId: 12345 } }),
      ),
    ).toBe("12345");
  });

  it("lit les identifiants d'appartement et d'hôtel imbriqués", () => {
    expect(
      extraireProprieteExterne(
        JSON.stringify({ data: { apartment: { apartment_id: "apt-9" } } }),
      ),
    ).toBe("apt-9");
    expect(
      extraireProprieteExterne(
        JSON.stringify({ event: "booking", hotelId: "hotel-4" }),
      ),
    ).toBe("hotel-4");
    expect(
      extraireProprieteExterne(
        JSON.stringify({ booking: { apartment: { id: 77 } } }),
      ),
    ).toBe("77");
  });

  it("retourne null pour un payload inconnu ou invalide", () => {
    expect(extraireProprieteExterne("{")).toBeNull();
    expect(extraireProprieteExterne(JSON.stringify({ id: "resa-1" }))).toBeNull();
    expect(extraireProprieteExterne(JSON.stringify({ property_id: "" }))).toBeNull();
  });

  it("ne descend pas indéfiniment", () => {
    let payload: Record<string, unknown> = { property_id: "profond" };
    for (let index = 0; index < 12; index += 1) payload = { enfant: payload };
    expect(extraireProprieteExterne(JSON.stringify(payload))).toBeNull();
  });
});
