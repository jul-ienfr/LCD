import type { Langue } from "./i18n";
import { masquerFonctions, resoudreLangue } from "./i18n-staff";

export interface TraductionsCompta {
  titrePage: string;
  espace: string;
  titre: (mois: string) => string;
  description: string;
  precedent: string;
  courant: string;
  suivant: string;
  factures: string;
  rapprochement: string;
  parametresFiscaux: string;
  simulateur: string;
  sorties: string;
  planning: string;
  exports: (mois: string) => string;
  resasCsv: string;
  facturesCsv: string;
  paiementsCsv: string;
  facturX: string;
  modele: string;
  auditCsv: string;
  colLogement: string;
  colSejours: string;
  colCa: string;
  colFactures: string;
  colTtc: string;
  paiementsMois: string;
  aucunPaiement: string;
  colDate: string;
  colFacture: string;
  colMode: string;
  colReference: string;
  colMontant: string;
  kpiCa: string;
  kpiHt: string;
  kpiTva: string;
  kpiTtc: string;
  kpiEncaisse: string;
  sejours: (n: number) => string;
  nbFactures: (n: number) => string;
  tvaEtTaxe: (tva: string, taxe: string) => string;
  horsCa: string;
  nbPaiements: (n: number) => string;
  paramsTitrePage: string;
  paramsSurtitre: string;
  paramsTitre: string;
  paramsDescription: string;
  paramsOk: string;
  paramsErreurs: Record<string, string>;
  kpiTvaDefaut: string;
  kpiTaxe: string;
  parNuitPersonne: string;
  kpiNumerotation: string;
  reglages: string;
  reglagesAide: string;
  tauxTva: string;
  tauxAide: string;
  prefixe: string;
  prefixeAide: string;
  taxeNuit: string;
  taxeAide: string;
  plafond: string;
  plafondAide: string;
  mentions: string;
  mentionsPlaceholder: string;
  enregistrer: string;
  facturXTitre: string;
  facturXAide: string;
  rappTitrePage: string;
  rappSurtitre: string;
  rappTitre: string;
  rappDescription: string;
  importerTitre: string;
  fichier: string;
  importer: string;
  colonnes: string;
  importRef: (ref: string) => string;
  alerteRapp: string;
  rapproche: string;
  credits: string;
  debits: string;
  attendus: string;
  ecart: string;
  ecartAlerte: (ecart: string) => string;
  orphelines: (n: number) => string;
  verifier: string;
  rappColDate: string;
  rappColLibelle: string;
  rappColMontant: string;
  rappColStatut: string;
  nonRetrouves: (n: number) => string;
  aucunReleve: string;
  recents: string;
  ecartOrphelines: (ecart: string, orphelines: number) => string;
  simTitrePage: string;
  simSurtitre: string;
  simTitre: string;
  simDescription: string;
  retourCompta: string;
  regimeEtudie: string;
  recettes: string;
  charges: string;
  amortissements: string;
  comparer: string;
  seuilMicro: string;
  abattement: string;
  baseReel: string;
  baseReelNote: string;
  resultat: string;
  baseMicro: string;
  indisponible: string;
  ecartReel: string;
  deficit: string;
  recettesSeuil: (seuil: string) => string;
  bareme: string;
  recommandations: Record<string, string>;
}

