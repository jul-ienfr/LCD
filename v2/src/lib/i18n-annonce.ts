import type { Langue } from "./i18n";
import { masquerFonctions, resoudreLangue } from "./i18n-staff";

export interface TraductionsAnnonce {
  titrePage: string;
  surtitre: string;
  titre: string;
  description: string;
  retour: string;
  creerAide: string;
  creerLogement: string;
  choisirLogement: string;
  ok: string;
  coproOk: string;
  archiveOk: string;
  restaurationOk: string;
  erreurInattendue: string;
  coproTitre: string;
  coproDescription: string;
  verifiee: string;
  aVerifier: string;
  publiable: string;
  nonPubliable: string;
  derniereVerif: (date: string) => string;
  coproLabel: string;
  coproAide: string;
  enregistrerVerification: string;
  archiveTexte: string;
  publication: string;
  publiee: string;
  brouillon: string;
  publicationAide: string;
  depublier: string;
  publier: string;
  verifierAvantPublication: string;
  cycleTitre: string;
  cycleTexte: (statut: string) => string;
  restaurer: string;
  confirmerArchivage: (nom: string) => string;
  archivageAide: string;
  confirmer: string;
  annuler: string;
  archiver: string;
  avancement: string;
  mentions: (faites: number, total: number, pourcentage: number) => string;
  conforme: string;
  aCompleter: string;
  toutesCochees: string;
  renseignerEtiquettes: string;
  etiquetteDpe: string;
  etiquetteGes: string;
  nonRenseigne: string;
  classement: string;
  numeroMairie: string;
  numeroCerfa: string;
  enregistrerConformite: string;
  tranquillite: string;
  tableau: string;
}

const FR: TraductionsAnnonce = {
  titrePage: "Conformité de l’annonce — Espace hôte", surtitre: "Espace hôte · Conformité",
  titre: "Conformité de l’annonce",
  description: "Les neuf mentions obligatoires et les étiquettes DPE/GES.",
  retour: "Retour au tableau de bord",
  creerAide: "Créez d’abord un logement pour vérifier son annonce.",
  creerLogement: "Créer un logement", choisirLogement: "Choisir un logement",
  ok: "Conformité enregistrée.", coproOk: "Vérification copropriété enregistrée.",
  archiveOk: "Logement archivé : il reste dans l’historique mais n’est plus proposé aux voyageurs.",
  restaurationOk: "Logement restauré en brouillon. Vérifiez la copropriété avant de le republier.",
  erreurInattendue: "Erreur inattendue. Réessayez.",
  coproTitre: "Vérification copropriété",
  coproDescription: "Règlement de copropriété lu, PV d’assemblée et accord du syndic vérifiés. Tant que cette vérification n’est pas faite, le logement reste masqué sur la page de réservation publique.",
  verifiee: "Vérifiée", aVerifier: "À vérifier",
  publiable: "Ce logement est actif, vérifié et publié : il peut être proposé aux voyageurs.",
  nonPubliable: "Ce logement n’est pas visible sur la page de réservation publique (copropriété non vérifiée ou publication en brouillon).",
  derniereVerif: (date) => ` Dernière vérification le ${date}.`,
  coproLabel: "Règlement, PV et accord du syndic vérifiés",
  coproAide: "Décochez pour remasquer le logement et bloquer les nouvelles demandes.",
  enregistrerVerification: "Enregistrer la vérification",
  archiveTexte: "Logement archivé : la publication est gelée. Restaurez-le pour le remettre en brouillon et revalider la copropriété.",
  publication: "Publication :", publiee: "publiée", brouillon: "brouillon",
  publicationAide: "La publication est une décision explicite : un logement vérifié mais en brouillon reste invisible sur /reserver.",
  depublier: "Dépublier le logement", publier: "Publier le logement",
  verifierAvantPublication: "Vérifiez la copropriété avant de publier.",
  cycleTitre: "Cycle de vie",
  cycleTexte: (statut) => `Statut actuel : ${statut}. L’archivage est doux : historique, réservations et documents sont conservés, mais le logement disparaît de la réservation publique. Une réservation non annulée à venir ou en cours bloque l’archivage.`,
  restaurer: "Restaurer le logement",
  confirmerArchivage: (nom) => `Confirmer l’archivage de « ${nom} » ?`,
  archivageAide: "Le logement sera masqué de /reserver et remis en brouillon. Les réservations non annulées à venir bloqueront l’opération.",
  confirmer: "Confirmer l’archivage", annuler: "Annuler", archiver: "Archiver le logement",
  avancement: "Avancement",
  mentions: (faites, total, pourcentage) => `${faites} / ${total} mentions · ${pourcentage} %`,
  conforme: "Conforme", aCompleter: "À compléter",
  toutesCochees: "Toutes les mentions sont cochées.", renseignerEtiquettes: "Renseignez les étiquettes DPE et GES pour valider.",
  etiquetteDpe: "Étiquette DPE", etiquetteGes: "Étiquette GES", nonRenseigne: "Non renseigné",
  classement: "Classement meublé", numeroMairie: "Numéro d’enregistrement mairie",
  numeroCerfa: "Numéro Cerfa", enregistrerConformite: "Enregistrer la conformité",
  tranquillite: "Carnet de tranquillité", tableau: "Tableau de bord",
};

