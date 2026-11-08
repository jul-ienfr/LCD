import type { Langue } from "./i18n";
import { masquerFonctions, resoudreLangue } from "./i18n-staff";

export interface TraductionsLogements {
  titre: string;
  espace: string;
  afficherArchives: string;
  masquerArchives: string;
  tenant: string;
  ajouter: string;
  ajouterIntro: string;
  code: string;
  codeAide: string;
  nom: string;
  adresse: string;
  adresseFacultatif: string;
  creer: string;
  cree: (code: string) => string;
  aucun: string;
  copro: string;
  calendrier: string;
  guide: string;
}

const FR: TraductionsLogements = {
  titre: "Logements", espace: "Espace hôte", afficherArchives: "Afficher les archivés",
  masquerArchives: "Masquer les archivés", tenant: "Tenant", ajouter: "Ajouter un logement",
  ajouterIntro: "Le code est stable et unique par tenant. Toute création est auditée.",
  code: "Code", codeAide: "minuscules, chiffres, tirets — stable dans les URL",
  nom: "Nom", adresse: "Adresse (facultatif)", adresseFacultatif: "Adresse",
  creer: "Créer le logement", cree: (code) => `Logement « ${code} » créé.`,
  aucun: "Aucun logement pour ce tenant. Créez le premier ci-dessus.",
  copro: "copro à vérifier", calendrier: "Calendrier", guide: "Guide",
};

const EN: TraductionsLogements = {
  titre: "Properties", espace: "Staff area", afficherArchives: "Show archived",
  masquerArchives: "Hide archived", tenant: "Tenant", ajouter: "Add a property",
  ajouterIntro: "The code is stable and unique per tenant. Every creation is audited.",
  code: "Code", codeAide: "lowercase, digits, hyphens — stable in URLs",
  nom: "Name", adresse: "Address (optional)", adresseFacultatif: "Address",
  creer: "Create property", cree: (code) => `Property “${code}” created.`,
  aucun: "No property for this tenant. Create the first one above.",
  copro: "co-ownership to verify", calendrier: "Calendar", guide: "Guide",
};

const ES: TraductionsLogements = {
  titre: "Alojamientos", espace: "Área profesional", afficherArchives: "Mostrar archivados",
  masquerArchives: "Ocultar archivados", tenant: "Tenant", ajouter: "Añadir un alojamiento",
  ajouterIntro: "El código es estable y único por tenant. Cada creación se audita.",
  code: "Código", codeAide: "minúsculas, cifras, guiones — estable en las URL",
  nom: "Nombre", adresse: "Dirección (opcional)", adresseFacultatif: "Dirección",
  creer: "Crear alojamiento", cree: (code) => `Alojamiento «${code}» creado.`,
  aucun: "Ningún alojamiento para este tenant. Cree el primero arriba.",
  copro: "copropiedad a verificar", calendrier: "Calendario", guide: "Guía",
};

const IT: TraductionsLogements = {
  titre: "Alloggi", espace: "Area professionale", afficherArchives: "Mostra archiviati",
  masquerArchives: "Nascondi archiviati", tenant: "Tenant", ajouter: "Aggiungi un alloggio",
  ajouterIntro: "Il codice è stabile e unico per tenant. Ogni creazione è verificata.",
  code: "Codice", codeAide: "minuscole, cifre, trattini — stabile negli URL",
  nom: "Nome", adresse: "Indirizzo (facoltativo)", adresseFacultatif: "Indirizzo",
  creer: "Crea alloggio", cree: (code) => `Alloggio «${code}» creato.`,
  aucun: "Nessun alloggio per questo tenant. Crei il primo sopra.",
  copro: "comproprietà da verificare", calendrier: "Calendario", guide: "Guida",
};

const DE: TraductionsLogements = {
  titre: "Unterkünfte", espace: "Profibereich", afficherArchives: "Archivierte anzeigen",
  masquerArchives: "Archivierte ausblenden", tenant: "Mandant", ajouter: "Unterkunft hinzufügen",
  ajouterIntro: "Der Code ist stabil und pro Mandant eindeutig. Jede Erstellung wird auditiert.",
  code: "Code", codeAide: "Kleinbuchstaben, Ziffern, Bindestriche — stabil in URLs",
  nom: "Name", adresse: "Adresse (optional)", adresseFacultatif: "Adresse",
  creer: "Unterkunft erstellen", cree: (code) => `Unterkunft „${code}“ erstellt.`,
  aucun: "Keine Unterkunft für diesen Mandanten. Erstellen Sie oben die erste.",
  copro: "Miteigentum zu prüfen", calendrier: "Kalender", guide: "Leitfaden",
};

const DICTIONNAIRES: Record<Langue, TraductionsLogements> = {
  fr: FR, en: EN, es: ES, it: IT, de: DE,
};

export function traductionsLogements(langue: string): TraductionsLogements {
  return masquerFonctions(DICTIONNAIRES[resoudreLangue(langue)]);
}