const FR: TraductionsCompta = {
  titrePage: "Comptabilité — Espace hôte", espace: "Espace hôte",
  titre: (mois) => `Comptabilité — ${mois}`,
  description: "Réservations, factures, TVA et taxe de séjour.",
  precedent: "← Mois précédent", courant: "Mois courant", suivant: "Mois suivant →",
  factures: "Factures", rapprochement: "Rapprochement", parametresFiscaux: "Paramètres fiscaux",
  simulateur: "Simulateur micro / réel", sorties: "Sorties d’argent", planning: "Planning",
  exports: (mois) => `Exports ${mois} :`, resasCsv: "Réservations CSV",
  facturesCsv: "Factures CSV", paiementsCsv: "Paiements CSV", facturX: "Factur-X ZIP",
  modele: "Modèle rapprochement", auditCsv: "Audit CSV",
  colLogement: "Logement", colSejours: "Séjours", colCa: "CA réservations",
  colFactures: "Factures", colTtc: "TTC facturé", paiementsMois: "Paiements du mois",
  aucunPaiement: "Aucun paiement encaissé sur ce mois.", colDate: "Date",
  colFacture: "Facture", colMode: "Mode", colReference: "Référence", colMontant: "Montant",
  kpiCa: "CA réservations", kpiHt: "HT facturé", kpiTva: "TVA + taxe de séjour",
  kpiTtc: "TTC facturé", kpiEncaisse: "Encaissé",
  sejours: (n) => `${n} séjours`, nbFactures: (n) => `${n} factures`,
  tvaEtTaxe: (tva, taxe) => `TVA ${tva} · taxe ${taxe}`, horsCa: "hors CA réservations",
  nbPaiements: (n) => `${n} paiement${n > 1 ? "s" : ""}`,
  paramsTitrePage: "Paramètres fiscaux — Espace hôte", paramsSurtitre: "Espace hôte · Comptabilité",
  paramsTitre: "Paramètres fiscaux",
  paramsDescription: "TVA, taxe de séjour et numérotation des factures pour ce tenant.",
  paramsOk: "Paramètres fiscaux enregistrés.",
  paramsErreurs: {
    taux: "Taux de TVA invalide (ex. 10 ou 5,5).",
    taxe: "Taxe de séjour invalide (ex. 1,50 ; 0 pour aucune taxe).",
    plafond: "Plafond invalide (ex. 4,20).", inattendu: "Erreur inattendue. Réessayez.",
  },
  kpiTvaDefaut: "TVA par défaut", kpiTaxe: "Taxe de séjour",
  parNuitPersonne: "par nuit et par personne", kpiNumerotation: "Numérotation",
  reglages: "Réglages",
  reglagesAide: "Ces valeurs servent de défaut. Une facture peut toujours les remplacer manuellement, ligne par ligne.",
  tauxTva: "Taux de TVA (%)",
  tauxAide: "Taux appliqué par défaut lors de la création d’une facture.",
  prefixe: "Préfixe des factures",
  prefixeAide: "2 à 8 caractères A-Z ou 0-9. Numérotation : PREFIXE-AAAA-0001.",
  taxeNuit: "Taxe de séjour (€ / nuit / personne)",
  taxeAide: "Montant appliqué par nuit et par voyageur. 0 si non applicable.",
  plafond: "Plafond (€ / nuit / personne, facultatif)",
  plafondAide: "Laisser vide si aucun plafond.",
  mentions: "Mentions légales (facultatif)",
  mentionsPlaceholder: "Ex. TVA non applicable, art. 293 B du CGI…",
  enregistrer: "Enregistrer les paramètres", facturXTitre: "Factur-X — préparation",
  facturXAide: "Chaque facture expose un export XML CII depuis sa page de détail. Le XML reprend les montants HT, TVA, taxe de séjour et TTC. Il reste à intégrer dans un PDF/A-3 et à valider avec une plateforme de dématérialisation partenaire avant un usage fiscal complet.",
  rappTitrePage: "Rapprochement bancaire — Espace hôte", rappSurtitre: "Comptabilité",
  rappTitre: "Rapprochement bancaire",
  rappDescription: "Importez le relevé CSV de la banque : les crédits sont rapprochés des paiements enregistrés (±3 jours, même montant, référence si présente). Alerte si l’écart dépasse 2 % ou si une opération reste orpheline plus de 7 jours.",
  importerTitre: "Importer un relevé", fichier: "Fichier CSV (2 Mo max)",
  importer: "Importer et rapprocher",
  colonnes: "Colonnes acceptées : date;libelle;montant (signé) ou date;libelle;debit;credit, avec reference facultative. Dates JJ/MM/AAAA ou AAAA-MM-JJ, montants avec virgule ou point.",
  importRef: (ref) => `Import ${ref}`, alerteRapp: "Alerte rapprochement", rapproche: "Rapproché",
  credits: "Crédits", debits: "Débits", attendus: "Paiements attendus", ecart: "Écart",
  ecartAlerte: (ecart) => `Écart supérieur à 2 % (${ecart}). `,
  orphelines: (n) => `${n} opération(s) orpheline(s) de plus de 7 jours. `,
  verifier: "Vérifiez les lignes ci-dessous et les paiements non rapprochés.",
  rappColDate: "Date", rappColLibelle: "Libellé", rappColMontant: "Montant", rappColStatut: "Statut",
  nonRetrouves: (n) => `Paiements enregistrés non retrouvés (${n})`,
  aucunReleve: "Aucun relevé importé pour cet espace.", recents: "Imports récents",
  ecartOrphelines: (ecart, n) => `écart ${ecart} · ${n} orpheline(s)`,
  simTitrePage: "Simulateur micro / réel — Comptabilité", simSurtitre: "Espace hôte · Comptabilité",
  simTitre: "Simulateur micro-BIC / réel",
  simDescription: "Comparez les bases imposables. Le simulateur ne calcule ni l’impôt sur le revenu ni les cotisations sociales.",
  retourCompta: "← Comptabilité", regimeEtudie: "Régime micro étudié",
  recettes: "Recettes annuelles (€)", charges: "Charges déductibles (€)",
  amortissements: "Amortissements (€)", comparer: "Comparer",
  seuilMicro: "Seuil micro", abattement: "Abattement", baseReel: "Base au réel",
  baseReelNote: "recettes − charges − amortissements", resultat: "Résultat",
  baseMicro: "Base micro", indisponible: "indisponible", ecartReel: "écart avec le réel",
  deficit: "Déficit reportable au réel",
  recettesSeuil: (seuil) => `Recettes supérieures au seuil de ${seuil} : le micro-BIC n’est pas disponible.`,
  bareme: "Barème indicatif 2025 (seuils 15 000 € / 77 700 €, abattements 30 % / 71 %). Vérifiez le barème de l’année et votre situation avec un expert-comptable.",
  recommandations: {
    micro: "Le micro-BIC donne la base imposable la plus faible sur ces montants.",
    reel: "Le régime réel donne une base imposable plus faible : les charges et amortissements dépassent l’abattement forfaitaire.",
    equivalent: "Les deux régimes donnent la même base imposable sur ces montants.",
    micro_indisponible: "Les recettes dépassent le seuil du micro-BIC : le régime réel s’applique.",
  },
};

