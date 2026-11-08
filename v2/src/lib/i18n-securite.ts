import type { Langue } from "./i18n";
import { masquerFonctions, resoudreLangue } from "./i18n-staff";

export interface TraductionsSecurite {
  titrePage: string;
  compte: string;
  securite: string;
  exigence: string;
  motDePasseChange: string;
  deuxFacteurs: string;
  totp: string;
  active2fa: string;
  codesSecours: string;
  code6: string;
  verifierActiver: string;
  deuxFaActive: string;
  mdpDesactiver: string;
  desactiver: string;
  mdpActiver: string;
  activer: string;
  sessionsActives: string;
  sessionsOuvertes: (nombre: number) => string;
  sessionsFermees: string;
  sessionsEchec: string;
  sessionCourante: string;
  expireLe: (date: string) => string;
  fermerAutres: string;
  motDePasse: string;
  motDePasseAide: string;
  actuel: string;
  nouveau: string;
  confirmation: string;
  modifier: string;
  retour: string;
  qrAlt: string;
}

const FR: TraductionsSecurite = {
  titrePage: "Sécurité — LCD Parc", compte: "Mon compte", securite: "Sécurité",
  exigence: "Votre rôle exige la double authentification. Activez-la ci-dessous pour accéder au reste de l’espace.",
  motDePasseChange: "Mot de passe modifié. Les autres sessions ont été déconnectées.",
  deuxFacteurs: "Authentification à deux facteurs",
  totp: "TOTP : compatible Google Authenticator, Aegis, 1Password, etc.",
  active2fa: "2FA activée. Conservez vos codes de secours.",
  codesSecours: "Codes de secours — conservez-les hors ligne :",
  code6: "Code à 6 chiffres", verifierActiver: "Vérifier et activer",
  deuxFaActive: "2FA active sur ce compte.", mdpDesactiver: "Mot de passe pour désactiver",
  desactiver: "Désactiver la 2FA", mdpActiver: "Mot de passe pour activer",
  activer: "Activer la 2FA", sessionsActives: "Sessions actives",
  sessionsOuvertes: (n) => `${n} session${n > 1 ? "s" : ""} ouverte${n > 1 ? "s" : ""}. Fermez les autres si vous avez utilisé un appareil partagé.`,
  sessionsFermees: "Les autres sessions ont été fermées.",
  sessionsEchec: "La fermeture des sessions a échoué. Réessayez.",
  sessionCourante: "Session actuelle", expireLe: (date) => `Expire le ${date}`,
  fermerAutres: "Fermer les autres sessions", motDePasse: "Mot de passe",
  motDePasseAide: "La modification déconnecte les autres sessions ouvertes.",
  actuel: "Mot de passe actuel", nouveau: "Nouveau mot de passe",
  confirmation: "Confirmation", modifier: "Modifier le mot de passe",
  retour: "Retour à mon espace", qrAlt: "QR code d’activation TOTP",
};

const EN: TraductionsSecurite = {
  titrePage: "Security — LCD Parc", compte: "My account", securite: "Security",
  exigence: "Your role requires two-factor authentication. Enable it below to access the rest of the area.",
  motDePasseChange: "Password changed. Other sessions were signed out.",
  deuxFacteurs: "Two-factor authentication",
  totp: "TOTP: compatible with Google Authenticator, Aegis, 1Password, etc.",
  active2fa: "2FA enabled. Keep your backup codes safe.",
  codesSecours: "Backup codes — keep them offline:",
  code6: "6-digit code", verifierActiver: "Verify and enable",
  deuxFaActive: "2FA is active on this account.", mdpDesactiver: "Password to disable",
  desactiver: "Disable 2FA", mdpActiver: "Password to enable",
  activer: "Enable 2FA", sessionsActives: "Active sessions",
  sessionsOuvertes: (n) => `${n} open session${n === 1 ? "" : "s"}. Close the others if you used a shared device.`,
  sessionsFermees: "Other sessions were closed.",
  sessionsEchec: "Closing sessions failed. Try again.",
  sessionCourante: "Current session", expireLe: (date) => `Expires on ${date}`,
  fermerAutres: "Close other sessions", motDePasse: "Password",
  motDePasseAide: "Changing it signs out other open sessions.",
  actuel: "Current password", nouveau: "New password",
  confirmation: "Confirmation", modifier: "Change password",
  retour: "Back to my area", qrAlt: "TOTP activation QR code",
};

