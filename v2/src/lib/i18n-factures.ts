import type { Langue } from "./i18n";
import { masquerFonctions, resoudreLangue } from "./i18n-staff";

export interface TraductionsFactures {
  titrePage: string;
  espace: string;
  titre: (mois: string) => string;
  resume: (n: number, total: string) => string;
  retour: string;
  precedent: string;
  courant: string;
  suivant: string;
  exportCsv: string;
  aRelancer: (n: number) => string;
  aRelancerAide: string;
  relancer: string;
  relancerBtn: string;
  creer: string;
  creerVide: string;
  gererLogements: string;
  creerAide: string;
  logement: string;
  reservationFacultatif: string;
  aucune: string;
  sansNom: string;
  numero: string;
  dateEmission: string;
  client: string;
  clientPlaceholder: string;
  emailClient: string;
  designation: string;
  designationPlaceholder: string;
  quantite: string;
  prixUnitaire: string;
  echeance: string;
  tva: string;
  taxeSejour: string;
  notes: string;
  auto: string;
  creerBtn: string;
  duMois: string;
  aucuneFacture: string;
  planning: string;
  tableauBord: string;
  retourAuxFactures: string;
  facture: string;
  litige: string;
  imprimer: string;
  emiseLe: (date: string) => string;
  echeanceLe: (date: string) => string;
  conciergerie: string;
  statut: string;
  designationCol: string;
  qte: string;
  pu: string;
  total: string;
  totalHt: string;
  tvaLigne: string;
  taxeLigne: string;
  totalTtc: string;
  dejaPaye: string;
  resteAPayer: string;
  piedFacture: string;
  paiements: string;
  encaisses: (paye: string, reste: string) => string;
  aucunEncaissement: string;
  encaisser: string;
  encaisserAide: string;
  montant: string;
  mode: string;
  virement: string;
  cb: string;
  especes: string;
  cheque: string;
  stripe: string;
  datePaiement: string;
  reference: string;
  enregistrerPaiement: string;
  emettrePourPayer: string;
  soldee: string;
  partage: string;
  partageAide: string;
  lienFacture: string;
  ouvrirClient: string;
  envoyerEmail: string;
  smtpOff: string;
  destinataire: string;
  envoyer: string;
  relancerEmail: string;
  emettrePourLien: string;
  statuts: Record<string, string>;
  litigeTitrePage: (numero: string) => string;
  litigeSurtitre: (numero: string) => string;
  litigeTitre: string;
  litigeDescription: string;
  litigeStripeOk: string;
  litigeEnregistre: string;
  litigeStripeErreur: string;
  litigeEchec: string;
  kpiFacture: string;
  kpiEncaisse: string;
  kpiConteste: string;
  paiementsEnregistres: string;
  plafonne: string;
  parametresDossier: string;
  parametresAide: string;
  retourFacture: string;
  dateDossier: string;
  montantConteste: string;
  laisserVide: string;
  motif: string;
  motifPlaceholder: string;
  actualiser: string;
  dossierPreFilli: string;
  dossierAide: string;
  imprimerBtn: string;
  enregistrerAudit: string;
  texteDossier: string;
  stripeTitre: string;
  stripeAide: string;
  stripeId: string;
  envoyerFermer: string;
  pieces: string;
}

