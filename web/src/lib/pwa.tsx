"use client";
// lib/pwa.tsx — zone PWA des 2 dashboards offline (F4 §F8) :
//  - enregistre le service worker maison (/sw.js) ;
//  - bandeau HONNETE : "hors ligne" des que navigator.onLine tombe, compteur
//    d'ecritures en attente (outbox IndexedDB), aucune promesse non tenue ;
//  - rejeu FIFO au retour du reseau : POST MPA identique au formulaire
//    natif (meme champ $ACTION_ID + meme ref idempotente : la passerelle
//    deduplique, donc 3 allers-retours = 0 ecriture perdue ET 0 doublon).
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { EVENEMENT_OUTBOX, outboxNavigateur, signalerOutbox } from "./outbox";

const CLE_SYNCHRO = "lcd-derniere-synchro";
const oubox = () => outboxNavigateur();

const TXT = {
  fr: {
    hors: "Hors ligne — contenu deja visite consultable ; ecritures en attente.",
    attente: (n: number, d: string) => `${n} ecriture(s) en attente d'envoi (donnees du ${d})`,
    vide: "Ecritures deja visitees consultables ; reseau absent.",
    envoye: (n: number) => `${n} ecriture(s) envoyee(s) au reseau`,
  },
  en: {
    hors: "Offline — previously visited content available; writes pending.",
    attente: (n: number, d: string) => `${n} write(s) pending (data from ${d})`,
    vide: "Previously visited content available; no network.",
    envoye: (n: number) => `${n} write(s) sent to the network`,
  },
  es: {
    hors: "Sin conexion — contenido ya visitado disponible; escrituras pendientes.",
    attente: (n: number, d: string) => `${n} escritura(s) pendiente(s) (datos del ${d})`,
    vide: "Contenido ya visitado disponible; sin red.",
    envoye: (n: number) => `${n} escritura(s) enviada(s)`,
  },
  it: {
    hors: "Offline — contenuti gia visitati disponibili; scritture in attesa.",
    attente: (n: number, d: string) => `${n} scrittura(i) in attesa (dati del ${d})`,
    vide: "Contenuti gia visitati disponibili; nessuna rete.",
    envoye: (n: number) => `${n} scrittura(i) inviate`,
  },
  de: {
    hors: "Offline — bereits besuchte Inhalte verfugbar; Schreibvorgange warten.",
    attente: (n: number, d: string) => `${n} Schreibvorgang(e) warten (Daten vom ${d})`,
    vide: "Besuchte Inhalte verfugbar; kein Netz.",
    envoye: (n: number) => `${n} Schreibvorgang(e) gesendet`,
  },
} as const;

type LanguePwa = keyof typeof TXT;

function heureCourte(iso: string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export function PwaDashboard({ lang = "fr" }: { lang?: LanguePwa }) {
  const [swPret, setSwPret] = useState(false);
  const [attente, setAttente] = useState(0);
  const [derniereSynchro, setDerniereSynchro] = useState("");
  const txt = TXT[lang] || TXT.fr;

  // Etat reseau = store externe du navigateur (jamais un etat derive en
  // effect : regle react-hooks/set-state-in-effect + fuite de listener).
  const enLigne = useSyncExternalStore(
    (abonner) => {
      window.addEventListener("online", abonner);
      window.addEventListener("offline", abonner);
      return () => {
        window.removeEventListener("online", abonner);
        window.removeEventListener("offline", abonner);
      };
    },
    () => navigator.onLine,
    () => true,
  );

  // Enregistrement du SW (jamais bloquant : L1/L0 survivent sans lui).
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then(() => setSwPret(true))
      .catch((e: unknown) => {
        // Un SW refuse (navigateur sans HTTPS/loopback) ne casse jamais la page.
        console.warn("service worker non enregistre :", e);
      });
  }, []);

  // Compteur outbox (eventuel emis par les formulaires) — tout setState
  // arrive dans un callback asynchrone, jamais dans le corps de l'effect.
  const rafraichir = useCallback(async () => {
    const n = await outboxNavigateur().compter();
    setAttente(n);
    const ts = localStorage.getItem(CLE_SYNCHRO);
    if (ts) setDerniereSynchro(ts);
  }, []);

  useEffect(() => {
    // Premiere lecture differee d'un tick : l'effect ne produit jamais de
    // setState pendant son propre commit (regle set-state-in-effect).
    const id = setTimeout(rafraichir, 0);
    window.addEventListener("online", rafraichir);
    window.addEventListener("offline", rafraichir);
    window.addEventListener(EVENEMENT_OUTBOX, rafraichir);
    return () => {
      clearTimeout(id);
      window.removeEventListener("online", rafraichir);
      window.removeEventListener("offline", rafraichir);
      window.removeEventListener(EVENEMENT_OUTBOX, rafraichir);
    };
  }, [rafraichir]);

  // Rejeu FIFO au retour du reseau (POST MPA : meme corps que le natif).
  const rejouer = useCallback(async () => {
    const box = oubox();
    const file = await box.lister();
    let envoyees = 0;
    for (const e of file) {
      const fd = new FormData();
      for (const [nom, valeur] of e.champs) fd.append(nom, valeur);
      try {
        // Accept "navigateur" OBLIGATOIRE : sans lui Next traite le POST
        // comme une requete RSC (pas comme une soumission MPA de formulaire),
        // rend la page en 200 SANS executer l'action — faux positif silencieux
        // (preuve recette : la table d'idempotence ne voit jamais la ref).
        const rep = await fetch(e.url, {
          method: "POST",
          body: fd,
          redirect: "manual",
          headers: {
            accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          },
        });
        // Acceptation : 200 (MPA cacheComponents = resultat rendu en ligne,
        // execution PROUVEE par la table d'idempotence), 303/307 (MPA
        // redirect). Un 200 "page sans execution" (bug cookies invariant,
        // cf. jarSecurise) ne peut plus se produire : le rendu degrade
        // l'identite au lieu d'echouer, et la recette verifie la ref au
        // serveur (premier contact deja idempotent = le navigateur a execute).
        if (rep.status === 200 || rep.status === 303 || rep.status === 307) {
          await box.retirer(e.ref);
          envoyees += 1;
          signalerOutbox();
        } else {
          break; // refus moteur : on ne tourne pas en boucle, l'humain decide
        }
      } catch {
        break; // reseau retombe pendant le rejeu : la file reste intacte
      }
    }
    if (envoyees > 0) {
      localStorage.setItem(CLE_SYNCHRO, new Date().toISOString());
      setDerniereSynchro(localStorage.getItem(CLE_SYNCHRO) || "");
      await rafraichir();
    }
  }, [rafraichir]);

  useEffect(() => {
    // Rejeu differe d'un tick : l'effect ne declenche jamais d'ecriture
    // pendant son propre commit (regle set-state-in-effect).
    if (!enLigne || attente === 0) return;
    const id = setTimeout(() => {
      rejouer();
    }, 0);
    return () => clearTimeout(id);
  }, [enLigne, attente, rejouer]);

  if (!swPret || (enLigne && attente === 0)) return null;

  const details = !enLigne
    ? txt.attente(attente, heureCourte(derniereSynchro) || "cette session")
    : txt.envoye(attente);
  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="bandeau-hors-ligne"
      className="rounded-2xl border border-[var(--alerte)] bg-[var(--alerte-douce)] px-4 py-2.5 text-sm font-semibold text-[var(--alerte)]"
    >
      {!enLigne && attente === 0 ? txt.vide : !enLigne ? `${txt.hors} ${details}` : details}
    </div>
  );
}
