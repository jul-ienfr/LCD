import { connection } from "next/server";
import { LireIdentiteSite } from "@/application/use-cases/identite-site";
import { DrizzleParametresSiteRepository } from "@/infrastructure/db/repositories/parametres-site-repository";
import { FormulaireConnexion } from "./formulaire-connexion";

export const instant = false;

export default async function PageLogin() {
  await connection();
  const identite = await new LireIdentiteSite(
    new DrizzleParametresSiteRepository(),
  ).executer();
  return (
    <FormulaireConnexion nom={identite.nom} logoUrl={identite.logoUrl} />
  );
}