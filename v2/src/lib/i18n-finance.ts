import type { Langue } from "./i18n";
import { masquerFonctions, resoudreLangue } from "./i18n-staff";

export interface TraductionsFinance {
  titrePage: string;
  espace: string;
  titre: (mois: string) => string;
  description: string;
  precedent: string;
  courant: string;
  suivant: string;
  planning: string;
  creee: string;
  maj: string;
  erreurMaj: string;
  validationAttente: string;
  validationApprouvee: string;
  validationRejetee: string;
  validationSoi: string;
  validationErreur: string;
  doubleTitre: string;
  doubleAide: (seuil: string) => string;
  retenueLigne: (reservation: string, montant: string) => string;
  demandePar: (demandeur: string, date: string) => string;
  motifCourt: string;
  demandeurAvert: string;
  approuverAppliquer: string;
  motifRefus: string;
  rejeter: string;
  cautionsMois: string;
  montantTotal: string;
  retenu: string;
  creerTitre: string;
  creerAide: string;
  reservation: string;
  montant: string;
  notesFacultatif: string;
  creer: string;
  cautionsResas: string;
  aucuneResa: string;
  aucuneCaution: string;
  recueLe: (date: string) => string;
  clotureeLe: (date: string) => string;
  retenuLabel: (montant: string) => string;
  motifLabel: (motif: string) => string;
  aCreer: string;
  marquerRecue: string;
  restituer: string;
  retenue: string;
  motifPlaceholder: string;
  retenir: string;
  seuilAide: (seuil: string) => string;
  statuts: Record<string, string>;
  statutsSortie: Record<string, string>;
  sortiesTitrePage: string;
  sortieEspace: string;
  sortieTitre: string;
  sortieDescription: string;
  okDemande: string;
  okDecide: string;
  okPaye: string;
  nouvelle: string;
  beneficiaire: string;
  beneficiairePlaceholder: string;
  referenceOptionnel: string;
  referencePlaceholder: string;
  motifSortie: string;
  motifSortiePlaceholder: string;
  demander: string;
  registre: string;
  aucuneSortie: string;
  colDate: string;
  colType: string;
  colBeneficiaire: string;
  colMontant: string;
  colRef: string;
  colStatut: string;
  colDemandeur: string;
  colActions: string;
  payeeLe: (date: string) => string;
  approuver: string;
  attenteAutre: string;
  marquerPayee: string;
  compta: string;
  cautions: string;
  tableauBord: string;
}

