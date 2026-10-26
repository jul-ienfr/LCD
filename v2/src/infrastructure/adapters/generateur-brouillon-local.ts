import type {
  BrouillonGenere,
  GenerateurBrouillon,
  RequeteBrouillon,
} from "@/application/ports/generateur-brouillon";
import {
  COUT_ESTIME_CENTIMES,
  MODELES,
} from "@/domain/assistant";

function salutation(voyageur: string): string {
  return voyageur ? `Bonjour ${voyageur},` : "Bonjour,";
}

function corps(requete: RequeteBrouillon): string {
  const ouverture = salutation(requete.voyageur);
  const details = requete.details ? ` ${requete.details}` : "";

  if (requete.intention === "arrivee") {
    return `${ouverture} votre séjour à ${requete.logement} approche. L’arrivée est possible à partir de 15 h ; le logement sera prêt et vous recevrez les informations d’accès par un canal vérifié.${details} À très bientôt.`;
  }
  if (requete.intention === "depart") {
    return `${ouverture} pour votre départ de ${requete.logement}, le check-out se fait avant 11 h. Merci de laisser les clés sur place et de fermer les fenêtres.${details} Bon retour.`;
  }
  if (requete.intention === "retard") {
    return `${ouverture} nous avons bien noté votre imprévu concernant ${requete.logement}. Prenez le temps nécessaire : nous adaptons l’organisation et restons disponibles.${details} Merci de votre compréhension.`;
  }
  if (requete.intention === "menage") {
    return `${ouverture} un passage ménage est prévu pendant votre séjour à ${requete.logement}. Le linge de maison est fourni ; dites-nous si un horaire particulier vous arrange.${details} Bon séjour.`;
  }
  return `${ouverture} merci d’avoir séjourné à ${requete.logement}. Votre avis nous aide à améliorer l’accueil : quelques mots suffisent, en toute simplicité.${details} Merci et à bientôt.`;
}

function ajusterTon(texte: string, requete: RequeteBrouillon): string {
  if (requete.ton === "concis") {
    return texte
      .replace(/ À très bientôt\.$/, " À bientôt.")
      .replace(/ Bon retour\.$/, " Bon retour.")
      .replace(/ Merci de votre compréhension\.$/, " Merci.")
      .replace(/ Bon séjour\.$/, " Bon séjour.")
      .replace(/ Merci et à bientôt\.$/, " Merci.");
  }
  if (requete.ton === "chaleureux") {
    return `${texte} N’hésitez pas à nous écrire si besoin.`;
  }
  return texte;
}

export class GenerateurBrouillonLocal implements GenerateurBrouillon {
  async generer(requete: RequeteBrouillon): Promise<BrouillonGenere> {
    return {
      texte: ajusterTon(corps(requete), requete),
      modele: MODELES[requete.niveau],
      coutEstimeCentimes: COUT_ESTIME_CENTIMES[requete.niveau],
    };
  }
}
