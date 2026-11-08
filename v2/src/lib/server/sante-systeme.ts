import { statfs } from "node:fs/promises";
import { connect } from "node:tls";
import { env } from "@/lib/env";
import { DrizzleParametresSiteRepository } from "@/infrastructure/db/repositories/parametres-site-repository";

export interface SanteDisque {
  chemin: string;
  libreGo: number | null;
  totalGo: number | null;
  seuilGo: number;
  ok: boolean;
  erreur: string | null;
}

export interface SanteTls {
  hote: string | null;
  expireLe: string | null;
  joursRestants: number | null;
  seuilJours: number;
  ok: boolean;
  erreur: string | null;
}

export interface SanteBox {
  configure: boolean;
  dernierContact: string | null;
  ageMinutes: number | null;
  seuilMinutes: number;
  ok: boolean;
}

function nombreGo(octets: number): number {
  return Math.round((octets / 1024 ** 3) * 10) / 10;
}

export async function lireSanteDisque(): Promise<SanteDisque> {
  const chemin = env.STOCKAGE_LOCAL_DIR || ".";
  const seuilGo = env.ALERTE_DISQUE_GO;
  try {
    const stats = await statfs(chemin);
    const libreGo = nombreGo(Number(stats.bavail) * Number(stats.bsize));
    const totalGo = nombreGo(Number(stats.blocks) * Number(stats.bsize));
    return {
      chemin,
      libreGo,
      totalGo,
      seuilGo,
      ok: libreGo >= seuilGo,
      erreur: null,
    };
  } catch (error) {
    return {
      chemin,
      libreGo: null,
      totalGo: null,
      seuilGo,
      ok: false,
      erreur: error instanceof Error ? error.message : "Erreur disque.",
    };
  }
}

function certificatDepuisUrl(): Promise<SanteTls> {
  const seuilJours = env.ALERTE_TLS_JOURS;
  let url: URL;
  try {
    url = new URL(env.APP_URL);
  } catch {
    return Promise.resolve({
      hote: null,
      expireLe: null,
      joursRestants: null,
      seuilJours,
      ok: false,
      erreur: "APP_URL invalide.",
    });
  }
  if (url.protocol !== "https:") {
    return Promise.resolve({
      hote: url.hostname,
      expireLe: null,
      joursRestants: null,
      seuilJours,
      ok: true,
      erreur: "Site servi en HTTP : pas de certificat à surveiller.",
    });
  }

  return new Promise((resolve) => {
    const hote = url.hostname;
    const port = url.port ? Number(url.port) : 443;
    let termine = false;

    const finir = (resultat: SanteTls) => {
      if (termine) return;
      termine = true;
      socket.destroy();
      resolve(resultat);
    };

    const socket = connect(
      {
        host: hote,
        port,
        servername: hote,
        rejectUnauthorized: false,
        timeout: 4_000,
      },
      () => {
        const certificat = socket.getPeerCertificate();
        const expire = certificat.valid_to ? new Date(certificat.valid_to) : null;
        if (!expire || Number.isNaN(expire.getTime())) {
          finir({
            hote,
            expireLe: null,
            joursRestants: null,
            seuilJours,
            ok: false,
            erreur: "Certificat illisible.",
          });
          return;
        }
        const joursRestants = Math.ceil(
          (expire.getTime() - Date.now()) / 86_400_000,
        );
        finir({
          hote,
          expireLe: expire.toISOString(),
          joursRestants,
          seuilJours,
          ok: joursRestants >= seuilJours,
          erreur: null,
        });
      },
    );

    socket.on("timeout", () =>
      finir({
        hote,
        expireLe: null,
        joursRestants: null,
        seuilJours,
        ok: false,
        erreur: "Délai TLS dépassé.",
      }),
    );
    socket.on("error", (error) =>
      finir({
        hote,
        expireLe: null,
        joursRestants: null,
        seuilJours,
        ok: false,
        erreur: error.message,
      }),
    );
  });
}

let cacheTls: { valeur: SanteTls; expire: number } | null = null;

export async function lireSanteTls(): Promise<SanteTls> {
  if (cacheTls && cacheTls.expire > Date.now()) return cacheTls.valeur;
  const valeur = await certificatDepuisUrl();
  cacheTls = { valeur, expire: Date.now() + 5 * 60_000 };
  return valeur;
}

export async function lireSanteBox(): Promise<SanteBox> {
  const seuilMinutes = env.BOX_HEARTBEAT_MAX_MINUTES;
  try {
    const brut = await new DrizzleParametresSiteRepository().lire(
      "box.dernier_contact",
    );
    if (!brut) {
      return {
        configure: false,
        dernierContact: null,
        ageMinutes: null,
        seuilMinutes,
        ok: false,
      };
    }
    const date = new Date(brut);
    if (Number.isNaN(date.getTime())) {
      return {
        configure: true,
        dernierContact: null,
        ageMinutes: null,
        seuilMinutes,
        ok: false,
      };
    }
    const ageMinutes = Math.floor((Date.now() - date.getTime()) / 60_000);
    return {
      configure: true,
      dernierContact: date.toISOString(),
      ageMinutes,
      seuilMinutes,
      ok: ageMinutes <= seuilMinutes,
    };
  } catch {
    return {
      configure: false,
      dernierContact: null,
      ageMinutes: null,
      seuilMinutes,
      ok: false,
    };
  }
}