const EN: TraductionsAnnonce = {
  titrePage: "Listing compliance — Staff area", surtitre: "Staff area · Compliance",
  titre: "Listing compliance",
  description: "The nine mandatory disclosures and the DPE/GES labels.",
  retour: "Back to dashboard",
  creerAide: "Create a property first to check its listing.",
  creerLogement: "Create a property", choisirLogement: "Choose a property",
  ok: "Compliance saved.", coproOk: "Co-ownership check saved.",
  archiveOk: "Property archived: it remains in history but is no longer offered to guests.",
  restaurationOk: "Property restored as draft. Check co-ownership before publishing it again.",
  erreurInattendue: "Unexpected error. Try again.",
  coproTitre: "Co-ownership check",
  coproDescription: "Co-ownership rules read, general meeting minutes and property manager approval checked. Until this check is done, the property stays hidden on the public booking page.",
  verifiee: "Verified", aVerifier: "To verify",
  publiable: "This property is active, verified and published: it can be offered to guests.",
  nonPubliable: "This property is not visible on the public booking page (co-ownership not verified or publication in draft).",
  derniereVerif: (date) => ` Last check on ${date}.`,
  coproLabel: "Rules, minutes and property manager approval checked",
  coproAide: "Uncheck to hide the property again and block new requests.",
  enregistrerVerification: "Save check",
  archiveTexte: "Property archived: publication is frozen. Restore it to put it back in draft and revalidate co-ownership.",
  publication: "Publication:", publiee: "published", brouillon: "draft",
  publicationAide: "Publication is an explicit decision: a verified property in draft remains invisible on /reserver.",
  depublier: "Unpublish property", publier: "Publish property",
  verifierAvantPublication: "Check co-ownership before publishing.",
  cycleTitre: "Lifecycle",
  cycleTexte: (statut) => `Current status: ${statut}. Archiving is soft: history, bookings and documents are kept, but the property disappears from public booking. A future or current booking not cancelled blocks archiving.`,
  restaurer: "Restore property",
  confirmerArchivage: (nom) => `Confirm archiving “${nom}”?`,
  archivageAide: "The property will be hidden from /reserver and put back in draft. Future bookings not cancelled will block the operation.",
  confirmer: "Confirm archiving", annuler: "Cancel", archiver: "Archive property",
  avancement: "Progress",
  mentions: (faites, total, pourcentage) => `${faites} / ${total} disclosures · ${pourcentage}%`,
  conforme: "Compliant", aCompleter: "To complete",
  toutesCochees: "All disclosures are ticked.", renseignerEtiquettes: "Enter the DPE and GES labels to validate.",
  etiquetteDpe: "DPE label", etiquetteGes: "GES label", nonRenseigne: "Not set",
  classement: "Furnished classification", numeroMairie: "Town hall registration number",
  numeroCerfa: "Cerfa number", enregistrerConformite: "Save compliance",
  tranquillite: "Quietness record", tableau: "Dashboard",
};

