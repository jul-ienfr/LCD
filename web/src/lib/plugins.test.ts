import { describe, expect, it } from "vitest";
import { ID_CONNUS, parserYamlManifeste, synchroniserFlags, validerManifeste, validerTout } from "../../scripts/valider-plugins.mjs";

// Chargeur plugins (§20.7 + cahier 70 §F3) : fail-closed, jamais de
// demi-chargement. Ces tests piégent le chargeur autant qu'ils le valident.

const CTX_BASE = {
  rolesConnus: new Set(["super_admin", "admin", "gestionnaire", "comptable", "proprietaire", "prestataire", "commercial", "voyageur"]),
  flagsConnus: new Set(["extras_upsell", "compta_auto", "jev_enabled"]),
  allow: {
    lecture: new Set(["/etat-parc", "/parc/annonces"]),
    ecriture: new Set(["/v1/action"]),
    prefixes: ["/parc/annonces/"],
  },
  routeExiste: () => true,
  // Règle §S3.4.2 : un plugin actif DOIT avoir son i18n.json (5/5).
  // La fixture lit le vrai fichier du dépôt (runtime cwd = web/).
  i18nFichier: "src/plugins/dash-operateur/i18n.json",
};

const VALIDE = {
  id: "dash-operateur",
  version: "1.0.0",
  actif: true,
  roles: ["gestionnaire"],
  routes: ["/hote"],
  apis: ["GET /etat-parc", "POST /v1/action"],
  flags: [],
  i18n_prefixe: "operateur.",
  lite: true,
  offline: false,
};

describe("parseur YAML manifeste (sous-ensemble plat, fail-closed)", () => {
  it("parse clés scalaires, booléens et listes inline", () => {
    const { obj, erreurs } = parserYamlManifeste(
      'id: dash-x\nversion: "1.2.3"\nactif: true\nroles: [voyageur]\n',
    );
    expect(erreurs).toEqual([]);
    expect(obj).toEqual({ id: "dash-x", version: "1.2.3", actif: true, roles: ["voyageur"] });
  });
  it("les commentaires et lignes vides sont ignorés", () => {
    const { obj } = parserYamlManifeste("# titre\n\nid: dash-x # trailing\n");
    expect(obj.id).toBe("dash-x");
  });
  it("accepte les listes en blocs (style YAML natif des manifestes)", () => {
    const { obj, erreurs } = parserYamlManifeste("id: dash-x\napis:\n  - GET /a\n  - POST /b\n");
    expect(erreurs).toEqual([]);
    expect(obj.apis).toEqual(["GET /a", "POST /b"]);
  });
  it("REFUSE une map imbriquée (hors contrat plat)", () => {
    const { erreurs } = parserYamlManifeste("roles:\n  nom: voyageur\n");
    expect(erreurs.join(" ")).toMatch(/indentation refusee/);
  });
  it("REFUSE une clé dupliquée", () => {
    const { erreurs } = parserYamlManifeste("id: a\nid: b\n");
    expect(erreurs.join(" ")).toMatch(/dupliquee/);
  });
});

describe("validation manifeste (échecs attendus = fail-closed)", () => {
  it("manifeste valide = 0 erreur", () => {
    expect(validerManifeste(VALIDE, CTX_BASE).erreurs).toEqual([]);
  });
  it("REFUSE un rôle inconnu (§S3.1 liste fermée)", () => {
    const e = validerManifeste({ ...VALIDE, roles: ["super_pouvoir"] }, CTX_BASE).erreurs;
    expect(e.join(" ")).toMatch(/role inconnu/);
  });
  it("REFUSE une API hors allowlist (§20.7 : jamais d'élargissement)", () => {
    const e = validerManifeste({ ...VALIDE, apis: ["GET /secret-admin"] }, CTX_BASE).erreurs;
    expect(e.join(" ")).toMatch(/hors allowlist/);
  });
  it("REFUSE un préfixe d'API non déclaré dans l'allowlist", () => {
    const e = validerManifeste({ ...VALIDE, apis: ["GET /admin/secrets/"] }, CTX_BASE).erreurs;
    expect(e.join(" ")).toMatch(/prefixe hors allowlist/);
  });
  it("REFUSE un flag inconnu (miroir logements.yaml)", () => {
    const e = validerManifeste({ ...VALIDE, flags: ["magie"] }, CTX_BASE).erreurs;
    expect(e.join(" ")).toMatch(/flag inconnu/);
  });
  it("REFUSE une clé hors schéma fermé", () => {
    const e = validerManifeste({ ...VALIDE, backdoor: true }, CTX_BASE).erreurs;
    expect(e.join(" ")).toMatch(/cle inconnue refusee/);
  });
  it("REFUSE un id hors des 8 dashboards", () => {
    const e = validerManifeste({ ...VALIDE, id: "dash-experiment" }, CTX_BASE).erreurs;
    expect(e.join(" ")).toMatch(/id inconnu/);
    expect(ID_CONNUS.has("dash-experiment")).toBe(false);
  });
  it("REFUSE une route sans page si actif (jamais de 404 muet)", () => {
    const e = validerManifeste(
      { ...VALIDE, routes: ["/inexistant"] },
      { ...CTX_BASE, routeExiste: () => false },
    ).erreurs;
    expect(e.join(" ")).toMatch(/sans page/);
  });
  it("ACCEPTE une route sans page si actif:false (plugin planifié F5)", () => {
    const e = validerManifeste(
      { ...VALIDE, actif: false, routes: ["/inexistant"] },
      { ...CTX_BASE, routeExiste: () => false },
    ).erreurs;
    expect(e).toEqual([]);
  });
  it("REFUSE i18n_prefixe sans point final", () => {
    const e = validerManifeste({ ...VALIDE, i18n_prefixe: "operateur" }, CTX_BASE).erreurs;
    expect(e.join(" ")).toMatch(/i18n_prefixe/);
  });
  it("REFUSE une version non-semver", () => {
    const e = validerManifeste({ ...VALIDE, version: "v1" }, CTX_BASE).erreurs;
    expect(e.join(" ")).toMatch(/semver/);
  });
});

describe("parcours réel du dépôt (8 plugins)", () => {
  it("les 8 manifestes du dépôt sont valides, 0 erreur", () => {
    const res = validerTout();
    expect(res).toHaveLength(8);
    const ko = res.flatMap((r) => r.erreurs.map((e) => `${r.dossier} : ${e}`));
    expect(ko).toEqual([]);
  });
  it("miroir flags = custom/logements.yaml (si accessible)", () => {
    const sync = synchroniserFlags();
    if (sync !== null) expect(sync.erreurs).toEqual([]); // lab/Docker : skip documenté
  });
});
