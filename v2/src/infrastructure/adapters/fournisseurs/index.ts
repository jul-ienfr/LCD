import type { FournisseurCanal } from "@/application/ports/fournisseur-canal";
import {
  codeFournisseurValide,
  type CodeFournisseur,
} from "@/domain/fournisseur";
import { ErreurMetier } from "@/domain/erreurs";
import { env } from "@/lib/env";
import { Beds24Fournisseur } from "./beds24";
import { ChannexFournisseur } from "./channex";
import { HostPortFournisseur } from "./hostport";
import { NobedsFournisseur } from "./nobeds";
import { SmoobuFournisseur } from "./smoobu";

export function creerFournisseur(code: string): FournisseurCanal {
  if (!codeFournisseurValide(code)) {
    throw new ErreurMetier(
      "FOURNISSEUR_INVALIDE",
      "Fournisseur inconnu.",
    );
  }
  switch (code) {
    case "beds24":
      return new Beds24Fournisseur();
    case "channex":
      return new ChannexFournisseur();
    case "smoobu":
      return new SmoobuFournisseur();
    case "hostport":
      return new HostPortFournisseur();
    case "nobeds":
      return new NobedsFournisseur();
  }
}

export function fournisseurConfigure(code: CodeFournisseur): boolean {
  switch (code) {
    case "beds24":
      return Boolean(env.BEDS24_REFRESH_TOKEN || env.BEDS24_API_TOKEN);
    case "channex":
      return Boolean(env.CHANNEX_API_KEY);
    case "smoobu":
      return Boolean(env.SMOOBU_API_KEY && env.SMOOBU_API_SECRET);
    case "hostport":
      return Boolean(env.HOSTPORT_API_KEY);
    case "nobeds":
      return Boolean(env.NOBEDS_API_TOKEN);
  }
}

export function webhookFournisseurConfigure(
  code: CodeFournisseur,
): boolean {
  switch (code) {
    case "beds24":
      return Boolean(env.BEDS24_WEBHOOK_SECRET);
    case "channex":
      return Boolean(env.CHANNEX_WEBHOOK_SECRET);
    case "smoobu":
      return Boolean(env.SMOOBU_WEBHOOK_SECRET);
    case "hostport":
      return Boolean(env.HOSTPORT_WEBHOOK_SECRET);
    case "nobeds":
      return Boolean(env.NOBEDS_WEBHOOK_SECRET);
  }
}
