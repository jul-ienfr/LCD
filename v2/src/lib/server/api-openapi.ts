/**
 * US7 (T706) — Document OpenAPI 3.1 de l'API v1.
 *
 * Le document est généré à la requête pour que `servers[0].url` reflète
 * l'origine réelle (local, préprod, prod). Aucune donnée tenant n'y figure.
 */
export function documentOpenApi(origine: string): Record<string, unknown> {
  const parametresPagination = [
    {
      name: "page",
      in: "query",
      required: false,
      schema: { type: "integer", minimum: 1, default: 1 },
    },
    {
      name: "limite",
      in: "query",
      required: false,
      schema: { type: "integer", minimum: 1, maximum: 200, default: 50 },
    },
  ];

  const reponseListe = {
    200: {
      description: "Liste paginée.",
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["data", "pagination"],
            properties: {
              data: { type: "array", items: { type: "object" } },
              pagination: { $ref: "#/components/schemas/Pagination" },
            },
          },
        },
      },
    },
    401: { $ref: "#/components/responses/NonAutorise" },
    403: { $ref: "#/components/responses/ScopeInsuffisant" },
    429: { $ref: "#/components/responses/TropDeRequetes" },
  };

  return {
    openapi: "3.1.0",
    info: {
      title: "LCD API v1",
      version: "1.0.0",
      description:
        "API de lecture de la conciergerie LCD : logements, réservations, disponibilités, prix, propriétaires et relevés. Authentification par clé Bearer, scopes par ressource, pagination par page/limite.",
    },
    servers: [{ url: origine }],
    security: [{ cleApi: [] }],
    components: {
      securitySchemes: {
        cleApi: {
          type: "http",
          scheme: "bearer",
          description:
            "Clé `lcd_…` créée dans /hote/integrations/api. En-tête : `Authorization: Bearer lcd_…`.",
        },
      },
      schemas: {
        Erreur: {
          type: "object",
          required: ["erreur"],
          properties: {
            erreur: {
              type: "object",
              required: ["code", "message"],
              properties: {
                code: { type: "string" },
                message: { type: "string" },
              },
            },
            requestId: { type: "string" },
          },
        },
        Pagination: {
          type: "object",
          required: ["page", "limite", "total", "pages"],
          properties: {
            page: { type: "integer" },
            limite: { type: "integer" },
            total: { type: "integer" },
            pages: { type: "integer" },
          },
        },
      },
      responses: {
        NonAutorise: {
          description: "Clé absente, inconnue, expirée ou révoquée.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Erreur" },
            },
          },
        },
        ScopeInsuffisant: {
          description: "La clé ne porte pas le scope requis.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Erreur" },
            },
          },
        },
        TropDeRequetes: {
          description: "Plus de 120 requêtes par minute pour cette clé.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Erreur" },
            },
          },
        },
      },
    },
    paths: {
      "/api/v1/logements": {
        get: {
          summary: "Lister les logements",
          security: [{ cleApi: ["logements:lire"] }],
          parameters: parametresPagination,
          responses: reponseListe,
        },
      },
      "/api/v1/reservations": {
        get: {
          summary: "Lister les réservations",
          security: [{ cleApi: ["reservations:lire"] }],
          parameters: [
            ...parametresPagination,
            {
              name: "logementId",
              in: "query",
              required: false,
              schema: { type: "string", format: "uuid" },
            },
            {
              name: "debut",
              in: "query",
              required: false,
              schema: { type: "string", format: "date" },
            },
            {
              name: "fin",
              in: "query",
              required: false,
              schema: { type: "string", format: "date" },
            },
          ],
          responses: reponseListe,
        },
      },
      "/api/v1/disponibilites": {
        get: {
          summary: "Disponibilités jour par jour d'un logement",
          security: [{ cleApi: ["disponibilites:lire"] }],
          parameters: [
            {
              name: "logementId",
              in: "query",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
            {
              name: "debut",
              in: "query",
              required: true,
              schema: { type: "string", format: "date" },
            },
            {
              name: "fin",
              in: "query",
              required: true,
              schema: { type: "string", format: "date" },
            },
          ],
          responses: {
            200: {
              description: "Jours avec disponibilité.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: { data: { type: "object" } },
                  },
                },
              },
            },
            400: { $ref: "#/components/responses/NonAutorise" },
            401: { $ref: "#/components/responses/NonAutorise" },
            403: { $ref: "#/components/responses/ScopeInsuffisant" },
          },
        },
      },
      "/api/v1/prix": {
        get: {
          summary: "Tarifs par nuit d'un logement",
          security: [{ cleApi: ["prix:lire"] }],
          parameters: [
            {
              name: "logementId",
              in: "query",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
            {
              name: "debut",
              in: "query",
              required: true,
              schema: { type: "string", format: "date" },
            },
            {
              name: "fin",
              in: "query",
              required: true,
              schema: { type: "string", format: "date" },
            },
            ...parametresPagination,
          ],
          responses: reponseListe,
        },
      },
      "/api/v1/proprietaires": {
        get: {
          summary: "Lister les propriétaires et leurs logements",
          security: [{ cleApi: ["proprietaires:lire"] }],
          parameters: parametresPagination,
          responses: reponseListe,
        },
      },
      "/api/v1/releves": {
        get: {
          summary: "Lister les relevés propriétaires",
          security: [{ cleApi: ["releves:lire"] }],
          parameters: [
            ...parametresPagination,
            {
              name: "moisDebut",
              in: "query",
              required: false,
              schema: { type: "string", pattern: "^\\d{4}-\\d{2}$" },
            },
            {
              name: "moisFin",
              in: "query",
              required: false,
              schema: { type: "string", pattern: "^\\d{4}-\\d{2}$" },
            },
          ],
          responses: reponseListe,
        },
      },
    },
  };
}