const EN: TraductionsCompta = {
  titrePage: "Accounting — Staff area", espace: "Staff area",
  titre: (mois) => `Accounting — ${mois}`,
  description: "Bookings, invoices, VAT and tourist tax.",
  precedent: "← Previous month", courant: "Current month", suivant: "Next month →",
  factures: "Invoices", rapprochement: "Reconciliation", parametresFiscaux: "Tax settings",
  simulateur: "Micro / standard simulator", sorties: "Money out", planning: "Planning",
  exports: (mois) => `Exports for ${mois}:`, resasCsv: "Bookings CSV",
  facturesCsv: "Invoices CSV", paiementsCsv: "Payments CSV", facturX: "Factur-X ZIP",
  modele: "Reconciliation template", auditCsv: "Audit CSV",
  colLogement: "Property", colSejours: "Stays", colCa: "Booking revenue",
  colFactures: "Invoices", colTtc: "Invoiced incl. tax", paiementsMois: "Payments this month",
  aucunPaiement: "No payment received this month.", colDate: "Date",
  colFacture: "Invoice", colMode: "Method", colReference: "Reference", colMontant: "Amount",
  kpiCa: "Booking revenue", kpiHt: "Invoiced excl. tax", kpiTva: "VAT + tourist tax",
  kpiTtc: "Invoiced incl. tax", kpiEncaisse: "Received",
  sejours: (n) => `${n} stay${n === 1 ? "" : "s"}`, nbFactures: (n) => `${n} invoice${n === 1 ? "" : "s"}`,
  tvaEtTaxe: (tva, taxe) => `VAT ${tva} · tax ${taxe}`, horsCa: "excluding booking revenue",
  nbPaiements: (n) => `${n} payment${n === 1 ? "" : "s"}`,
  paramsTitrePage: "Tax settings — Staff area", paramsSurtitre: "Staff area · Accounting",
  paramsTitre: "Tax settings",
  paramsDescription: "VAT, tourist tax and invoice numbering for this tenant.",
  paramsOk: "Tax settings saved.",
  paramsErreurs: {
    taux: "Invalid VAT rate (e.g. 10 or 5.5).",
    taxe: "Invalid tourist tax (e.g. 1.50; 0 for none).",
    plafond: "Invalid cap (e.g. 4.20).", inattendu: "Unexpected error. Try again.",
  },
  kpiTvaDefaut: "Default VAT", kpiTaxe: "Tourist tax",
  parNuitPersonne: "per night and per person", kpiNumerotation: "Numbering",
  reglages: "Settings",
  reglagesAide: "These values are defaults. An invoice can always override them manually, line by line.",
  tauxTva: "VAT rate (%)",
  tauxAide: "Rate applied by default when creating an invoice.",
  prefixe: "Invoice prefix",
  prefixeAide: "2 to 8 characters A-Z or 0-9. Numbering: PREFIX-YYYY-0001.",
  taxeNuit: "Tourist tax (€ / night / person)",
  taxeAide: "Amount applied per night and per guest. 0 if not applicable.",
  plafond: "Cap (€ / night / person, optional)",
  plafondAide: "Leave empty if there is no cap.",
  mentions: "Legal notices (optional)",
  mentionsPlaceholder: "E.g. VAT not applicable, art. 293 B of the French tax code…",
  enregistrer: "Save settings", facturXTitre: "Factur-X — preparation",
  facturXAide: "Each invoice exposes a CII XML export from its detail page. The XML contains excl. tax, VAT, tourist tax and incl. tax amounts. It still needs to be embedded in a PDF/A-3 and validated with a partner dematerialisation platform before full tax use.",
  rappTitrePage: "Bank reconciliation — Staff area", rappSurtitre: "Accounting",
  rappTitre: "Bank reconciliation",
  rappDescription: "Import the bank’s CSV statement: credits are matched to recorded payments (±3 days, same amount, reference when present). Alert if the gap exceeds 2% or an item stays unmatched for more than 7 days.",
  importerTitre: "Import a statement", fichier: "CSV file (2 MB max)",
  importer: "Import and reconcile",
  colonnes: "Accepted columns: date;label;amount (signed) or date;label;debit;credit, with optional reference. Dates DD/MM/YYYY or YYYY-MM-DD, amounts with comma or dot.",
  importRef: (ref) => `Import ${ref}`, alerteRapp: "Reconciliation alert", rapproche: "Reconciled",
  credits: "Credits", debits: "Debits", attendus: "Expected payments", ecart: "Gap",
  ecartAlerte: (ecart) => `Gap above 2% (${ecart}). `,
  orphelines: (n) => `${n} unmatched item(s) older than 7 days. `,
  verifier: "Check the lines below and unmatched payments.",
  rappColDate: "Date", rappColLibelle: "Label", rappColMontant: "Amount", rappColStatut: "Status",
  nonRetrouves: (n) => `Recorded payments not found (${n})`,
  aucunReleve: "No statement imported for this workspace.", recents: "Recent imports",
  ecartOrphelines: (ecart, n) => `gap ${ecart} · ${n} unmatched`,
  simTitrePage: "Micro / standard simulator — Accounting", simSurtitre: "Staff area · Accounting",
  simTitre: "Micro-BIC / standard simulator",
  simDescription: "Compare taxable bases. The simulator does not calculate income tax or social contributions.",
  retourCompta: "← Accounting", regimeEtudie: "Micro regime studied",
  recettes: "Annual revenue (€)", charges: "Deductible expenses (€)",
  amortissements: "Depreciation (€)", comparer: "Compare",
  seuilMicro: "Micro threshold", abattement: "Allowance", baseReel: "Standard base",
  baseReelNote: "revenue − expenses − depreciation", resultat: "Result",
  baseMicro: "Micro base", indisponible: "unavailable", ecartReel: "gap with standard regime",
  deficit: "Loss carried forward under standard regime",
  recettesSeuil: (seuil) => `Revenue above the ${seuil} threshold: micro-BIC is not available.`,
  bareme: "Indicative 2025 scale (thresholds €15,000 / €77,700, allowances 30% / 71%). Check the year’s scale and your situation with an accountant.",
  recommandations: {
    micro: "Micro-BIC gives the lowest taxable base on these amounts.",
    reel: "The standard regime gives a lower taxable base: expenses and depreciation exceed the flat allowance.",
    equivalent: "Both regimes give the same taxable base on these amounts.",
    micro_indisponible: "Revenue exceeds the micro-BIC threshold: the standard regime applies.",
  },
};

