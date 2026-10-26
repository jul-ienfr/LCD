import { describe, expect, it } from "vitest";
import { cronSecretValide } from "@/lib/cron-secret";

describe("cronSecretValide", () => {
  it("accepte un Bearer exact", () => {
    expect(cronSecretValide("Bearer secret-123", "secret-123")).toBe(true);
    expect(cronSecretValide("secret-123", "secret-123")).toBe(true);
  });

  it("refuse un secret différent ou absent", () => {
    expect(cronSecretValide("Bearer autre", "secret-123")).toBe(false);
    expect(cronSecretValide(null, "secret-123")).toBe(false);
    expect(cronSecretValide("Bearer secret-123", undefined)).toBe(false);
  });
});
