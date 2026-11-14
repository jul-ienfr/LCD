import {
  RECHERCHE_MAX,
  RECHERCHE_MIN,
  RechercherRefs,
  requeteRechercheValide,
} from "@/application/use-cases/recherche";
import type { CategorieRecherche } from "@/application/ports/recherche-repository";
import { DrizzleRechercheRepository } from "@/infrastructure/db/repositories/recherche-repository";
import { traductionsRecherche } from "@/lib/i18n-recherche";
import { mesurerParcours } from "@/lib/server/mesure-ergonomie";
import { requireRole, tenantIdDeSession } from "@/lib/server/session";
import type { PageServerLoad } from "./$types";

const LIBELLES: Record<CategorieRecherche, string> = {
  logement: "Logements",
  reservation: "Réservations",
  facture: "Factures",
  paiement: "Paiements",
  mission: "Missions",
  menage: "Ménages",
  "etat-des-lieux": "États des lieux",
  ticket: "Support",
  sinistre: "Sinistres",
  "objet-trouve": "Objets trouvés",
  "commande-extra": "Extras",
};

const ORDRE: CategorieRecherche[] = [
  "logement",
  "reservation",
  "facture",
  "paiement",
  "mission",
  "menage",
  "etat-des-lieux",
  "ticket",
  "sinistre",
  "objet-trouve",
  "commande-extra",
];

export const load: PageServerLoad = async (event) => {
  const session = requireRole(event, ["admin", "hote", "comptable", "operateur"]);
  const tenantId = tenantIdDeSession(session);
  const q = (event.url.searchParams.get("q") ?? "").trim();
  const valide = requeteRechercheValide(q);
  const resultats = q && valide
    ? await new RechercherRefs(new DrizzleRechercheRepository()).executer(tenantId, q)
    : [];
  const t = traductionsRecherche(event.cookies.get("lcd_langue") ?? "fr");

  /* --- Mesure (T092) : recherche effectuée ou sans résultat --- */
  // Seul le nombre de résultats est mesuré : jamais le texte cherché (PII).
  if (q && valide) {
    await mesurerParcours(event, tenantId, {
      nom: resultats.length > 0 ? "recherche_effectuee" : "recherche_sans_resultat",
      parcoursId: "P-RECHERCHE",
      surface: "staff",
      route: "/hote/recherche",
      etape: "resultats",
      resultat: resultats.length > 0 ? "succes" : "erreur",
      role: session.user.role ?? "",
      nombreResultats: resultats.length,
    });
  }

  return {
    t,
    q,
    valide,
    max: RECHERCHE_MAX,
    min: RECHERCHE_MIN,
    nombre: resultats.length,
    groupes: ORDRE.map((categorie) => ({
      categorie,
      libelle: t.categories[categorie] ?? LIBELLES[categorie],
      items: resultats
        .filter((item) => item.categorie === categorie)
        .map((item) => ({
          id: `${item.categorie}-${item.id}`,
          ref: item.ref,
          titre: item.titre,
          detail: item.detail,
          date: item.date,
          href: item.href,
        })),
    })).filter((groupe) => groupe.items.length > 0),
  };
};
