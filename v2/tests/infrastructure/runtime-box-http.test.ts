import { createServer, type IncomingMessage, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { creerRuntimeBox } from "@/infrastructure/adapters/runtime-box-http";

let serveur: Server;
let baseUrl: string;
let derniereRequete: {
  url?: string;
  authorization?: string;
  corps?: string;
} = {};

async function lireCorps(requete: IncomingMessage): Promise<string> {
  const morceaux: Buffer[] = [];
  for await (const morceau of requete) {
    morceaux.push(Buffer.from(morceau));
  }
  return Buffer.concat(morceaux).toString("utf8");
}

beforeAll(async () => {
  serveur = createServer(async (requete, reponse) => {
    const corps = await lireCorps(requete);
    derniereRequete = {
      url: requete.url,
      authorization: requete.headers.authorization,
      corps,
    };

    if (requete.url === "/boom") {
      reponse.writeHead(500);
      reponse.end();
      return;
    }
    if (requete.url === "/api/services/light/turn_on") {
      reponse.writeHead(200);
      reponse.end();
      return;
    }
    if (requete.url === "/api/commands") {
      reponse.writeHead(204);
      reponse.end();
      return;
    }
    reponse.writeHead(200, { "Content-Type": "application/json" });
    reponse.end(JSON.stringify({ version: "1.2.3", message: "API running." }));
  });

  await new Promise<void>((resolve) => serveur.listen(0, "127.0.0.1", resolve));
  const adresse = serveur.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${adresse.port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve) => serveur.close(() => resolve()));
});

describe("runtime box HTTP", () => {
  it("lit l’état et envoie une commande générique", async () => {
    const box = creerRuntimeBox(
      JSON.stringify({ log1: { baseUrl, token: "secret" } }),
    );

    const etat = await box.etat("log1");
    expect(etat.enLigne).toBe(true);
    expect(etat.version).toBe("1.2.3");
    expect(derniereRequete.authorization).toBe("Bearer secret");

    await box.executer("log1", "allume", { entity_id: "light.salon" });
    expect(derniereRequete.url).toBe("/api/commands");
    expect(JSON.parse(derniereRequete.corps ?? "{}")).toEqual({
      commande: "allume",
      payload: { entity_id: "light.salon" },
    });
  });

  it("mappe une commande Home Assistant domaine.service", async () => {
    const box = creerRuntimeBox(
      JSON.stringify({
        log2: { type: "home_assistant", baseUrl, token: "ha" },
      }),
    );

    const etat = await box.etat("log2");
    expect(etat.enLigne).toBe(true);
    expect(derniereRequete.url).toBe("/api/");

    await box.executer("log2", "light.turn_on", {
      entity_id: "light.salon",
    });
    expect(derniereRequete.url).toBe("/api/services/light/turn_on");
    expect(JSON.parse(derniereRequete.corps ?? "{}")).toEqual({
      entity_id: "light.salon",
    });
  });

  it("refuse une box inconnue, un JSON invalide et une commande en erreur", async () => {
    const box = creerRuntimeBox(JSON.stringify({ log1: { baseUrl } }));
    await expect(box.etat("log-inconnu")).rejects.toThrow(/Box inconnue/);
    await expect(
      creerRuntimeBox("pas du json").etat("log1"),
    ).rejects.toThrow(/JSON valide/);

    const enErreur = creerRuntimeBox(
      JSON.stringify({
        log3: { baseUrl, commandPath: "/boom" },
      }),
    );
    await expect(
      enErreur.executer("log3", "test", {}),
    ).rejects.toThrow(/HTTP 500/);
  });
});