const FR: TraductionsFactures = {
  titrePage: "Factures — LCD Parc", espace: "Espace hôte",
  titre: (mois) => `Factures — ${mois}`,
  resume: (n, total) => `${n} facture${n > 1 ? "s" : ""} · ${total} TTC`,
  retour: "Retour au tableau de bord", precedent: "← Mois précédent",
  courant: "Mois courant", suivant: "Mois suivant →", exportCsv: "Export CSV",
  aRelancer: (n) => `${n} facture${n > 1 ? "s" : ""} émise${n > 1 ? "s" : ""} échue${n > 1 ? "s" : ""} restent à relancer aujourd’hui.`,
  aRelancerAide: "Un seul email par facture et par jour, même si vous cliquez plusieurs fois. Les factures soldées et sans email valide sont ignorées.",
  relancer: "Relancer les factures échues", relancerBtn: "Relancer les factures échues",
  creer: "Créer une facture", creerVide: "Créez d’abord un logement pour facturer.",
  gererLogements: "Gérer les logements",
  creerAide: "Les totaux HT/TTC sont calculés à partir des lignes. Laissez la TVA et la taxe de séjour vides pour appliquer automatiquement les paramètres fiscaux. La facture est créée en brouillon.",
  logement: "Logement", reservationFacultatif: "Réservation (facultatif)",
  aucune: "Aucune", sansNom: "Sans nom", numero: "Numéro",
  dateEmission: "Date d’émission", client: "Client",
  clientPlaceholder: "Requis hors réservation liée", emailClient: "E-mail client",
  designation: "Désignation", designationPlaceholder: "Séjour — 5 nuits",
  quantite: "Quantité", prixUnitaire: "Prix unitaire (€)", echeance: "Échéance",
  tva: "TVA (€, facultatif)", taxeSejour: "Taxe de séjour (€, facultatif)",
  notes: "Notes", auto: "Auto", creerBtn: "Créer la facture",
  duMois: "Factures du mois", aucuneFacture: "Aucune facture sur ce mois.",
  planning: "Planning", tableauBord: "Tableau de bord",
  retourAuxFactures: "← Retour aux factures", facture: "Facture", litige: "Dossier de litige",
  imprimer: "Ctrl+P pour imprimer", emiseLe: (date) => `Émise le ${date}`,
  echeanceLe: (date) => `échéance ${date}`, conciergerie: "Conciergerie locative",
  statut: "Statut", designationCol: "Désignation", qte: "Qté", pu: "P.U.", total: "Total",
  totalHt: "Total HT", tvaLigne: "TVA", taxeLigne: "Taxe de séjour", totalTtc: "Total TTC",
  dejaPaye: "Déjà payé", resteAPayer: "Reste à payer",
  piedFacture: "Document généré par LCD Parc. La taxe de séjour est suivie séparément du chiffre d’affaires.",
  paiements: "Paiements", encaisses: (paye, reste) => `${paye} encaissés · ${reste} restants`,
  aucunEncaissement: "Aucun encaissement enregistré.", encaisser: "Encaisser un paiement",
  encaisserAide: "Le paiement est idempotent ; la facture passe en « payée » quand le solde est atteint.",
  montant: "Montant (€)", mode: "Mode", virement: "Virement", cb: "Carte bancaire",
  especes: "Espèces", cheque: "Chèque", stripe: "Stripe", datePaiement: "Date",
  reference: "Référence", enregistrerPaiement: "Enregistrer le paiement",
  emettrePourPayer: "Émettez la facture pour pouvoir enregistrer un paiement.",
  soldee: "Facture soldée.", partage: "Partage client",
  partageAide: "Lien signé, valable 90 jours, consultable sans compte et sans JavaScript.",
  lienFacture: "Lien de la facture", ouvrirClient: "Ouvrir la facture client",
  envoyerEmail: "Envoyer par e-mail",
  smtpOff: "SMTP désactivé : l’envoi échouera tant que EMAIL_ENABLED n’est pas activé.",
  destinataire: "Destinataire", envoyer: "Envoyer la facture",
  relancerEmail: "Relancer par email",
  emettrePourLien: "Émettez la facture pour générer le lien client et l’envoyer par e-mail.",
  statuts: { brouillon: "Remettre en brouillon", emise: "Marquer émise", payee: "Marquer payée", annulee: "Annuler la facture" },
  litigeTitrePage: (n) => `Dossier de litige — ${n}`,
  litigeSurtitre: (n) => `Espace hôte · Facture ${n}`,
  litigeTitre: "Dossier de contestation",
  litigeDescription: "Support factuel pour une banque, un service de médiation ou une réclamation client. Aucune décision juridique n’est prise ici.",
  litigeStripeOk: "Réponse envoyée à Stripe et litige clôturé. Vérifiez le statut dans le tableau de bord Stripe.",
  litigeEnregistre: "Dossier enregistré dans le journal d’audit.",
  litigeStripeErreur: "Envoi Stripe impossible. Vérifiez l’identifiant dp_…, la clé Stripe et l’échéance du litige.",
  litigeEchec: "L’enregistrement a échoué. Réessayez.",
  kpiFacture: "Facture", kpiEncaisse: "Encaissé", kpiConteste: "Montant contesté",
  paiementsEnregistres: "paiements enregistrés", plafonne: "plafonné à l’encaissé",
  parametresDossier: "Paramètres du dossier",
  parametresAide: "Le montant contesté ne peut pas dépasser les paiements réellement encaissés.",
  retourFacture: "Retour à la facture", dateDossier: "Date du dossier",
  montantConteste: "Montant contesté (€)",
  laisserVide: "Laisser vide pour contester tout l’encaissé.",
  motif: "Motif de la contestation",
  motifPlaceholder: "Ex. Le client conteste la taxe de séjour ; le séjour a bien été exécuté du 5 au 12 octobre.",
  actualiser: "Actualiser le dossier", dossierPreFilli: "Dossier pré-rempli",
  dossierAide: "Copiez ce texte dans votre réponse à la banque ou imprimez-le avec les pièces justificatives.",
  imprimerBtn: "Imprimer", enregistrerAudit: "Enregistrer dans l’audit",
  texteDossier: "Texte du dossier", stripeTitre: "Réponse Stripe",
  stripeAide: "Collez l’identifiant du litige reçu par Stripe. Le texte du dossier est envoyé comme preuve écrite, puis le litige est clôturé.",
  stripeId: "Identifiant du litige Stripe", envoyerFermer: "Envoyer la réponse et clôturer",
  pieces: "Les pièces jointes (contrat, facture, photos) restent à ajouter dans l’interface Stripe si le dossier en contient.",
};

