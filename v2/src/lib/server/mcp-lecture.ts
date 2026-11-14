/**
 * T715 — Serveur MCP en lecture seule.
 *
 * Le transport (stdio) et le protocole JSON-RPC sont séparés des outils :
 * `traiterMessageMcp` est testable sans réseau, `executerOutilMcp` reçoit un
 * `fetch` injecté. Aucun outil n'écrit ni ne sort du périmètre de la clé API.
 */

export interface ProprieteSchemaMcp {
  type: "string" | "integer";
  description: string;
}

export interface OutilMcp {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, ProprieteSchemaMcp>;
    required?: string[];
    additionalProperties: false;
  };
}

const PAGINATION = {
  page: { type: "integer" as const, description: "Page, à partir de 1." },
  limite: {
    type: "integer" as const,
    description: "Taille de page, 1 à 200 (défaut 50).",
  },
};

export const OUTILS_MCP: readonly OutilMcp[] = [
  {
    name: "lister_logements",
    description: "Liste les logements du compte, avec pagination.",
    inputSchema: {
      type: "object",
      properties: { ...PAGINATION },
      additionalProperties: false,
    },
  },
  {
    name: "lister_reservations",
    description:
      "Liste les réservations, filtrables par logement et période (AAAA-MM-JJ).",
    inputSchema: {
      type: "object",
      properties: {
        logementId: {
          type: "string",
          description: "Identifiant du logement.",
        },
        debut: {
          type: "string",
          description: "Début de période inclus, AAAA-MM-JJ.",
        },
        fin: {
          type: "string",
          description: "Fin de période exclue, AAAA-MM-JJ.",
        },
        ...PAGINATION,
      },
      additionalProperties: false,
    },
  },
  {
    name: "lister_disponibilites",
    description:
      "Liste les disponibilités nuit par nuit d'un logement sur une période.",
    inputSchema: {
      type: "object",
      properties: {
        logementId: {
          type: "string",
          description: "Identifiant du logement.",
        },
        debut: { type: "string", description: "Première nuit, AAAA-MM-JJ." },
        fin: { type: "string", description: "Fin exclue, AAAA-MM-JJ." },
      },
      required: ["logementId", "debut", "fin"],
      additionalProperties: false,
    },
  },
  {
    name: "lister_prix",
    description: "Liste les prix par nuit d'un logement sur une période.",
    inputSchema: {
      type: "object",
      properties: {
        logementId: {
          type: "string",
          description: "Identifiant du logement.",
        },
        debut: { type: "string", description: "Première nuit, AAAA-MM-JJ." },
        fin: { type: "string", description: "Fin exclue, AAAA-MM-JJ." },
      },
      required: ["logementId", "debut", "fin"],
      additionalProperties: false,
    },
  },
  {
    name: "lister_proprietaires",
    description:
      "Liste les propriétaires et les logements qui leur sont assignés.",
    inputSchema: {
      type: "object",
      properties: { ...PAGINATION },
      additionalProperties: false,
    },
  },
  {
    name: "lister_releves",
    description:
      "Liste les relevés propriétaires, filtrables par mois (AAAA-MM).",
    inputSchema: {
      type: "object",
      properties: {
        moisDebut: {
          type: "string",
          description: "Premier mois inclus, AAAA-MM.",
        },
        moisFin: { type: "string", description: "Dernier mois inclus, AAAA-MM." },
        ...PAGINATION,
      },
      additionalProperties: false,
    },
  },
] as const;

const CHEMINS: Record<string, string> = {
  lister_logements: "/api/v1/logements",
  lister_reservations: "/api/v1/reservations",
  lister_disponibilites: "/api/v1/disponibilites",
  lister_prix: "/api/v1/prix",
  lister_proprietaires: "/api/v1/proprietaires",
  lister_releves: "/api/v1/releves",
};

export interface ClientMcp {
  baseUrl: string;
  apiKey: string;
  fetchImpl?: typeof fetch;
}

export interface ContenuMcp {
  content: { type: "text"; text: string }[];
  isError?: boolean;
}

export class ErreurMcp extends Error {}

export function listerOutilsMcp(): OutilMcp[] {
  return OUTILS_MCP.map((outil) => structuredClone(outil));
}

function outil(nom: string): OutilMcp | null {
  return OUTILS_MCP.find((outil) => outil.name === nom) ?? null;
}

function texteArgument(
  args: Record<string, unknown>,
  nom: string,
  requis: boolean,
): string | null {
  const valeur = args[nom];
  if (valeur === undefined || valeur === null || valeur === "") {
    if (requis) throw new ErreurMcp(`Argument « ${nom} » requis.`);
    return null;
  }
  if (typeof valeur === "string") return valeur.trim();
  if (typeof valeur === "number" && Number.isFinite(valeur)) {
    return String(Math.trunc(valeur));
  }
  throw new ErreurMcp(`Argument « ${nom} » invalide.`);
}

