// app/actions.ts — Server Actions : relaient vers la passerelle, re-rendent.
// Formulaires natifs <form action> : fonctionnent SANS JavaScript (POST natif).
// Avec JS : React améliore (pending), sans JS : ça marche quand même.
"use server";

import { redirect } from "next/navigation";
import { gwGet, gwPost } from "@/lib/gateway";
import { cookies } from "next/headers";

export async function choisirLangueAction(formData: FormData) {
  const lang = String(formData.get("lang") || "fr").slice(0, 2);
  const jar = await cookies();
  jar.set("lcd_lang", lang, { path: "/", maxAge: 365 * 24 * 3600 });
  redirect(`/?lang=${encodeURIComponent(lang)}`);
}

// Connexion SIMULÉE (lab) : on choisit un compte humain déclaré dans la
// gateway (custom/acces.yaml) et on le mémorise en cookie httpOnly. C'est ce
// `qui` qui pré-remplit les formulaires 1-tap — la gateway REVÉRIFIE toujours
// l'autorisation (ce cookie ne prouve rien côté serveur : RBAC réel = gateway).
const COMPTES: Record<string, string> = {
  personne_01: "/hote",
  personne_02: "/hote",
  personne_03: "/hote",
  personne_04: "/hote",
  personne_05: "/proprio?logement=log1&qui=personne_05",
  commercial_01: "/commercial",
};

export async function loginAction(formData: FormData) {
  const qui = String(formData.get("qui") || "").trim();
  const jar = await cookies();
  const cible = COMPTES[qui];
  if (!cible) redirect("/login?erreur=inconnu");
  jar.set("lcd_qui", qui, {
    path: "/",
    maxAge: 30 * 24 * 3600,
    httpOnly: true,
    sameSite: "lax",
  });
  redirect(cible);
}

export async function logoutAction() {
  (await cookies()).delete("lcd_qui");
  redirect("/login?erreur=deconnexion");
}

async function quiParDefaut(): Promise<string> {
  return (await cookies()).get("lcd_qui")?.value || "";
}

export type ResultatAction = { ok: boolean; message: string };

export async function executerAction(
  prev: ResultatAction | null,
  formData: FormData,
): Promise<ResultatAction> {
  const box_id = String(formData.get("box_id") || "").trim();
  const logement_id = String(formData.get("logement_id") || "").trim();
  const action = String(formData.get("action") || "").trim();
  const qui =
    String(formData.get("qui") || "").trim() || (await quiParDefaut());
  if (!box_id || !logement_id || !action || !qui)
    return { ok: false, message: "box, logement, action et qui sont requis." };
  const data: Record<string, string> = {};
  for (const [k, v] of formData.entries()) {
    const cle = String(k);
    if (["box_id", "logement_id", "action", "qui", "ref"].includes(cle))
      continue;
    const val = String(v).trim();
    if (val !== "") data[cle] = val;
  }
  const ref =
    String(formData.get("ref") || "").trim() ||
    `WEB-${Date.now().toString(36).toUpperCase()}`;
  try {
    const rep = await gwPost<Record<string, unknown>>("/v1/action", {
      box_id,
      logement_id,
      action,
      qui,
      ref,
      data,
    });
    const code = Number(rep.moteur_code ?? 200);
    if (code >= 200 && code < 300)
      return { ok: true, message: `Relayé (${action}, ref ${ref}).` };
    return { ok: false, message: `Moteur ${code} : ${JSON.stringify(rep.reponse ?? rep).slice(0, 300)}` };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Échec relai." };
  }
}

export async function creerProspect(
  prev: ResultatAction | null,
  formData: FormData,
): Promise<ResultatAction> {
  const qui =
    String(formData.get("qui") || "").trim() || (await quiParDefaut());
  const data: Record<string, string> = {};
  for (const k of ["prospect_id", "nom", "bien", "source", "contact_ref"]) {
    const v = String(formData.get(k) || "").trim();
    if (v) data[k] = v;
  }
  if (!qui || !data.prospect_id)
    return { ok: false, message: "qui + prospect_id requis." };
  try {
    await gwPost("/v1/prospects", { qui, data });
    return { ok: true, message: `Prospect ${data.prospect_id} créé.` };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Échec." };
  }
}

export async function calculerSimulateur(
  prev: ResultatAction | null,
  formData: FormData,
): Promise<ResultatAction> {
  const corps: Record<string, unknown> = {
    qui:
      String(formData.get("qui") || "").trim() || (await quiParDefaut()),
    entite_id: String(formData.get("entite_id") || "").trim(),
  };
  const forfait = String(formData.get("forfait") || "").trim();
  if (forfait) corps.forfait = forfait;
  for (const k of ["adr", "occupation_pct", "nuits_an", "commission_pct", "plateforme_pct"]) {
    const v = String(formData.get(k) || "").trim();
    if (v !== "") corps[k] = Number(v);
  }
  try {
    const rep = await gwPost<Record<string, unknown>>("/v1/simulateur", corps);
    return { ok: true, message: `Indicatif : ${JSON.stringify(rep).slice(0, 400)}` };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Échec." };
  }
}

