import { createInterface } from "node:readline";
import { traiterMessageMcp } from "../src/lib/server/mcp-lecture";

const baseUrl =
  process.env.LCD_API_URL?.trim() ||
  process.env.APP_URL?.trim() ||
  "http://127.0.0.1:5173";
const apiKey = process.env.LCD_API_KEY?.trim() ?? "";

if (!apiKey) {
  console.error(
    "LCD_API_KEY manquante. Créez une clé de lecture dans /hote/integrations/api.",
  );
  process.exit(1);
}

const client = { baseUrl, apiKey };
const lignes = createInterface({ input: process.stdin, crlfDelay: Infinity });

let file = Promise.resolve();

lignes.on("line", (ligne) => {
  const texte = ligne.trim();
  if (!texte) return;
  file = file.then(async () => {
    let message: unknown;
    try {
      message = JSON.parse(texte);
    } catch {
      process.stdout.write(
        `${JSON.stringify({
          jsonrpc: "2.0",
          id: null,
          error: { code: -32700, message: "JSON invalide." },
        })}\n`,
      );
      return;
    }
    const reponse = await traiterMessageMcp(message, client);
    if (reponse !== null) {
      process.stdout.write(`${JSON.stringify(reponse)}\n`);
    }
  });
});

lignes.on("close", () => {
  void file;
});
