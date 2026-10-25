import { afterEach, describe, expect, it, vi } from "vitest";
import { creerRecuperateurIcs } from "@/infrastructure/adapters/recuperateur-ics";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("recuperateur ICS", () => {
  it("récupère un flux HTTPS", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response("BEGIN:VCALENDAR\nEND:VCALENDAR", {
        status: 200,
        headers: { "content-type": "text/calendar" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const texte = await creerRecuperateurIcs().recuperer(
      "https://www.airbnb.fr/calendar/ical/123.ics",
    );
    expect(texte).toContain("BEGIN:VCALENDAR");
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("refuse une réponse HTTP en erreur", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("nope", { status: 500 })),
    );

    await expect(
      creerRecuperateurIcs().recuperer(
        "https://www.airbnb.fr/calendar/ical/123.ics",
      ),
    ).rejects.toThrow("HTTP 500");
  });

  it("refuse un flux trop volumineux", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("x", {
          status: 200,
          headers: { "content-length": "3000000" },
        }),
      ),
    );

    await expect(
      creerRecuperateurIcs().recuperer(
        "https://www.airbnb.fr/calendar/ical/123.ics",
      ),
    ).rejects.toThrow("trop volumineux");
  });
});
