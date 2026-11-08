import { afterEach, describe, expect, it, vi } from "vitest";

const resolveTxt = vi.fn();
vi.mock("node:dns/promises", () => ({ resolveTxt }));

const { verifierDnsTxt } = await import("@/lib/server/domaine-dns");

describe("verifierDnsTxt", () => {
  afterEach(() => {
    resolveTxt.mockReset();
    vi.useRealTimers();
  });

  it("accepte un jeton présent, même découpé en morceaux", async () => {
    resolveTxt.mockResolvedValueOnce([["lcd-verif", "ication-abc"]]);
    await expect(verifierDnsTxt("sejour.example.fr", "lcd-verification-abc")).resolves.toBe(
      true,
    );
    expect(resolveTxt).toHaveBeenCalledWith("_lcd-verification.sejour.example.fr");
  });

  it("tolère les espaces autour du jeton", async () => {
    resolveTxt.mockResolvedValueOnce([["  jeton-123  "]]);
    await expect(verifierDnsTxt("a.example.fr", "jeton-123")).resolves.toBe(true);
  });

  it("refuse un jeton différent", async () => {
    resolveTxt.mockResolvedValueOnce([["autre-jeton"]]);
    await expect(verifierDnsTxt("a.example.fr", "attendu")).resolves.toBe(false);
  });

  it("échoue fermé quand le DNS ne répond pas", async () => {
    resolveTxt.mockRejectedValueOnce(new Error("NXDOMAIN"));
    await expect(verifierDnsTxt("absent.example.fr", "jeton")).resolves.toBe(false);
  });

  it("échoue fermé au-delà du délai", async () => {
    vi.useFakeTimers();
    resolveTxt.mockReturnValueOnce(new Promise(() => {}));
    const promesse = verifierDnsTxt("lent.example.fr", "jeton");
    await vi.advanceTimersByTimeAsync(5_001);
    await expect(promesse).resolves.toBe(false);
  });
});
