// Dossier de contestation (chargeback) : composition factuelle, sans
// promesse juridique. Pur, testable sans base ni framework.

export interface PaiementLitige {
  date: string;
  mode: string;
  montantCentimes: number;
  reference: string | null;
}

export interface DossierLitigeInput {
  facture: {
    numero: string;
    dateEmission: string;
    montantTtcCentimes: number;
    statut: string;
  };
  clientNom: string;
  sejour: {
    ref: string;
    debut: string;
    fin: string;
    logement: string;
  } | null;
  paiements: readonly PaiementLitige[];
  motif: string;
  montantContesteCentimes: number;
  dateLitige: string;
  editeur: string;
}

export interface DossierLitige {
  reference: string;
  montantContesteCentimes: number;
  texte: string;
}

function euros(centimes: number): string {
  return `${(centimes / 100).toFixed(2).replace(".", ",")} €`;
}

function ligne(libelle: string, valeur: string): string {
  return `${libelle} : ${valeur}`;
}

/**
 * Compose un dossier lisible par une banque ou un service de médiation.
 * Le montant contesté ne peut jamais dépasser les paiements enregistrés :
 * un dossier qui réclame plus que ce qui a été encaissé serait incohérent.
 */
export function composerDossierLitige(input: DossierLitigeInput): DossierLitige {
  const totalPaye = input.paiements.reduce(
    (total, paiement) => total + paiement.montantCentimes,
    0,
  );
  const montant = Math.max(
    0,
    Math.min(input.montantContesteCentimes, totalPaye),
  );

  const sections = [
    "DOSSIER DE CONTESTATION DE PAIEMENT",
    "",
    ligne("Référence", `${input.facture.numero}-LITIGE`),
    ligne("Date du dossier", input.dateLitige),
    ligne("Éditeur", input.editeur),
    "",
    "1. CLIENT",
    ligne("Nom", input.clientNom),
    "",
    "2. SÉJOUR",
    input.sejour
      ? [
          ligne("Référence", input.sejour.ref),
          ligne("Logement", input.sejour.logement),
          ligne("Dates", `du ${input.sejour.debut} au ${input.sejour.fin}`),
        ].join("\n")
      : "Aucun séjour rattaché à cette facture.",
    "",
    "3. FACTURE",
    ligne("Numéro", input.facture.numero),
    ligne("Date d’émission", input.facture.dateEmission),
    ligne("Montant TTC", euros(input.facture.montantTtcCentimes)),
    ligne("Statut", input.facture.statut),
    "",
    "4. PAIEMENTS ENCAISSÉS",
    input.paiements.length === 0
      ? "Aucun paiement enregistré."
      : input.paiements
          .map((paiement) =>
            [
              ligne(
                "Paiement",
                `${paiement.date} · ${paiement.mode} · ${euros(paiement.montantCentimes)}`,
              ),
              paiement.reference
                ? ligne("Référence", paiement.reference)
                : null,
            ]
              .filter(Boolean)
              .join("\n"),
          )
          .join("\n\n"),
    "",
    "5. MONTANT CONTESTÉ",
    ligne("Montant", euros(montant)),
    ligne("Total encaissé", euros(totalPaye)),
    "",
    "6. MOTIF DE LA CONTESTATION",
    input.motif.trim() || "Motif à compléter par l’hôte.",
    "",
    "7. PIÈCES À JOINDRE",
    "- Contrat de séjour signé et conditions d’annulation.",
    "- Facture et justificatif de paiement.",
    "- Preuve d’exécution du séjour (messages, état des lieux, photos).",
    "- Échanges avec le client et réponse apportée à sa réclamation.",
    "",
    "Ce dossier est un support factuel. Il ne constitue ni une décision "
      + "juridique ni une reconnaissance de responsabilité.",
  ];

  return {
    reference: `${input.facture.numero}-LITIGE`,
    montantContesteCentimes: montant,
    texte: sections.join("\n"),
  };
}
