// app/actions.ts — Server Actions : relaient vers la passerelle, re-rendent.
// Formulaires natifs <form action> : fonctionnent SANS JavaScript (POST natif).
// Avec JS : React améliore (pending), sans JS : ça marche quand même.
"use server";

import { redirect } from "next/navigation";
import { gwGet, gwPost } from "@/lib/gateway";
import { cookies } from "next/headers";
import { autheliaInterne, lireIdentite, portailIdp } from "@/lib/identite";
import { PROFILS } from "@/lib/profils";

export async function choisirLangueAction(formData: FormData) {
  const lang = String(formData.get("lang") || "fr").slice(0, 2);
  const jar = await cookies();
  jar.set("lcd_lang", lang, { path: "/", maxAge: 365 * 24 * 3600 });
  redirect(`/?lang=${encodeURIComponent(lang)}`);
}

// Connexion SIMULÉE (lab, P1) : on choisit un compte humain déclaré dans la
// gateway (custom/acces.yaml) et on le mémorise en cookie httpOnly. C'est ce
// `qui` qui pré-remplit les formulaires 1-tap — la gateway REVÉRIFIE toujours
// l'autorisation (ce cookie ne prouve rien côté serveur : RBAC réel = gateway).
// En mode IdP (LCD_IDP=1) ce picker n'existe plus : loginAction redirige vers
// le portail (l'entrée sans-IdP a disparu, F3).
const COMPTES: Record<string, string> = Object.fromEntries(
  Object.entries(PROFILS).map(([id, p]) => [id, p.cible]),
);

export async function loginAction(formData: FormData) {
  const id = await lireIdentite();
  if (id.modeIdp) redirect(`${portailIdp()}/`);
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

// Mode IdP : la session vit chez Authelia (lcd_session, Domain=lcd.test) —
// le serveur la relaie à l'endpoint interne (réseau docker, X-Forwarded-Proto
// https exigé : cookie secure) puis efface lcd_vu. Le navigateur ne parle
// jamais directement au-delà du front.
async function fermerSessionIdp(session: string): Promise<void> {
  try {
    const portail = new URL(portailIdp());
    await fetch(`${autheliaInterne()}/api/logout`, {
      method: "POST",
      headers: {
        Cookie: `lcd_session=${session}`,
        Origin: portail.origin,
        "X-Forwarded-Proto": "https",
        "X-Forwarded-Host": portail.host,
      },
    });
  } catch (e) {
    console.error("logout IdP indisponible:", e);
  }
}

export async function logoutAction() {
  const id = await lireIdentite();
  const jar = await cookies();
  if (id.modeIdp) {
    const session = jar.get("lcd_session")?.value || "";
    jar.delete("lcd_vu");
    if (session) await fermerSessionIdp(session);
    redirect("/login?erreur=deconnexion");
  }
  jar.delete("lcd_qui");
  redirect("/login?erreur=deconnexion");
}

async function quiParDefaut(): Promise<string> {
  return (await lireIdentite()).qui;
}

// Piste d'audit voir-comme (§S3.3) : en mode IdP chaque écriture porte
// `qui_reel` (Remote-User prouvé) à côté de `qui` (identité effective) —
// la gateway exige alors un qui_reel admin et journalise le geste 90 j.
// Mode lab : objet vide, payloads strictement inchangés (batteries).
async function pisteIdentite(): Promise<{ qui_reel?: string }> {
  const id = await lireIdentite();
  return id.modeIdp && id.quiReel ? { qui_reel: id.quiReel } : {};
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
      ...(await pisteIdentite()),
    });
    const code = Number(rep.moteur_code ?? 200);
    if (code >= 200 && code < 300)
      return { ok: true, message: `Relayé (${action}, ref ${ref}).` };
    return { ok: false, message: `Moteur ${code} : ${JSON.stringify(rep.reponse ?? rep).slice(0, 300)}` };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Échec relai." };
  }
}

