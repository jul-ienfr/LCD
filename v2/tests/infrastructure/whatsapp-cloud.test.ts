import { describe, expect, it } from "vitest";
import { ErreurMetier } from "@/domain/erreurs";
import {
  creerWhatsAppCloud,
  normaliserNumeroWhatsApp,
} from "@/infrastructure/adapters/whatsapp-cloud";

function fetchEspion(corps: unknown, statut = 200) {
  const appels: { url: string; init?: RequestInit }[] = [];
  const impl = (async (url: RequestInfo | URL, init?: RequestInit) => {
    appels.push({ url: String(url), init });
    return new Response(JSON.stringify(corps), {
      status: statut,
      headers: { "content-type": "application/json" },
    });
  }) as typeof fetch;
  return { impl, appels };
}

function creer(fetchImpl: typeof fetch) {
  return creerWhatsAppCloud({
    token: "jeton-test",
    phoneNumberId: "123456",
    fetchImpl,
    baseUrl: "https://graph.test/v21.0",
  });
}

describe("adapter WhatsApp Cloud", () => {
  it("normalise un numéro international", () => {
    expect(normaliserNumeroWhatsApp("+33 6 12 34 56 78")).toBe("+33612345678");
    expect(normaliserNumeroWhatsApp("+33 (0)6-12-34-56-78")).toBe(
      "+330612345678",
    );
  });

  it("refuse un numéro non international", () => {
    expect(() => normaliserNumeroWhatsApp("06 12 34 56 78")).toThrow(
      ErreurMetier,
    );
    expect(() => normaliserNumeroWhatsApp("+12")).toThrow(/international/);
  });

  it("envoie le texte avec le jeton et le numéro d'expéditeur", async () => {
    const espion = fetchEspion({ messages: [{ id: "wamid.42" }] });
    const whatsapp = creer(espion.impl);

    const resultat = await whatsapp.envoyer({
      to: "+33 6 12 34 56 78",
      text: "  Bonjour Camille.  ",
    });

    expect(resultat).toEqual({ externalId: "wamid.42" });
    expect(espion.appels).toHaveLength(1);
    expect(espion.appels[0]!.url).toBe(
      "https://graph.test/v21.0/123456/messages",
    );
    expect(espion.appels[0]!.init?.headers).toMatchObject({
      authorization: "Bearer jeton-test",
    });
    const corps = JSON.parse(String(espion.appels[0]!.init?.body));
    expect(corps).toMatchObject({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: "+33612345678",
      type: "text",
      text: { preview_url: false, body: "Bonjour Camille." },
    });
  });

  it("traduit un refus Meta en erreur métier sans fuite du jeton", async () => {
    const espion = fetchEspion(
      { error: { message: "Recipient not in allowed list", code: 131030 } },
      400,
    );
    const whatsapp = creer(espion.impl);

    await expect(
      whatsapp.envoyer({ to: "+33612345678", text: "Bonjour." }),
    ).rejects.toThrow(/400.*allowed list/);
    await expect(
      whatsapp.envoyer({ to: "+33612345678", text: "Bonjour." }),
    ).rejects.not.toThrow(/jeton-test/);
  });

  it("refuse un message vide sans appeler Meta", async () => {
    const espion = fetchEspion({ messages: [{ id: "x" }] });
    const whatsapp = creer(espion.impl);

    await expect(
      whatsapp.envoyer({ to: "+33612345678", text: "   " }),
    ).rejects.toThrow(/vide/);
    expect(espion.appels).toHaveLength(0);
  });
});