const ES: TraductionsCompta = {
  titrePage: "Contabilidad — Área profesional", espace: "Área profesional",
  titre: (mois) => `Contabilidad — ${mois}`,
  description: "Reservas, facturas, IVA y tasa turística.",
  precedent: "← Mes anterior", courant: "Mes actual", suivant: "Mes siguiente →",
  factures: "Facturas", rapprochement: "Conciliación", parametresFiscaux: "Parámetros fiscales",
  simulateur: "Simulador micro / real", sorties: "Salidas de dinero", planning: "Planificación",
  exports: (mois) => `Exportaciones ${mois}:`, resasCsv: "Reservas CSV",
  facturesCsv: "Facturas CSV", paiementsCsv: "Pagos CSV", facturX: "Factur-X ZIP",
  modele: "Modelo de conciliación", auditCsv: "Auditoría CSV",
  colLogement: "Alojamiento", colSejours: "Estancias", colCa: "Ingresos reservas",
  colFactures: "Facturas", colTtc: "Facturado con IVA", paiementsMois: "Pagos del mes",
  aucunPaiement: "Ningún pago cobrado este mes.", colDate: "Fecha",
  colFacture: "Factura", colMode: "Modo", colReference: "Referencia", colMontant: "Importe",
  kpiCa: "Ingresos reservas", kpiHt: "Facturado sin IVA", kpiTva: "IVA + tasa turística",
  kpiTtc: "Facturado con IVA", kpiEncaisse: "Cobrado",
  sejours: (n) => `${n} estancia${n === 1 ? "" : "s"}`, nbFactures: (n) => `${n} factura${n === 1 ? "" : "s"}`,
  tvaEtTaxe: (tva, taxe) => `IVA ${tva} · tasa ${taxe}`, horsCa: "excluido de ingresos reservas",
  nbPaiements: (n) => `${n} pago${n === 1 ? "" : "s"}`,
  paramsTitrePage: "Parámetros fiscales — Área profesional", paramsSurtitre: "Área profesional · Contabilidad",
  paramsTitre: "Parámetros fiscales",
  paramsDescription: "IVA, tasa turística y numeración de facturas para este tenant.",
  paramsOk: "Parámetros fiscales guardados.",
  paramsErreurs: {
    taux: "Tipo de IVA no válido (ej. 10 o 5,5).",
    taxe: "Tasa turística no válida (ej. 1,50; 0 para ninguna).",
    plafond: "Límite no válido (ej. 4,20).", inattendu: "Error inesperado. Inténtelo de nuevo.",
  },
  kpiTvaDefaut: "IVA por defecto", kpiTaxe: "Tasa turística",
  parNuitPersonne: "por noche y por persona", kpiNumerotation: "Numeración",
  reglages: "Ajustes",
  reglagesAide: "Estos valores son los predeterminados. Una factura siempre puede sustituirlos manualmente, línea por línea.",
  tauxTva: "Tipo de IVA (%)",
  tauxAide: "Tipo aplicado por defecto al crear una factura.",
  prefixe: "Prefijo de facturas",
  prefixeAide: "2 a 8 caracteres A-Z o 0-9. Numeración: PREFIJO-AAAA-0001.",
  taxeNuit: "Tasa turística (€ / noche / persona)",
  taxeAide: "Importe aplicado por noche y viajero. 0 si no procede.",
  plafond: "Límite (€ / noche / persona, opcional)",
  plafondAide: "Dejar vacío si no hay límite.",
  mentions: "Menciones legales (opcional)",
  mentionsPlaceholder: "Ej. IVA no aplicable, art. 293 B del CGI…",
  enregistrer: "Guardar parámetros", facturXTitre: "Factur-X — preparación",
  facturXAide: "Cada factura expone una exportación XML CII desde su página de detalle. El XML recoge los importes sin IVA, IVA, tasa turística y con IVA. Aún debe integrarse en un PDF/A-3 y validarse con una plataforma de desmaterialización asociada antes de un uso fiscal completo.",
  rappTitrePage: "Conciliación bancaria — Área profesional", rappSurtitre: "Contabilidad",
  rappTitre: "Conciliación bancaria",
  rappDescription: "Importe el extracto CSV del banco: los créditos se concilian con los pagos registrados (±3 días, mismo importe, referencia si existe). Alerta si la diferencia supera el 2 % o si una operación queda huérfana más de 7 días.",
  importerTitre: "Importar un extracto", fichier: "Archivo CSV (2 MB máx.)",
  importer: "Importar y conciliar",
  colonnes: "Columnas aceptadas: fecha;concepto;importe (con signo) o fecha;concepto;debe;haber, con referencia opcional. Fechas DD/MM/AAAA o AAAA-MM-DD, importes con coma o punto.",
  importRef: (ref) => `Importación ${ref}`, alerteRapp: "Alerta de conciliación", rapproche: "Conciliado",
  credits: "Créditos", debits: "Débitos", attendus: "Pagos esperados", ecart: "Diferencia",
  ecartAlerte: (ecart) => `Diferencia superior al 2 % (${ecart}). `,
  orphelines: (n) => `${n} operación(es) huérfana(s) de más de 7 días. `,
  verifier: "Revise las líneas siguientes y los pagos no conciliados.",
  rappColDate: "Fecha", rappColLibelle: "Concepto", rappColMontant: "Importe", rappColStatut: "Estado",
  nonRetrouves: (n) => `Pagos registrados no encontrados (${n})`,
  aucunReleve: "Ningún extracto importado para este espacio.", recents: "Importaciones recientes",
  ecartOrphelines: (ecart, n) => `diferencia ${ecart} · ${n} huérfana(s)`,
  simTitrePage: "Simulador micro / real — Contabilidad", simSurtitre: "Área profesional · Contabilidad",
  simTitre: "Simulador micro-BIC / real",
  simDescription: "Compare las bases imponibles. El simulador no calcula el IRPF ni las cotizaciones sociales.",
  retourCompta: "← Contabilidad", regimeEtudie: "Régimen micro estudiado",
  recettes: "Ingresos anuales (€)", charges: "Gastos deducibles (€)",
  amortissements: "Amortizaciones (€)", comparer: "Comparar",
  seuilMicro: "Umbral micro", abattement: "Reducción", baseReel: "Base real",
  baseReelNote: "ingresos − gastos − amortizaciones", resultat: "Resultado",
  baseMicro: "Base micro", indisponible: "no disponible", ecartReel: "diferencia con el real",
  deficit: "Pérdida pendiente de compensar en el régimen real",
  recettesSeuil: (seuil) => `Ingresos superiores al umbral de ${seuil}: el micro-BIC no está disponible.`,
  bareme: "Escala indicativa 2025 (umbrales 15 000 € / 77 700 €, reducciones 30 % / 71 %). Compruebe la escala del año y su situación con un asesor fiscal.",
  recommandations: {
    micro: "El micro-BIC ofrece la base imponible más baja con estos importes.",
    reel: "El régimen real ofrece una base imponible más baja: los gastos y amortizaciones superan la reducción fija.",
    equivalent: "Ambos regímenes dan la misma base imponible con estos importes.",
    micro_indisponible: "Los ingresos superan el umbral del micro-BIC: se aplica el régimen real.",
  },
};

