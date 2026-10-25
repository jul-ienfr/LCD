import { describe, expect, it } from "vitest";
import {
  evenementWebhookValide,
  libelleWebhookValide,
  secretWebhookValide,
  urlWebhookValide,
} from "@/domain/webhook";

describe("webhook", () => {
  it("accepte une URL HTTPS publique", () => {
    expect(urlWebhookValide("https://ha.example.com/api/webhook")).toBe(true);
    expect(urlWebhookValide("https://moli.example.fr/hooks/lcd")).toBe(true);
  });

  it("refuse HTTP, localhost et IP privées", () => {
    expect(urlWebhookValide("http://ha.example.com/hook")).toBe(false);
    expect(urlWebhookValide("https://localhost/hook")).toBe(false);
    expect(urlWebhookValide("https://127.0.0.1/hook")).toBe(false);
    expect(urlWebhookValide("https://192.168.1.2/hook")).toBe(false);
    expect(urlWebhookValide("https://box.local/hook")).toBe(false);
    expect(urlWebhookValide("pas une url")).toBe(false);
  });

  it("valide les événements, secrets et libellés", () => {
    expect(evenementWebhookValide("reservation.created")).toBe(true);
    expect(evenementWebhookValide("inconnu")).toBe(false);
    expect(secretWebhookValide("0123456789abcdef")).toBe(true);
    expect(secretWebhookValide("court")).toBe(false);
    expect(libelleWebhookValide("Home Assistant")).toBe(true);
    expect(libelleWebhookValide("A")).toBe(false);
  });
});