const ES: TraductionsSecurite = {
  titrePage: "Seguridad — LCD Parc", compte: "Mi cuenta", securite: "Seguridad",
  exigence: "Su rol exige la doble autenticación. Actívela abajo para acceder al resto del área.",
  motDePasseChange: "Contraseña modificada. Las demás sesiones se han cerrado.",
  deuxFacteurs: "Autenticación de dos factores",
  totp: "TOTP: compatible con Google Authenticator, Aegis, 1Password, etc.",
  active2fa: "2FA activada. Guarde sus códigos de respaldo.",
  codesSecours: "Códigos de respaldo: guárdelos sin conexión:",
  code6: "Código de 6 cifras", verifierActiver: "Verificar y activar",
  deuxFaActive: "2FA activa en esta cuenta.", mdpDesactiver: "Contraseña para desactivar",
  desactiver: "Desactivar 2FA", mdpActiver: "Contraseña para activar",
  activer: "Activar 2FA", sessionsActives: "Sesiones activas",
  sessionsOuvertes: (n) => `${n} sesión${n === 1 ? "" : "es"} abierta${n === 1 ? "" : "s"}. Cierre las demás si usó un dispositivo compartido.`,
  sessionsFermees: "Las demás sesiones se han cerrado.",
  sessionsEchec: "No se pudieron cerrar las sesiones. Inténtelo de nuevo.",
  sessionCourante: "Sesión actual", expireLe: (date) => `Caduca el ${date}`,
  fermerAutres: "Cerrar las demás sesiones", motDePasse: "Contraseña",
  motDePasseAide: "El cambio cierra las demás sesiones abiertas.",
  actuel: "Contraseña actual", nouveau: "Nueva contraseña",
  confirmation: "Confirmación", modifier: "Modificar contraseña",
  retour: "Volver a mi área", qrAlt: "Código QR de activación TOTP",
};

const IT: TraductionsSecurite = {
  titrePage: "Sicurezza — LCD Parc", compte: "Il mio account", securite: "Sicurezza",
  exigence: "Il suo ruolo richiede l’autenticazione a due fattori. La attivi qui sotto per accedere al resto dell’area.",
  motDePasseChange: "Password modificata. Le altre sessioni sono state disconnesse.",
  deuxFacteurs: "Autenticazione a due fattori",
  totp: "TOTP: compatibile con Google Authenticator, Aegis, 1Password, ecc.",
  active2fa: "2FA attivata. Conservi i codici di backup.",
  codesSecours: "Codici di backup — li conservi offline:",
  code6: "Codice a 6 cifre", verifierActiver: "Verifica e attiva",
  deuxFaActive: "2FA attiva su questo account.", mdpDesactiver: "Password per disattivare",
  desactiver: "Disattiva 2FA", mdpActiver: "Password per attivare",
  activer: "Attiva 2FA", sessionsActives: "Sessioni attive",
  sessionsOuvertes: (n) => `${n} session${n === 1 ? "e" : "i"} apert${n === 1 ? "a" : "e"}. Chiuda le altre se ha usato un dispositivo condiviso.`,
  sessionsFermees: "Le altre sessioni sono state chiuse.",
  sessionsEchec: "Chiusura delle sessioni non riuscita. Riprovare.",
  sessionCourante: "Sessione corrente", expireLe: (date) => `Scade il ${date}`,
  fermerAutres: "Chiudi le altre sessioni", motDePasse: "Password",
  motDePasseAide: "La modifica disconnette le altre sessioni aperte.",
  actuel: "Password attuale", nouveau: "Nuova password",
  confirmation: "Conferma", modifier: "Modifica password",
  retour: "Torna alla mia area", qrAlt: "Codice QR di attivazione TOTP",
};

const DE: TraductionsSecurite = {
  titrePage: "Sicherheit — LCD Parc", compte: "Mein Konto", securite: "Sicherheit",
  exigence: "Ihre Rolle erfordert die Zwei-Faktor-Authentifizierung. Aktivieren Sie sie unten, um auf den restlichen Bereich zuzugreifen.",
  motDePasseChange: "Passwort geändert. Andere Sitzungen wurden abgemeldet.",
  deuxFacteurs: "Zwei-Faktor-Authentifizierung",
  totp: "TOTP: kompatibel mit Google Authenticator, Aegis, 1Password usw.",
  active2fa: "2FA aktiviert. Bewahren Sie Ihre Backup-Codes sicher auf.",
  codesSecours: "Backup-Codes — offline aufbewahren:",
  code6: "6-stelliger Code", verifierActiver: "Prüfen und aktivieren",
  deuxFaActive: "2FA ist für dieses Konto aktiv.", mdpDesactiver: "Passwort zum Deaktivieren",
  desactiver: "2FA deaktivieren", mdpActiver: "Passwort zum Aktivieren",
  activer: "2FA aktivieren", sessionsActives: "Aktive Sitzungen",
  sessionsOuvertes: (n) => `${n} offene Sitzung${n === 1 ? "" : "en"}. Schließen Sie die anderen, wenn Sie ein gemeinsam genutztes Gerät verwendet haben.`,
  sessionsFermees: "Die anderen Sitzungen wurden geschlossen.",
  sessionsEchec: "Schließen der Sitzungen fehlgeschlagen. Versuchen Sie es erneut.",
  sessionCourante: "Aktuelle Sitzung", expireLe: (date) => `Läuft ab am ${date}`,
  fermerAutres: "Andere Sitzungen schließen", motDePasse: "Passwort",
  motDePasseAide: "Die Änderung meldet andere offene Sitzungen ab.",
  actuel: "Aktuelles Passwort", nouveau: "Neues Passwort",
  confirmation: "Bestätigung", modifier: "Passwort ändern",
  retour: "Zurück zu meinem Bereich", qrAlt: "QR-Code zur TOTP-Aktivierung",
};

const DICTIONNAIRES: Record<Langue, TraductionsSecurite> = {
  fr: FR, en: EN, es: ES, it: IT, de: DE,
};

export function traductionsSecurite(langue: string): TraductionsSecurite {
  return masquerFonctions(DICTIONNAIRES[resoudreLangue(langue)]);
}