const IT: TraductionsCompta = {
  titrePage: "Contabilità — Area professionale", espace: "Area professionale",
  titre: (mois) => `Contabilità — ${mois}`,
  description: "Prenotazioni, fatture, IVA e tassa di soggiorno.",
  precedent: "← Mese precedente", courant: "Mese corrente", suivant: "Mese successivo →",
  factures: "Fatture", rapprochement: "Riconciliazione", parametresFiscaux: "Parametri fiscali",
  simulateur: "Simulatore micro / ordinario", sorties: "Uscite di denaro", planning: "Pianificazione",
  exports: (mois) => `Esportazioni ${mois}:`, resasCsv: "Prenotazioni CSV",
  facturesCsv: "Fatture CSV", paiementsCsv: "Pagamenti CSV", facturX: "Factur-X ZIP",
  modele: "Modello di riconciliazione", auditCsv: "Audit CSV",
  colLogement: "Alloggio", colSejours: "Soggiorni", colCa: "Ricavi prenotazioni",
  colFactures: "Fatture", colTtc: "Fatturato IVA incl.", paiementsMois: "Pagamenti del mese",
  aucunPaiement: "Nessun pagamento incassato questo mese.", colDate: "Data",
  colFacture: "Fattura", colMode: "Modalità", colReference: "Riferimento", colMontant: "Importo",
  kpiCa: "Ricavi prenotazioni", kpiHt: "Fatturato netto", kpiTva: "IVA + tassa di soggiorno",
  kpiTtc: "Fatturato lordo", kpiEncaisse: "Incassato",
  sejours: (n) => `${n} soggiorn${n === 1 ? "o" : "i"}`, nbFactures: (n) => `${n} fattur${n === 1 ? "a" : "e"}`,
  tvaEtTaxe: (tva, taxe) => `IVA ${tva} · tassa ${taxe}`, horsCa: "escluso dai ricavi prenotazioni",
  nbPaiements: (n) => `${n} pagament${n === 1 ? "o" : "i"}`,
  paramsTitrePage: "Parametri fiscali — Area professionale", paramsSurtitre: "Area professionale · Contabilità",
  paramsTitre: "Parametri fiscali",
  paramsDescription: "IVA, tassa di soggiorno e numerazione fatture per questo tenant.",
  paramsOk: "Parametri fiscali salvati.",
  paramsErreurs: {
    taux: "Aliquota IVA non valida (es. 10 o 5,5).",
    taxe: "Tassa di soggiorno non valida (es. 1,50; 0 per nessuna).",
    plafond: "Tetto non valido (es. 4,20).", inattendu: "Errore imprevisto. Riprovare.",
  },
  kpiTvaDefaut: "IVA predefinita", kpiTaxe: "Tassa di soggiorno",
  parNuitPersonne: "per notte e per persona", kpiNumerotation: "Numerazione",
  reglages: "Impostazioni",
  reglagesAide: "Questi valori sono predefiniti. Una fattura può sempre sostituirli manualmente, riga per riga.",
  tauxTva: "Aliquota IVA (%)",
  tauxAide: "Aliquota applicata per impostazione predefinita alla creazione di una fattura.",
  prefixe: "Prefisso fatture",
  prefixeAide: "Da 2 a 8 caratteri A-Z o 0-9. Numerazione: PREFISSO-AAAA-0001.",
  taxeNuit: "Tassa di soggiorno (€ / notte / persona)",
  taxeAide: "Importo applicato per notte e per ospite. 0 se non applicabile.",
  plafond: "Tetto (€ / notte / persona, facoltativo)",
  plafondAide: "Lasciare vuoto se non c’è un tetto.",
  mentions: "Note legali (facoltativo)",
  mentionsPlaceholder: "Es. IVA non applicabile, art. 293 B del CGI…",
  enregistrer: "Salva parametri", facturXTitre: "Factur-X — preparazione",
  facturXAide: "Ogni fattura espone un’esportazione XML CII dalla sua pagina di dettaglio. Il XML riporta gli importi netti, IVA, tassa di soggiorno e lordi. Resta da integrare in un PDF/A-3 e validare con una piattaforma di dematerializzazione partner prima di un uso fiscale completo.",
  rappTitrePage: "Riconciliazione bancaria — Area professionale", rappSurtitre: "Contabilità",
  rappTitre: "Riconciliazione bancaria",
  rappDescription: "Importi l’estratto CSV della banca: i crediti vengono riconciliati con i pagamenti registrati (±3 giorni, stesso importo, riferimento se presente). Allerta se lo scostamento supera il 2 % o se un’operazione resta orfana più di 7 giorni.",
  importerTitre: "Importa un estratto", fichier: "File CSV (2 MB max)",
  importer: "Importa e riconcilia",
  colonnes: "Colonne accettate: data;descrizione;importo (con segno) o data;descrizione;dare;avere, con riferimento facoltativo. Date GG/MM/AAAA o AAAA-MM-GG, importi con virgola o punto.",
  importRef: (ref) => `Importazione ${ref}`, alerteRapp: "Allerta riconciliazione", rapproche: "Riconciliato",
  credits: "Crediti", debits: "Addebiti", attendus: "Pagamenti attesi", ecart: "Scostamento",
  ecartAlerte: (ecart) => `Scostamento superiore al 2 % (${ecart}). `,
  orphelines: (n) => `${n} operazione/i orfana/e da oltre 7 giorni. `,
  verifier: "Controlli le righe seguenti e i pagamenti non riconciliati.",
  rappColDate: "Data", rappColLibelle: "Descrizione", rappColMontant: "Importo", rappColStatut: "Stato",
  nonRetrouves: (n) => `Pagamenti registrati non trovati (${n})`,
  aucunReleve: "Nessun estratto importato per questo spazio.", recents: "Importazioni recenti",
  ecartOrphelines: (ecart, n) => `scostamento ${ecart} · ${n} orfana/e`,
  simTitrePage: "Simulatore micro / ordinario — Contabilità", simSurtitre: "Area professionale · Contabilità",
  simTitre: "Simulatore micro-BIC / ordinario",
  simDescription: "Confronti le basi imponibili. Il simulatore non calcola l’IRPEF né i contributi sociali.",
  retourCompta: "← Contabilità", regimeEtudie: "Regime micro studiato",
  recettes: "Ricavi annuali (€)", charges: "Costi deducibili (€)",
  amortissements: "Ammortamenti (€)", comparer: "Confronta",
  seuilMicro: "Soglia micro", abattement: "Abbattimento", baseReel: "Base ordinaria",
  baseReelNote: "ricavi − costi − ammortamenti", resultat: "Risultato",
  baseMicro: "Base micro", indisponible: "non disponibile", ecartReel: "scostamento dall’ordinario",
  deficit: "Perdita riportabile nel regime ordinario",
  recettesSeuil: (seuil) => `Ricavi superiori alla soglia di ${seuil}: il micro-BIC non è disponibile.`,
  bareme: "Scala indicativa 2025 (soglie 15.000 € / 77.700 €, abbattimenti 30 % / 71 %). Verifichi la scala dell’anno e la sua situazione con un commercialista.",
  recommandations: {
    micro: "Il micro-BIC offre la base imponibile più bassa su questi importi.",
    reel: "Il regime ordinario offre una base imponibile più bassa: costi e ammortamenti superano l’abbattimento forfettario.",
    equivalent: "Entrambi i regimi danno la stessa base imponibile su questi importi.",
    micro_indisponible: "I ricavi superano la soglia del micro-BIC: si applica il regime ordinario.",
  },
};

