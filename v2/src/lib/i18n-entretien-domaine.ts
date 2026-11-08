import type { Langue } from "./i18n";
import { masquerFonctions, resoudreLangue } from "./i18n-staff";

export interface TraductionsEntretienDomaine {
  dTitrePage: string;
  dSurtitre: string;
  dTitre: string;
  dDescription: string;
  dRetour: string;
  dSiteNonPublie: string;
  dAjouterTitre: string;
  dDomaine: string;
  dAjouter: string;
  dAide: string;
  dCompte: (n: number) => string;
  dAucun: string;
  dDns: string;
  dDnsDetail: (domaine: string, jeton: string) => string;
  dVerifierDns: string;
  dActiver: string;
  dSupprimer: string;
  dMsgAjoute: string;
  dMsgVerifie: string;
  dMsgActif: string;
  dStatuts: Record<string, string>;
  eTitrePage: string;
  eSurtitre: string;
  eTitre: string;
  eDescription: string;
  eRetour: string;
  eVide: string;
  eCreerLogement: string;
  eChoisirLogement: string;
  eOk: string;
  eErreurInattendue: string;
  eInterventions: string;
  eCoutCumule: string;
  eReparations: string;
  eControles: string;
  eNouvelle: (nom: string) => string;
  eType: string;
  eDate: string;
  ePrestataire: string;
  eOptionnel: string;
  eCout: string;
  eTitreChamp: string;
  eTitrePlaceholder: string;
  eDescriptionChamp: string;
  eEnregistrer: string;
  eHistorique: string;
  eEtatsDesLieux: string;
  eMenage: string;
  eAucune: string;
  eColDate: string;
  eColType: string;
  eColIntervention: string;
  eColPrestataire: string;
  eColCout: string;
}

const FR: TraductionsEntretienDomaine = {
  dTitrePage: "Domaine personnalisé — LCD Parc", dSurtitre: "Espace hôte · Design",
  dTitre: "Domaine personnalisé",
  dDescription: "Publiez votre site sur votre propre domaine. La vérification se fait par un enregistrement DNS TXT ; le certificat TLS et la redirection sont ensuite pris en charge par l’hébergement.",
  dRetour: "← Retour au design", dSiteNonPublie: "Votre site n’est pas encore publié. Le domaine restera inactif tant que le site n’est pas publié.",
  dAjouterTitre: "Ajouter un domaine", dDomaine: "Domaine", dAjouter: "Ajouter",
  dAide: "Saisissez le domaine sans https:// ni chemin.",
  dCompte: (n) => `${n} domaine${n > 1 ? "s" : ""}`,
  dAucun: "Aucun domaine pour l’instant. Ajoutez-en un pour publier votre site sur votre propre adresse.",
  dDns: "Enregistrement DNS à créer",
  dDnsDetail: (domaine, jeton) => `Type TXT · nom _lcd-verification.${domaine} · valeur ${jeton}`,
  dVerifierDns: "Vérifier le DNS", dActiver: "Activer le domaine", dSupprimer: "Supprimer",
  dMsgAjoute: "Domaine ajouté. Créez l’enregistrement TXT puis vérifiez-le.",
  dMsgVerifie: "Domaine vérifié par DNS. Vous pouvez l’activer.", dMsgActif: "Domaine activé.",
  dStatuts: { en_attente: "En attente de DNS", verifie: "Vérifié", actif: "Actif", erreur: "Erreur" },
  eTitrePage: "Carnet d’entretien — LCD Parc", eSurtitre: "Espace hôte · Exploitation",
  eTitre: "Carnet d’entretien", eDescription: "Interventions, prestataires et coûts réels par logement.",
  eRetour: "Retour au tableau de bord",
  eVide: "Créez d’abord un logement pour tenir son carnet d’entretien.",
  eCreerLogement: "Créer un logement", eChoisirLogement: "Choisir un logement",
  eOk: "Entretien enregistré.", eErreurInattendue: "Erreur inattendue. Réessayez.",
  eInterventions: "Interventions", eCoutCumule: "Coût cumulé", eReparations: "Réparations", eControles: "Contrôles",
  eNouvelle: (nom) => `Nouvelle intervention — ${nom}`,
  eType: "Type", eDate: "Date", ePrestataire: "Prestataire", eOptionnel: "Optionnel", eCout: "Coût (€)",
  eTitreChamp: "Titre", eTitrePlaceholder: "Remplacement du mitigeur", eDescriptionChamp: "Description",
  eEnregistrer: "Enregistrer l’intervention", eHistorique: "Historique",
  eEtatsDesLieux: "États des lieux", eMenage: "Ménage",
  eAucune: "Aucune intervention enregistrée pour ce logement.",
  eColDate: "Date", eColType: "Type", eColIntervention: "Intervention", eColPrestataire: "Prestataire", eColCout: "Coût",
};

