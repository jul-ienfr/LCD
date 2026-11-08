import type { Langue } from "./i18n";
import { masquerFonctions, resoudreLangue } from "./i18n-staff";

export interface TraductionsAdministration {
  oTitrePage: string;
  oSurtitre: string;
  oTitre: string;
  oDescription: string;
  retour: string;
  coproOk: string;
  publicationOk: string;
  publicationRefusee: string;
  erreurInattendue: string;
  aucunLogement: string;
  aucunLogementAide: string;
  creerLogement: string;
  choisirLogement: string;
  avancement: (nom: string) => string;
  progression: (faites: number, total: number, pourcentage: number) => string;
  pret: string;
  nonPubliable: string;
  fait: string;
  aFaire: string;
  coproLabel: string;
  coproAide: string;
  enregistrer: string;
  etatPublication: string;
  publie: string;
  brouillon: string;
  publicationNote: string;
  depublier: string;
  publier: string;
  verifierCopro: string;
  pretNote: (slug: string) => string;
  pasPretNote: string;
  annonce: string;
  logements: string;
  tableau: string;
  uTitrePage: string;
  uSurtitre: string;
  uTitre: string;
  uDescription: string;
  deuxfaOk: string;
  comptes: string;
  actifs: string;
  admins: string;
  creerTitre: string;
  creerAide: string;
  superAdminNote: string;
  nom: string;
  email: string;
  role: string;
  motDePasse: string;
  motDePasseAide: string;
  creerCompte: string;
  equipe: string;
  desactivationNote: string;
  aucunUtilisateur: string;
  vous: string;
  actif: string;
  desactive: string;
  deuxfaActive: string;
  deuxfaInactive: string;
  rcLabel: string;
  rcAbsente: string;
  rcValable: (date: string) => string;
  rcExpiree: string;
  rcExpireDans: (jours: number) => string;
  changerRole: string;
  changerRoleBtn: string;
  assurance: string;
  valableJusquau: string;
  enregistrerRc: string;
  rcAide: string;
  desactiver: string;
  reactiver: string;
  reinit2fa: string;
  confirm2fa: string;
  reinitMdp: string;
  nouveauMdp: string;
  confirmation: string;
  reinitMdpBtn: string;
  roles: Record<string, string>;
}

