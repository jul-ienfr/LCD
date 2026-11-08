import { describe, expect, it } from "vitest";
import {
  normaliserAttribution,
  segmentAttribution,
  sourceValide,
} from "@/domain/attribution";

describe("attribution des réservations", () => {
  it("nettoie un segment UTM", () => {
    expect(segmentAttribution("Été 2026 !")).toBe("ete-2026");
    expect(segmentAttribution("   ")).toBeNull();
    expect(segmentAttribution("a".repeat(40))).toHaveLength(24);
  });

  it("privilégie le code promo", () => {
    expect(
      normaliserAttribution({
        codePromo: "ete-2026",
        utmSource: "instagram",
        widget: true,
      }),
    ).toBe("promo:ete-2026");
  });

  it("compose la source UTM", () => {
    expect(
      normaliserAttribution({
        utmSource: "Instagram",
        utmMedium: "cpc",
        utmCampaign: "Été",
      }),
    ).toBe("utm:instagram/cpc/ete");
    expect(normaliserAttribution({ utmSource: "newsletter" })).toBe(
      "utm:newsletter",
    );
  });

  it("retombe sur widget puis direct", () => {
    expect(normaliserAttribution({ widget: true })).toBe("widget");
    expect(normaliserAttribution({})).toBe("direct");
  });

  it("marque une réservation issue d'une demande de séjour", () => {
    expect(normaliserAttribution({ demandeRef: "DEM-0001" })).toBe(
      "demande:dem-0001",
    );
    expect(
      normaliserAttribution({ demandeRef: "DEM-1", utmSource: "instagram" }),
    ).toBe("utm:instagram");
  });

  it("valide les sources formatées", () => {
    expect(sourceValide("direct")).toBe(true);
    expect(sourceValide("widget")).toBe(true);
    expect(sourceValide("utm:instagram/cpc/ete")).toBe(true);
    expect(sourceValide("promo:ete-2026")).toBe(true);
    expect(sourceValide("demande:dem-0001")).toBe(true);
    expect(sourceValide("utm:Instagram")).toBe(false);
    expect(sourceValide("javascript:alert(1)")).toBe(false);
    expect(sourceValide("utm:a/b/c/d")).toBe(false);
  });
});