const EN: TraductionsEntretienDomaine = {
  dTitrePage: "Custom domain — LCD Parc", dSurtitre: "Staff area · Design",
  dTitre: "Custom domain",
  dDescription: "Publish your site on your own domain. Verification uses a DNS TXT record; the TLS certificate and redirect are then handled by the hosting.",
  dRetour: "← Back to design", dSiteNonPublie: "Your site is not published yet. The domain will stay inactive until the site is published.",
  dAjouterTitre: "Add a domain", dDomaine: "Domain", dAjouter: "Add",
  dAide: "Enter the domain without https:// or a path.",
  dCompte: (n) => `${n} domain${n === 1 ? "" : "s"}`,
  dAucun: "No domain yet. Add one to publish your site on your own address.",
  dDns: "DNS record to create",
  dDnsDetail: (domaine, jeton) => `TXT type · name _lcd-verification.${domaine} · value ${jeton}`,
  dVerifierDns: "Check DNS", dActiver: "Activate domain", dSupprimer: "Delete",
  dMsgAjoute: "Domain added. Create the TXT record then check it.",
  dMsgVerifie: "Domain verified by DNS. You can activate it.", dMsgActif: "Domain activated.",
  dStatuts: { en_attente: "Waiting for DNS", verifie: "Verified", actif: "Active", erreur: "Error" },
  eTitrePage: "Maintenance log — LCD Parc", eSurtitre: "Staff area · Operations",
  eTitre: "Maintenance log", eDescription: "Jobs, providers and real costs per property.",
  eRetour: "Back to dashboard",
  eVide: "Create a property first to keep its maintenance log.",
  eCreerLogement: "Create a property", eChoisirLogement: "Choose a property",
  eOk: "Maintenance saved.", eErreurInattendue: "Unexpected error. Try again.",
  eInterventions: "Jobs", eCoutCumule: "Total cost", eReparations: "Repairs", eControles: "Checks",
  eNouvelle: (nom) => `New job — ${nom}`,
  eType: "Type", eDate: "Date", ePrestataire: "Provider", eOptionnel: "Optional", eCout: "Cost (€)",
  eTitreChamp: "Title", eTitrePlaceholder: "Replace the mixer tap", eDescriptionChamp: "Description",
  eEnregistrer: "Save job", eHistorique: "History",
  eEtatsDesLieux: "Inspections", eMenage: "Housekeeping",
  eAucune: "No job recorded for this property.",
  eColDate: "Date", eColType: "Type", eColIntervention: "Job", eColPrestataire: "Provider", eColCout: "Cost",
};