const DE: TraductionsCompta = {
  titrePage: "Buchhaltung — Profibereich", espace: "Profibereich",
  titre: (mois) => `Buchhaltung — ${mois}`,
  description: "Buchungen, Rechnungen, MwSt. und Kurtaxe.",
  precedent: "← Vorheriger Monat", courant: "Aktueller Monat", suivant: "Nächster Monat →",
  factures: "Rechnungen", rapprochement: "Abgleich", parametresFiscaux: "Steuereinstellungen",
  simulateur: "Micro-/Standard-Simulator", sorties: "Geldausgänge", planning: "Planung",
  exports: (mois) => `Exporte ${mois}:`, resasCsv: "Buchungen CSV",
  facturesCsv: "Rechnungen CSV", paiementsCsv: "Zahlungen CSV", facturX: "Factur-X ZIP",
  modele: "Abgleichsvorlage", auditCsv: "Audit CSV",
  colLogement: "Unterkunft", colSejours: "Aufenthalte", colCa: "Buchungsumsatz",
  colFactures: "Rechnungen", colTtc: "Brutto fakturiert", paiementsMois: "Zahlungen des Monats",
  aucunPaiement: "Keine Zahlung in diesem Monat erhalten.", colDate: "Datum",
  colFacture: "Rechnung", colMode: "Art", colReference: "Referenz", colMontant: "Betrag",
  kpiCa: "Buchungsumsatz", kpiHt: "Netto fakturiert", kpiTva: "MwSt. + Kurtaxe",
  kpiTtc: "Brutto fakturiert", kpiEncaisse: "Erhalten",
  sejours: (n) => `${n} Aufenthalt${n === 1 ? "" : "e"}`, nbFactures: (n) => `${n} Rechnung${n === 1 ? "" : "en"}`,
  tvaEtTaxe: (tva, taxe) => `MwSt. ${tva} · Kurtaxe ${taxe}`, horsCa: "ohne Buchungsumsatz",
  nbPaiements: (n) => `${n} Zahlung${n === 1 ? "" : "en"}`,
  paramsTitrePage: "Steuereinstellungen — Profibereich", paramsSurtitre: "Profibereich · Buchhaltung",
  paramsTitre: "Steuereinstellungen",
  paramsDescription: "MwSt., Kurtaxe und Rechnungsnummerierung für diesen Tenant.",
  paramsOk: "Steuereinstellungen gespeichert.",
  paramsErreurs: {
    taux: "Ungültiger MwSt.-Satz (z. B. 10 oder 5,5).",
    taxe: "Ungültige Kurtaxe (z. B. 1,50; 0 für keine).",
    plafond: "Ungültige Obergrenze (z. B. 4,20).", inattendu: "Unerwarteter Fehler. Versuchen Sie es erneut.",
  },
  kpiTvaDefaut: "Standard-MwSt.", kpiTaxe: "Kurtaxe",
  parNuitPersonne: "pro Nacht und Person", kpiNumerotation: "Nummerierung",
  reglages: "Einstellungen",
  reglagesAide: "Diese Werte sind Standard. Eine Rechnung kann sie jederzeit manuell pro Position überschreiben.",
  tauxTva: "MwSt.-Satz (%)",
  tauxAide: "Standardmäßig bei der Rechnungserstellung angewendeter Satz.",
  prefixe: "Rechnungspräfix",
  prefixeAide: "2 bis 8 Zeichen A-Z oder 0-9. Nummerierung: PRÄFIX-JJJJ-0001.",
  taxeNuit: "Kurtaxe (€ / Nacht / Person)",
  taxeAide: "Betrag pro Nacht und Gast. 0, wenn nicht anwendbar.",
  plafond: "Obergrenze (€ / Nacht / Person, optional)",
  plafondAide: "Leer lassen, wenn keine Obergrenze besteht.",
  mentions: "Rechtliche Hinweise (optional)",
  mentionsPlaceholder: "Z. B. MwSt. nicht anwendbar, Art. 293 B CGI…",
  enregistrer: "Einstellungen speichern", facturXTitre: "Factur-X — Vorbereitung",
  facturXAide: "Jede Rechnung bietet auf ihrer Detailseite einen CII-XML-Export. Die XML enthält Netto-, MwSt.-, Kurtaxe- und Bruttobeträge. Sie muss noch in ein PDF/A-3 eingebettet und mit einer Partner-Dematerialisierungsplattform validiert werden, bevor sie steuerlich voll nutzbar ist.",
  rappTitrePage: "Bankabgleich — Profibereich", rappSurtitre: "Buchhaltung",
  rappTitre: "Bankabgleich",
  rappDescription: "Importieren Sie den CSV-Kontoauszug der Bank: Gutschriften werden mit erfassten Zahlungen abgeglichen (±3 Tage, gleicher Betrag, Referenz falls vorhanden). Warnung, wenn die Abweichung 2 % übersteigt oder eine Position länger als 7 Tage offen bleibt.",
  importerTitre: "Kontoauszug importieren", fichier: "CSV-Datei (max. 2 MB)",
  importer: "Importieren und abgleichen",
  colonnes: "Akzeptierte Spalten: datum;bezeichnung;betrag (vorzeichenbehaftet) oder datum;bezeichnung;soll;haben, mit optionaler Referenz. Datum TT/MM/JJJJ oder JJJJ-MM-TT, Beträge mit Komma oder Punkt.",
  importRef: (ref) => `Import ${ref}`, alerteRapp: "Abgleichwarnung", rapproche: "Abgeglichen",
  credits: "Gutschriften", debits: "Belastungen", attendus: "Erwartete Zahlungen", ecart: "Abweichung",
  ecartAlerte: (ecart) => `Abweichung über 2 % (${ecart}). `,
  orphelines: (n) => `${n} offene Position(en) älter als 7 Tage. `,
  verifier: "Prüfen Sie die folgenden Zeilen und die nicht abgeglichenen Zahlungen.",
  rappColDate: "Datum", rappColLibelle: "Bezeichnung", rappColMontant: "Betrag", rappColStatut: "Status",
  nonRetrouves: (n) => `Erfasste Zahlungen nicht gefunden (${n})`,
  aucunReleve: "Kein Kontoauszug für diesen Bereich importiert.", recents: "Letzte Importe",
  ecartOrphelines: (ecart, n) => `Abweichung ${ecart} · ${n} offen`,
  simTitrePage: "Micro-/Standard-Simulator — Buchhaltung", simSurtitre: "Profibereich · Buchhaltung",
  simTitre: "Micro-BIC-/Standard-Simulator",
  simDescription: "Vergleichen Sie die steuerlichen Bemessungsgrundlagen. Der Simulator berechnet weder Einkommensteuer noch Sozialabgaben.",
  retourCompta: "← Buchhaltung", regimeEtudie: "Untersuchtes Micro-Regime",
  recettes: "Jahresumsatz (€)", charges: "Abzugsfähige Kosten (€)",
  amortissements: "Abschreibungen (€)", comparer: "Vergleichen",
  seuilMicro: "Micro-Schwelle", abattement: "Freibetrag", baseReel: "Standard-Basis",
  baseReelNote: "Umsatz − Kosten − Abschreibungen", resultat: "Ergebnis",
  baseMicro: "Micro-Basis", indisponible: "nicht verfügbar", ecartReel: "Abweichung zum Standard",
  deficit: "Vortragsfähiger Verlust im Standardregime",
  recettesSeuil: (seuil) => `Umsatz über der Schwelle von ${seuil}: Micro-BIC ist nicht verfügbar.`,
  bareme: "Indikative Skala 2025 (Schwellen 15.000 € / 77.700 €, Freibeträge 30 % / 71 %). Prüfen Sie die Skala des Jahres und Ihre Situation mit einem Steuerberater.",
  recommandations: {
    micro: "Micro-BIC ergibt bei diesen Beträgen die niedrigste steuerliche Basis.",
    reel: "Das Standardregime ergibt eine niedrigere Basis: Kosten und Abschreibungen übersteigen den Pauschalfreibetrag.",
    equivalent: "Beide Regime ergeben bei diesen Beträgen dieselbe Basis.",
    micro_indisponible: "Der Umsatz übersteigt die Micro-BIC-Schwelle: Das Standardregime gilt.",
  },
};

const DICTIONNAIRES: Record<Langue, TraductionsCompta> = {
  fr: FR, en: EN, es: ES, it: IT, de: DE,
};

export function traductionsCompta(langue: string): TraductionsCompta {
  return masquerFonctions(DICTIONNAIRES[resoudreLangue(langue)]);
}