const ES: TraductionsAnnonce = {
  titrePage: "Conformidad del anuncio — Área profesional", surtitre: "Área profesional · Conformidad",
  titre: "Conformidad del anuncio",
  description: "Las nueve menciones obligatorias y las etiquetas DPE/GES.",
  retour: "Volver al panel",
  creerAide: "Cree primero un alojamiento para verificar su anuncio.",
  creerLogement: "Crear un alojamiento", choisirLogement: "Elegir un alojamiento",
  ok: "Conformidad guardada.", coproOk: "Verificación de comunidad guardada.",
  archiveOk: "Alojamiento archivado: permanece en el historial pero ya no se ofrece a los viajeros.",
  restaurationOk: "Alojamiento restaurado como borrador. Verifique la comunidad antes de volver a publicarlo.",
  erreurInattendue: "Error inesperado. Inténtelo de nuevo.",
  coproTitre: "Verificación de comunidad",
  coproDescription: "Reglamento de comunidad leído, actas de junta y acuerdo del administrador verificados. Mientras no se haga esta verificación, el alojamiento permanece oculto en la página de reserva pública.",
  verifiee: "Verificada", aVerifier: "Por verificar",
  publiable: "Este alojamiento está activo, verificado y publicado: puede ofrecerse a los viajeros.",
  nonPubliable: "Este alojamiento no es visible en la página de reserva pública (comunidad no verificada o publicación en borrador).",
  derniereVerif: (date) => ` Última verificación el ${date}.`,
  coproLabel: "Reglamento, actas y acuerdo del administrador verificados",
  coproAide: "Desmarque para volver a ocultar el alojamiento y bloquear nuevas solicitudes.",
  enregistrerVerification: "Guardar la verificación",
  archiveTexte: "Alojamiento archivado: la publicación está congelada. Restáurelo para volver a borrador y revalidar la comunidad.",
  publication: "Publicación:", publiee: "publicada", brouillon: "borrador",
  publicationAide: "La publicación es una decisión explícita: un alojamiento verificado pero en borrador sigue invisible en /reserver.",
  depublier: "Despublicar el alojamiento", publier: "Publicar el alojamiento",
  verifierAvantPublication: "Verifique la comunidad antes de publicar.",
  cycleTitre: "Ciclo de vida",
  cycleTexte: (statut) => `Estado actual: ${statut}. El archivado es suave: se conservan historial, reservas y documentos, pero el alojamiento desaparece de la reserva pública. Una reserva futura o en curso no cancelada bloquea el archivado.`,
  restaurer: "Restaurar el alojamiento",
  confirmerArchivage: (nom) => `¿Confirmar el archivado de «${nom}»?`,
  archivageAide: "El alojamiento se ocultará de /reserver y volverá a borrador. Las reservas futuras no canceladas bloquearán la operación.",
  confirmer: "Confirmar el archivado", annuler: "Cancelar", archiver: "Archivar el alojamiento",
  avancement: "Avance",
  mentions: (faites, total, pourcentage) => `${faites} / ${total} menciones · ${pourcentage} %`,
  conforme: "Conforme", aCompleter: "Por completar",
  toutesCochees: "Todas las menciones están marcadas.", renseignerEtiquettes: "Indique las etiquetas DPE y GES para validar.",
  etiquetteDpe: "Etiqueta DPE", etiquetteGes: "Etiqueta GES", nonRenseigne: "Sin indicar",
  classement: "Clasificación de amueblado", numeroMairie: "Número de registro municipal",
  numeroCerfa: "Número Cerfa", enregistrerConformite: "Guardar la conformidad",
  tranquillite: "Cuaderno de tranquilidad", tableau: "Panel",
};

