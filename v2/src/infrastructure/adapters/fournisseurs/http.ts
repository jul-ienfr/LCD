import { ErreurMetier } from "@/domain/erreurs";

export interface RequeteFournisseur {
  url: string;
  methode?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  entetes?: Record<string, string>;
  corps?: unknown;
  corpsBrut?: string;
  timeoutMs: number;
  fetchImpl?: typeof fetch;
}

function messageErreur(donnees: unknown, statut: number): string {
  if (typeof donnees === "string" && donnees.trim()) {
    return donnees.trim().slice(0, 300);
  }
  if (donnees && typeof donnees === "object") {
    const objet = donnees as Record<string, unknown>;
    const candidat =
      objet.message ?? objet.error ?? objet.detail ?? objet.errors ?? null;
    if (typeof candidat === "string") return candidat.slice(0, 300);
    if (candidat && typeof candidat === "object") {
      return JSON.stringify(candidat).slice(0, 300);
    }
  }
  return `HTTP ${statut}`;
}

export async function requeteFournisseur<T>(
  requete: RequeteFournisseur,
): Promise<T> {
  const fetchImpl = requete.fetchImpl ?? fetch;
  const corps =
    requete.corpsBrut ??
    (requete.corps === undefined ? undefined : JSON.stringify(requete.corps));
  let reponse: Response;
  try {
    reponse = await fetchImpl(requete.url, {
      method: requete.methode ?? "GET",
      headers: {
        Accept: "application/json",
        ...(corps === undefined ? {} : { "Content-Type": "application/json" }),
        ...requete.entetes,
      },
      body: corps,
      signal: AbortSignal.timeout(requete.timeoutMs),
    });
  } catch (error) {
    throw new ErreurMetier(
      "FOURNISSEUR_INDISPONIBLE",
      `Fournisseur injoignable : ${
        error instanceof Error ? error.message : "erreur réseau"
      }`,
    );
  }

  const texte = await reponse.text();
  let donnees: unknown = null;
  if (texte) {
    try {
      donnees = JSON.parse(texte) as unknown;
    } catch {
      donnees = texte;
    }
  }

  if (!reponse.ok) {
    throw new ErreurMetier(
      "FOURNISSEUR_INDISPONIBLE",
      `Fournisseur en erreur (${reponse.status}) : ${messageErreur(donnees, reponse.status)}`,
    );
  }

  return donnees as T;
}

export function urlAvecParametres(
  base: string,
  chemin: string,
  parametres: Record<string, string | number | boolean | undefined>,
): string {
  const url = new URL(
    `${base.replace(/\/+$/u, "")}/${chemin.replace(/^\/+/u, "")}`,
  );
  for (const [cle, valeur] of Object.entries(parametres)) {
    if (valeur !== undefined) url.searchParams.set(cle, String(valeur));
  }
  return url.toString();
}

export function exigerCle(valeur: string | undefined, nom: string): string {
  const cle = valeur?.trim();
  if (!cle) {
    throw new ErreurMetier(
      "FOURNISSEUR_INDISPONIBLE",
      `Clé ${nom} absente de la configuration serveur.`,
    );
  }
  return cle;
}

export function centimes(valeur: unknown): number | null {
  if (typeof valeur === "number" && Number.isFinite(valeur)) {
    return Math.round(valeur * 100);
  }
  if (typeof valeur === "string" && valeur.trim()) {
    const nombre = Number(valeur);
    return Number.isFinite(nombre) ? Math.round(nombre * 100) : null;
  }
  return null;
}

export function texteOuNull(valeur: unknown): string | null {
  return typeof valeur === "string" && valeur.trim() ? valeur.trim() : null;
}