const FR: TraductionsAdministration = {
  oTitrePage: "Onboarding — Espace hôte", oSurtitre: "Nouveau logement · conformité",
  oTitre: "Onboarding",
  oDescription: "Les conditions réelles avant qu’un logement puisse être proposé aux voyageurs. Aucune case n’est décorative : chaque étape est vérifiée sur les données enregistrées.",
  retour: "Retour au tableau de bord", coproOk: "Vérification copropriété enregistrée.",
  publicationOk: "Publication mise à jour.",
  publicationRefusee: "Publication refusée : vérifiez d’abord la copropriété et le statut actif du logement.",
  erreurInattendue: "Erreur inattendue. Réessayez.", aucunLogement: "Aucun logement",
  aucunLogementAide: "Créez un premier logement pour démarrer l’onboarding.",
  creerLogement: "Créer un logement", choisirLogement: "Choisir un logement",
  avancement: (nom) => `Avancement — ${nom}`,
  progression: (faites, total, pourcentage) => `${faites} / ${total} étapes · ${pourcentage} %`,
  pret: "Prêt à réserver", nonPubliable: "Non publiable", fait: "Fait", aFaire: "À faire",
  coproLabel: "Règlement, PV et accord du syndic vérifiés",
  coproAide: "Décochez pour remasquer le logement.", enregistrer: "Enregistrer",
  etatPublication: "État de publication :", publie: "publié", brouillon: "brouillon",
  publicationNote: "Un logement en brouillon n’apparaît jamais sur /reserver, même vérifié.",
  depublier: "Dépublier le logement", publier: "Publier le logement",
  verifierCopro: "Vérifiez la copropriété avant de publier.",
  pretNote: (slug) => `Le logement est visible sur /reserver?tenant=${slug}.`,
  pasPretNote: "Tant que les étapes 1 à 5 ne sont pas complètes, le logement n’apparaît pas sur la page de réservation publique.",
  annonce: "Conformité de l’annonce", logements: "Logements", tableau: "Tableau de bord",
  uTitrePage: "Utilisateurs — LCD Parc", uSurtitre: "Espace hôte", uTitre: "Utilisateurs",
  uDescription: "Comptes de l’équipe, rôles et accès à la plateforme.",
  deuxfaOk: "Double authentification réinitialisée. Les sessions du compte ont été fermées.",
  comptes: "Comptes", actifs: "Actifs", admins: "Administrateurs actifs",
  creerTitre: "Créer un compte",
  creerAide: "Chaque compte est rattaché à votre organisation. Le rôle détermine les pages accessibles.",
  superAdminNote: "super_admin ouvre la supervision globale, l’apparence et le journal global : à réserver à l’exploitant, pas à un hôte.",
  nom: "Nom", email: "E-mail", role: "Rôle", motDePasse: "Mot de passe initial",
  motDePasseAide: "12 caractères minimum. À communiquer par un canal sûr.",
  creerCompte: "Créer le compte", equipe: "Comptes de l’équipe",
  desactivationNote: "La désactivation ferme immédiatement les sessions ouvertes.",
  aucunUtilisateur: "Aucun utilisateur pour le moment.", vous: "Vous", actif: "Actif",
  desactive: "Désactivé", deuxfaActive: "2FA active", deuxfaInactive: "2FA inactive",
  rcLabel: "RC professionnelle :", rcAbsente: "absente — dispatch bloqué",
  rcValable: (date) => `valable jusqu’au ${date}`, rcExpiree: "expirée, dispatch bloqué",
  rcExpireDans: (jours) => `expire dans ${jours} jour${jours > 1 ? "s" : ""}`,
  changerRole: "Changer le rôle", changerRoleBtn: "Changer le rôle",
  assurance: "Assurance RC professionnelle", valableJusquau: "Valable jusqu’au",
  enregistrerRc: "Enregistrer la RC",
  rcAide: "Un prestataire sans RC valide ne peut recevoir aucun dispatch. Laissez vide pour retirer la RC.",
  desactiver: "Désactiver le compte", reactiver: "Réactiver le compte",
  reinit2fa: "Réinitialiser la 2FA",
  confirm2fa: "Réinitialiser la double authentification de ce compte et fermer ses sessions ?",
  reinitMdp: "Réinitialiser le mot de passe", nouveauMdp: "Nouveau mot de passe",
  confirmation: "Confirmation", reinitMdpBtn: "Réinitialiser le mot de passe",
  roles: { admin: "Administrateur", hote: "Hôte", comptable: "Comptable", menage: "Ménage", presta: "Prestataire", super_admin: "Super administrateur" },
};