const FR: TraductionsFinance = {
  titrePage: "Cautions — Espace hôte", espace: "Espace hôte",
  titre: (mois) => `Cautions — ${mois}`,
  description: "Dépôts de garantie des réservations du mois.",
  precedent: "← Mois précédent", courant: "Mois courant", suivant: "Mois suivant →",
  planning: "Planning", creee: "Caution créée.", maj: "Caution mise à jour.",
  erreurMaj: "Mise à jour refusée : vérifiez le montant retenu et le motif.",
  validationAttente: "Retenue enregistrée en attente : un second compte habilité doit l’approuver avant qu’elle soit appliquée.",
  validationApprouvee: "Retenue approuvée et appliquée.",
  validationRejetee: "Retenue rejetée : la caution est inchangée.",
  validationSoi: "Double validation : vous ne pouvez pas approuver votre propre demande.",
  validationErreur: "Validation impossible : la demande a peut-être déjà été traitée.",
  doubleTitre: "Double validation en attente",
  doubleAide: (seuil) => `Retenues supérieures ou égales à ${seuil}. Le demandeur ne peut jamais approuver sa propre demande.`,
  retenueLigne: (reservation, montant) => `${reservation} · retenue ${montant}`,
  demandePar: (demandeur, date) => `Demandé par ${demandeur} le ${date}`,
  motifCourt: "motif", demandeurAvert: "Vous êtes le demandeur : un autre administrateur ou comptable doit décider.",
  approuverAppliquer: "Approuver et appliquer", motifRefus: "Motif du refus (facultatif)",
  rejeter: "Rejeter", cautionsMois: "Cautions du mois", montantTotal: "Montant total",
  retenu: "Retenu", creerTitre: "Créer une caution", creerAide: "Une seule caution par réservation.",
  reservation: "Réservation", montant: "Montant (€)", notesFacultatif: "Notes (facultatif)",
  creer: "Créer la caution", cautionsResas: "Cautions et réservations",
  aucuneResa: "Aucune réservation sur ce mois.", aucuneCaution: "aucune caution",
  recueLe: (date) => `Reçue le ${date}`, clotureeLe: (date) => `Clôturée le ${date}`,
  retenuLabel: (montant) => `Retenu : ${montant}`, motifLabel: (motif) => `Motif : ${motif}`,
  aCreer: "à créer", marquerRecue: "Marquer reçue", restituer: "Restituer intégralement",
  retenue: "Retenue (€)", motifPlaceholder: "Dégât", retenir: "Retenir",
  seuilAide: (seuil) => `Une retenue ≥ ${seuil} part en double validation : elle ne sera appliquée qu’après approbation d’un autre compte administrateur ou comptable.`,
  statuts: { attendue: "attendue", recue: "reçue", restituee: "restituée", retenue: "retenue" },
  statutsSortie: { en_attente: "en attente", approuvee: "approuvée", rejetee: "rejetée", payee: "payée" },
  sortiesTitrePage: "Sorties d’argent — LCD Parc", sortieEspace: "Espace hôte · Finance",
  sortieTitre: "Sorties d’argent",
  sortieDescription: "Reversements, remboursements et gestes commerciaux passent par une double validation : le demandeur ne peut jamais approuver sa propre sortie. Une sortie approuvée est ensuite marquée payée après exécution.",
  okDemande: "Demande enregistrée. Elle attend un second validateur.",
  okDecide: "Décision enregistrée.", okPaye: "Sortie marquée payée.",
  nouvelle: "Nouvelle sortie", beneficiaire: "Bénéficiaire",
  beneficiairePlaceholder: "Nom ou raison sociale", referenceOptionnel: "Référence (optionnel)",
  referencePlaceholder: "Facture, séjour, devis…", motifSortie: "Motif",
  motifSortiePlaceholder: "Justification factuelle de la sortie",
  demander: "Demander la validation", registre: "Registre",
  aucuneSortie: "Aucune sortie enregistrée.", colDate: "Date", colType: "Type",
  colBeneficiaire: "Bénéficiaire", colMontant: "Montant", colRef: "Réf.",
  colStatut: "Statut", colDemandeur: "Demandeur", colActions: "Actions",
  payeeLe: (date) => `Payée le ${date}`, approuver: "Approuver",
  attenteAutre: "En attente d’un autre validateur", marquerPayee: "Marquer payée",
  compta: "Comptabilité", cautions: "Cautions", tableauBord: "Tableau de bord",
};