// F5 §S3.5-V5/V6 : déclaration de rotation d'un slot de secret — geste
// super_admin SEUL (la gateway renvoie 403 pour un admin). Ne transmet JAMAIS
// une valeur : seulement le nom du slot + la date constatée (vault/env).
export async function declarerRotation(
  prev: ResultatAction | null,
  formData: FormData,
): Promise<ResultatAction> {
  const slot = String(formData.get("slot") || "").trim();
  const date = String(formData.get("date") || "").trim();
  const qui = String(formData.get("qui") || "").trim() || (await quiParDefaut());
  if (!slot || !date)
    return { ok: false, message: "slot et date sont requis." };
  try {
    const rep = await gwPost<Record<string, unknown>>("/v1/secrets/rotate", {
      qui,
      slot,
      date,
      ...(await pisteIdentite()),
    });
    if (rep.ok) return { ok: true, message: `Rotation déclarée : ${slot} (${date}).` };
    return { ok: false, message: JSON.stringify(rep).slice(0, 300) };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Échec rotation." };
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
    await gwPost("/v1/prospects", { qui, data, ...(await pisteIdentite()) });
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
    ...(await pisteIdentite()),
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
      ...(await pisteIdentite()),
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
      ...(await pisteIdentite()),
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

// Trancher un conflit split-brain (§16.2) : QUELLE version devient la vérité.
// Geste humain tracé (qui + motif + ref TRANCHE-*), l'application du prix suit
// le circuit normal prix 1-tap — jamais d'écrasement silencieux.
export async function trancherConflit(
  prev: ResultatAction | null,
  formData: FormData,
): Promise<ResultatAction> {
  const qui =
    String(formData.get("qui") || "").trim() || (await quiParDefaut());
  const box_id = String(formData.get("box_id") || "").trim();
  const logement_id = String(formData.get("logement_id") || "").trim();
  const date = String(formData.get("date") || "").trim();
  const choix = String(formData.get("choix") || "").trim();
  const motif = String(formData.get("motif") || "").trim();
  if (!box_id || !logement_id || !date)
    return { ok: false, message: "box_id, logement_id et date requis." };
  if (!["box", "centrale"].includes(choix))
    return { ok: false, message: 'choix : "box" ou "centrale".' };
  if (!motif) return { ok: false, message: "motif obligatoire (tracé)." };
  try {
    const rep = await gwPost<Record<string, unknown>>(
      "/parc/conflits/trancher",
      {
        qui,
        box_id,
        logement_id,
        date,
        choix,
        motif,
        ...(await pisteIdentite()),
      },
    );
    return {
      ok: true,
      message:
        `Tranché (${choix}) : ${String(rep.ref ?? "TRANCHE")}. ` +
        "Applique ensuite le PRIX retenu via le prix 1-tap — le tranchement seul n'écrit rien.",
    };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Échec tranchement." };
  }
}

// Voir-comme (§14 V5/V6) : bascule de session super/admin vers un autre profil.
// Cookie seul : la passerelle reste l'unique vérité RBAC à CHAQUE écriture.
// `retour` = chemin interne (`/…`), jamais un protocole externe.
// Mode IdP (§S3.3) : la cible part dans `lcd_vu` (qui_reel reste Remote-User,
// bandeau permanent) et le GESTE est d'abord journalisé à la passerelle
// (POST /v1/audit, 90 j) — si le journal tombe, PAS de bascule (fail-closed :
// rien ne doit se voir sans trace).
export async function voirComme(formData: FormData): Promise<void> {
  const jar = await cookies();
  const id = await lireIdentite();
  const cible = String(formData.get("qui") || "").trim();
  const brutRetour = String(formData.get("retour") || "").trim();
  const retour =
    brutRetour.startsWith("/") && !brutRetour.startsWith("//") && !brutRetour.includes("\\")
      ? brutRetour
      : "/hote";
  if (!COMPTES[cible]) redirect(retour);
  if (id.modeIdp) {
    if (cible === id.quiReel) {
      jar.delete("lcd_vu");
      redirect(retour);
    }
    // Gesté d'audit : journal AVANT la bascule (dûment tracé, §S3.3).
    let trace = false;
    try {
      await gwPost("/v1/audit", {
        qui_reel: id.quiReel,
        qui: cible,
        geste: "voir_comme",
      });
      trace = true;
    } catch (e) {
      console.error("journal voir-comme indisponible (bascule refusee):", e);
    }
    if (trace) {
      jar.set("lcd_vu", cible, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
    }
    redirect(retour);
  }
  jar.set("lcd_qui", cible, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect(retour);
}

// Bascule thème clair/sombre manuel (cookie lcd_theme). Valeurs fermées :
// "clair" <-> "sombre". `retour` = chemin interne uniquement.
export async function basculerTheme(formData: FormData): Promise<void> {
  const jar = await cookies();
  const actuel = jar.get("lcd_theme")?.value === "sombre" ? "sombre" : "clair";
  const cible = actuel === "sombre" ? "clair" : "sombre";
  jar.set("lcd_theme", cible, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });
  const brut = String(formData.get("retour") || "").trim();
  const retour =
    brut.startsWith("/") && !brut.startsWith("//") && !brut.includes("\\")
      ? brut
      : "/hote";
  redirect(retour);
}

export async function lire<T>(chemin: string): Promise<{ ok: boolean; data: T | null; erreur: string }> {
  try {
    const data = await gwGet<T>(chemin);
    return { ok: true, data, erreur: "" };
  } catch (e) {
    return { ok: false, data: null, erreur: e instanceof Error ? e.message : "Échec." };
  }
}

// F5 §P8 : ouvrir un ticket support (bug/demande/question) — tout humain du
// parc, SLA P1<4h / P2<48h / P3<5j. La ref `TICKET-*` est générée par la
// passerelle : jamais un ticket sans ref (clé de reprise).
export async function ouvrirTicket(
  prev: ResultatAction | null,
  formData: FormData,
): Promise<ResultatAction> {
  const qui =
    String(formData.get("qui") || "").trim() || (await quiParDefaut());
  const sujet = String(formData.get("sujet") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const priorite = String(formData.get("priorite") || "P2").trim() || "P2";
  const logement_id = String(formData.get("logement_id") || "").trim();
  if (!sujet || !description)
    return { ok: false, message: "sujet et description sont requis." };
  try {
    const rep = await gwPost<{ ok?: boolean; ticket?: { ref?: string } }>(
      "/v1/tickets",
      { qui, sujet, description, priorite, logement_id, ...(await pisteIdentite()) },
    );
    const ref = rep.ticket?.ref ?? "TICKET";
    return { ok: true, message: `Ticket ${ref} ouvert (P${priorite.slice(1)}).` };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Échec ticket." };
  }
}

// F5 §P8 : faire évoluer un ticket — staff seul (super/admin/opérateur ;
// la passerelle refuse un client). Clôture = motif obligatoire (trace).
export async function majTicket(
  prev: ResultatAction | null,
  formData: FormData,
): Promise<ResultatAction> {
  const qui =
    String(formData.get("qui") || "").trim() || (await quiParDefaut());
  const ref = String(formData.get("ref") || "").trim();
  const statut = String(formData.get("statut") || "").trim();
  const motif = String(formData.get("motif") || "").trim();
  if (!ref || !statut)
    return { ok: false, message: "ref et statut sont requis." };
  try {
    const rep = await gwPost<{ ok?: boolean; ticket?: { ref?: string } }>(
      "/v1/tickets/statut",
      { qui, ref, statut, motif, ...(await pisteIdentite()) },
    );
    if (rep.ok) return { ok: true, message: `Ticket ${ref} → ${statut}.` };
    return { ok: false, message: JSON.stringify(rep).slice(0, 300) };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Échec." };
  }
}

// F5 §P8 : écrire dans un fil de messagerie (proprio/presta/voyageur). ACL
// fail-closed côté passerelle : un client n'écrit QUE dans ses fils (auteur)
// ; un opérateur peut toujours écrire. Jamais WhatsApp/SMS perso : tout ici,
// au journal, avec ref.
export async function envoyerMessage(
  prev: ResultatAction | null,
  formData: FormData,
): Promise<ResultatAction> {
  const qui =
    String(formData.get("qui") || "").trim() || (await quiParDefaut());
  const type = String(formData.get("type") || "").trim();
  const ref = String(formData.get("ref") || "").trim();
  const texte = String(formData.get("texte") || "").trim();
  if (!["proprio", "presta", "voyageur"].includes(type))
    return { ok: false, message: "type : proprio, presta ou voyageur." };
  if (!ref || !texte)
    return { ok: false, message: "ref (logement/mission/résa) et texte requis." };
  try {
    const rep = await gwPost<{ ok?: boolean; message?: { fil_id?: string } }>(
      "/v1/messagerie",
      { qui, type, ref, texte, ...(await pisteIdentite()) },
    );
    if (rep.ok)
      return { ok: true, message: `Message envoyé dans ${rep.message?.fil_id ?? `${type}:${ref}`}.` };
    return { ok: false, message: JSON.stringify(rep).slice(0, 300) };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Échec." };
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
  const qui = String(formData.get("qui") || "").trim() || (await quiParDefaut());
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
      ...(await pisteIdentite()),
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