const EN: TraductionsAdministration = {
  oTitrePage: "Onboarding — Staff area", oSurtitre: "New property · compliance",
  oTitre: "Onboarding",
  oDescription: "The real conditions before a property can be offered to guests. No checkbox is decorative: every step is checked against recorded data.",
  retour: "Back to dashboard", coproOk: "Co-ownership check saved.",
  publicationOk: "Publication updated.",
  publicationRefusee: "Publication refused: check co-ownership and the property’s active status first.",
  erreurInattendue: "Unexpected error. Try again.", aucunLogement: "No property",
  aucunLogementAide: "Create a first property to start onboarding.",
  creerLogement: "Create a property", choisirLogement: "Choose a property",
  avancement: (nom) => `Progress — ${nom}`,
  progression: (faites, total, pourcentage) => `${faites} / ${total} steps · ${pourcentage}%`,
  pret: "Ready to book", nonPubliable: "Not publishable", fait: "Done", aFaire: "To do",
  coproLabel: "Rules, minutes and co-owner approval checked",
  coproAide: "Uncheck to hide the property again.", enregistrer: "Save",
  etatPublication: "Publication status:", publie: "published", brouillon: "draft",
  publicationNote: "A draft property never appears on /reserver, even when verified.",
  depublier: "Unpublish property", publier: "Publish property",
  verifierCopro: "Check co-ownership before publishing.",
  pretNote: (slug) => `The property is visible on /reserver?tenant=${slug}.`,
  pasPretNote: "Until steps 1 to 5 are complete, the property does not appear on the public booking page.",
  annonce: "Listing compliance", logements: "Properties", tableau: "Dashboard",
  uTitrePage: "Users — LCD Parc", uSurtitre: "Staff area", uTitre: "Users",
  uDescription: "Team accounts, roles and platform access.",
  deuxfaOk: "Two-factor authentication reset. The account sessions were closed.",
  comptes: "Accounts", actifs: "Active", admins: "Active administrators",
  creerTitre: "Create an account",
  creerAide: "Each account belongs to your organisation. The role determines accessible pages.",
  superAdminNote: "super_admin opens global supervision, appearance and the global log: reserve it for the operator, not a host.",
  nom: "Name", email: "Email", role: "Role", motDePasse: "Initial password",
  motDePasseAide: "At least 12 characters. Share it through a secure channel.",
  creerCompte: "Create account", equipe: "Team accounts",
  desactivationNote: "Deactivation immediately closes open sessions.",
  aucunUtilisateur: "No user yet.", vous: "You", actif: "Active",
  desactive: "Deactivated", deuxfaActive: "2FA active", deuxfaInactive: "2FA inactive",
  rcLabel: "Professional insurance:", rcAbsente: "missing — dispatch blocked",
  rcValable: (date) => `valid until ${date}`, rcExpiree: "expired, dispatch blocked",
  rcExpireDans: (jours) => `expires in ${jours} day${jours > 1 ? "s" : ""}`,
  changerRole: "Change role", changerRoleBtn: "Change role",
  assurance: "Professional insurance", valableJusquau: "Valid until",
  enregistrerRc: "Save insurance",
  rcAide: "A provider without valid insurance cannot receive any dispatch. Leave blank to remove it.",
  desactiver: "Deactivate account", reactiver: "Reactivate account",
  reinit2fa: "Reset 2FA",
  confirm2fa: "Reset two-factor authentication for this account and close its sessions?",
  reinitMdp: "Reset password", nouveauMdp: "New password",
  confirmation: "Confirmation", reinitMdpBtn: "Reset password",
  roles: { admin: "Administrator", hote: "Host", comptable: "Accountant", menage: "Housekeeping", presta: "Provider", super_admin: "Super administrator" },
};

