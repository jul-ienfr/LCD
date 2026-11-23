<script lang="ts">
  import type { StatutPreuve } from "@/domain/preuve-intervention";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  const TON_PREUVE: Record<StatutPreuve, string> = {
    validee: "ui-badge--succes",
    soumise: "ui-badge--accent",
    refusee: "ui-badge--alerte",
    a_soumettre: "",
  };
</script>

<svelte:head>
  <title>Preuves des interventions — Espace propriétaire</title>
</svelte:head>

<main id="contenu" class="mx-auto max-w-4xl space-y-8 px-6 py-12">
  <header class="flex flex-wrap items-end justify-between gap-4">
    <div class="space-y-2">
      <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">Espace propriétaire</p>
      <h1 class="text-3xl font-semibold tracking-tight">Preuves des interventions</h1>
      <p class="text-encre-douce">{data.nom}</p>
    </div>
    <div class="flex flex-wrap items-center gap-3">
      <a class="ui-lien-action text-sm" href="/proprio">← Relevé du mois</a>
      <form method="POST" action="/logout"><button class="ui-bouton ui-bouton--fantome ui-bouton--petit" type="submit">Quitter</button></form>
    </div>
  </header>

  {#if data.logements.length === 0}
    <p class="ui-alerte ui-alerte--alerte">Aucun logement n’est encore rattaché à votre compte. Contactez votre gestionnaire.</p>
  {:else}
    {#each data.logements as logement (logement.logementId)}
      <section class="space-y-4">
        <div class="flex flex-wrap items-end justify-between gap-2">
          <h2 class="text-xl font-semibold">{logement.logementNom}</h2>
          <p class="text-sm text-encre-faine">Visibilité réglée : {logement.visibiliteLibelle}</p>
        </div>

        {#if !logement.visible}
          <p class="ui-alerte">Les interventions de ce logement ne sont pas partagées avec les propriétaires par votre mandat. Contactez votre gestionnaire pour en ouvrir l’accès.</p>
        {:else}
          <section class="space-y-3">
            <h3 class="text-lg font-semibold">Interventions</h3>
            {#if logement.interventions.length === 0}
              <p class="ui-alerte">Aucune intervention enregistrée sur ce logement.</p>
            {:else}
              <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
              <div tabindex="0" aria-label="Tableau défilant" class="overflow-x-auto rounded-carte border border-bordure bg-surface">
                <table class="w-full min-w-[680px] border-collapse text-sm">
                  <thead>
                    <tr class="border-b border-bordure bg-fond text-left">
                      <th class="p-3">Référence</th>
                      <th class="p-3">Date</th>
                      <th class="p-3">Type</th>
                      <th class="p-3">Intervention</th>
                      <th class="p-3">Preuve</th>
                    </tr>
                  </thead>
                  <tbody>
                    {#each logement.interventions as intervention (intervention.missionId)}
                      <tr class="border-b border-bordure align-top last:border-0">
                        <td class="p-3 font-medium">{intervention.ref}</td>
                        <td class="p-3 text-encre-douce">{intervention.date}</td>
                        <td class="p-3">{intervention.typeLibelle}</td>
                        <td class="p-3">
                          <span class="text-encre-douce">{intervention.statutLibelle}</span>
                          {#if intervention.debutReel && intervention.finReelle}
                            <p class="text-xs text-encre-faine">
                              Pointage {intervention.debutReel} → {intervention.finReelle}
                              {#if intervention.dureeReelle}· {intervention.dureeReelle}{/if}
                              {#if intervention.pointageHorsLigne}<span class="ml-1 text-encre-faine">(hors ligne)</span>{/if}
                            </p>
                          {/if}
                        </td>
                        <td class="p-3">
                          <span class="ui-badge {TON_PREUVE[intervention.preuveStatut]}">{intervention.preuveLibelle}</span>
                          {#if intervention.motifRefus}
                            <p class="mt-1 text-xs text-encre-douce">Motif du refus : {intervention.motifRefus}</p>
                          {/if}
                        </td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            {/if}
          </section>

          {#if logement.visibilite === "complete"}
            <section class="space-y-3">
              <h3 class="text-lg font-semibold">Photos de preuve</h3>
              {#if logement.photos.length === 0}
                <p class="ui-alerte">Aucune photo de preuve sur ce logement.</p>
              {:else}
                <ul class="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {#each logement.photos as photo (photo.id)}
                    <li class="overflow-hidden rounded-2xl border border-bordure bg-surface">
                      <a href={photo.url} target="_blank" rel="noopener">
                        <img class="h-32 w-full object-cover" src={photo.url} alt={`${photo.phaseLibelle} — ${photo.piece}`} loading="lazy" />
                      </a>
                      <div class="space-y-0.5 p-2 text-xs">
                        <p class="font-medium">{photo.phaseLibelle}</p>
                        <p class="text-encre-douce">{photo.piece}</p>
                        <p class="text-encre-faine">{photo.creeLe}</p>
                      </div>
                    </li>
                  {/each}
                </ul>
              {/if}
            </section>
          {/if}
        {/if}
      </section>
    {/each}
  {/if}
</main>
