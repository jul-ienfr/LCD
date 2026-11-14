import type { CreerAutomatisationData } from "@/application/ports/automatisations-repository";

/**
 * Modèles de messages de séjour proposés à un hébergeur. Ce sont des
 * brouillons : rien ne part sans validation humaine dans l'inbox.
 */
export const AUTOMATISATIONS_PAR_DEFAUT: readonly Omit<
  CreerAutomatisationData,
  "tenantId"
>[] = [
  {
    code: "preparation-sejour",
    libelle: "Préparer le séjour (J-7)",
    declencheur: "j-7",
    canal: "email",
    sujet: "Votre séjour approche — {{logement}}",
    modele:
      "Bonjour {{voyageur}},\n\nVotre séjour au {{logement}} commence le {{arrivee}} pour {{nuits}} nuits.\nSouhaitez-vous que nous préparions quelque chose en particulier (lit bébé, arrivée tardive, courses) ?\n\nRéférence de votre réservation : {{reference}}\n\nVotre guide du logement (arrivée, accès, WiFi) : {{guide}}\n\nÀ très vite,",
  },
  {
    code: "veille-arrivee",
    libelle: "Instructions d'arrivée (J-1)",
    declencheur: "j-1",
    canal: "email",
    sujet: "Votre arrivée demain au {{logement}}",
    modele:
      "Bonjour {{voyageur}},\n\nPetit rappel pour demain : voici les informations d'accès au {{logement}}.\nHeure d'arrivée souhaitée, code d'entrée et stationnement vous seront confirmés ici.\n\nRetrouvez toutes les informations pratiques dans votre guide : {{guide}}\n\nBonne route,",
  },
  {
    code: "bienvenue-arrivee",
    libelle: "Message de bienvenue (jour d'arrivée)",
    declencheur: "arrivee",
    canal: "email",
    sujet: "Bienvenue au {{logement}}",
    modele:
      "Bonjour {{voyageur}},\n\nBienvenue ! Nous restons joignables pendant tout votre séjour : répondez simplement à ce message.\n\nBon séjour au {{logement}},",
  },
  {
    code: "consignes-depart",
    libelle: "Consignes de départ",
    declencheur: "depart",
    canal: "email",
    sujet: "Votre départ du {{logement}}",
    modele:
      "Bonjour {{voyageur}},\n\nPour votre départ, merci de sortir les poubelles, lancer la vaisselle, fermer les fenêtres et déposer les clés comme convenu.\n\nMerci et à bientôt,",
  },
  {
    code: "remerciement-apres-sejour",
    libelle: "Remerciement (J+1)",
    declencheur: "j+1",
    canal: "email",
    sujet: "Merci pour votre séjour au {{logement}}",
    modele:
      "Bonjour {{voyageur}},\n\nMerci d'avoir séjourné au {{logement}}. Si tout s'est bien passé, un avis nous aide beaucoup ; si quelque chose a manqué, dites-le nous directement.\n\nVotre avis : {{avis}}\n\nÀ bientôt,",
  },
];
