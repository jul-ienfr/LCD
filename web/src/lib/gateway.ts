// lib/gateway.ts — client passerelle :8443 (lecture JSON + écritures 1-tap).
// Le navigateur ne parle JAMAIS à la gateway en direct : tout passe par les
// Server Actions / Route Handlers Next (clé = env serveur, jamais exposée).
// Sans JS : les <form action> POSTent en natif, le serveur relaye et re-rend.
const BASE =
  process.env.LCD_GATEWAY_URL?.replace(/\/+$/, "") || "http://127.0.0.1:8443";

// Source unique de l'allowlist (DRY, §20.2) : le chargeur plugins
// (scripts/valider-plugins.mjs) lit le MÊME fichier — un plugin ne peut
// jamais élargir ce que la gateway relaie, seulement le sous-utiliser.
import allowlist from "./allowlist.json";

export type Qui =
  | "personne_01"
  | "personne_02"
  | "personne_03"
  | "personne_04"
  | "personne_05"
  | "commercial_01";

// Allowlist stricte : le front ne relaie QUE ces routes (aucun proxy libre).
const LECTURE_OK = new Set(allowlist.lecture);
const ECRITURE_OK = new Set(allowlist.ecriture);

function cheminAutorise(path: string): boolean {
  const nu = path.split("?")[0];
  if (LECTURE_OK.has(nu) || ECRITURE_OK.has(nu)) return true;
  // Préfixes stricts (allowlist.json) : segment unique, pas de "..", pas de
  // sous-chemin — /parc/portail/<logement> (relevé proprio, lecture seule)
  // et /parc/annonces/<logement> (guide séjour V1).
  for (const p of allowlist.prefixes) {
    if (nu.startsWith(p)) {
      const seg = nu.slice(p.length);
      if (seg.length > 0 && !seg.includes("/") && seg !== "." && seg !== "..") return true;
    }
  }
  return false;
}

export async function gwGet<T>(path: string, init?: RequestInit): Promise<T> {
  if (!cheminAutorise(path)) throw new Error(`route non relayée : ${path}`);
  let r: Response;
  try {
    r = await fetch(`${BASE}${path}`, {
      ...init,
      cache: "no-store",
      headers: { accept: "application/json", ...(init?.headers || {}) },
    });
  } catch (e) {
    throw new Error(
      `gateway injoignable (${BASE}${path}) : ${e instanceof Error ? e.message : String(e)}`,
    );
  }
  const txt = await r.text();
  let obj: unknown = null;
  try {
    obj = txt ? JSON.parse(txt) : null;
  } catch {
    obj = { brut: txt.slice(0, 2000) };
  }
  if (!r.ok) {
    const err =
      typeof obj === "object" && obj !== null && "erreur" in obj
        ? String((obj as Record<string, unknown>).erreur)
        : `gateway ${r.status}`;
    throw new Error(err);
  }
  return obj as T;
}

export async function gwPost<T>(path: string, corps: unknown): Promise<T> {
  if (!ECRITURE_OK.has(path.split("?")[0]))
    throw new Error(`écriture non relayée : ${path}`);
  const r = await fetch(`${BASE}${path}`, {
    method: "POST",
    cache: "no-store",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(corps ?? {}),
  });
  const txt = await r.text();
  let obj: unknown = null;
  try {
    obj = txt ? JSON.parse(txt) : null;
  } catch {
    obj = { brut: txt.slice(0, 2000) };
  }
  if (!r.ok) {
    const err =
      typeof obj === "object" && obj !== null && "erreur" in obj
        ? String((obj as Record<string, unknown>).erreur)
        : `gateway ${r.status}`;
    throw new Error(err);
  }
  return obj as T;
}

// 14 actions 1-tap (miroir CIBLES gateway — libellés côté i18n).
export const ACTIONS = [
  { id: "resa", champs: ["debut", "fin", "voyageurs"] },
  { id: "confirmer", champs: [] },
  { id: "prix", champs: ["date", "prix"] },
  { id: "mission", champs: ["presta_id", "motif"] },
  { id: "cloture_menage", champs: ["dossier"] },
  { id: "facture_valider", champs: ["facture_id", "rubrique"] },
  { id: "payout", champs: ["canal", "montant", "date", "ref_resa"] },
  { id: "cloture_compta", champs: ["annee", "mois"] },
  { id: "debiter", champs: ["ref_resa", "montant", "justificatifs"] },
  { id: "restituer_caution", champs: ["ref_resa"] },
  { id: "doc_facture", champs: ["ref_resa", "b2b"] },
  { id: "doc_valider", champs: ["ref_resa", "type_doc"] },
  { id: "commande_extras", champs: ["ref_resa", "extras", "arrivee"] },
  { id: "sinistre_declarer", champs: ["motif", "description"] },
] as const;

export type ActionId = (typeof ACTIONS)[number]["id"];