const EN: TraductionsFactures = {
  titrePage: "Invoices — LCD Parc", espace: "Staff area",
  titre: (mois) => `Invoices — ${mois}`,
  resume: (n, total) => `${n} invoice${n === 1 ? "" : "s"} · ${total} incl. tax`,
  retour: "Back to dashboard", precedent: "← Previous month",
  courant: "Current month", suivant: "Next month →", exportCsv: "CSV export",
  aRelancer: (n) => `${n} issued overdue invoice${n === 1 ? "" : "s"} still to remind today.`,
  aRelancerAide: "One email per invoice per day, even if you click several times. Paid invoices and invalid emails are ignored.",
  relancer: "Remind overdue invoices", relancerBtn: "Remind overdue invoices",
  creer: "Create an invoice", creerVide: "Create a property first to invoice.",
  gererLogements: "Manage properties",
  creerAide: "Excl./incl. tax totals are computed from the lines. Leave VAT and tourist tax empty to apply the tax settings automatically. The invoice is created as a draft.",
  logement: "Property", reservationFacultatif: "Booking (optional)",
  aucune: "None", sansNom: "Unnamed", numero: "Number",
  dateEmission: "Issue date", client: "Client",
  clientPlaceholder: "Required without a linked booking", emailClient: "Client email",
  designation: "Description", designationPlaceholder: "Stay — 5 nights",
  quantite: "Quantity", prixUnitaire: "Unit price (€)", echeance: "Due date",
  tva: "VAT (€, optional)", taxeSejour: "Tourist tax (€, optional)",
  notes: "Notes", auto: "Auto", creerBtn: "Create invoice",
  duMois: "Invoices this month", aucuneFacture: "No invoice this month.",
  planning: "Planning", tableauBord: "Dashboard",
  retourAuxFactures: "← Back to invoices", facture: "Invoice", litige: "Dispute file",
  imprimer: "Ctrl+P to print", emiseLe: (date) => `Issued on ${date}`,
  echeanceLe: (date) => `due ${date}`, conciergerie: "Rental concierge",
  statut: "Status", designationCol: "Description", qte: "Qty", pu: "Unit", total: "Total",
  totalHt: "Total excl. tax", tvaLigne: "VAT", taxeLigne: "Tourist tax", totalTtc: "Total incl. tax",
  dejaPaye: "Already paid", resteAPayer: "Balance due",
  piedFacture: "Document generated by LCD Parc. Tourist tax is tracked separately from revenue.",
  paiements: "Payments", encaisses: (paye, reste) => `${paye} received · ${reste} remaining`,
  aucunEncaissement: "No payment recorded.", encaisser: "Record a payment",
  encaisserAide: "The payment is idempotent; the invoice becomes “paid” when the balance reaches zero.",
  montant: "Amount (€)", mode: "Method", virement: "Bank transfer", cb: "Card",
  especes: "Cash", cheque: "Cheque", stripe: "Stripe", datePaiement: "Date",
  reference: "Reference", enregistrerPaiement: "Save payment",
  emettrePourPayer: "Issue the invoice before recording a payment.",
  soldee: "Invoice paid.", partage: "Client sharing",
  partageAide: "Signed link, valid for 90 days, viewable without an account or JavaScript.",
  lienFacture: "Invoice link", ouvrirClient: "Open client invoice",
  envoyerEmail: "Send by email",
  smtpOff: "SMTP disabled: sending will fail until EMAIL_ENABLED is turned on.",
  destinataire: "Recipient", envoyer: "Send invoice",
  relancerEmail: "Remind by email",
  emettrePourLien: "Issue the invoice to generate the client link and send it by email.",
  statuts: { brouillon: "Back to draft", emise: "Mark issued", payee: "Mark paid", annulee: "Cancel invoice" },
  litigeTitrePage: (n) => `Dispute file — ${n}`,
  litigeSurtitre: (n) => `Staff area · Invoice ${n}`,
  litigeTitre: "Dispute file",
  litigeDescription: "Factual support for a bank, mediation service or client complaint. No legal decision is made here.",
  litigeStripeOk: "Response sent to Stripe and dispute closed. Check the status in the Stripe dashboard.",
  litigeEnregistre: "File saved to the audit log.",
  litigeStripeErreur: "Stripe send failed. Check the dp_… ID, the Stripe key and the dispute deadline.",
  litigeEchec: "Saving failed. Try again.",
  kpiFacture: "Invoice", kpiEncaisse: "Received", kpiConteste: "Disputed amount",
  paiementsEnregistres: "recorded payments", plafonne: "capped at received amount",
  parametresDossier: "File settings",
  parametresAide: "The disputed amount cannot exceed payments actually received.",
  retourFacture: "Back to invoice", dateDossier: "File date",
  montantConteste: "Disputed amount (€)",
  laisserVide: "Leave empty to dispute everything received.",
  motif: "Reason for dispute",
  motifPlaceholder: "E.g. The client disputes the tourist tax; the stay did take place from 5 to 12 October.",
  actualiser: "Refresh file", dossierPreFilli: "Pre-filled file",
  dossierAide: "Copy this text into your reply to the bank or print it with the supporting documents.",
  imprimerBtn: "Print", enregistrerAudit: "Save to audit",
  texteDossier: "File text", stripeTitre: "Stripe response",
  stripeAide: "Paste the dispute ID received from Stripe. The file text is sent as written evidence, then the dispute is closed.",
  stripeId: "Stripe dispute ID", envoyerFermer: "Send response and close",
  pieces: "Attachments (contract, invoice, photos) must still be added in the Stripe interface if the file contains any.",
};