const EN: TraductionsFinance = {
  titrePage: "Deposits — Staff area", espace: "Staff area",
  titre: (mois) => `Deposits — ${mois}`,
  description: "Security deposits for the month’s bookings.",
  precedent: "← Previous month", courant: "Current month", suivant: "Next month →",
  planning: "Planning", creee: "Deposit created.", maj: "Deposit updated.",
  erreurMaj: "Update refused: check the withheld amount and reason.",
  validationAttente: "Withholding saved as pending: a second authorised account must approve it before it is applied.",
  validationApprouvee: "Withholding approved and applied.",
  validationRejetee: "Withholding rejected: the deposit is unchanged.",
  validationSoi: "Dual approval: you cannot approve your own request.",
  validationErreur: "Approval impossible: the request may already have been processed.",
  doubleTitre: "Pending dual approval",
  doubleAide: (seuil) => `Withholdings of ${seuil} or more. The requester can never approve their own request.`,
  retenueLigne: (reservation, montant) => `${reservation} · withholding ${montant}`,
  demandePar: (demandeur, date) => `Requested by ${demandeur} on ${date}`,
  motifCourt: "reason", demandeurAvert: "You are the requester: another administrator or accountant must decide.",
  approuverAppliquer: "Approve and apply", motifRefus: "Rejection reason (optional)",
  rejeter: "Reject", cautionsMois: "Deposits this month", montantTotal: "Total amount",
  retenu: "Withheld", creerTitre: "Create a deposit", creerAide: "One deposit per booking.",
  reservation: "Booking", montant: "Amount (€)", notesFacultatif: "Notes (optional)",
  creer: "Create deposit", cautionsResas: "Deposits and bookings",
  aucuneResa: "No booking this month.", aucuneCaution: "no deposit",
  recueLe: (date) => `Received on ${date}`, clotureeLe: (date) => `Closed on ${date}`,
  retenuLabel: (montant) => `Withheld: ${montant}`, motifLabel: (motif) => `Reason: ${motif}`,
  aCreer: "to create", marquerRecue: "Mark received", restituer: "Return in full",
  retenue: "Withholding (€)", motifPlaceholder: "Damage", retenir: "Withhold",
  seuilAide: (seuil) => `A withholding of ${seuil} or more goes to dual approval: it is applied only after another administrator or accountant account approves it.`,
  statuts: { attendue: "expected", recue: "received", restituee: "returned", retenue: "withheld" },
  statutsSortie: { en_attente: "pending", approuvee: "approved", rejetee: "rejected", payee: "paid" },
  sortiesTitrePage: "Money out — LCD Parc", sortieEspace: "Staff area · Finance",
  sortieTitre: "Money out",
  sortieDescription: "Transfers, refunds and goodwill gestures require dual approval: the requester can never approve their own payment. An approved payment is then marked paid after execution.",
  okDemande: "Request saved. It is waiting for a second approver.",
  okDecide: "Decision saved.", okPaye: "Payment marked paid.",
  nouvelle: "New payment", beneficiaire: "Payee",
  beneficiairePlaceholder: "Name or company", referenceOptionnel: "Reference (optional)",
  referencePlaceholder: "Invoice, stay, quote…", motifSortie: "Reason",
  motifSortiePlaceholder: "Factual justification for the payment",
  demander: "Request approval", registre: "Ledger",
  aucuneSortie: "No payment recorded.", colDate: "Date", colType: "Type",
  colBeneficiaire: "Payee", colMontant: "Amount", colRef: "Ref.",
  colStatut: "Status", colDemandeur: "Requester", colActions: "Actions",
  payeeLe: (date) => `Paid on ${date}`, approuver: "Approve",
  attenteAutre: "Waiting for another approver", marquerPayee: "Mark paid",
  compta: "Accounting", cautions: "Deposits", tableauBord: "Dashboard",
};

