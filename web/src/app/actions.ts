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

export type ResultatAction = { ok: boolean; message: string };

export async function executerAction(
  prev: ResultatAction | null,
  formData: FormData,
): Promise<ResultatAction> {
  const box_id = String(formData.get("box_id") || "").trim();
  const logement_id = String(formData.get("logement_id") || "").trim();
  const action = String(formData.get("action") || "").trim();
  const qui = String(formData.get("qui") || "").trim();
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
  const qui = String(formData.get("qui") || "").trim();
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
    qui: String(formData.get("qui") || "").trim(),
    entite_id: String(formData.get("entite_id") || "").trim(),
  };
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
      qui: String(formData.get("qui") || "").trim(),
      usage: String(formData.get("usage") || "").trim(),
      prompt: String(formData.get("prompt") || ""),
    });
    return { ok: true, message: `Dry-run : ${JSON.stringify(rep).slice(0, 400)}` };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Échec." };
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