const ES: TraductionsFactures = {
  titrePage: "Facturas — LCD Parc", espace: "Área profesional",
  titre: (mois) => `Facturas — ${mois}`,
  resume: (n, total) => `${n} factura${n === 1 ? "" : "s"} · ${total} IVA incl.`,
  retour: "Volver al panel", precedent: "← Mes anterior",
  courant: "Mes actual", suivant: "Mes siguiente →", exportCsv: "Exportar CSV",
  aRelancer: (n) => `Quedan ${n} factura${n === 1 ? "" : "s"} emitida${n === 1 ? "" : "s"} vencida${n === 1 ? "" : "s"} por reclamar hoy.`,
  aRelancerAide: "Un solo correo por factura y día, aunque haga clic varias veces. Las facturas pagadas y sin correo válido se ignoran.",
  relancer: "Reclamar facturas vencidas", relancerBtn: "Reclamar facturas vencidas",
  creer: "Crear una factura", creerVide: "Cree primero un alojamiento para facturar.",
  gererLogements: "Gestionar alojamientos",
  creerAide: "Los totales sin/con IVA se calculan desde las líneas. Deje el IVA y la tasa turística vacíos para aplicar automáticamente los parámetros fiscales. La factura se crea en borrador.",
  logement: "Alojamiento", reservationFacultatif: "Reserva (opcional)",
  aucune: "Ninguna", sansNom: "Sin nombre", numero: "Número",
  dateEmission: "Fecha de emisión", client: "Cliente",
  clientPlaceholder: "Obligatorio sin reserva vinculada", emailClient: "Correo del cliente",
  designation: "Descripción", designationPlaceholder: "Estancia — 5 noches",
  quantite: "Cantidad", prixUnitaire: "Precio unitario (€)", echeance: "Vencimiento",
  tva: "IVA (€, opcional)", taxeSejour: "Tasa turística (€, opcional)",
  notes: "Notas", auto: "Auto", creerBtn: "Crear factura",
  duMois: "Facturas del mes", aucuneFacture: "Ninguna factura este mes.",
  planning: "Planificación", tableauBord: "Panel",
  retourAuxFactures: "← Volver a las facturas", facture: "Factura", litige: "Expediente de litigio",
  imprimer: "Ctrl+P para imprimir", emiseLe: (date) => `Emitida el ${date}`,
  echeanceLe: (date) => `vencimiento ${date}`, conciergerie: "Conserjería de alquiler",
  statut: "Estado", designationCol: "Descripción", qte: "Cant.", pu: "P.U.", total: "Total",
  totalHt: "Total sin IVA", tvaLigne: "IVA", taxeLigne: "Tasa turística", totalTtc: "Total con IVA",
  dejaPaye: "Ya pagado", resteAPayer: "Pendiente",
  piedFacture: "Documento generado por LCD Parc. La tasa turística se controla por separado de la facturación.",
  paiements: "Pagos", encaisses: (paye, reste) => `${paye} cobrados · ${reste} pendientes`,
  aucunEncaissement: "Ningún cobro registrado.", encaisser: "Registrar un pago",
  encaisserAide: "El pago es idempotente; la factura pasa a «pagada» cuando el saldo llega a cero.",
  montant: "Importe (€)", mode: "Modo", virement: "Transferencia", cb: "Tarjeta",
  especes: "Efectivo", cheque: "Cheque", stripe: "Stripe", datePaiement: "Fecha",
  reference: "Referencia", enregistrerPaiement: "Guardar pago",
  emettrePourPayer: "Emita la factura para poder registrar un pago.",
  soldee: "Factura pagada.", partage: "Compartir con el cliente",
  partageAide: "Enlace firmado, válido 90 días, consultable sin cuenta y sin JavaScript.",
  lienFacture: "Enlace de la factura", ouvrirClient: "Abrir factura del cliente",
  envoyerEmail: "Enviar por correo",
  smtpOff: "SMTP desactivado: el envío fallará mientras EMAIL_ENABLED no esté activo.",
  destinataire: "Destinatario", envoyer: "Enviar factura",
  relancerEmail: "Reclamar por correo",
  emettrePourLien: "Emita la factura para generar el enlace del cliente y enviarlo por correo.",
  statuts: { brouillon: "Volver a borrador", emise: "Marcar emitida", payee: "Marcar pagada", annulee: "Anular factura" },
  litigeTitrePage: (n) => `Expediente de litigio — ${n}`,
  litigeSurtitre: (n) => `Área profesional · Factura ${n}`,
  litigeTitre: "Expediente de contestación",
  litigeDescription: "Soporte fáctico para un banco, un servicio de mediación o una reclamación del cliente. Aquí no se toma ninguna decisión jurídica.",
  litigeStripeOk: "Respuesta enviada a Stripe y litigio cerrado. Compruebe el estado en el panel de Stripe.",
  litigeEnregistre: "Expediente guardado en el registro de auditoría.",
  litigeStripeErreur: "Envío a Stripe imposible. Compruebe el identificador dp_…, la clave Stripe y el plazo del litigio.",
  litigeEchec: "El guardado ha fallado. Inténtelo de nuevo.",
  kpiFacture: "Factura", kpiEncaisse: "Cobrado", kpiConteste: "Importe contestado",
  paiementsEnregistres: "pagos registrados", plafonne: "limitado a lo cobrado",
  parametresDossier: "Parámetros del expediente",
  parametresAide: "El importe contestado no puede superar los pagos realmente cobrados.",
  retourFacture: "Volver a la factura", dateDossier: "Fecha del expediente",
  montantConteste: "Importe contestado (€)",
  laisserVide: "Dejar vacío para contestar todo lo cobrado.",
  motif: "Motivo de la contestación",
  motifPlaceholder: "Ej. El cliente impugna la tasa turística; la estancia se realizó del 5 al 12 de octubre.",
  actualiser: "Actualizar expediente", dossierPreFilli: "Expediente prellenado",
  dossierAide: "Copie este texto en su respuesta al banco o imprímalo con los justificantes.",
  imprimerBtn: "Imprimir", enregistrerAudit: "Guardar en auditoría",
  texteDossier: "Texto del expediente", stripeTitre: "Respuesta de Stripe",
  stripeAide: "Pegue el identificador del litigio recibido de Stripe. El texto se envía como prueba escrita y después se cierra el litigio.",
  stripeId: "Identificador del litigio Stripe", envoyerFermer: "Enviar respuesta y cerrar",
  pieces: "Los adjuntos (contrato, factura, fotos) aún deben añadirse en la interfaz de Stripe si el expediente los contiene.",
};

