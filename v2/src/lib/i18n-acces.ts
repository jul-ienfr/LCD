import type { Langue } from "./i18n";
import { masquerFonctions, resoudreLangue } from "./i18n-staff";

export interface TraductionsAcces {
  titrePage: string;
  surtitre: string;
  titre: string;
  description: string;
  revoquee: string;
  erreurInattendue: string;
  sessionsActives: string;
  comptesActifs: string;
  administrateurs: string;
  sansSession: string;
  utilisateur: string;
  role: string;
  appareil: string;
  ip: string;
  derniereActivite: string;
  expire: string;
  action: string;
  aucuneSession: string;
  inconnu: string;
  active: string;
  expiree: string;
  sessionCourante: string;
  revoquer: string;
  comptesEtSessions: string;
  sessions: (nombre: number) => string;
  gererUtilisateurs: string;
  audit: string;
}

const FR: TraductionsAcces = {
  titrePage: "Registre des accès — Espace hôte", surtitre: "Espace hôte · Sécurité",
  titre: "Registre des accès",
  description: "Sessions nominatives de l’équipe — révoquez un accès en un geste, jamais le vôtre.",
  revoquee: "Session révoquée.", erreurInattendue: "Erreur inattendue. Réessayez.",
  sessionsActives: "Sessions actives", comptesActifs: "Comptes actifs",
  administrateurs: "Administrateurs", sansSession: "Actifs sans session",
  utilisateur: "Utilisateur", role: "Rôle", appareil: "Appareil", ip: "IP",
  derniereActivite: "Dernière activité", expire: "Expire", action: "Action",
  aucuneSession: "Aucune session enregistrée.", inconnu: "Inconnu",
  active: "Active", expiree: "Expirée", sessionCourante: "Session courante",
  revoquer: "Révoquer", comptesEtSessions: "Comptes et sessions actives",
  sessions: (n) => `${n} session${n > 1 ? "s" : ""}`,
  gererUtilisateurs: "Gérer les utilisateurs", audit: "Journal d’audit",
};

const EN: TraductionsAcces = {
  titrePage: "Access log — Staff area", surtitre: "Staff area · Security",
  titre: "Access log",
  description: "Named team sessions — revoke access in one click, never your own.",
  revoquee: "Session revoked.", erreurInattendue: "Unexpected error. Try again.",
  sessionsActives: "Active sessions", comptesActifs: "Active accounts",
  administrateurs: "Administrators", sansSession: "Active without session",
  utilisateur: "User", role: "Role", appareil: "Device", ip: "IP",
  derniereActivite: "Last activity", expire: "Expires", action: "Action",
  aucuneSession: "No session recorded.", inconnu: "Unknown",
  active: "Active", expiree: "Expired", sessionCourante: "Current session",
  revoquer: "Revoke", comptesEtSessions: "Accounts and active sessions",
  sessions: (n) => `${n} session${n === 1 ? "" : "s"}`,
  gererUtilisateurs: "Manage users", audit: "Audit log",
};

const ES: TraductionsAcces = {
  titrePage: "Registro de accesos — Área profesional", surtitre: "Área profesional · Seguridad",
  titre: "Registro de accesos",
  description: "Sesiones nominales del equipo: revoque un acceso en un clic, nunca el suyo.",
  revoquee: "Sesión revocada.", erreurInattendue: "Error inesperado. Inténtelo de nuevo.",
  sessionsActives: "Sesiones activas", comptesActifs: "Cuentas activas",
  administrateurs: "Administradores", sansSession: "Activos sin sesión",
  utilisateur: "Usuario", role: "Rol", appareil: "Dispositivo", ip: "IP",
  derniereActivite: "Última actividad", expire: "Caduca", action: "Acción",
  aucuneSession: "Ninguna sesión registrada.", inconnu: "Desconocido",
  active: "Activa", expiree: "Caducada", sessionCourante: "Sesión actual",
  revoquer: "Revocar", comptesEtSessions: "Cuentas y sesiones activas",
  sessions: (n) => `${n} sesión${n === 1 ? "" : "es"}`,
  gererUtilisateurs: "Gestionar usuarios", audit: "Registro de auditoría",
};

const IT: TraductionsAcces = {
  titrePage: "Registro degli accessi — Area professionale", surtitre: "Area professionale · Sicurezza",
  titre: "Registro degli accessi",
  description: "Sessioni nominali del team: revochi un accesso con un clic, mai il proprio.",
  revoquee: "Sessione revocata.", erreurInattendue: "Errore imprevisto. Riprovare.",
  sessionsActives: "Sessioni attive", comptesActifs: "Account attivi",
  administrateurs: "Amministratori", sansSession: "Attivi senza sessione",
  utilisateur: "Utente", role: "Ruolo", appareil: "Dispositivo", ip: "IP",
  derniereActivite: "Ultima attività", expire: "Scade", action: "Azione",
  aucuneSession: "Nessuna sessione registrata.", inconnu: "Sconosciuto",
  active: "Attiva", expiree: "Scaduta", sessionCourante: "Sessione corrente",
  revoquer: "Revoca", comptesEtSessions: "Account e sessioni attive",
  sessions: (n) => `${n} session${n === 1 ? "e" : "i"}`,
  gererUtilisateurs: "Gestisci utenti", audit: "Registro di audit",
};

const DE: TraductionsAcces = {
  titrePage: "Zugriffsprotokoll — Profibereich", surtitre: "Profibereich · Sicherheit",
  titre: "Zugriffsprotokoll",
  description: "Persönliche Teamsitzungen — Zugriff mit einem Klick widerrufen, niemals den eigenen.",
  revoquee: "Sitzung widerrufen.", erreurInattendue: "Unerwarteter Fehler. Versuchen Sie es erneut.",
  sessionsActives: "Aktive Sitzungen", comptesActifs: "Aktive Konten",
  administrateurs: "Administratoren", sansSession: "Aktiv ohne Sitzung",
  utilisateur: "Benutzer", role: "Rolle", appareil: "Gerät", ip: "IP",
  derniereActivite: "Letzte Aktivität", expire: "Läuft ab", action: "Aktion",
  aucuneSession: "Keine Sitzung erfasst.", inconnu: "Unbekannt",
  active: "Aktiv", expiree: "Abgelaufen", sessionCourante: "Aktuelle Sitzung",
  revoquer: "Widerrufen", comptesEtSessions: "Konten und aktive Sitzungen",
  sessions: (n) => `${n} Sitzung${n === 1 ? "" : "en"}`,
  gererUtilisateurs: "Benutzer verwalten", audit: "Audit-Protokoll",
};

const DICTIONNAIRES: Record<Langue, TraductionsAcces> = {
  fr: FR, en: EN, es: ES, it: IT, de: DE,
};

export function traductionsAcces(langue: string): TraductionsAcces {
  return masquerFonctions(DICTIONNAIRES[resoudreLangue(langue)]);
}
