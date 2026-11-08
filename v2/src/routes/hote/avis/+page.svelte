<script lang="ts">
  import type { PageData } from "./$types";
  import { traductionsVoyageurs } from "@/lib/i18n-voyageurs";

  let { data }: { data: PageData } = $props();

  const t = $derived(traductionsVoyageurs(data.langue));
</script>

<svelte:head>
  <title>{t.avisTitrePage}</title>
</svelte:head>

<main class="mx-auto max-w-5xl space-y-8 px-6 py-12">
  <header class="flex flex-wrap items-end justify-between gap-4">
    <div class="space-y-2">
      <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">
        {t.avisEspace}
      </p>
      <h1 class="text-3xl font-semibold tracking-tight">{t.avisTitre}</h1>
      <p class="text-encre-douce">{t.avisResume(data.total, data.publies, data.moyenne === null ? null : String(data.moyenne))}</p>
    </div>
  </header>

  {#if data.ok}
    <p class="ui-alerte ui-alerte--ok">{t.avisMaj}</p>
  {/if}
  {#if data.erreur}
    <p class="ui-alerte ui-alerte--danger">{t.avisIntrouvable}</p>
  {/if}

  {#if data.avis.length === 0}
    <p class="rounded-2xl border border-dashed border-bordure p-6 text-encre-douce">
      {t.aucunAvis}
    </p>
  {:else}
    <ul class="space-y-3">
      {#each data.avis as avis (avis.id)}
        <li class="ui-carte">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p class="font-medium">{avis.nom} · {avis.logement}</p>
              <p class="text-sm" aria-label={t.noteSur(avis.note)}>
                {"★".repeat(avis.note)}<span class="text-encre-faine"
                  >{"★".repeat(5 - avis.note)}</span
                >
              </p>
              <p class="mt-1 text-xs text-encre-faine">
                {avis.date} · {t.statuts[avis.statut]}
              </p>
            </div>
            <form method="POST" action="?/moderer">
              <input name="id" type="hidden" value={avis.id} />
              <input
                name="statut"
                type="hidden"
                value={avis.statut === "publie" ? "masque" : "publie"}
              />
              <button class="ui-bouton ui-bouton--secondaire ui-bouton--petit" type="submit">
                {avis.statut === "publie" ? t.masquer : t.publier}
              </button>
            </form>
          </div>
          {#if avis.commentaire}
            <p class="mt-3 whitespace-pre-line text-sm text-encre-douce">
              {avis.commentaire}
            </p>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</main>