const ES: TraductionsEntretienDomaine = {
  dTitrePage: "Dominio personalizado — LCD Parc", dSurtitre: "Área profesional · Diseño",
  dTitre: "Dominio personalizado",
  dDescription: "Publique su sitio en su propio dominio. La verificación se hace con un registro DNS TXT; el certificado TLS y la redirección los gestiona después el alojamiento.",
  dRetour: "← Volver al diseño", dSiteNonPublie: "Su sitio aún no está publicado. El dominio permanecerá inactivo mientras el sitio no se publique.",
  dAjouterTitre: "Añadir un dominio", dDomaine: "Dominio", dAjouter: "Añadir",
  dAide: "Introduzca el dominio sin https:// ni ruta.",
  dCompte: (n) => `${n} dominio${n === 1 ? "" : "s"}`,
  dAucun: "Ningún dominio por ahora. Añada uno para publicar su sitio en su propia dirección.",
  dDns: "Registro DNS que crear",
  dDnsDetail: (domaine, jeton) => `Tipo TXT · nombre _lcd-verification.${domaine} · valor ${jeton}`,
  dVerifierDns: "Verificar el DNS", dActiver: "Activar el dominio", dSupprimer: "Eliminar",
  dMsgAjoute: "Dominio añadido. Cree el registro TXT y luego verifíquelo.",
  dMsgVerifie: "Dominio verificado por DNS. Puede activarlo.", dMsgActif: "Dominio activado.",
  dStatuts: { en_attente: "Esperando DNS", verifie: "Verificado", actif: "Activo", erreur: "Error" },
  eTitrePage: "Libro de mantenimiento — LCD Parc", eSurtitre: "Área profesional · Explotación",
  eTitre: "Libro de mantenimiento", eDescription: "Intervenciones, proveedores y costes reales por alojamiento.",
  eRetour: "Volver al panel",
  eVide: "Cree primero un alojamiento para llevar su libro de mantenimiento.",
  eCreerLogement: "Crear un alojamiento", eChoisirLogement: "Elegir un alojamiento",
  eOk: "Mantenimiento guardado.", eErreurInattendue: "Error inesperado. Inténtelo de nuevo.",
  eInterventions: "Intervenciones", eCoutCumule: "Coste acumulado", eReparations: "Reparaciones", eControles: "Controles",
  eNouvelle: (nom) => `Nueva intervención — ${nom}`,
  eType: "Tipo", eDate: "Fecha", ePrestataire: "Proveedor", eOptionnel: "Opcional", eCout: "Coste (€)",
  eTitreChamp: "Título", eTitrePlaceholder: "Sustitución del grifo monomando", eDescriptionChamp: "Descripción",
  eEnregistrer: "Guardar la intervención", eHistorique: "Historial",
  eEtatsDesLieux: "Estados de los lugares", eMenage: "Limpieza",
  eAucune: "Ninguna intervención registrada para este alojamiento.",
  eColDate: "Fecha", eColType: "Tipo", eColIntervention: "Intervención", eColPrestataire: "Proveedor", eColCout: "Coste",
};

const IT: TraductionsEntretienDomaine = {
  dTitrePage: "Dominio personalizzato — LCD Parc", dSurtitre: "Area professionale · Design",
  dTitre: "Dominio personalizzato",
  dDescription: "Pubblichi il suo sito sul proprio dominio. La verifica avviene tramite un record DNS TXT; il certificato TLS e il reindirizzamento sono poi gestiti dall’hosting.",
  dRetour: "← Torna al design", dSiteNonPublie: "Il suo sito non è ancora pubblicato. Il dominio resterà inattivo finché il sito non sarà pubblicato.",
  dAjouterTitre: "Aggiungi un dominio", dDomaine: "Dominio", dAjouter: "Aggiungi",
  dAide: "Inserisca il dominio senza https:// né percorso.",
  dCompte: (n) => `${n} dominio${n === 1 ? "" : "i"}`,
  dAucun: "Nessun dominio per ora. Ne aggiunga uno per pubblicare il sito sul proprio indirizzo.",
  dDns: "Record DNS da creare",
  dDnsDetail: (domaine, jeton) => `Tipo TXT · nome _lcd-verification.${domaine} · valore ${jeton}`,
  dVerifierDns: "Verifica il DNS", dActiver: "Attiva il dominio", dSupprimer: "Elimina",
  dMsgAjoute: "Dominio aggiunto. Crei il record TXT e poi lo verifichi.",
  dMsgVerifie: "Dominio verificato via DNS. Può attivarlo.", dMsgActif: "Dominio attivato.",
  dStatuts: { en_attente: "In attesa del DNS", verifie: "Verificato", actif: "Attivo", erreur: "Errore" },
  eTitrePage: "Registro di manutenzione — LCD Parc", eSurtitre: "Area professionale · Esercizio",
  eTitre: "Registro di manutenzione", eDescription: "Interventi, fornitori e costi reali per alloggio.",
  eRetour: "Torna alla dashboard",
  eVide: "Crei prima un alloggio per tenere il suo registro di manutenzione.",
  eCreerLogement: "Crea un alloggio", eChoisirLogement: "Scegli un alloggio",
  eOk: "Manutenzione salvata.", eErreurInattendue: "Errore imprevisto. Riprovi.",
  eInterventions: "Interventi", eCoutCumule: "Costo cumulato", eReparations: "Riparazioni", eControles: "Controlli",
  eNouvelle: (nom) => `Nuovo intervento — ${nom}`,
  eType: "Tipo", eDate: "Data", ePrestataire: "Fornitore", eOptionnel: "Opzionale", eCout: "Costo (€)",
  eTitreChamp: "Titolo", eTitrePlaceholder: "Sostituzione del miscelatore", eDescriptionChamp: "Descrizione",
  eEnregistrer: "Salva l’intervento", eHistorique: "Cronologia",
  eEtatsDesLieux: "Stati dei luoghi", eMenage: "Pulizie",
  eAucune: "Nessun intervento registrato per questo alloggio.",
  eColDate: "Data", eColType: "Tipo", eColIntervention: "Intervento", eColPrestataire: "Fornitore", eColCout: "Costo",
};