const IT: TraductionsFactures = {
  titrePage: "Fatture — LCD Parc", espace: "Area professionale",
  titre: (mois) => `Fatture — ${mois}`,
  resume: (n, total) => `${n} fattur${n === 1 ? "a" : "e"} · ${total} IVA incl.`,
  retour: "Torna alla dashboard", precedent: "← Mese precedente",
  courant: "Mese corrente", suivant: "Mese successivo →", exportCsv: "Esporta CSV",
  aRelancer: (n) => `Restano ${n} fattur${n === 1 ? "a" : "e"} emess${n === 1 ? "a" : "e"} scadut${n === 1 ? "a" : "e"} da sollecitare oggi.`,
  aRelancerAide: "Una sola email per fattura e per giorno, anche se si clicca più volte. Le fatture saldate e senza email valida vengono ignorate.",
  relancer: "Sollecita fatture scadute", relancerBtn: "Sollecita fatture scadute",
  creer: "Crea una fattura", creerVide: "Crei prima un alloggio per fatturare.",
  gererLogements: "Gestisci alloggi",
  creerAide: "I totali netto/lordo sono calcolati dalle righe. Lasciare IVA e tassa di soggiorno vuote per applicare automaticamente i parametri fiscali. La fattura viene creata in bozza.",
  logement: "Alloggio", reservationFacultatif: "Prenotazione (facoltativo)",
  aucune: "Nessuna", sansNom: "Senza nome", numero: "Numero",
  dateEmission: "Data di emissione", client: "Cliente",
  clientPlaceholder: "Obbligatorio senza prenotazione collegata", emailClient: "Email cliente",
  designation: "Descrizione", designationPlaceholder: "Soggiorno — 5 notti",
  quantite: "Quantità", prixUnitaire: "Prezzo unitario (€)", echeance: "Scadenza",
  tva: "IVA (€, facoltativo)", taxeSejour: "Tassa di soggiorno (€, facoltativo)",
  notes: "Note", auto: "Auto", creerBtn: "Crea fattura",
  duMois: "Fatture del mese", aucuneFacture: "Nessuna fattura questo mese.",
  planning: "Pianificazione", tableauBord: "Dashboard",
  retourAuxFactures: "← Torna alle fatture", facture: "Fattura", litige: "Fascicolo di contestazione",
  imprimer: "Ctrl+P per stampare", emiseLe: (date) => `Emessa il ${date}`,
  echeanceLe: (date) => `scadenza ${date}`, conciergerie: "Concierge immobiliare",
  statut: "Stato", designationCol: "Descrizione", qte: "Q.tà", pu: "P.U.", total: "Totale",
  totalHt: "Totale netto", tvaLigne: "IVA", taxeLigne: "Tassa di soggiorno", totalTtc: "Totale lordo",
  dejaPaye: "Già pagato", resteAPayer: "Da pagare",
  piedFacture: "Documento generato da LCD Parc. La tassa di soggiorno è gestita separatamente dal fatturato.",
  paiements: "Pagamenti", encaisses: (paye, reste) => `${paye} incassati · ${reste} rimanenti`,
  aucunEncaissement: "Nessun incasso registrato.", encaisser: "Registra un pagamento",
  encaisserAide: "Il pagamento è idempotente; la fattura passa a «pagata» quando il saldo è zero.",
  montant: "Importo (€)", mode: "Modalità", virement: "Bonifico", cb: "Carta",
  especes: "Contanti", cheque: "Assegno", stripe: "Stripe", datePaiement: "Data",
  reference: "Riferimento", enregistrerPaiement: "Salva pagamento",
  emettrePourPayer: "Emetta la fattura per poter registrare un pagamento.",
  soldee: "Fattura saldata.", partage: "Condivisione cliente",
  partageAide: "Link firmato, valido 90 giorni, consultabile senza account e senza JavaScript.",
  lienFacture: "Link della fattura", ouvrirClient: "Apri fattura cliente",
  envoyerEmail: "Invia per email",
  smtpOff: "SMTP disattivato: l’invio fallirà finché EMAIL_ENABLED non è attivo.",
  destinataire: "Destinatario", envoyer: "Invia fattura",
  relancerEmail: "Sollecita via email",
  emettrePourLien: "Emetta la fattura per generare il link cliente e inviarlo via email.",
  statuts: { brouillon: "Riporta in bozza", emise: "Segna emessa", payee: "Segna pagata", annulee: "Annulla fattura" },
  litigeTitrePage: (n) => `Fascicolo di contestazione — ${n}`,
  litigeSurtitre: (n) => `Area professionale · Fattura ${n}`,
  litigeTitre: "Fascicolo di contestazione",
  litigeDescription: "Supporto fattuale per una banca, un servizio di mediazione o un reclamo del cliente. Qui non viene presa alcuna decisione giuridica.",
  litigeStripeOk: "Risposta inviata a Stripe e contestazione chiusa. Verifichi lo stato nella dashboard Stripe.",
  litigeEnregistre: "Fascicolo salvato nel registro di audit.",
  litigeStripeErreur: "Invio a Stripe impossibile. Verifichi l’identificativo dp_…, la chiave Stripe e la scadenza della contestazione.",
  litigeEchec: "Salvataggio non riuscito. Riprovare.",
  kpiFacture: "Fattura", kpiEncaisse: "Incassato", kpiConteste: "Importo contestato",
  paiementsEnregistres: "pagamenti registrati", plafonne: "limitato all’incassato",
  parametresDossier: "Parametri del fascicolo",
  parametresAide: "L’importo contestato non può superare i pagamenti realmente incassati.",
  retourFacture: "Torna alla fattura", dateDossier: "Data del fascicolo",
  montantConteste: "Importo contestato (€)",
  laisserVide: "Lasciare vuoto per contestare tutto l’incassato.",
  motif: "Motivo della contestazione",
  motifPlaceholder: "Es. Il cliente contesta la tassa di soggiorno; il soggiorno si è svolto dal 5 al 12 ottobre.",
  actualiser: "Aggiorna fascicolo", dossierPreFilli: "Fascicolo precompilato",
  dossierAide: "Copi questo testo nella risposta alla banca o lo stampi con i documenti giustificativi.",
  imprimerBtn: "Stampa", enregistrerAudit: "Salva nell’audit",
  texteDossier: "Testo del fascicolo", stripeTitre: "Risposta Stripe",
  stripeAide: "Incolli l’identificativo della contestazione ricevuto da Stripe. Il testo viene inviato come prova scritta, poi la contestazione viene chiusa.",
  stripeId: "Identificativo contestazione Stripe", envoyerFermer: "Invia risposta e chiudi",
  pieces: "Gli allegati (contratto, fattura, foto) vanno ancora aggiunti nell’interfaccia Stripe se il fascicolo ne contiene.",
};

