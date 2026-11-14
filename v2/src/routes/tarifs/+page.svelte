<script lang="ts">
  import { euros } from "@/domain/offres";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>Tarifs — FULL, PILOTAGE, KIT | LCD</title>
  <meta
    content="Trois façons de confier ou d'outiller votre location courte durée : conciergerie FULL, logiciel PILOTAGE ou KIT de démarrage."
    name="description"
  />
</svelte:head>

<main id="contenu" class="mx-auto max-w-5xl space-y-12 px-6 py-12">
  <header class="space-y-3 text-center">
    <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">
      Tarifs
    </p>
    <h1 class="text-4xl font-semibold tracking-tight">
      Confiez, pilotez ou lancez votre location
    </h1>
    <p class="mx-auto max-w-2xl text-encre-douce">
      Pas de frais cachés : choisissez le niveau d'accompagnement. Le
      calculateur donne un ordre de grandeur mensuel, hors ménage et
      consommables pour FULL.
    </p>
  </header>

  <section class="grid gap-6 md:grid-cols-3">
    {#each data.simulations as offre (offre.code)}
      <article class="ui-carte flex flex-col gap-4">
        <div>
          <h2 class="text-xl font-semibold">{offre.nom}</h2>
          <p class="text-sm text-encre-faine">{offre.accroche}</p>
        </div>
        <p class="text-3xl font-semibold tabular-nums">
          {euros(offre.simulation.mensuelCentimes)}
          <span class="text-sm font-normal text-encre-faine">/ mois</span>
        </p>
        <p class="text-sm text-encre-douce">{offre.description}</p>
        <ul class="space-y-1 text-sm text-encre-douce">
          {#each offre.inclus as element (element)}
            <li>✓ {element}</li>
          {/each}
        </ul>
        <p class="mt-auto text-xs text-encre-faine">{offre.simulation.note}</p>
        <a
          class="ui-bouton ui-bouton--secondaire"
          href={`/reserver?offre=${offre.code.toLowerCase()}`}
        >
          Demander un devis
        </a>
      </article>
    {/each}
  </section>

  <section class="ui-carte space-y-4">
    <div>
      <h2 class="text-xl font-semibold">Estimer mon budget</h2>
      <p class="mt-1 text-sm text-encre-douce">
        Indiquez le nombre de logements et le chiffre d'affaires brut mensuel
        attendu. Le calcul se fait sans JavaScript.
      </p>
    </div>
    <form class="grid gap-4 sm:grid-cols-[1fr_1fr_auto]" method="GET">
      <label class="space-y-2">
        <span class="ui-label">Logements</span>
        <input
          class="ui-champ"
          max="50"
          min="1"
          name="logements"
          type="number"
          value={data.logements}
        />
      </label>
      <label class="space-y-2">
        <span class="ui-label">CA brut mensuel (€)</span>
        <input
          class="ui-champ"
          min="0"
          name="ca"
          step="100"
          type="number"
          value={data.caEuros}
        />
      </label>
      <div class="flex items-end">
        <button class="ui-bouton ui-bouton--primaire" type="submit">
          Calculer
        </button>
      </div>
    </form>
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <div role="region" tabindex="0" aria-label="Tableau défilant"  class="overflow-x-auto rounded-2xl border border-bordure">
      <table class="ui-tableau min-w-[520px]">
        <thead>
          <tr><th>Offre</th><th>Mensuel estimé</th><th>Annuel</th><th>Hypothèse</th></tr>
        </thead>
        <tbody>
          {#each data.simulationsFormatees as simulation (simulation.code)}
            <tr>
              <td class="font-medium">{simulation.nom}</td>
              <td class="tabular-nums">{simulation.mensuel}</td>
              <td class="tabular-nums">{simulation.annuel}</td>
              <td class="text-xs text-encre-faine">{simulation.note}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <p class="text-xs text-encre-faine">
      Simulation indicative pour {data.logements} logement(s) et
      {data.caEuros} € de CA brut mensuel. Le devis définitif tient compte du
      linge, du ménage, des consommables et des spécificités du logement.
    </p>
  </section>

  <section class="space-y-4">
    <h2 class="text-2xl font-semibold">Questions fréquentes</h2>
    <details class="rounded-2xl border border-bordure p-4">
      <summary class="flex min-h-11 cursor-pointer items-center font-medium">
        Quelle différence entre FULL et PILOTAGE ?
      </summary>
      <p class="mt-2 text-sm text-encre-douce">
        FULL inclut l'opération : nous gérons les annonces, le ménage, les
        états des lieux et les déclarations. PILOTAGE fournit le logiciel et
        les process à votre équipe, qui garde l'opération.
      </p>
    </details>
    <details class="rounded-2xl border border-bordure p-4">
      <summary class="flex min-h-11 cursor-pointer items-center font-medium">
        Le ménage est-il compris dans les 25 % ?
      </summary>
      <p class="mt-2 text-sm text-encre-douce">
        Non. La commission FULL couvre la gestion ; le ménage, le linge et les
        consommables sont refacturés au propriétaire ou intégrés au prix du
        séjour selon le contrat.
      </p>
    </details>
    <details class="rounded-2xl border border-bordure p-4">
      <summary class="flex min-h-11 cursor-pointer items-center font-medium">
        Puis-je changer d'offre ?
      </summary>
      <p class="mt-2 text-sm text-encre-douce">
        Oui. Le KIT peut évoluer vers PILOTAGE, et PILOTAGE vers FULL. Les
        données et l'historique restent dans le même compte.
      </p>
    </details>
    <details class="rounded-2xl border border-bordure p-4">
      <summary class="flex min-h-11 cursor-pointer items-center font-medium">
        Y a-t-il un engagement ?
      </summary>
      <p class="mt-2 text-sm text-encre-douce">
        Les conditions sont précisées au devis. Le KIT est un achat initial ;
        PILOTAGE et FULL sont mensuels, sans frais de mise en service cachés.
      </p>
    </details>
  </section>
</main>
