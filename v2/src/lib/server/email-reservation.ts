import type { EmailMessage } from "@/application/ports/email";
import { formaterEuros } from "@/lib/format";

export interface EcheanceEmail {
  type: string;
  montantCentimes: number;
  exigibleLe: string;
}

export interface DonneesEmailReservation {
  ref: string;
  clientNom: string;
  logementNom: string;
  debut: string;
  fin: string;
  voyageurs: number;
  totalCentimes: number;
  acompteCentimes: number;
  soldeCentimes: number;
  lienGestion: string;
  echeances?: EcheanceEmail[];
}

const LIBELLES: Record<string, string> = {
  acompte: "Acompte",
  solde: "Solde",
  caution: "Caution",
};

export function libelleEcheance(type: string): string {
  return LIBELLES[type] ?? type;
}

/**
 * Lien de gestion voyageur : signé par HMAC côté route, jamais devinable.
 * Le chemin reste stable pour survivre aux changements d'UI.
 */
export function lienGestion(
  baseUrl: string,
  ref: string,
  tenantSlug: string,
): string {
  const base = baseUrl.replace(/\/+$/, "");
  return `${base}/reserver/${encodeURIComponent(ref)}?tenant=${encodeURIComponent(tenantSlug)}`;
}

export function messageConfirmation(
  donnees: DonneesEmailReservation,
): EmailMessage {
  const echeances = (donnees.echeances ?? [])
    .map(
      (echeance) =>
        `- ${libelleEcheance(echeance.type)} : ${formaterEuros(echeance.montantCentimes)} le ${echeance.exigibleLe}`,
    )
    .join("\n");

  const texte = [
    `Bonjour ${donnees.clientNom},`,
    "",
    `Votre réservation ${donnees.ref} pour ${donnees.logementNom} est confirmée.`,
    `Du ${donnees.debut} au ${donnees.fin}, ${donnees.voyageurs} voyageur(s).`,
    "",
    `Total du séjour : ${formaterEuros(donnees.totalCentimes)}`,
    `Acompte : ${formaterEuros(donnees.acompteCentimes)}`,
    `Solde : ${formaterEuros(donnees.soldeCentimes)}`,
    ...(echeances ? ["", "Échéances :", echeances] : []),
    "",
    `Gérer votre réservation et payer en ligne : ${donnees.lienGestion}`,
    "",
    "À bientôt,",
  ].join("\n");

  return {
    to: "",
    subject: `Réservation ${donnees.ref} confirmée — ${donnees.logementNom}`,
    text: texte,
  };
}

export function messageRelancePaiement(
  donnees: DonneesEmailReservation,
  echeance: EcheanceEmail,
  joursRestants: number,
): EmailMessage {
  const quand =
    joursRestants < 0
      ? `en retard depuis ${Math.abs(joursRestants)} jour(s)`
      : joursRestants === 0
        ? "à régler aujourd'hui"
        : `à régler sous ${joursRestants} jour(s)`;

  return {
    to: "",
    subject: `Réservation ${donnees.ref} — ${libelleEcheance(echeance.type)} ${quand}`,
    text: [
      `Bonjour ${donnees.clientNom},`,
      "",
      `Votre réservation ${donnees.ref} (${donnees.logementNom}, du ${donnees.debut} au ${donnees.fin}) comporte un ${libelleEcheance(echeance.type).toLowerCase()} de ${formaterEuros(echeance.montantCentimes)}, ${quand}.`,
      "",
      `Payer maintenant : ${donnees.lienGestion}`,
      "",
      "Si le paiement a été effectué récemment, ignorez ce message.",
    ].join("\n"),
  };
}

export function messageAnnulation(
  donnees: DonneesEmailReservation,
  montantRembourseCentimes: number,
  motif?: string,
): EmailMessage {
  return {
    to: "",
    subject: `Réservation ${donnees.ref} annulée`,
    text: [
      `Bonjour ${donnees.clientNom},`,
      "",
      `Votre réservation ${donnees.ref} pour ${donnees.logementNom} (du ${donnees.debut} au ${donnees.fin}) est annulée.`,
      `Montant remboursé : ${formaterEuros(montantRembourseCentimes)}`,
      ...(motif ? ["", `Motif : ${motif}`] : []),
      "",
      "À bientôt,",
    ].join("\n"),
  };
}

export function messagePanierAbandonne(
  donnees: Pick<
    DonneesEmailReservation,
    "ref" | "clientNom" | "logementNom" | "debut" | "fin" | "lienGestion"
  >,
): EmailMessage {
  return {
    to: "",
    subject: `Votre demande ${donnees.ref} vous attend — ${donnees.logementNom}`,
    text: [
      `Bonjour ${donnees.clientNom},`,
      "",
      `Votre demande de réservation ${donnees.ref} pour ${donnees.logementNom} (du ${donnees.debut} au ${donnees.fin}) n'est pas encore confirmée : le logement reste disponible pour d'autres voyageurs.`,
      "",
      `Reprendre et payer : ${donnees.lienGestion}`,
      "",
      "À bientôt,",
    ].join("\n"),
  };
}

/** Envoie un message préparé ; le destinataire est complété ici. */export async function envoyerEmailReservation(
  email: { envoyer: (message: EmailMessage) => Promise<void> },
  message: EmailMessage,
  destinataire: string,
): Promise<void> {
  await email.envoyer({ ...message, to: destinataire });
}
