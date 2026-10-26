import { describe, expect, it } from "vitest";
import type {
  EnregistrerPreferencesData,
  PreferencesSejourRepository,
} from "@/application/ports/preferences-sejour-repository";
import { EnregistrerPreferencesSejour } from "@/application/use-cases/preference-sejour";
import type { PreferencesSejour } from "@/domain/preference-sejour";
import { ReservationRepositoryMemoire } from "../helpers/reservation-repository-memoire";

class MemoirePreferences implements PreferencesSejourRepository {
  items: PreferencesSejour[] = [];

  async trouverParReservation(tenantId: string, reservationId: string) {
    return (
      this.items.find(
        (p) => p.tenantId === tenantId && p.reservationId === reservationId,
      ) ?? null
    );
  }

  async enregistrer(data: EnregistrerPreferencesData) {
    const existant = await this.trouverParReservation(
      data.tenantId,
      data.reservationId,
    );
    if (existant) {
      Object.assign(existant, data, { updatedAt: new Date() });
      return existant;
    }
    const preferences: PreferencesSejour = {
      id: crypto.randomUUID(),
      ...data,
      updatedAt: new Date(),
    };
    this.items.push(preferences);
    return preferences;
  }
}

async function preparer() {
  const reservations = new ReservationRepositoryMemoire();
  const reservation = await reservations.creer({
    tenantId: "t1",
    logementId: "l1",
    ref: "RESA-1",
    voyageurs: 2,
    debut: "2026-12-01",
    fin: "2026-12-05",
    montantCentimes: 50000,
  });
  const preferences = new MemoirePreferences();
  return {
    reservation,
    preferences,
    cas: new EnregistrerPreferencesSejour(preferences, reservations),
  };
}

const base = {
  tenantId: "t1",
  menageFrequenceJ: 7,
  lingeInclus: true,
  heureArrivee: "18:30",
  consignes: "Lit bébé dans la chambre.",
};

describe("cas d'usage préférences de séjour", () => {
  it("enregistre puis met à jour une réservation", async () => {
    const { reservation, preferences, cas } = await preparer();
    const cree = await cas.executer({
      ...base,
      reservationId: reservation.id,
    });
    expect(cree.menageFrequenceJ).toBe(7);
    expect(cree.heureArrivee).toBe("18:30");
    const maj = await cas.executer({
      ...base,
      reservationId: reservation.id,
      menageFrequenceJ: 0,
      lingeInclus: false,
    });
    expect(maj.id).toBe(cree.id);
    expect(maj.menageFrequenceJ).toBe(0);
    expect(maj.lingeInclus).toBe(false);
    expect(preferences.items).toHaveLength(1);
  });

  it("refuse une réservation inconnue", async () => {
    const { cas } = await preparer();
    await expect(
      cas.executer({ ...base, reservationId: "inconnu" }),
    ).rejects.toMatchObject({ code: "PREFERENCES_INVALIDES" });
  });

  it("refuse une heure invalide sans écrire", async () => {
    const { reservation, preferences, cas } = await preparer();
    await expect(
      cas.executer({
        ...base,
        reservationId: reservation.id,
        heureArrivee: "8h30",
      }),
    ).rejects.toMatchObject({ code: "PREFERENCES_INVALIDES" });
    expect(preferences.items).toHaveLength(0);
  });
});