const ES: TraductionsFinance = {
  titrePage: "Fianzas — Área profesional", espace: "Área profesional",
  titre: (mois) => `Fianzas — ${mois}`,
  description: "Depósitos de garantía de las reservas del mes.",
  precedent: "← Mes anterior", courant: "Mes actual", suivant: "Mes siguiente →",
  planning: "Planificación", creee: "Fianza creada.", maj: "Fianza actualizada.",
  erreurMaj: "Actualización rechazada: compruebe el importe retenido y el motivo.",
  validationAttente: "Retención guardada pendiente: una segunda cuenta autorizada debe aprobarla antes de aplicarla.",
  validationApprouvee: "Retención aprobada y aplicada.",
  validationRejetee: "Retención rechazada: la fianza no cambia.",
  validationSoi: "Doble validación: no puede aprobar su propia solicitud.",
  validationErreur: "Validación imposible: puede que la solicitud ya se haya tratado.",
  doubleTitre: "Doble validación pendiente",
  doubleAide: (seuil) => `Retenciones iguales o superiores a ${seuil}. El solicitante nunca puede aprobar su propia solicitud.`,
  retenueLigne: (reservation, montant) => `${reservation} · retención ${montant}`,
  demandePar: (demandeur, date) => `Solicitado por ${demandeur} el ${date}`,
  motifCourt: "motivo", demandeurAvert: "Usted es el solicitante: otro administrador o contable debe decidir.",
  approuverAppliquer: "Aprobar y aplicar", motifRefus: "Motivo del rechazo (opcional)",
  rejeter: "Rechazar", cautionsMois: "Fianzas del mes", montantTotal: "Importe total",
  retenu: "Retenido", creerTitre: "Crear una fianza", creerAide: "Una sola fianza por reserva.",
  reservation: "Reserva", montant: "Importe (€)", notesFacultatif: "Notas (opcional)",
  creer: "Crear fianza", cautionsResas: "Fianzas y reservas",
  aucuneResa: "Ninguna reserva este mes.", aucuneCaution: "ninguna fianza",
  recueLe: (date) => `Recibida el ${date}`, clotureeLe: (date) => `Cerrada el ${date}`,
  retenuLabel: (montant) => `Retenido: ${montant}`, motifLabel: (motif) => `Motivo: ${motif}`,
  aCreer: "por crear", marquerRecue: "Marcar recibida", restituer: "Restituir íntegramente",
  retenue: "Retención (€)", motifPlaceholder: "Daño", retenir: "Retener",
  seuilAide: (seuil) => `Una retención ≥ ${seuil} pasa a doble validación: solo se aplicará tras la aprobación de otra cuenta de administrador o contable.`,
  statuts: { attendue: "pendiente", recue: "recibida", restituee: "restituida", retenue: "retenida" },
  statutsSortie: { en_attente: "pendiente", approuvee: "aprobada", rejetee: "rechazada", payee: "pagada" },
  sortiesTitrePage: "Salidas de dinero — LCD Parc", sortieEspace: "Área profesional · Finanzas",
  sortieTitre: "Salidas de dinero",
  sortieDescription: "Transferencias, reembolsos y gestos comerciales pasan por doble validación: el solicitante nunca puede aprobar su propia salida. Una salida aprobada se marca pagada tras su ejecución.",
  okDemande: "Solicitud guardada. Espera un segundo validador.",
  okDecide: "Decisión guardada.", okPaye: "Salida marcada como pagada.",
  nouvelle: "Nueva salida", beneficiaire: "Beneficiario",
  beneficiairePlaceholder: "Nombre o razón social", referenceOptionnel: "Referencia (opcional)",
  referencePlaceholder: "Factura, estancia, presupuesto…", motifSortie: "Motivo",
  motifSortiePlaceholder: "Justificación fáctica de la salida",
  demander: "Solicitar validación", registre: "Registro",
  aucuneSortie: "Ninguna salida registrada.", colDate: "Fecha", colType: "Tipo",
  colBeneficiaire: "Beneficiario", colMontant: "Importe", colRef: "Ref.",
  colStatut: "Estado", colDemandeur: "Solicitante", colActions: "Acciones",
  payeeLe: (date) => `Pagada el ${date}`, approuver: "Aprobar",
  attenteAutre: "Esperando otro validador", marquerPayee: "Marcar pagada",
  compta: "Contabilidad", cautions: "Fianzas", tableauBord: "Panel",
};