const IT: TraductionsAnnonce = {
  titrePage: "Conformità dell’annuncio — Area professionale", surtitre: "Area professionale · Conformità",
  titre: "Conformità dell’annuncio",
  description: "Le nove menzioni obbligatorie e le etichette DPE/GES.",
  retour: "Torna alla dashboard",
  creerAide: "Crei prima un alloggio per verificare il suo annuncio.",
  creerLogement: "Crea un alloggio", choisirLogement: "Scegli un alloggio",
  ok: "Conformità salvata.", coproOk: "Verifica condominio salvata.",
  archiveOk: "Alloggio archiviato: resta nella cronologia ma non è più proposto agli ospiti.",
  restaurationOk: "Alloggio ripristinato come bozza. Verifichi il condominio prima di ripubblicarlo.",
  erreurInattendue: "Errore imprevisto. Riprovi.",
  coproTitre: "Verifica condominio",
  coproDescription: "Regolamento condominiale letto, verbali di assemblea e accordo dell’amministratore verificati. Finché questa verifica non è fatta, l’alloggio resta nascosto nella pagina di prenotazione pubblica.",
  verifiee: "Verificata", aVerifier: "Da verificare",
  publiable: "Questo alloggio è attivo, verificato e pubblicato: può essere proposto agli ospiti.",
  nonPubliable: "Questo alloggio non è visibile nella pagina di prenotazione pubblica (condominio non verificato o pubblicazione in bozza).",
  derniereVerif: (date) => ` Ultima verifica il ${date}.`,
  coproLabel: "Regolamento, verbali e accordo dell’amministratore verificati",
  coproAide: "Deselezioni per nascondere di nuovo l’alloggio e bloccare nuove richieste.",
  enregistrerVerification: "Salva la verifica",
  archiveTexte: "Alloggio archiviato: la pubblicazione è congelata. Lo ripristini per rimetterlo in bozza e rivalidare il condominio.",
  publication: "Pubblicazione:", publiee: "pubblicata", brouillon: "bozza",
  publicationAide: "La pubblicazione è una decisione esplicita: un alloggio verificato ma in bozza resta invisibile su /reserver.",
  depublier: "Ritira l’alloggio", publier: "Pubblica l’alloggio",
  verifierAvantPublication: "Verifichi il condominio prima di pubblicare.",
  cycleTitre: "Ciclo di vita",
  cycleTexte: (statut) => `Stato attuale: ${statut}. L’archiviazione è morbida: cronologia, prenotazioni e documenti sono conservati, ma l’alloggio scompare dalla prenotazione pubblica. Una prenotazione futura o in corso non annullata blocca l’archiviazione.`,
  restaurer: "Ripristina l’alloggio",
  confirmerArchivage: (nom) => `Confermare l’archiviazione di «${nom}»?`,
  archivageAide: "L’alloggio sarà nascosto da /reserver e rimesso in bozza. Le prenotazioni future non annullate bloccheranno l’operazione.",
  confirmer: "Conferma l’archiviazione", annuler: "Annulla", archiver: "Archivia l’alloggio",
  avancement: "Avanzamento",
  mentions: (faites, total, pourcentage) => `${faites} / ${total} menzioni · ${pourcentage} %`,
  conforme: "Conforme", aCompleter: "Da completare",
  toutesCochees: "Tutte le menzioni sono spuntate.", renseignerEtiquettes: "Inserisca le etichette DPE e GES per validare.",
  etiquetteDpe: "Etichetta DPE", etiquetteGes: "Etichetta GES", nonRenseigne: "Non indicato",
  classement: "Classificazione arredato", numeroMairie: "Numero di registrazione comunale",
  numeroCerfa: "Numero Cerfa", enregistrerConformite: "Salva la conformità",
  tranquillite: "Quaderno di tranquillità", tableau: "Dashboard",
};

