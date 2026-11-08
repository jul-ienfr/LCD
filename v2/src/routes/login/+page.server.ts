import { fail, isRedirect, redirect } from "@sveltejs/kit";
import { APIError } from "better-auth/api";
import { verifierChallengeCaptcha } from "@/domain/captcha";
import { auth } from "@/lib/server/auth";
import {
  captchaActif,
  cleTentative,
  creerCaptcha,
  effacerTentatives,
  enregistrerEchecTentative,
  etatTentatives,
} from "@/lib/server/captcha";
import { env } from "@/lib/env";
import {
  LANGUES_STAFF,
  traductionsConnexion,
} from "@/lib/i18n-staff";
import { destinationRole } from "@/lib/server/session";
import type { Actions, PageServerLoad } from "./$types";

const COOKIE_CAPTCHA = "lcd_captcha";

function ipRequete(event: {
  getClientAddress: () => string;
}): string {
  try {
    return event.getClientAddress();
  } catch {
    return "inconnue";
  }
}

function captchaRequis(etat: { requis: boolean }): boolean {
  return env.CAPTCHA_MODE === "toujours" || etat.requis;
}

export const load: PageServerLoad = async (event) => {
  const { locals, url } = event;
  // « erreur=acces » doit rester affichable pour un rôle non autorisé,
  // sinon /login → /hote → /login boucle sans fin.
  if (locals.session && url.searchParams.get("erreur") !== "acces") {
    redirect(303, destinationRole(locals.session.user.role));
  }

  let captcha: { question: string; token: string } | null = null;
  if (captchaActif()) {
    const etat = await etatTentatives(cleTentative(ipRequete(event)));
    if (captchaRequis(etat)) {
      const defi = creerCaptcha();
      event.cookies.set(COOKIE_CAPTCHA, defi.nonce, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: event.url.protocol === "https:",
        maxAge: 10 * 60,
      });
      captcha = defi.affiche;
    }
  }

  const langueDemandee = url.searchParams.get("lang");
  const langue =
    langueDemandee && LANGUES_STAFF.includes(langueDemandee as (typeof LANGUES_STAFF)[number])
      ? langueDemandee
      : event.cookies.get("lcd_langue") ?? "fr";
  if (langueDemandee) {
    event.cookies.set("lcd_langue", langue, {
      path: "/",
      sameSite: "lax",
      maxAge: 365 * 24 * 60 * 60,
      secure: event.url.protocol === "https:",
    });
  }
  const t = traductionsConnexion(langue);
  const erreur = url.searchParams.get("erreur");
  return {
    t,
    langue,
    langues: LANGUES_STAFF,
    succes:
      url.searchParams.get("reinitialise") === "1" ? t.succesReinitialise : null,
    erreur:
      erreur === "acces"
        ? t.erreurAcces
        : erreur === "session"
          ? t.erreurSession
          : erreur === "captcha"
            ? t.erreurCaptcha
            : null,
    captcha,
  };
};

export const actions = {
  default: async (event) => {
    const donnees = await event.request.formData();
    const email = String(donnees.get("email") ?? "").trim().toLowerCase();
    const motDePasse = String(donnees.get("password") ?? "");
    const ip = ipRequete(event);
    const cle = cleTentative(ip);

    if (!email || !motDePasse) {
      return fail(400, {
        email,
        message: "Renseignez votre e-mail et votre mot de passe.",
      });
    }

    if (captchaActif()) {
      const etat = await etatTentatives(cle);
      if (captchaRequis(etat)) {
        const reponse = String(donnees.get("captchaReponse") ?? "");
        const token = String(donnees.get("captchaToken") ?? "");
        const nonce = event.cookies.get(COOKIE_CAPTCHA) ?? "";
        event.cookies.delete(COOKIE_CAPTCHA, { path: "/" });
        if (
          !verifierChallengeCaptcha({
            secret: env.BETTER_AUTH_SECRET,
            token,
            nonce,
            reponse,
          })
        ) {
          await enregistrerEchecTentative(cle);
          redirect(303, "/login?erreur=captcha");
        }
      }
    }

    let roleConnecte: string | undefined;
    try {
      const resultat = await auth.api.signInEmail({
        body: { email, password: motDePasse },
        headers: event.request.headers,
      });
      if (resultat && "twoFactorRedirect" in resultat && resultat.twoFactorRedirect) {
        await effacerTentatives(cle);
        event.cookies.delete(COOKIE_CAPTCHA, { path: "/" });
        redirect(303, "/two-factor");
      }
      roleConnecte = (resultat as { user?: { role?: string } } | undefined)?.user?.role;
    } catch (error) {
      if (isRedirect(error)) throw error;
      const etat = await enregistrerEchecTentative(cle);
      if (error instanceof APIError) {
        return fail(400, {
          email,
          message:
            error.status === "FORBIDDEN"
              ? "Compte désactivé. Contactez un administrateur."
              : error.status === "TOO_MANY_REQUESTS"
                ? "Trop de tentatives. Réessayez dans une minute."
                : etat.requis
                  ? "E-mail ou mot de passe incorrect. Une vérification anti-robot sera demandée."
                  : "E-mail ou mot de passe incorrect.",
        });
      }
      return fail(500, {
        email,
        message: "Connexion impossible. Réessayez dans un instant.",
      });
    }

    await effacerTentatives(cle);
    event.cookies.delete(COOKIE_CAPTCHA, { path: "/" });
    redirect(303, destinationRole(roleConnecte));
  },
} satisfies Actions;
