import { afterEach, describe, expect, it, vi } from "vitest";
import { creerRecuperateurIcs } from "@/infrastructure/adapters/recuperateur-ics";

const ics = "BEGIN:VCALENDAR\nVERSION:2.0\nEND:VCALENDAR\n";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("recuperateur ICS", () => {
  it("récupère un flux HTTPS avec ETag et Last-Modified", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(ics, {
        status: 200,
        headers: {
          "content-type": "text/calendar",
          etag: '"abc"',
          "last-modified": "Sun, 25 Oct 2026 10:00:00 GMT",
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const reponse = await creerRecuperateurIcs().recuperer(
      "https://www.airbnb.fr/calendar/ical/123.ics",
      { etag: '"old"', derniereModification: "Sat, 24 Oct 2026 10:00:00 GMT" },
    );
    expect(reponse.texte).toContain("BEGIN:VCALENDAR");
    expect(reponse.etag).toBe('"abc"');
    expect(reponse.derniereModification).toBe(
      "Sun, 25 Oct 2026 10:00:00 GMT",
    );
    expect(fetchMock).toHaveBeenCalledOnce();
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(init.headers).toMatchObject({
      "If-None-Match": '"old"',
      "If-Modified-Since": "Sat, 24 Oct 2026 10:00:00 GMT",
    });
    expect(init.redirect).toBe("manual");
  });

  it("gère un 304 sans corps", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(null, {
          status: 304,
          headers: { etag: '"abc"' },
        }),
      ),
    );

    const reponse = await creerRecuperateurIcs().recuperer(
      "https://ical.booking.com/v1/export?t=abc",
    );
    expect(reponse.nonModifie).toBe(true);
    expect(reponse.texte).toBeNull();
    expect(reponse.statutHttp).toBe(304);
  });

  it("refuse une page HTML servie en 200", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("<html>maintenance</html>", {
          status: 200,
          headers: { "content-type": "text/html" },
        }),
      ),
    );

    await expect(
      creerRecuperateurIcs().recuperer(
        "https://www.airbnb.fr/calendar/ical/123.ics",
      ),
    ).rejects.toThrow("page HTML");
  });

  it("refuse un contenu qui n’est pas du iCalendar", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("pas un calendrier", {
          status: 200,
          headers: { "content-type": "text/plain" },
        }),
      ),
    );

    await expect(
      creerRecuperateurIcs().recuperer(
        "https://www.airbnb.fr/calendar/ical/123.ics",
      ),
    ).rejects.toThrow("VCALENDAR");
  });

  it("refuse une redirection vers une IP privée", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(null, {
        status: 302,
        headers: { location: "https://127.0.0.1/secret.ics" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      creerRecuperateurIcs().recuperer(
        "https://www.airbnb.fr/calendar/ical/123.ics",
      ),
    ).rejects.toThrow("non autorisée");
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("refuse un flux trop volumineux", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(ics, {
          status: 200,
          headers: {
            "content-type": "text/calendar",
            "content-length": "3000000",
          },
        }),
      ),
    );

    await expect(
      creerRecuperateurIcs().recuperer(
        "https://www.airbnb.fr/calendar/ical/123.ics",
      ),
    ).rejects.toThrow("trop volumineux");
  });

  it("réessaie une erreur 500 puis réussit", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("nope", { status: 500 }))
      .mockResolvedValueOnce(
        new Response(ics, {
          status: 200,
          headers: { "content-type": "text/calendar" },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const reponse = await creerRecuperateurIcs({ tentatives: 2 }).recuperer(
      "https://www.airbnb.fr/calendar/ical/123.ics",
    );
    expect(reponse.statutHttp).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("refuse une réponse HTTP en erreur définitive", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("nope", { status: 404 })),
    );

    await expect(
      creerRecuperateurIcs().recuperer(
        "https://www.airbnb.fr/calendar/ical/123.ics",
      ),
    ).rejects.toThrow("HTTP 404");
  });
});