const ES: TraductionsAdministration = {
  oTitrePage: "Onboarding — Área profesional", oSurtitre: "Nuevo alojamiento · conformidad",
  oTitre: "Onboarding",
  oDescription: "Las condiciones reales antes de que un alojamiento pueda ofrecerse a los viajeros. Ninguna casilla es decorativa: cada etapa se verifica con los datos registrados.",
  retour: "Volver al panel", coproOk: "Verificación de comunidad guardada.",
  publicationOk: "Publicación actualizada.",
  publicationRefusee: "Publicación rechazada: compruebe primero la comunidad y el estado activo del alojamiento.",
  erreurInattendue: "Error inesperado. Inténtelo de nuevo.", aucunLogement: "Ningún alojamiento",
  aucunLogementAide: "Cree un primer alojamiento para iniciar el onboarding.",
  creerLogement: "Crear un alojamiento", choisirLogement: "Elegir un alojamiento",
  avancement: (nom) => `Avance — ${nom}`,
  progression: (faites, total, pourcentage) => `${faites} / ${total} etapas · ${pourcentage} %`,
  pret: "Listo para reservar", nonPubliable: "No publicable", fait: "Hecho", aFaire: "Por hacer",
  coproLabel: "Reglamento, actas y acuerdo de la comunidad verificados",
  coproAide: "Desmarque para volver a ocultar el alojamiento.", enregistrer: "Guardar",
  etatPublication: "Estado de publicación:", publie: "publicado", brouillon: "borrador",
  publicationNote: "Un alojamiento en borrador nunca aparece en /reserver, aunque esté verificado.",
  depublier: "Despublicar el alojamiento", publier: "Publicar el alojamiento",
  verifierCopro: "Verifique la comunidad antes de publicar.",
  pretNote: (slug) => `El alojamiento es visible en /reserver?tenant=${slug}.`,
  pasPretNote: "Mientras las etapas 1 a 5 no estén completas, el alojamiento no aparece en la página de reserva pública.",
  annonce: "Conformidad del anuncio", logements: "Alojamientos", tableau: "Panel",
  uTitrePage: "Usuarios — LCD Parc", uSurtitre: "Área profesional", uTitre: "Usuarios",
  uDescription: "Cuentas del equipo, roles y acceso a la plataforma.",
  deuxfaOk: "Autenticación de dos factores restablecida. Se cerraron las sesiones de la cuenta.",
  comptes: "Cuentas", actifs: "Activos", admins: "Administradores activos",
  creerTitre: "Crear una cuenta",
  creerAide: "Cada cuenta está vinculada a su organización. El rol determina las páginas accesibles.",
  superAdminNote: "super_admin abre la supervisión global, la apariencia y el registro global: resérvelo al explotador, no a un anfitrión.",
  nom: "Nombre", email: "Correo", role: "Rol", motDePasse: "Contraseña inicial",
  motDePasseAide: "12 caracteres mínimo. Comuníquela por un canal seguro.",
  creerCompte: "Crear la cuenta", equipe: "Cuentas del equipo",
  desactivationNote: "La desactivación cierra inmediatamente las sesiones abiertas.",
  aucunUtilisateur: "Ningún usuario por el momento.", vous: "Usted", actif: "Activo",
  desactive: "Desactivado", deuxfaActive: "2FA activa", deuxfaInactive: "2FA inactiva",
  rcLabel: "Seguro de responsabilidad civil:", rcAbsente: "ausente — dispatch bloqueado",
  rcValable: (date) => `válido hasta el ${date}`, rcExpiree: "caducado, dispatch bloqueado",
  rcExpireDans: (jours) => `caduca en ${jours} día${jours > 1 ? "s" : ""}`,
  changerRole: "Cambiar el rol", changerRoleBtn: "Cambiar el rol",
  assurance: "Seguro de responsabilidad civil", valableJusquau: "Válido hasta",
  enregistrerRc: "Guardar el seguro",
  rcAide: "Un proveedor sin seguro válido no puede recibir ningún dispatch. Déjelo vacío para retirarlo.",
  desactiver: "Desactivar la cuenta", reactiver: "Reactivar la cuenta",
  reinit2fa: "Restablecer la 2FA",
  confirm2fa: "¿Restablecer la autenticación de dos factores de esta cuenta y cerrar sus sesiones?",
  reinitMdp: "Restablecer la contraseña", nouveauMdp: "Nueva contraseña",
  confirmation: "Confirmación", reinitMdpBtn: "Restablecer la contraseña",
  roles: { admin: "Administrador", hote: "Anfitrión", comptable: "Contable", menage: "Limpieza", presta: "Proveedor", super_admin: "Superadministrador" },
};