function construireChemin(
  nom: string,
  args: Record<string, unknown>,
): string {
  const definition = outil(nom);
  if (!definition) throw new ErreurMcp("Outil inconnu.");
  for (const cle of Object.keys(args)) {
    if (!(cle in definition.inputSchema.properties)) {
      throw new ErreurMcp(`Argument « ${cle} » inconnu.`);
    }
  }
  const requis = new Set(definition.inputSchema.required ?? []);
  const params = new URLSearchParams();
  for (const cle of Object.keys(definition.inputSchema.properties)) {
    const valeur = texteArgument(args, cle, requis.has(cle));
    if (valeur !== null) params.set(cle, valeur);
  }
  const query = params.toString();
  return `${CHEMINS[nom]}${query ? `?${query}` : ""}`;
}

export async function executerOutilMcp(
  nom: string,
  args: Record<string, unknown>,
  client: ClientMcp,
): Promise<ContenuMcp> {
  let chemin: string;
  try {
    chemin = construireChemin(nom, args);
  } catch (error) {
    if (error instanceof ErreurMcp) {
      return {
        isError: true,
        content: [{ type: "text", text: error.message }],
      };
    }
    throw error;
  }
  const url = new URL(chemin, client.baseUrl.replace(/\/+$/, ""));
  const fetchImpl = client.fetchImpl ?? fetch;
  let reponse: Response;
  try {
    reponse = await fetchImpl(url, {
      method: "GET",
      headers: {
        authorization: `Bearer ${client.apiKey}`,
        accept: "application/json",
      },
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    return {
      isError: true,
      content: [{ type: "text", text: "Erreur réseau vers l’API LCD." }],
    };
  }
  const corps = await reponse.text();
  if (!reponse.ok) {
    const requestId = reponse.headers.get("x-request-id");
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: `Erreur API LCD (${reponse.status})${requestId ? ` — requête ${requestId}` : ""}.`,
        },
      ],
    };
  }
  let texte = corps;
  try {
    texte = JSON.stringify(JSON.parse(corps), null, 2);
  } catch {
    texte = corps.slice(0, 2_000);
  }
  return {
    content: [{ type: "text", text: texte }],
  };
}

type IdMcp = string | number | null;

function erreur(id: IdMcp, code: number, message: string) {
  return { jsonrpc: "2.0" as const, id, error: { code, message } };
}

/**
 * Traite un message JSON-RPC MCP. Retourne `null` pour les notifications
 * (aucune réponse ne doit être écrite sur stdout).
 */
export async function traiterMessageMcp(
  message: unknown,
  client: ClientMcp,
): Promise<unknown | null> {
  if (
    typeof message !== "object" ||
    message === null ||
    (message as { jsonrpc?: unknown }).jsonrpc !== "2.0"
  ) {
    return erreur(null, -32600, "Requête JSON-RPC invalide.");
  }
  const requete = message as {
    id?: IdMcp;
    method?: unknown;
    params?: unknown;
  };
  const id = requete.id ?? null;
  const methode = requete.method;
  if (typeof methode !== "string") {
    return erreur(id, -32600, "Méthode manquante.");
  }
  const estNotification = requete.id === undefined;
  if (estNotification) return null;

  if (methode === "initialize") {
    return {
      jsonrpc: "2.0",
      id,
      result: {
        protocolVersion: "2025-06-18",
        capabilities: { tools: {} },
        serverInfo: { name: "lcd-lecture", version: "1.0.0" },
      },
    };
  }
  if (methode === "ping") {
    return { jsonrpc: "2.0", id, result: {} };
  }
  if (methode === "tools/list") {
    return { jsonrpc: "2.0", id, result: { tools: listerOutilsMcp() } };
  }
  if (methode === "tools/call") {
    const params = requete.params as
      | { name?: unknown; arguments?: unknown }
      | undefined;
    if (!params || typeof params.name !== "string") {
      return erreur(id, -32602, "Paramètre « name » requis.");
    }
    const args =
      params.arguments && typeof params.arguments === "object"
        ? (params.arguments as Record<string, unknown>)
        : {};
    try {
      const resultat = await executerOutilMcp(params.name, args, client);
      return { jsonrpc: "2.0", id, result: resultat };
    } catch (error) {
      if (error instanceof ErreurMcp) {
        return {
          jsonrpc: "2.0",
          id,
          result: {
            isError: true,
            content: [{ type: "text", text: error.message }],
          },
        };
      }
      return erreur(id, -32603, "Erreur interne du serveur MCP.");
    }
  }
  return erreur(id, -32601, `Méthode inconnue : ${methode}.`);
}
