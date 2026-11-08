import { describe, expect, it } from "vitest";
import { EnregistrerFluxIcs } from "@/application/use-cases/enregistrer-flux-ics";
import { ErreurMetier } from "@/domain/erreurs";
import { FluxIcsRepositoryMemoire } from "../helpers/flux-ics-repository-memoire";

const tenantId = "11111111-1111-4111-8111-111111111111";
const logementId = "22222222-2222-4222-8222-222222222222";

describe("EnregistrerFluxIcs", () => {
  it("normalise une URL webcal en HTTPS", async () => {
    const repo = new FluxIcsRepositoryMemoire();
    const flux = await new EnregistrerFluxIcs(repo).executer({
      tenantId,
      logementId,
      libelle: "Airbnb",
      url: "webcal://www.airbnb.fr/calendar/ical/123.ics",
    });
    expect(flux.url).toBe("https://www.airbnb.fr/calendar/ical/123.ics");
  });

  it("refuse une URL non HTTPS ou locale", async () => {
    const repo = new FluxIcsRepositoryMemoire();
    const cas = new EnregistrerFluxIcs(repo);
    await expect(
      cas.executer({
        tenantId,
        logementId,
        libelle: "Airbnb",
        url: "http://www.airbnb.fr/calendar/ical/123.ics",
      }),
    ).rejects.toBeInstanceOf(ErreurMetier);
    await expect(
      cas.executer({
        tenantId,
        logementId,
        libelle: "Local",
        url: "https://127.0.0.1/calendar.ics",
      }),
    ).rejects.toBeInstanceOf(ErreurMetier);
  });
});
