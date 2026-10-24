export interface EntreeIncidentOutbox {
  ref: string;
  token: string;
  message: string;
  createdAt: string;
}

const DB_NAME = "lcd-outbox";
const STORE = "incidents";
const VERSION = 1;

function indexedDbDisponible(): boolean {
  return typeof indexedDB !== "undefined";
}

function ouvrir(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!indexedDbDisponible()) {
      reject(new Error("IndexedDB indisponible."));
      return;
    }

    const requete = indexedDB.open(DB_NAME, VERSION);
    requete.onupgradeneeded = () => {
      const db = requete.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "ref" });
      }
    };
    requete.onsuccess = () => resolve(requete.result);
    requete.onerror = () => reject(requete.error);
  });
}

async function transaction<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await ouvrir();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const requete = operation(tx.objectStore(STORE));
    requete.onsuccess = () => resolve(requete.result);
    requete.onerror = () => reject(requete.error);
    tx.oncomplete = () => db.close();
    tx.onerror = () => reject(tx.error);
  });
}

export async function ajouterIncident(
  entree: EntreeIncidentOutbox,
): Promise<void> {
  await transaction("readwrite", (store) => store.put(entree));
}

export async function listerIncidents(): Promise<EntreeIncidentOutbox[]> {
  if (!indexedDbDisponible()) return [];
  return transaction("readonly", (store) => store.getAll());
}

export async function retirerIncident(ref: string): Promise<void> {
  await transaction("readwrite", (store) => store.delete(ref));
}

export async function compterIncidents(): Promise<number> {
  if (!indexedDbDisponible()) return 0;
  return transaction("readonly", (store) => store.count());
}

export async function rejouerIncidents(): Promise<{
  envoyes: number;
  restants: number;
}> {
  const entries = await listerIncidents();
  let envoyes = 0;

  for (const entree of entries) {
    try {
      const response = await fetch("/api/voyageur/incident", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          token: entree.token,
          ref: entree.ref,
          message: entree.message,
        }),
      });

      // 2xx = accepté ; 4xx = définitif (token/message invalide) : on retire.
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        await retirerIncident(entree.ref);
        if (response.ok) envoyes += 1;
      }
    } catch {
      // réseau/5xx : on garde pour un prochain essai
    }
  }

  return { envoyes, restants: await compterIncidents() };
}
