import { LANGUES, type Langue } from "./i18n";

export const LANGUES_STAFF = LANGUES;

export interface TraductionsConnexion {
  espacePro: string;
  bonRetour: string;
  intro: string;
  email: string;
  motDePasse: string;
  captchaTitre: string;
  captchaResultat: string;
  seConnecter: string;
  oublie: string;
  footer: string;
  succesReinitialise: string;
  erreurAcces: string;
  erreurSession: string;
  erreurCaptcha: string;
}

const FR: TraductionsConnexion = {
  espacePro: "Espace professionnel",
  bonRetour: "Bon retour.",
  intro:
    "Connectez-vous pour gérer les séjours, les ménages et la facturation.",
  email: "E-mail",
  motDePasse: "Mot de passe",
  captchaTitre: "Vérification anti-robot",
  captchaResultat: "Résultat en chiffres",
  seConnecter: "Se connecter",
  oublie: "Mot de passe oublié ?",
  footer: "Connexion sécurisée · 2FA disponible · Aucun traceur publicitaire.",
  succesReinitialise:
    "Votre mot de passe a été modifié. Connectez-vous avec votre nouveau mot de passe.",
  erreurAcces: "Accès refusé : cette page est réservée à un rôle autorisé.",
  erreurSession: "Votre session a expiré. Reconnectez-vous.",
  erreurCaptcha:
    "Vérification anti-robot incorrecte ou expirée. Réessayez.",
};

const EN: TraductionsConnexion = {
  espacePro: "Staff area",
  bonRetour: "Welcome back.",
  intro: "Sign in to manage stays, cleaning and invoicing.",
  email: "Email",
  motDePasse: "Password",
  captchaTitre: "Anti-robot check",
  captchaResultat: "Numeric answer",
  seConnecter: "Sign in",
  oublie: "Forgot your password?",
  footer: "Secure login · 2FA available · No advertising trackers.",
  succesReinitialise:
    "Your password has been changed. Sign in with your new password.",
  erreurAcces: "Access denied: this page requires an authorised role.",
  erreurSession: "Your session has expired. Sign in again.",
  erreurCaptcha: "Anti-robot check incorrect or expired. Try again.",
};

const ES: TraductionsConnexion = {
  espacePro: "Área profesional",
  bonRetour: "Bienvenido de nuevo.",
  intro: "Inicie sesión para gestionar estancias, limpieza y facturación.",
  email: "Correo electrónico",
  motDePasse: "Contraseña",
  captchaTitre: "Verificación anti-robot",
  captchaResultat: "Resultado numérico",
  seConnecter: "Iniciar sesión",
  oublie: "¿Ha olvidado su contraseña?",
  footer: "Conexión segura · 2FA disponible · Sin rastreadores publicitarios.",
  succesReinitialise:
    "Su contraseña ha sido modificada. Inicie sesión con la nueva contraseña.",
  erreurAcces: "Acceso denegado: esta página requiere un rol autorizado.",
  erreurSession: "Su sesión ha caducado. Vuelva a iniciar sesión.",
  erreurCaptcha: "Verificación anti-robot incorrecta o caducada. Inténtelo de nuevo.",
};

const IT: TraductionsConnexion = {
  espacePro: "Area professionale",
  bonRetour: "Bentornato.",
  intro: "Accedi per gestire soggiorni, pulizie e fatturazione.",
  email: "E-mail",
  motDePasse: "Password",
  captchaTitre: "Verifica anti-robot",
  captchaResultat: "Risultato numerico",
  seConnecter: "Accedi",
  oublie: "Password dimenticata?",
  footer: "Accesso sicuro · 2FA disponibile · Nessun tracker pubblicitario.",
  succesReinitialise:
    "La password è stata modificata. Accedi con la nuova password.",
  erreurAcces: "Accesso negato: questa pagina richiede un ruolo autorizzato.",
  erreurSession: "La sessione è scaduta. Accedi di nuovo.",
  erreurCaptcha: "Verifica anti-robot errata o scaduta. Riprova.",
};

const DE: TraductionsConnexion = {
  espacePro: "Profibereich",
  bonRetour: "Willkommen zurück.",
  intro: "Melden Sie sich an, um Aufenthalte, Reinigung und Abrechnung zu verwalten.",
  email: "E-Mail",
  motDePasse: "Passwort",
  captchaTitre: "Anti-Roboter-Prüfung",
  captchaResultat: "Numerisches Ergebnis",
  seConnecter: "Anmelden",
  oublie: "Passwort vergessen?",
  footer: "Sichere Anmeldung · 2FA verfügbar · Keine Werbetracker.",
  succesReinitialise:
    "Ihr Passwort wurde geändert. Melden Sie sich mit dem neuen Passwort an.",
  erreurAcces: "Zugriff verweigert: Diese Seite erfordert eine autorisierte Rolle.",
  erreurSession: "Ihre Sitzung ist abgelaufen. Melden Sie sich erneut an.",
  erreurCaptcha: "Anti-Roboter-Prüfung falsch oder abgelaufen. Versuchen Sie es erneut.",
};

const DICTIONNAIRES: Record<Langue, TraductionsConnexion> = {
  fr: FR,
  en: EN,
  es: ES,
  it: IT,
  de: DE,
};

export function resoudreLangue(valeur: string | null | undefined): Langue {
  return valeur && (LANGUES as readonly string[]).includes(valeur)
    ? (valeur as Langue)
    : "fr";
}

export function masquerFonctions<T extends object>(dictionnaire: T): T {
  for (const cle of Object.keys(dictionnaire)) {
    const valeur = (dictionnaire as Record<string, unknown>)[cle];
    if (typeof valeur === "function") {
      Object.defineProperty(dictionnaire, cle, { enumerable: false });
    }
  }
  return dictionnaire;
}

export function traductionsConnexion(langue: string): TraductionsConnexion {
  return DICTIONNAIRES[(LANGUES as readonly string[]).includes(langue)
    ? (langue as Langue)
    : "fr"];
}
