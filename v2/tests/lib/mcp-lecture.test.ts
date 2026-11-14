import { describe, expect, it } from "vitest";
import {
  executerOutilMcp,
  listerOutilsMcp,
  traiterMessageMcp,
} from "@/lib/server/mcp-lecture";

const CLIENT = {
  baseUrl: "https://lcd.test/",
  apiKey: "lcd_secret_test",
};

function fetchJson(corps: unknown, statut = 200) {
  const appels: { url: string; init?: RequestInit }[] = [];
  const impl = (async (url: RequestInfo | URL, init?: RequestInit) => {
    appels.push({ url: String(url), init });
    return new Response(JSON.stringify(corps), {
      status: statut,
      headers: { "content-type": "application/json", "x-request-id": "req-1" },
    });
  }) as typeof fetch;
  return { impl, appels };
}

describe("serveur MCP lecture", () => {
  it("expose six outils en lecture seule avec des schémas stricts", () => {
    const outils = listerOutilsMcp();
    expect(outils.map((outil) => outil.name)).toEqual([
      "lister_logements",
      "lister_reservations",
      "lister_disponibilites",
      "lister_prix",
      "lister_proprietaires",
      "lister_releves",
    ]);
    for (const outil of outils) {
      expect(outil.description.length).toBeGreaterThan(0);
      expect(outil.inputSchema.type).toBe("object");
      expect(outil.inputSchema.additionalProperties).toBe(false);
    }
    const dispo = outils.find((outil) => outil.name === "lister_disponibilites");
    expect(dispo?.inputSchema.required).toEqual([
      "logementId",
      "debut",
      "fin",
    ]);
  });

  it("répond à initialize, ping et tools/list sans réseau", async () => {
    const init = (await traiterMessageMcp(
      { jsonrpc: "2.0", id: 1, method: "initialize", params: {} },
      CLIENT,
    )) as { result: { serverInfo: { name: string } } };
    expect(init.result.serverInfo.name).toBe("lcd-lecture");

    const ping = (await traiterMessageMcp(
      { jsonrpc: "2.0", id: 2, method: "ping" },
      CLIENT,
    )) as { result: Record<string, never> };
    expect(ping.result).toEqual({});

    const liste = (await traiterMessageMcp(
      { jsonrpc: "2.0", id: 3, method: "tools/list" },
      CLIENT,
    )) as { result: { tools: unknown[] } };
    expect(liste.result.tools).toHaveLength(6);
  });

  it("appelle l'API avec la clé et les filtres, puis formate le JSON", async () => {
    const espion = fetchJson({ data: [{ id: "log-1" }] });
    const resultat = await traiterMessageMcp(
      {
        jsonrpc: "2.0",
        id: 4,
        method: "tools/call",
        params: {
          name: "lister_reservations",
          arguments: {
            logementId: "log-1",
            debut: "2026-12-01",
            fin: "2026-12-07",
            page: 2,
          },
        },
      },
      { ...CLIENT, fetchImpl: espion.impl },
    );
    expect(espion.appels).toHaveLength(1);
    const url = new URL(espion.appels[0]!.url);
    expect(url.pathname).toBe("/api/v1/reservations");
    expect(url.searchParams.get("logementId")).toBe("log-1");
    expect(url.searchParams.get("debut")).toBe("2026-12-01");
    expect(url.searchParams.get("fin")).toBe("2026-12-07");
    expect(url.searchParams.get("page")).toBe("2");
    expect(espion.appels[0]!.init?.headers).toMatchObject({
      authorization: "Bearer lcd_secret_test",
    });
    const contenu = (resultat as { result: { content: { text: string }[] } })
      .result.content[0]!.text;
    expect(contenu).toContain('"id": "log-1"');
    expect(contenu).not.toContain("lcd_secret_test");
  });

  it("signale un argument requis absent sans appeler l'API", async () => {
    const espion = fetchJson({ data: [] });
    const resultat = await executerOutilMcp(
      "lister_disponibilites",
      { logementId: "log-1" },
      { ...CLIENT, fetchImpl: espion.impl },
    );
    expect(resultat.isError).toBe(true);
    expect(resultat.content[0]!.text).toContain("« debut » requis");
    expect(espion.appels).toHaveLength(0);
  });

  it("refuse un argument inconnu et une erreur HTTP sans fuite de corps", async () => {
    const inconnu = await executerOutilMcp(
      "lister_logements",
      { motDePasse: "x" },
      CLIENT,
    );
    expect(inconnu.isError).toBe(true);

    const espion = fetchJson({ erreur: { message: "secret interne" } }, 403);
    const refus = await executerOutilMcp(
      "lister_logements",
      {},
      { ...CLIENT, fetchImpl: espion.impl },
    );
    expect(refus.isError).toBe(true);
    expect(refus.content[0]!.text).toContain("403");
    expect(refus.content[0]!.text).toContain("req-1");
    expect(refus.content[0]!.text).not.toContain("secret interne");
  });

  it("ignore les notifications et rejette une méthode inconnue", async () => {
    expect(
      await traiterMessageMcp(
        { jsonrpc: "2.0", method: "notifications/initialized" },
        CLIENT,
      ),
    ).toBeNull();

    const inconnue = (await traiterMessageMcp(
      { jsonrpc: "2.0", id: 9, method: "tools/ecrire" },
      CLIENT,
    )) as { error: { code: number } };
    expect(inconnue.error.code).toBe(-32601);
  });
});