const DE: TraductionsFactures = {
  titrePage: "Rechnungen — LCD Parc", espace: "Profibereich",
  titre: (mois) => `Rechnungen — ${mois}`,
  resume: (n, total) => `${n} Rechnung${n === 1 ? "" : "en"} · ${total} inkl. Steuern`,
  retour: "Zurück zum Dashboard", precedent: "← Vorheriger Monat",
  courant: "Aktueller Monat", suivant: "Nächster Monat →", exportCsv: "CSV-Export",
  aRelancer: (n) => `${n} überfällige${n === 1 ? "" : ""} Rechnung${n === 1 ? "" : "en"} müssen heute noch gemahnt werden.`,
  aRelancerAide: "Eine E-Mail pro Rechnung und Tag, auch bei mehrfachem Klicken. Bezahlte Rechnungen und ungültige E-Mails werden ignoriert.",
  relancer: "Überfällige Rechnungen mahnen", relancerBtn: "Überfällige Rechnungen mahnen",
  creer: "Rechnung erstellen", creerVide: "Erstellen Sie zuerst eine Unterkunft, um abzurechnen.",
  gererLogements: "Unterkünfte verwalten",
  creerAide: "Netto-/Bruttosummen werden aus den Positionen berechnet. Lassen Sie MwSt. und Kurtaxe leer, um die Steuereinstellungen automatisch anzuwenden. Die Rechnung wird als Entwurf erstellt.",
  logement: "Unterkunft", reservationFacultatif: "Buchung (optional)",
  aucune: "Keine", sansNom: "Ohne Namen", numero: "Nummer",
  dateEmission: "Ausstellungsdatum", client: "Kunde",
  clientPlaceholder: "Erforderlich ohne verknüpfte Buchung", emailClient: "Kunden-E-Mail",
  designation: "Bezeichnung", designationPlaceholder: "Aufenthalt — 5 Nächte",
  quantite: "Menge", prixUnitaire: "Einzelpreis (€)", echeance: "Fälligkeit",
  tva: "MwSt. (€, optional)", taxeSejour: "Kurtaxe (€, optional)",
  notes: "Notizen", auto: "Auto", creerBtn: "Rechnung erstellen",
  duMois: "Rechnungen des Monats", aucuneFacture: "Keine Rechnung in diesem Monat.",
  planning: "Planung", tableauBord: "Dashboard",
  retourAuxFactures: "← Zurück zu den Rechnungen", facture: "Rechnung", litige: "Streitakte",
  imprimer: "Ctrl+P zum Drucken", emiseLe: (date) => `Ausgestellt am ${date}`,
  echeanceLe: (date) => `fällig ${date}`, conciergerie: "Miet-Concierge",
  statut: "Status", designationCol: "Bezeichnung", qte: "Menge", pu: "Einzelpreis", total: "Gesamt",
  totalHt: "Netto", tvaLigne: "MwSt.", taxeLigne: "Kurtaxe", totalTtc: "Brutto",
  dejaPaye: "Bereits bezahlt", resteAPayer: "Offener Betrag",
  piedFacture: "Von LCD Parc erzeugtes Dokument. Die Kurtaxe wird getrennt vom Umsatz geführt.",
  paiements: "Zahlungen", encaisses: (paye, reste) => `${paye} erhalten · ${reste} offen`,
  aucunEncaissement: "Keine Zahlung erfasst.", encaisser: "Zahlung erfassen",
  encaisserAide: "Die Zahlung ist idempotent; die Rechnung wird „bezahlt“, sobald der Saldo null ist.",
  montant: "Betrag (€)", mode: "Art", virement: "Überweisung", cb: "Karte",
  especes: "Bargeld", cheque: "Scheck", stripe: "Stripe", datePaiement: "Datum",
  reference: "Referenz", enregistrerPaiement: "Zahlung speichern",
  emettrePourPayer: "Stellen Sie die Rechnung aus, bevor Sie eine Zahlung erfassen.",
  soldee: "Rechnung bezahlt.", partage: "Kundenfreigabe",
  partageAide: "Signierter Link, 90 Tage gültig, ohne Konto und ohne JavaScript abrufbar.",
  lienFacture: "Rechnungslink", ouvrirClient: "Kundenrechnung öffnen",
  envoyerEmail: "Per E-Mail senden",
  smtpOff: "SMTP deaktiviert: Der Versand schlägt fehl, bis EMAIL_ENABLED aktiviert ist.",
  destinataire: "Empfänger", envoyer: "Rechnung senden",
  relancerEmail: "Per E-Mail mahnen",
  emettrePourLien: "Stellen Sie die Rechnung aus, um den Kundenlink zu erzeugen und per E-Mail zu senden.",
  statuts: { brouillon: "Zurück zu Entwurf", emise: "Als ausgestellt markieren", payee: "Als bezahlt markieren", annulee: "Rechnung stornieren" },
  litigeTitrePage: (n) => `Streitakte — ${n}`,
  litigeSurtitre: (n) => `Profibereich · Rechnung ${n}`,
  litigeTitre: "Einspruchsakte",
  litigeDescription: "Sachliche Unterlage für eine Bank, eine Schlichtungsstelle oder eine Kundenbeschwerde. Hier wird keine rechtliche Entscheidung getroffen.",
  litigeStripeOk: "Antwort an Stripe gesendet und Streitfall geschlossen. Prüfen Sie den Status im Stripe-Dashboard.",
  litigeEnregistre: "Akte im Audit-Log gespeichert.",
  litigeStripeErreur: "Stripe-Versand nicht möglich. Prüfen Sie die dp_…-ID, den Stripe-Schlüssel und die Frist.",
  litigeEchec: "Speichern fehlgeschlagen. Versuchen Sie es erneut.",
  kpiFacture: "Rechnung", kpiEncaisse: "Erhalten", kpiConteste: "Bestrittener Betrag",
  paiementsEnregistres: "erfasste Zahlungen", plafonne: "begrenzt auf erhaltenen Betrag",
  parametresDossier: "Akteneinstellungen",
  parametresAide: "Der bestrittene Betrag darf die tatsächlich erhaltenen Zahlungen nicht überschreiten.",
  retourFacture: "Zurück zur Rechnung", dateDossier: "Aktendatum",
  montantConteste: "Bestrittener Betrag (€)",
  laisserVide: "Leer lassen, um alles Erhaltene zu bestreiten.",
  motif: "Grund des Einspruchs",
  motifPlaceholder: "Z. B. Der Kunde bestreitet die Kurtaxe; der Aufenthalt fand vom 5. bis 12. Oktober statt.",
  actualiser: "Akte aktualisieren", dossierPreFilli: "Vorausgefüllte Akte",
  dossierAide: "Kopieren Sie diesen Text in Ihre Antwort an die Bank oder drucken Sie ihn mit den Belegen.",
  imprimerBtn: "Drucken", enregistrerAudit: "Im Audit speichern",
  texteDossier: "Aktentext", stripeTitre: "Stripe-Antwort",
  stripeAide: "Fügen Sie die von Stripe erhaltene Streitfall-ID ein. Der Text wird als schriftlicher Nachweis gesendet, dann wird der Streitfall geschlossen.",
  stripeId: "Stripe-Streitfall-ID", envoyerFermer: "Antwort senden und schließen",
  pieces: "Anhänge (Vertrag, Rechnung, Fotos) müssen noch in der Stripe-Oberfläche ergänzt werden, falls die Akte welche enthält.",
};

const DICTIONNAIRES: Record<Langue, TraductionsFactures> = {
  fr: FR, en: EN, es: ES, it: IT, de: DE,
};

export function traductionsFactures(langue: string): TraductionsFactures {
  return masquerFonctions(DICTIONNAIRES[resoudreLangue(langue)]);
}