const DE: TraductionsAnnonce = {
  titrePage: "Anzeigen-Compliance — Profibereich", surtitre: "Profibereich · Compliance",
  titre: "Anzeigen-Compliance",
  description: "Die neun Pflichtangaben und die DPE/GES-Etiketten.",
  retour: "Zurück zum Dashboard",
  creerAide: "Erstellen Sie zuerst eine Unterkunft, um ihre Anzeige zu prüfen.",
  creerLogement: "Unterkunft erstellen", choisirLogement: "Unterkunft wählen",
  ok: "Compliance gespeichert.", coproOk: "Eigentümergemeinschafts-Prüfung gespeichert.",
  archiveOk: "Unterkunft archiviert: Sie bleibt im Verlauf, wird Gästen aber nicht mehr angeboten.",
  restaurationOk: "Unterkunft als Entwurf wiederhergestellt. Prüfen Sie die Eigentümergemeinschaft vor erneuter Veröffentlichung.",
  erreurInattendue: "Unerwarteter Fehler. Versuchen Sie es erneut.",
  coproTitre: "Prüfung der Eigentümergemeinschaft",
  coproDescription: "Teilungserklärung gelesen, Versammlungsprotokolle und Zustimmung der Verwaltung geprüft. Bis diese Prüfung erfolgt ist, bleibt die Unterkunft auf der öffentlichen Buchungsseite verborgen.",
  verifiee: "Geprüft", aVerifier: "Zu prüfen",
  publiable: "Diese Unterkunft ist aktiv, geprüft und veröffentlicht: Sie kann Gästen angeboten werden.",
  nonPubliable: "Diese Unterkunft ist auf der öffentlichen Buchungsseite nicht sichtbar (Eigentümergemeinschaft nicht geprüft oder Veröffentlichung als Entwurf).",
  derniereVerif: (date) => ` Letzte Prüfung am ${date}.`,
  coproLabel: "Reglement, Protokolle und Zustimmung der Verwaltung geprüft",
  coproAide: "Abwählen, um die Unterkunft wieder auszublenden und neue Anfragen zu blockieren.",
  enregistrerVerification: "Prüfung speichern",
  archiveTexte: "Unterkunft archiviert: Die Veröffentlichung ist eingefroren. Stellen Sie sie wieder her, um sie in den Entwurf zu setzen und die Eigentümergemeinschaft erneut zu prüfen.",
  publication: "Veröffentlichung:", publiee: "veröffentlicht", brouillon: "Entwurf",
  publicationAide: "Die Veröffentlichung ist eine ausdrückliche Entscheidung: Eine geprüfte Unterkunft im Entwurf bleibt auf /reserver unsichtbar.",
  depublier: "Unterkunft zurückziehen", publier: "Unterkunft veröffentlichen",
  verifierAvantPublication: "Prüfen Sie die Eigentümergemeinschaft vor der Veröffentlichung.",
  cycleTitre: "Lebenszyklus",
  cycleTexte: (statut) => `Aktueller Status: ${statut}. Die Archivierung ist weich: Verlauf, Buchungen und Dokumente bleiben erhalten, aber die Unterkunft verschwindet aus der öffentlichen Buchung. Eine nicht stornierte zukünftige oder laufende Buchung blockiert die Archivierung.`,
  restaurer: "Unterkunft wiederherstellen",
  confirmerArchivage: (nom) => `Archivierung von „${nom}“ bestätigen?`,
  archivageAide: "Die Unterkunft wird aus /reserver ausgeblendet und in den Entwurf zurückgesetzt. Nicht stornierte zukünftige Buchungen blockieren den Vorgang.",
  confirmer: "Archivierung bestätigen", annuler: "Abbrechen", archiver: "Unterkunft archivieren",
  avancement: "Fortschritt",
  mentions: (faites, total, pourcentage) => `${faites} / ${total} Angaben · ${pourcentage} %`,
  conforme: "Konform", aCompleter: "Zu vervollständigen",
  toutesCochees: "Alle Angaben sind angehakt.", renseignerEtiquettes: "Geben Sie die DPE- und GES-Etiketten ein, um zu bestätigen.",
  etiquetteDpe: "DPE-Etikett", etiquetteGes: "GES-Etikett", nonRenseigne: "Nicht angegeben",
  classement: "Möblierungs-Klassifizierung", numeroMairie: "Städtische Registrierungsnummer",
  numeroCerfa: "Cerfa-Nummer", enregistrerConformite: "Compliance speichern",
  tranquillite: "Ruhe-Nachweis", tableau: "Dashboard",
};

const DICTIONNAIRES: Record<Langue, TraductionsAnnonce> = {
  fr: FR, en: EN, es: ES, it: IT, de: DE,
};

export function traductionsAnnonce(langue: string): TraductionsAnnonce {
  return masquerFonctions(DICTIONNAIRES[resoudreLangue(langue)]);
}
