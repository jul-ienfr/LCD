import {
  RECHERCHE_MAX,
  RECHERCHE_MIN,
  RechercherRefs,
  requeteRechercheValide,
} from "@/application/use-cases/recherche";
import type { CategorieRecherche } from "@/application/ports/recherche-repository";
import { DrizzleRechercheRepository } from "@/infrastructure/db/repositories/recherche-repository";
import { traductionsRecherche } from "@/lib/i18n-recherche";
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