const IT: TraductionsFinance = {
  titrePage: "Cauzioni — Area professionale", espace: "Area professionale",
  titre: (mois) => `Cauzioni — ${mois}`,
  description: "Depositi cauzionali delle prenotazioni del mese.",
  precedent: "← Mese precedente", courant: "Mese corrente", suivant: "Mese successivo →",
  planning: "Pianificazione", creee: "Cauzione creata.", maj: "Cauzione aggiornata.",
  erreurMaj: "Aggiornamento rifiutato: verifichi l’importo trattenuto e il motivo.",
  validationAttente: "Trattenuta salvata in attesa: un secondo account abilitato deve approvarla prima dell’applicazione.",
  validationApprouvee: "Trattenuta approvata e applicata.",
  validationRejetee: "Trattenuta rifiutata: la cauzione resta invariata.",
  validationSoi: "Doppia convalida: non può approvare la propria richiesta.",
  validationErreur: "Convalida impossibile: la richiesta potrebbe essere già stata gestita.",
  doubleTitre: "Doppia convalida in attesa",
  doubleAide: (seuil) => `Trattenute pari o superiori a ${seuil}. Il richiedente non può mai approvare la propria richiesta.`,
  retenueLigne: (reservation, montant) => `${reservation} · trattenuta ${montant}`,
  demandePar: (demandeur, date) => `Richiesto da ${demandeur} il ${date}`,
  motifCourt: "motivo", demandeurAvert: "Lei è il richiedente: un altro amministratore o contabile deve decidere.",
  approuverAppliquer: "Approva e applica", motifRefus: "Motivo del rifiuto (facoltativo)",
  rejeter: "Rifiuta", cautionsMois: "Cauzioni del mese", montantTotal: "Importo totale",
  retenu: "Trattenuto", creerTitre: "Crea una cauzione", creerAide: "Una sola cauzione per prenotazione.",
  reservation: "Prenotazione", montant: "Importo (€)", notesFacultatif: "Note (facoltativo)",
  creer: "Crea cauzione", cautionsResas: "Cauzioni e prenotazioni",
  aucuneResa: "Nessuna prenotazione questo mese.", aucuneCaution: "nessuna cauzione",
  recueLe: (date) => `Ricevuta il ${date}`, clotureeLe: (date) => `Chiusa il ${date}`,
  retenuLabel: (montant) => `Trattenuto: ${montant}`, motifLabel: (motif) => `Motivo: ${motif}`,
  aCreer: "da creare", marquerRecue: "Segna ricevuta", restituer: "Restituisci integralmente",
  retenue: "Trattenuta (€)", motifPlaceholder: "Danno", retenir: "Trattieni",
  seuilAide: (seuil) => `Una trattenuta ≥ ${seuil} passa alla doppia convalida: sarà applicata solo dopo l’approvazione di un altro account amministratore o contabile.`,
  statuts: { attendue: "attesa", recue: "ricevuta", restituee: "restituita", retenue: "trattenuta" },
  statutsSortie: { en_attente: "in attesa", approuvee: "approvata", rejetee: "rifiutata", payee: "pagata" },
  sortiesTitrePage: "Uscite di denaro — LCD Parc", sortieEspace: "Area professionale · Finanza",
  sortieTitre: "Uscite di denaro",
  sortieDescription: "Trasferimenti, rimborsi e gesti commerciali richiedono doppia convalida: il richiedente non può mai approvare la propria uscita. Un’uscita approvata viene poi segnata pagata dopo l’esecuzione.",
  okDemande: "Richiesta salvata. Attende un secondo validatore.",
  okDecide: "Decisione salvata.", okPaye: "Uscita segnata come pagata.",
  nouvelle: "Nuova uscita", beneficiaire: "Beneficiario",
  beneficiairePlaceholder: "Nome o ragione sociale", referenceOptionnel: "Riferimento (facoltativo)",
  referencePlaceholder: "Fattura, soggiorno, preventivo…", motifSortie: "Motivo",
  motifSortiePlaceholder: "Giustificazione fattuale dell’uscita",
  demander: "Richiedi convalida", registre: "Registro",
  aucuneSortie: "Nessuna uscita registrata.", colDate: "Data", colType: "Tipo",
  colBeneficiaire: "Beneficiario", colMontant: "Importo", colRef: "Rif.",
  colStatut: "Stato", colDemandeur: "Richiedente", colActions: "Azioni",
  payeeLe: (date) => `Pagata il ${date}`, approuver: "Approva",
  attenteAutre: "In attesa di un altro validatore", marquerPayee: "Segna pagata",
  compta: "Contabilità", cautions: "Cauzioni", tableauBord: "Dashboard",
};