const IT: TraductionsAdministration = {
  oTitrePage: "Onboarding — Area professionale", oSurtitre: "Nuovo alloggio · conformità",
  oTitre: "Onboarding",
  oDescription: "Le condizioni reali prima che un alloggio possa essere proposto agli ospiti. Nessuna casella è decorativa: ogni tappa è verificata sui dati registrati.",
  retour: "Torna alla dashboard", coproOk: "Verifica condominio salvata.",
  publicationOk: "Pubblicazione aggiornata.",
  publicationRefusee: "Pubblicazione rifiutata: verifichi prima il condominio e lo stato attivo dell’alloggio.",
  erreurInattendue: "Errore imprevisto. Riprovi.", aucunLogement: "Nessun alloggio",
  aucunLogementAide: "Crei un primo alloggio per avviare l’onboarding.",
  creerLogement: "Crea un alloggio", choisirLogement: "Scegli un alloggio",
  avancement: (nom) => `Avanzamento — ${nom}`,
  progression: (faites, total, pourcentage) => `${faites} / ${total} tappe · ${pourcentage} %`,
  pret: "Pronto per prenotare", nonPubliable: "Non pubblicabile", fait: "Fatto", aFaire: "Da fare",
  coproLabel: "Regolamento, verbali e accordo del condominio verificati",
  coproAide: "Deselezioni per nascondere di nuovo l’alloggio.", enregistrer: "Salva",
  etatPublication: "Stato di pubblicazione:", publie: "pubblicato", brouillon: "bozza",
  publicationNote: "Un alloggio in bozza non compare mai su /reserver, anche se verificato.",
  depublier: "Ritira l’alloggio", publier: "Pubblica l’alloggio",
  verifierCopro: "Verifichi il condominio prima di pubblicare.",
  pretNote: (slug) => `L’alloggio è visibile su /reserver?tenant=${slug}.`,
  pasPretNote: "Finché le tappe da 1 a 5 non sono complete, l’alloggio non compare nella pagina di prenotazione pubblica.",
  annonce: "Conformità dell’annuncio", logements: "Alloggi", tableau: "Dashboard",
  uTitrePage: "Utenti — LCD Parc", uSurtitre: "Area professionale", uTitre: "Utenti",
  uDescription: "Account del team, ruoli e accesso alla piattaforma.",
  deuxfaOk: "Autenticazione a due fattori reimpostata. Le sessioni dell’account sono state chiuse.",
  comptes: "Account", actifs: "Attivi", admins: "Amministratori attivi",
  creerTitre: "Crea un account",
  creerAide: "Ogni account è collegato alla sua organizzazione. Il ruolo determina le pagine accessibili.",
  superAdminNote: "super_admin apre la supervisione globale, l’aspetto e il registro globale: da riservare all’operatore, non a un host.",
  nom: "Nome", email: "E-mail", role: "Ruolo", motDePasse: "Password iniziale",
  motDePasseAide: "Minimo 12 caratteri. La comunichi tramite un canale sicuro.",
  creerCompte: "Crea l’account", equipe: "Account del team",
  desactivationNote: "La disattivazione chiude immediatamente le sessioni aperte.",
  aucunUtilisateur: "Nessun utente per ora.", vous: "Lei", actif: "Attivo",
  desactive: "Disattivato", deuxfaActive: "2FA attiva", deuxfaInactive: "2FA inattiva",
  rcLabel: "RC professionale:", rcAbsente: "assente — dispatch bloccato",
  rcValable: (date) => `valida fino al ${date}`, rcExpiree: "scaduta, dispatch bloccato",
  rcExpireDans: (jours) => `scade tra ${jours} giorn${jours > 1 ? "i" : "o"}`,
  changerRole: "Cambia ruolo", changerRoleBtn: "Cambia ruolo",
  assurance: "Assicurazione RC professionale", valableJusquau: "Valida fino al",
  enregistrerRc: "Salva la RC",
  rcAide: "Un fornitore senza RC valida non può ricevere alcun dispatch. Lasci vuoto per rimuoverla.",
  desactiver: "Disattiva l’account", reactiver: "Riattiva l’account",
  reinit2fa: "Reimposta la 2FA",
  confirm2fa: "Reimpostare l’autenticazione a due fattori di questo account e chiudere le sue sessioni?",
  reinitMdp: "Reimposta la password", nouveauMdp: "Nuova password",
  confirmation: "Conferma", reinitMdpBtn: "Reimposta la password",
  roles: { admin: "Amministratore", hote: "Host", comptable: "Contabile", menage: "Pulizie", presta: "Fornitore", super_admin: "Super amministratore" },
};

