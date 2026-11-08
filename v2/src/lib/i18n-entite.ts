import type { Langue } from "./i18n";
import { masquerFonctions, resoudreLangue } from "./i18n-staff";

export interface TraductionsEntite {
  titrePage: string;
  espace: string;
  titre: string;
  description: string;
  proprietaires: string;
  introuvable: string;
  ok: string;
  erreurInattendue: string;
  identite: string;
  identiteAide: string;
  nom: string;
  siren: string;
  sirenEnregistre: string;
  nature: string;
  regime: string;
  tva: string;
  adresse: string;
  mentions: string;
  mentionsAide: string;
  enregistrer: string;
}

const FR: TraductionsEntite = {
  titrePage: "Entité juridique — Espace hôte", espace: "Espace hôte",
  titre: "Entité juridique",
  description: "Identité utilisée sur les factures et les exports comptables.",
  proprietaires: "Propriétaires et mandats", introuvable: "Entité introuvable.",
  ok: "Entité juridique mise à jour.", erreurInattendue: "Erreur inattendue. Réessayez.",
  identite: "Identité de facturation",
  identiteAide: "Une seule entité juridique par organisation en beta.",
  nom: "Nom de l’entité", siren: "SIREN (facultatif)", sirenEnregistre: "SIREN enregistré",
  nature: "Nature juridique", regime: "Régime fiscal", tva: "TVA",
  adresse: "Adresse de facturation (facultatif)",
  mentions: "Mentions légales de facture (facultatif)",
  mentionsAide: "Ex. « TVA non applicable, art. 293 B du CGI ». Les paramètres fiscaux restent prioritaires si une mention y est déjà définie.",
  enregistrer: "Enregistrer l’entité",
};

const EN: TraductionsEntite = {
  titrePage: "Legal entity — Staff area", espace: "Staff area",
  titre: "Legal entity",
  description: "Identity used on invoices and accounting exports.",
  proprietaires: "Owners and mandates", introuvable: "Entity not found.",
  ok: "Legal entity updated.", erreurInattendue: "Unexpected error. Try again.",
  identite: "Billing identity",
  identiteAide: "One legal entity per organisation in beta.",
  nom: "Entity name", siren: "SIREN (optional)", sirenEnregistre: "Registered SIREN",
  nature: "Legal form", regime: "Tax regime", tva: "VAT",
  adresse: "Billing address (optional)",
  mentions: "Legal invoice notices (optional)",
  mentionsAide: "E.g. “VAT not applicable, art. 293 B of the French tax code”. Tax settings take precedence when a notice is already defined.",
  enregistrer: "Save entity",
};

const ES: TraductionsEntite = {
  titrePage: "Entidad jurídica — Área profesional", espace: "Área profesional",
  titre: "Entidad jurídica",
  description: "Identidad utilizada en las facturas y exportaciones contables.",
  proprietaires: "Propietarios y mandatos", introuvable: "Entidad no encontrada.",
  ok: "Entidad jurídica actualizada.", erreurInattendue: "Error inesperado. Inténtelo de nuevo.",
  identite: "Identidad de facturación",
  identiteAide: "Una sola entidad jurídica por organización en beta.",
  nom: "Nombre de la entidad", siren: "SIREN (opcional)", sirenEnregistre: "SIREN registrado",
  nature: "Forma jurídica", regime: "Régimen fiscal", tva: "IVA",
  adresse: "Dirección de facturación (opcional)",
  mentions: "Menciones legales de factura (opcional)",
  mentionsAide: "Ej. «IVA no aplicable, art. 293 B del CGI». Los parámetros fiscales tienen prioridad si ya hay una mención definida.",
  enregistrer: "Guardar entidad",
};

const IT: TraductionsEntite = {
  titrePage: "Entità giuridica — Area professionale", espace: "Area professionale",
  titre: "Entità giuridica",
  description: "Identità utilizzata su fatture ed esportazioni contabili.",
  proprietaires: "Proprietari e mandati", introuvable: "Entità non trovata.",
  ok: "Entità giuridica aggiornata.", erreurInattendue: "Errore imprevisto. Riprovare.",
  identite: "Identità di fatturazione",
  identiteAide: "Una sola entità giuridica per organizzazione in beta.",
  nom: "Nome dell’entità", siren: "SIREN (facoltativo)", sirenEnregistre: "SIREN registrato",
  nature: "Forma giuridica", regime: "Regime fiscale", tva: "IVA",
  adresse: "Indirizzo di fatturazione (facoltativo)",
  mentions: "Note legali di fattura (facoltativo)",
  mentionsAide: "Es. «IVA non applicabile, art. 293 B del CGI». I parametri fiscali hanno priorità se una nota è già definita.",
  enregistrer: "Salva entità",
};

const DE: TraductionsEntite = {
  titrePage: "Rechtsträger — Profibereich", espace: "Profibereich",
  titre: "Rechtsträger",
  description: "Identität für Rechnungen und Buchhaltungsexporte.",
  proprietaires: "Eigentümer und Mandate", introuvable: "Rechtsträger nicht gefunden.",
  ok: "Rechtsträger aktualisiert.", erreurInattendue: "Unerwarteter Fehler. Versuchen Sie es erneut.",
  identite: "Rechnungsidentität",
  identiteAide: "Eine Rechtsträger pro Organisation in der Beta.",
  nom: "Name des Rechtsträgers", siren: "SIREN (optional)", sirenEnregistre: "Registrierte SIREN",
  nature: "Rechtsform", regime: "Steuerregime", tva: "USt.",
  adresse: "Rechnungsadresse (optional)",
  mentions: "Rechtliche Rechnungshinweise (optional)",
  mentionsAide: "Z. B. „USt. nicht anwendbar, Art. 293 B CGI“. Steuereinstellungen haben Vorrang, wenn bereits ein Hinweis definiert ist.",
  enregistrer: "Rechtsträger speichern",
};

const DICTIONNAIRES: Record<Langue, TraductionsEntite> = {
  fr: FR, en: EN, es: ES, it: IT, de: DE,
};

export function traductionsEntite(langue: string): TraductionsEntite {
  return masquerFonctions(DICTIONNAIRES[resoudreLangue(langue)]);
}
