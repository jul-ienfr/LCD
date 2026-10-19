// lib/outbox.ts — file d'attente d'écritures hors-ligne (F4 §F8).
// Contrat : IndexedDB (par défaut), file PAR `ref` idempotente (la ref est
// la même que celle de la passerelle : rejeu sans doublon, le moteur dédupe),
// FIFO par horodatage, aucun framework. Le backend est injectable : la
// logique (dédup, ordre, retrait) est testée en unitaire sans navigateur.

export type EntreeOutbox = {
  ref: string; // ref idempotente (meme champ `ref` que le formulaire 1-tap)
  url: string; // URL de rejeu (la page qui porte le formulaire, POST MPA)
  champs: [string, string][]; // paires champ/valeur (FormData serialisee)
  ts: number; // horodatage d'envoi (ordre FIFO + affichage)
};

// Backend minimal (IndexedDB natif par defaut, memoire pour les tests).
export type BackendOutbox = {
  lire(): Promise<EntreeOutbox[]>;
  ecrire(entrees: EntreeOutbox[]): Promise<void>;
};

export function backendMemoire(): BackendOutbox {
  let copie: EntreeOutbox[] = [];
  return {
    lire: async () => copie.map((e) => ({ ...e })),
    ecrire: async (entrees) => {
      copie = entrees.map((e) => ({ ...e }));
    },
  };
}

// Dedup par ref (dernier etat gagne), ordre FIFO par ts.
export function fusionner(entrees: EntreeOutbox[], nouvelle: EntreeOutbox): EntreeOutbox[] {
  const sansDoublon = entrees.filter((e) => e.ref !== nouvelle.ref);
  return [...sansDoublon, nouvelle].sort((a, b) => a.ts - b.ts);
}

export class Outbox {
  constructor(private backend: BackendOutbox) {}

  async ajouter(entree: EntreeOutbox): Promise<void> {
    const entrees = await this.backend.lire();
    await this.backend.ecrire(fusionner(entrees, entree));
  }

  async lister(): Promise<EntreeOutbox[]> {
    return (await this.backend.lire()).sort((a, b) => a.ts - b.ts);
  }

  async retirer(ref: string): Promise<void> {
    const entrees = (await this.backend.lire()).filter((e) => e.ref !== ref);
    await this.backend.ecrire(entrees);
  }

  async compter(): Promise<number> {
    return (await this.backend.lire()).length;
  }

  async contient(ref: string): Promise<boolean> {
    return (await this.backend.lire()).some((e) => e.ref === ref);
  }
}

// Backend IndexedDB (navigateur) ; sans IndexedDB (mode prive) : memoire de
// session — la file vit alors le temps de la session, jamais silencieusement
// perdue dans un quota refuse : l'etat est affiche (bandeau).
export function backendNavigateur(nom = "lcd-outbox"): BackendOutbox {
  if (typeof indexedDB === "undefined") return backendMemoire();
  const ouvrir = (): Promise<IDBDatabase> =>
    new Promise((resolve, reject) => {
      const req = indexedDB.open(nom, 1);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains("ecritures")) {
          req.result.createObjectStore("ecritures", { keyPath: "ref" });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  return {
    async lire() {
      const db = await ouvrir();
      return new Promise<EntreeOutbox[]>((resolve, reject) => {
        const tx = db.transaction("ecritures", "readonly");
        const req = tx.objectStore("ecritures").getAll();
        req.onsuccess = () => resolve((req.result || []) as EntreeOutbox[]);
        req.onerror = () => reject(req.error);
      });
    },
    async ecrire(entrees) {
      const db = await ouvrir();
      return new Promise<void>((resolve, reject) => {
        const tx = db.transaction("ecritures", "readwrite");
        const magasin = tx.objectStore("ecritures");
        magasin.clear();
        for (const e of entrees) magasin.put(e);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    },
  };
}

export function outboxNavigateur(): Outbox {
  return new Outbox(backendNavigateur());
}

// Evenement de coordination (compteur du bandeau / message du formulaire).
export const EVENEMENT_OUTBOX = "lcd-outbox-chang";

export function signalerOutbox(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVENEMENT_OUTBOX));
  }
}