const DE: TraductionsAdministration = {
  oTitrePage: "Onboarding — Profibereich", oSurtitre: "Neue Unterkunft · Compliance",
  oTitre: "Onboarding",
  oDescription: "Die tatsächlichen Bedingungen, bevor eine Unterkunft Gästen angeboten werden kann. Kein Kontrollkästchen ist dekorativ: Jeder Schritt wird anhand gespeicherter Daten geprüft.",
  retour: "Zurück zum Dashboard", coproOk: "Eigentümergemeinschafts-Prüfung gespeichert.",
  publicationOk: "Veröffentlichung aktualisiert.",
  publicationRefusee: "Veröffentlichung abgelehnt: Prüfen Sie zuerst die Eigentümergemeinschaft und den aktiven Status der Unterkunft.",
  erreurInattendue: "Unerwarteter Fehler. Versuchen Sie es erneut.", aucunLogement: "Keine Unterkunft",
  aucunLogementAide: "Erstellen Sie eine erste Unterkunft, um das Onboarding zu starten.",
  creerLogement: "Unterkunft erstellen", choisirLogement: "Unterkunft wählen",
  avancement: (nom) => `Fortschritt — ${nom}`,
  progression: (faites, total, pourcentage) => `${faites} / ${total} Schritte · ${pourcentage} %`,
  pret: "Bereit zur Buchung", nonPubliable: "Nicht veröffentlichbar", fait: "Erledigt", aFaire: "Offen",
  coproLabel: "Reglement, Protokolle und Zustimmung der Eigentümergemeinschaft geprüft",
  coproAide: "Abwählen, um die Unterkunft wieder auszublenden.", enregistrer: "Speichern",
  etatPublication: "Veröffentlichungsstatus:", publie: "veröffentlicht", brouillon: "Entwurf",
  publicationNote: "Eine Unterkunft im Entwurf erscheint nie auf /reserver, auch wenn sie geprüft ist.",
  depublier: "Unterkunft zurückziehen", publier: "Unterkunft veröffentlichen",
  verifierCopro: "Prüfen Sie die Eigentümergemeinschaft vor der Veröffentlichung.",
  pretNote: (slug) => `Die Unterkunft ist auf /reserver?tenant=${slug} sichtbar.`,
  pasPretNote: "Solange die Schritte 1 bis 5 nicht vollständig sind, erscheint die Unterkunft nicht auf der öffentlichen Buchungsseite.",
  annonce: "Anzeigen-Compliance", logements: "Unterkünfte", tableau: "Dashboard",
  uTitrePage: "Benutzer — LCD Parc", uSurtitre: "Profibereich", uTitre: "Benutzer",
  uDescription: "Teamkonten, Rollen und Plattformzugriff.",
  deuxfaOk: "Zwei-Faktor-Authentifizierung zurückgesetzt. Die Kontositzungen wurden beendet.",
  comptes: "Konten", actifs: "Aktiv", admins: "Aktive Administratoren",
  creerTitre: "Konto erstellen",
  creerAide: "Jedes Konto gehört zu Ihrer Organisation. Die Rolle bestimmt die zugänglichen Seiten.",
  superAdminNote: "super_admin öffnet die globale Aufsicht, das Erscheinungsbild und das globale Protokoll: für den Betreiber, nicht für einen Gastgeber.",
  nom: "Name", email: "E-Mail", role: "Rolle", motDePasse: "Erstpasswort",
  motDePasseAide: "Mindestens 12 Zeichen. Über einen sicheren Kanal mitteilen.",
  creerCompte: "Konto erstellen", equipe: "Teamkonten",
  desactivationNote: "Die Deaktivierung beendet sofort offene Sitzungen.",
  aucunUtilisateur: "Noch kein Benutzer.", vous: "Sie", actif: "Aktiv",
  desactive: "Deaktiviert", deuxfaActive: "2FA aktiv", deuxfaInactive: "2FA inaktiv",
  rcLabel: "Berufshaftpflicht:", rcAbsente: "fehlt — Dispatch blockiert",
  rcValable: (date) => `gültig bis ${date}`, rcExpiree: "abgelaufen, Dispatch blockiert",
  rcExpireDans: (jours) => `läuft in ${jours} Tag${jours > 1 ? "en" : ""} ab`,
  changerRole: "Rolle ändern", changerRoleBtn: "Rolle ändern",
  assurance: "Berufshaftpflichtversicherung", valableJusquau: "Gültig bis",
  enregistrerRc: "Versicherung speichern",
  rcAide: "Ein Dienstleister ohne gültige Versicherung kann keinen Dispatch erhalten. Leer lassen, um sie zu entfernen.",
  desactiver: "Konto deaktivieren", reactiver: "Konto reaktivieren",
  reinit2fa: "2FA zurücksetzen",
  confirm2fa: "Zwei-Faktor-Authentifizierung dieses Kontos zurücksetzen und seine Sitzungen beenden?",
  reinitMdp: "Passwort zurücksetzen", nouveauMdp: "Neues Passwort",
  confirmation: "Bestätigung", reinitMdpBtn: "Passwort zurücksetzen",
  roles: { admin: "Administrator", hote: "Gastgeber", comptable: "Buchhalter", menage: "Reinigung", presta: "Dienstleister", super_admin: "Superadministrator" },
};

const DICTIONNAIRES: Record<Langue, TraductionsAdministration> = {
  fr: FR, en: EN, es: ES, it: IT, de: DE,
};

export function traductionsAdministration(langue: string): TraductionsAdministration {
  return masquerFonctions(DICTIONNAIRES[resoudreLangue(langue)]);
}
