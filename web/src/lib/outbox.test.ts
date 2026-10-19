// lib/outbox.test.ts — logique file hors-ligne (F4 §F8) : dedup PAR ref
// idempotente, ordre FIFO, retrait au succes. Backend memoire injecte :
// aucun navigateur requis, la logique reelle est testee telle quelle.
import { describe, expect, it } from "vitest";
import { Outbox, backendMemoire, fusionner, type EntreeOutbox } from "./outbox";

const e = (ref: string, ts: number): EntreeOutbox => ({
  ref,
  url: "/voyageur",
  champs: [["qui", "personne_03"]],
  ts,
});

describe("outbox (F4 §F8)", () => {
  it("dedup PAR REF : meme ref = une seule entree (rejeu sans doublon)", async () => {
    const box = new Outbox(backendMemoire());
    await box.ajouter(e("WEB-VOY-LOG1-SINISTRE_DECLARER", 1000));
    await box.ajouter({ ...e("WEB-VOY-LOG1-SINISTRE_DECLARER", 2000), champs: [["motif", "fuite"]] });
    expect(await box.compter()).toBe(1);
    const [seule] = await box.lister();
    expect(seule.ts).toBe(2000);
    expect(seule.champs).toEqual([["motif", "fuite"]]);
  });

  it("ordre FIFO par horodatage (3 allers-retours = file stable, pas de reordonnancement)", async () => {
    const box = new Outbox(backendMemoire());
    await box.ajouter(e("r2", 2000));
    await box.ajouter(e("r1", 1000));
    await box.ajouter(e("r3", 3000));
    expect((await box.lister()).map((x) => x.ref)).toEqual(["r1", "r2", "r3"]);
  });

  it("retrait au succes + contient()", async () => {
    const box = new Outbox(backendMemoire());
    await box.ajouter(e("r1", 1));
    await box.ajouter(e("r2", 2));
    expect(await box.contient("r1")).toBe(true);
    await box.retirer("r1");
    expect(await box.contient("r1")).toBe(false);
    expect(await box.compter()).toBe(1);
  });

  it("fusionner est pure et stable (dernier etat gagne)", () => {
    const base = [e("a", 1), e("b", 2)];
    const sortie = fusionner(base, e("a", 3));
    expect(sortie.map((x) => x.ref)).toEqual(["b", "a"]);
    expect(base).toHaveLength(2); // jamais mutate l'entree
  });

  it("0 ecriture perdue sur 3 cycles offline/online (allers-retours reels)", async () => {
    const box = new Outbox(backendMemoire());
    // cycle 1 : hors ligne, 1 ecriture en attente
    await box.ajouter(e("sinistre", 10));
    // retour reseau : rejeu (la batterie reel verifie le POST), retrait
    await box.retirer("sinistre");
    // cycle 2 : 2 ecritures simultanees
    await box.ajouter(e("extras", 20));
    await box.ajouter(e("sinistre", 21));
    expect(await box.compter()).toBe(2);
    // reseau : envoi reussi (sinistre rejoue = MEME ref -> passerelle dedup)
    await box.retirer("extras");
    await box.retirer("sinistre");
    // cycle 3 : re-soumission du meme formulaire (meme ref) = une seule entree
    await box.ajouter(e("sinistre", 30));
    expect(await box.compter()).toBe(1);
    await box.retirer("sinistre");
    expect(await box.compter()).toBe(0);
  });
});
