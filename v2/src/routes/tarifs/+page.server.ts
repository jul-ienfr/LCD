import {
  bornerCa,
  bornerLogements,
  euros,
  OFFRES,
  simulerOffre,
} from "@/domain/offres";
import type { PageServerLoad } from "./$types";

function nombre(valeur: string | null, defaut: number): number {
  const parse = Number.parseInt(valeur ?? "", 10);
  return Number.isFinite(parse) ? parse : defaut;
}

export const load: PageServerLoad = ({ url }) => {
  const logements = bornerLogements(nombre(url.searchParams.get("logements"), 1));
  // `ca` est saisi en euros dans le formulaire ; le domaine raisonne en centimes.
  const caEuros = Math.min(
    1_000_000,
    Math.max(0, nombre(url.searchParams.get("ca"), 2_500)),
  );
  const caMensuelCentimes = bornerCa(caEuros * 100);

  return {
    logements,
    caMensuelCentimes,
    caEuros: Math.round(caMensuelCentimes / 100),
    simulations: OFFRES.map((offre) => ({
      ...offre,
      simulation: simulerOffre(offre.code, { logements, caMensuelCentimes }),
    })),
    simulationsFormatees: OFFRES.map((offre) => {
      const simulation = simulerOffre(offre.code, {
        logements,
        caMensuelCentimes,
      });
      return {
        code: offre.code,
        nom: offre.nom,
        mensuel: euros(simulation.mensuelCentimes),
        annuel: euros(simulation.annuelCentimes),
        note: simulation.note,
      };
    }),
  };
};