const DE: TraductionsEntretienDomaine = {
  dTitrePage: "Eigene Domain — LCD Parc", dSurtitre: "Profibereich · Design",
  dTitre: "Eigene Domain",
  dDescription: "Veröffentlichen Sie Ihre Website auf Ihrer eigenen Domain. Die Prüfung erfolgt über einen DNS-TXT-Eintrag; TLS-Zertifikat und Weiterleitung übernimmt anschließend das Hosting.",
  dRetour: "← Zurück zum Design", dSiteNonPublie: "Ihre Website ist noch nicht veröffentlicht. Die Domain bleibt inaktiv, bis die Website veröffentlicht ist.",
  dAjouterTitre: "Domain hinzufügen", dDomaine: "Domain", dAjouter: "Hinzufügen",
  dAide: "Geben Sie die Domain ohne https:// und ohne Pfad ein.",
  dCompte: (n) => `${n} Domain${n === 1 ? "" : "s"}`,
  dAucun: "Noch keine Domain. Fügen Sie eine hinzu, um Ihre Website unter Ihrer eigenen Adresse zu veröffentlichen.",
  dDns: "Zu erstellender DNS-Eintrag",
  dDnsDetail: (domaine, jeton) => `Typ TXT · Name _lcd-verification.${domaine} · Wert ${jeton}`,
  dVerifierDns: "DNS prüfen", dActiver: "Domain aktivieren", dSupprimer: "Löschen",
  dMsgAjoute: "Domain hinzugefügt. Erstellen Sie den TXT-Eintrag und prüfen Sie ihn.",
  dMsgVerifie: "Domain per DNS geprüft. Sie können sie aktivieren.", dMsgActif: "Domain aktiviert.",
  dStatuts: { en_attente: "Warten auf DNS", verifie: "Geprüft", actif: "Aktiv", erreur: "Fehler" },
  eTitrePage: "Wartungsbuch — LCD Parc", eSurtitre: "Profibereich · Betrieb",
  eTitre: "Wartungsbuch", eDescription: "Einsätze, Dienstleister und reale Kosten pro Unterkunft.",
  eRetour: "Zurück zum Dashboard",
  eVide: "Erstellen Sie zuerst eine Unterkunft, um ihr Wartungsbuch zu führen.",
  eCreerLogement: "Unterkunft erstellen", eChoisirLogement: "Unterkunft wählen",
  eOk: "Wartung gespeichert.", eErreurInattendue: "Unerwarteter Fehler. Versuchen Sie es erneut.",
  eInterventions: "Einsätze", eCoutCumule: "Gesamtkosten", eReparations: "Reparaturen", eControles: "Kontrollen",
  eNouvelle: (nom) => `Neuer Einsatz — ${nom}`,
  eType: "Typ", eDate: "Datum", ePrestataire: "Dienstleister", eOptionnel: "Optional", eCout: "Kosten (€)",
  eTitreChamp: "Titel", eTitrePlaceholder: "Austausch der Mischbatterie", eDescriptionChamp: "Beschreibung",
  eEnregistrer: "Einsatz speichern", eHistorique: "Verlauf",
  eEtatsDesLieux: "Zustandsprotokolle", eMenage: "Reinigung",
  eAucune: "Kein Einsatz für diese Unterkunft erfasst.",
  eColDate: "Datum", eColType: "Typ", eColIntervention: "Einsatz", eColPrestataire: "Dienstleister", eColCout: "Kosten",
};

const DICTIONNAIRES: Record<Langue, TraductionsEntretienDomaine> = {
  fr: FR, en: EN, es: ES, it: IT, de: DE,
};

export function traductionsEntretienDomaine(langue: string): TraductionsEntretienDomaine {
  return masquerFonctions(DICTIONNAIRES[resoudreLangue(langue)]);
}
