import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

async function adapter() {
  vi.stubEnv("SMS_ENABLED", "true");
  vi.stubEnv("BREVO_API_KEY", "cle-test");
  vi.stubEnv("BREVO_SMS_SENDER", "LCD");
  vi.resetModules();
  return import("@/infrastructure/adapters/sms-brevo");
}

describe("adapter SMS Brevo", () => {
  it("poste le SMS transactionnel avec la clé API", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response("{}", { status: 201 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const { creerSmsBrevo, smsConfigured } = await adapter();
    expect(smsConfigured()).toBe(true);

    await creerSmsBrevo().envoyer({
      to: "+33612345678",
      text: "Votre logement sera prêt à 15 h.",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.brevo.com/v3/transactionalSMS/sms");
    expect((init.headers as Record<string, string>)["api-key"]).toBe(
      "cle-test",
    );
    expect(JSON.parse(String(init.body))).toEqual({
      sender: "LCD",
      recipient: "+33612345678",
      content: "Votre logement sera prêt à 15 h.",
      type: "transactional",
    });
  });

  it("remonte une erreur HTTP sans exposer le corps complet", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("refus fournisseur", { status: 401 }),
      ),
    );
    const { creerSmsBrevo } = await adapter();
    await expect(
      creerSmsBrevo().envoyer({ to: "+33612345678", text: "Test" }),
    ).rejects.toThrow(/Brevo SMS 401/);
  });

  it("refuse de créer l’adapter sans clé", async () => {
    vi.stubEnv("SMS_ENABLED", "false");
    vi.stubEnv("BREVO_API_KEY", "");
    vi.resetModules();
    const { creerSmsBrevo, smsConfigured } = await import(
      "@/infrastructure/adapters/sms-brevo"
    );
    expect(smsConfigured()).toBe(false);
    expect(() => creerSmsBrevo()).toThrow(/SMS désactivé/);
  });
});
