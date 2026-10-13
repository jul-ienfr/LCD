// lib/i18n.ts — 5 langues FR/EN/ES/IT/DE (miroir gateway §17, côté front).
// Priorité : ?lang= > cookie lcd_lang > Accept-Language > fr.
export const LANGUES = ["fr", "en", "es", "it", "de"] as const;
export type Langue = (typeof LANGUES)[number];

const T: Record<string, Record<Langue, string>> = {
  titre: {
    fr: "LCD — Parc",
    en: "LCD — Estate",
    es: "LCD — Parque",
    it: "LCD — Parco",
    de: "LCD — Park",
  },
  pilotage: {
    fr: "Pilotage",
    en: "Control",
    es: "Pilotaje",
    it: "Gestione",
    de: "Steuerung",
  },
  voyageur: {
    fr: "Voyageur",
    en: "Guest",
    es: "Viajero",
    it: "Ospite",
    de: "Gast",
  },
  proprio: {
    fr: "Propriétaire",
    en: "Owner",
    es: "Propietario",
    it: "Proprietario",
    de: "Eigentümer",
  },
  commercial: {
    fr: "Commercial",
    en: "Sales",
    es: "Comercial",
    it: "Commerciale",
    de: "Vertrieb",
  },
  envoyer: { fr: "Envoyer", en: "Send", es: "Enviar", it: "Invia", de: "Senden" },
  qui: {
    fr: "Qui (obligatoire, journalisé)",
    en: "Who (required, logged)",
    es: "Quién (obligatorio, registrado)",
    it: "Chi (obbligatorio, registrato)",
    de: "Wer (erforderlich, protokolliert)",
  },
  ecritures_off: {
    fr: "Écritures désactivées : box injoignable.",
    en: "Writes disabled: box unreachable.",
    es: "Escrituras desactivadas: caja inalcanzable.",
    it: "Scritture disabilitate: box non raggiungibile.",
    de: "Schreiben deaktiviert: Box nicht erreichbar.",
  },
  joignables: {
    fr: "joignable(s)",
    en: "reachable",
    es: "alcanzable(s)",
    it: "raggiungibile(i)",
    de: "erreichbar",
  },
  sans_js: {
    fr: "Fonctionne sans JavaScript — formulaires natifs.",
    en: "Works without JavaScript — native forms.",
    es: "Funciona sin JavaScript — formularios nativos.",
    it: "Funziona senza JavaScript — moduli nativi.",
    de: "Funktioniert ohne JavaScript — native Formulare.",
  },
};

export function t(cle: string, lang: Langue): string {
  return T[cle]?.[lang] ?? `[${cle}]`;
}

export function choisirLangue(
  query: string,
  cookie: string,
  accept: string,
): Langue {
  const q = (query || "").slice(0, 2).toLowerCase();
  if ((LANGUES as readonly string[]).includes(q)) return q as Langue;
  const c = (cookie || "").slice(0, 2).toLowerCase();
  if ((LANGUES as readonly string[]).includes(c)) return c as Langue;
  const m = (accept || "").toLowerCase().match(/[a-z]{2}/);
  if (m && (LANGUES as readonly string[]).includes(m[0]))
    return m[0] as Langue;
  return "fr";
}

export const LIBELLES_ACTION: Record<string, Record<Langue, string>> = {
  resa: {
    fr: "Réserver",
    en: "Book",
    es: "Reservar",
    it: "Prenota",
    de: "Buchen",
  },
  confirmer: {
    fr: "Confirmer",
    en: "Confirm",
    es: "Confirmar",
    it: "Conferma",
    de: "Bestätigen",
  },
  prix: {
    fr: "Fixer le prix",
    en: "Set price",
    es: "Fijar precio",
    it: "Imposta prezzo",
    de: "Preis setzen",
  },
  mission: {
    fr: "Créer mission ménage",
    en: "Create cleaning task",
    es: "Crear tarea limpieza",
    it: "Crea pulizia",
    de: "Reinigung anlegen",
  },
  cloture_menage: {
    fr: "Clôturer ménage",
    en: "Close cleaning",
    es: "Cerrar limpieza",
    it: "Chiudi pulizia",
    de: "Reinigung schließen",
  },
  facture_valider: {
    fr: "Valider facture",
    en: "Validate invoice",
    es: "Validar factura",
    it: "Convalida fattura",
    de: "Rechnung prüfen",
  },
  payout: {
    fr: "Verser (payout)",
    en: "Pay out",
    es: "Pagar",
    it: "Versa",
    de: "Auszahlen",
  },
  cloture_compta: {
    fr: "Clôture compta",
    en: "Close accounts",
    es: "Cerrar contabilidad",
    it: "Chiudi contabilità",
    de: "Buchhaltung schließen",
  },
  debiter: {
    fr: "Débiter caution",
    en: "Charge deposit",
    es: "Cargar fianza",
    it: "Addebita cauzione",
    de: "Kaution belasten",
  },
  restituer_caution: {
    fr: "Restituer caution",
    en: "Refund deposit",
    es: "Devolver fianza",
    it: "Restituisci cauzione",
    de: "Kaution erstatten",
  },
  doc_facture: {
    fr: "Générer facture",
    en: "Generate invoice",
    es: "Generar factura",
    it: "Genera fattura",
    de: "Rechnung erstellen",
  },
  doc_valider: {
    fr: "Valider document",
    en: "Validate document",
    es: "Validar documento",
    it: "Convalida documento",
    de: "Dokument prüfen",
  },
  commande_extras: {
    fr: "Commander extras",
    en: "Order extras",
    es: "Pedir extras",
    it: "Ordina extra",
    de: "Extras bestellen",
  },
  sinistre_declarer: {
    fr: "Déclarer sinistre",
    en: "Report incident",
    es: "Declarar siniestro",
    it: "Dichiara sinistro",
    de: "Schaden melden",
  },
};