export async function testerLlm(
  prev: ResultatAction | null,
  formData: FormData,
): Promise<ResultatAction> {
  try {
    const rep = await gwPost<Record<string, unknown>>("/v1/llm-tester", {
      qui:
        String(formData.get("qui") || "").trim() || (await quiParDefaut()),
      usage: String(formData.get("usage") || "").trim(),
      prompt: String(formData.get("prompt") || ""),
    });
    return { ok: true, message: `Dry-run : ${JSON.stringify(rep).slice(0, 400)}` };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Échec." };
  }
}

// Offre commerciale (§14.5 scope strict) : génère le TEXTE d'offre à partir
// d'un prospect réel + une simulation optionnelle. Lecture de la base F.
export async function offreGenerer(
  prev: ResultatAction | null,
  formData: FormData,
): Promise<ResultatAction> {
  const qui =
    String(formData.get("qui") || "").trim() || (await quiParDefaut());
  const prospect_id = String(formData.get("prospect_id") || "").trim();
  const simBrut = String(formData.get("simulation") || "").trim();
  if (!prospect_id) return { ok: false, message: "prospect_id requis." };
  let simulation: Record<string, unknown> = {};
  if (simBrut) {
    try {
      const p = JSON.parse(simBrut);
      if (p && typeof p === "object" && !Array.isArray(p)) simulation = p;
      else throw new Error("objet attendu");
    } catch {
      return { ok: false, message: "simulation : JSON objet attendu (ex. {\"adr\":110,...})." };
    }
  }
  try {
    const rep = await gwPost<Record<string, unknown>>("/v1/offres", {
      qui,
      prospect_id,
      simulation,
    });
    const lignes = Array.isArray(rep.lignes) ? (rep.lignes as string[]) : [];
    const titre = String(rep.titre || "Offre");
    return {
      ok: true,
      message: lignes.length
        ? `${titre}\n${lignes.map((l) => "· " + l).join("\n")}`
        : JSON.stringify(rep).slice(0, 600),
    };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Échec offre." };
  }
}

export async function lire<T>(chemin: string): Promise<{ ok: boolean; data: T | null; erreur: string }> {
  try {
    const data = await gwGet<T>(chemin);
    return { ok: true, data, erreur: "" };
  } catch (e) {
    return { ok: false, data: null, erreur: e instanceof Error ? e.message : "Échec." };
  }
}

// Onboarding §L3 étape 7 : création RÉELLE du logement via POST /parc/logements.
// Règles RG respectées : qui = humain connecté (cookie, défaut personne_01),
// copro verifiee:false posée par la passerelle (BLOQUÉ tant que pas de syndic),
// jamais de champ gratuit non prévu par le registre.
export async function onboardingCreer(
  prev: ResultatAction | null,
  formData: FormData,
): Promise<ResultatAction> {
  const jar = await cookies();
  const qui = String(formData.get("qui") || "").trim() || jar.get("lcd_qui")?.value || "";
  const nom = String(formData.get("nom") || "").trim();
  const commune = String(formData.get("commune") || "").trim();
  const capacite = String(formData.get("capacite") || "").trim();
  const surface = String(formData.get("surface_m2") || "").trim();
  const prixBase = String(formData.get("prix_base") || "").trim();
  const slug = String(formData.get("logement_id") || "").trim();
  const logement_id =
    slug ||
    `log${Date.now().toString(36).slice(-6).replace(/[^a-z0-9]/g, "")}`;
  if (!nom || !commune || !capacite)
    return { ok: false, message: "nom, commune et capacité sont requis." };
  if (!["personne_01", "personne_02"].includes(qui))
    return { ok: false, message: `création réservée à admin/super_admin (qui=${qui || "?"}).` };
  const data: Record<string, string> = {
    nom,
    commune,
    capacite,
    surface_m2: surface || "0",
    ...(prixBase ? { prix_base: prixBase } : {}),
    smart_lock: formData.get("smart_lock") === "on" ? "true" : "false",
    voix: formData.get("voix") === "on" ? "true" : "false",
  };
  try {
    const rep = await gwPost<Record<string, unknown>>("/parc/logements", {
      logement_id,
      qui,
      data,
    });
    const lid = String(rep.logement_id ?? logement_id);
    return {
      ok: true,
      message:
        `Logement ${lid} créé (bornes héritées ${JSON.stringify(rep.bornes_heritees ?? [])}). ` +
        "⚠ copro verifiee=false : mise en ligne BLOQUÉE tant que le syndic n'a pas confirmé (REQ-L-001).",
    };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Échec création." };
  }
}