const DE: TraductionsFinance = {
  titrePage: "Kautionen — Profibereich", espace: "Profibereich",
  titre: (mois) => `Kautionen — ${mois}`,
  description: "Sicherheitsleistungen der Buchungen des Monats.",
  precedent: "← Vorheriger Monat", courant: "Aktueller Monat", suivant: "Nächster Monat →",
  planning: "Planung", creee: "Kaution erstellt.", maj: "Kaution aktualisiert.",
  erreurMaj: "Aktualisierung abgelehnt: Prüfen Sie Einbehalt und Grund.",
  validationAttente: "Einbehalt als ausstehend gespeichert: Ein zweites berechtigtes Konto muss ihn vor der Anwendung genehmigen.",
  validationApprouvee: "Einbehalt genehmigt und angewendet.",
  validationRejetee: "Einbehalt abgelehnt: Die Kaution bleibt unverändert.",
  validationSoi: "Doppelte Freigabe: Sie können Ihren eigenen Antrag nicht genehmigen.",
  validationErreur: "Freigabe nicht möglich: Der Antrag wurde möglicherweise bereits bearbeitet.",
  doubleTitre: "Ausstehende doppelte Freigabe",
  doubleAide: (seuil) => `Einbehalte ab ${seuil}. Der Antragsteller kann seinen eigenen Antrag nie genehmigen.`,
  retenueLigne: (reservation, montant) => `${reservation} · Einbehalt ${montant}`,
  demandePar: (demandeur, date) => `Beantragt von ${demandeur} am ${date}`,
  motifCourt: "Grund", demandeurAvert: "Sie sind der Antragsteller: Ein anderer Administrator oder Buchhalter muss entscheiden.",
  approuverAppliquer: "Genehmigen und anwenden", motifRefus: "Ablehnungsgrund (optional)",
  rejeter: "Ablehnen", cautionsMois: "Kautionen des Monats", montantTotal: "Gesamtbetrag",
  retenu: "Einbehalten", creerTitre: "Kaution erstellen", creerAide: "Eine Kaution pro Buchung.",
  reservation: "Buchung", montant: "Betrag (€)", notesFacultatif: "Notizen (optional)",
  creer: "Kaution erstellen", cautionsResas: "Kautionen und Buchungen",
  aucuneResa: "Keine Buchung in diesem Monat.", aucuneCaution: "keine Kaution",
  recueLe: (date) => `Erhalten am ${date}`, clotureeLe: (date) => `Abgeschlossen am ${date}`,
  retenuLabel: (montant) => `Einbehalten: ${montant}`, motifLabel: (motif) => `Grund: ${motif}`,
  aCreer: "zu erstellen", marquerRecue: "Als erhalten markieren", restituer: "Vollständig zurückzahlen",
  retenue: "Einbehalt (€)", motifPlaceholder: "Schaden", retenir: "Einbehalten",
  seuilAide: (seuil) => `Ein Einbehalt ab ${seuil} geht in die doppelte Freigabe: Er wird erst nach Genehmigung durch ein anderes Administrator- oder Buchhalterkonto angewendet.`,
  statuts: { attendue: "erwartet", recue: "erhalten", restituee: "zurückgezahlt", retenue: "einbehalten" },
  statutsSortie: { en_attente: "ausstehend", approuvee: "genehmigt", rejetee: "abgelehnt", payee: "bezahlt" },
  sortiesTitrePage: "Geldausgänge — LCD Parc", sortieEspace: "Profibereich · Finanzen",
  sortieTitre: "Geldausgänge",
  sortieDescription: "Überweisungen, Rückerstattungen und Kulanzleistungen erfordern eine doppelte Freigabe: Der Antragsteller kann seine eigene Ausgabe nie genehmigen. Eine genehmigte Ausgabe wird nach Ausführung als bezahlt markiert.",
  okDemande: "Antrag gespeichert. Er wartet auf einen zweiten Prüfer.",
  okDecide: "Entscheidung gespeichert.", okPaye: "Ausgabe als bezahlt markiert.",
  nouvelle: "Neue Ausgabe", beneficiaire: "Empfänger",
  beneficiairePlaceholder: "Name oder Firma", referenceOptionnel: "Referenz (optional)",
  referencePlaceholder: "Rechnung, Aufenthalt, Angebot…", motifSortie: "Grund",
  motifSortiePlaceholder: "Sachliche Begründung der Ausgabe",
  demander: "Freigabe beantragen", registre: "Register",
  aucuneSortie: "Keine Ausgabe erfasst.", colDate: "Datum", colType: "Typ",
  colBeneficiaire: "Empfänger", colMontant: "Betrag", colRef: "Ref.",
  colStatut: "Status", colDemandeur: "Antragsteller", colActions: "Aktionen",
  payeeLe: (date) => `Bezahlt am ${date}`, approuver: "Genehmigen",
  attenteAutre: "Warten auf einen anderen Prüfer", marquerPayee: "Als bezahlt markieren",
  compta: "Buchhaltung", cautions: "Kautionen", tableauBord: "Dashboard",
};

const DICTIONNAIRES: Record<Langue, TraductionsFinance> = {
  fr: FR, en: EN, es: ES, it: IT, de: DE,
};

export function traductionsFinance(langue: string): TraductionsFinance {
  return masquerFonctions(DICTIONNAIRES[resoudreLangue(langue)]);
}
