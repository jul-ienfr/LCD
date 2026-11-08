<script lang="ts">
  import PageEntete from "@/lib/components/ui/page-entete.svelte";
  import Kpi from "@/lib/components/ui/kpi.svelte";
  import { traductionsCompta } from "@/lib/i18n-compta";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  const t = $derived(traductionsCompta(data.langue));
</script>

<svelte:head>
  <title>{t.simTitrePage}</title>
</svelte:head>

<main class="mx-auto max-w-4xl space-y-8 px-6 py-12">
  <PageEntete
    surtitre={t.simSurtitre}
    titre={t.simTitre}
    description={t.simDescription}
  />

  <div class="flex flex-wrap gap-3">
    <a class="ui-lien text-sm" href="/hote/compta">{t.retourCompta}</a>
    <a class="ui-lien text-sm" href="/hote/compta/parametres">{t.parametresFiscaux}</a>
  </div>

  <section class="ui-carte space-y-4">
    <form class="grid gap-4 sm:grid-cols-2" method="GET">
      <label class="space-y-2 sm:col-span-2">
        <span class="ui-label">{t.regimeEtudie}</span>
        <select class="ui-champ" name="regime">
          {#each data.regimes as regime (regime.id)}
            <option value={regime.id} selected={regime.id === data.regime}>{regime.label}</option>
          {/each}
        </select>
      </label>
      <label class="space-y-2">
        <span class="ui-label">{t.recettes}</span>
        <input class="ui-champ" inputmode="decimal" name="recettes" value={data.saisies.recettes} />
      </label>
      <label class="space-y-2">
        <span class="ui-label">{t.charges}</span>
        <input class="ui-champ" inputmode="decimal" name="charges" value={data.saisies.charges} />
      </label>
      <label class="space-y-2">
        <span class="ui-label">{t.amortissements}</span>
        <input class="ui-champ" inputmode="decimal" name="amortissements" value={data.saisies.amortissements} />
      </label>
      <div class="flex items-end">
        <button class="ui-bouton ui-bouton--primaire" type="submit">{t.comparer}</button>
      </div>
    </form>
  </section>

  <section class="grid gap-4 sm:grid-cols-3">
    <Kpi libelle={t.seuilMicro} valeur={data.montants.seuil} note={data.regimeLibelle} />
    <Kpi libelle={t.abattement} valeur={data.montants.abattement ?? "—"} note={data.tauxAbattement} />
    <Kpi libelle={t.baseReel} valeur={data.montants.baseReel} note={t.baseReelNote} />
  </section>

  <section class="ui-carte space-y-3">
    <h2 class="text-lg font-semibold">{t.resultat}</h2>
    <p class="text-sm">
      {t.baseMicro} : <strong>{data.montants.baseMicro ?? t.indisponible}</strong>
      {#if data.montants.ecart}
        · {t.ecartReel} : <strong>{data.montants.ecart}</strong>
      {/if}
    </p>
    <p class="text-encre-douce">{t.recommandations[data.simulation.recommandation]}</p>
    {#if data.simulation.deficitReportableCentimes > 0}
      <p class="text-sm text-encre-douce">
        {t.deficit} : <strong>{data.montants.deficit}</strong>.
      </p>
    {/if}
    {#if !data.simulation.microPossible}
      <p class="ui-alerte ui-alerte--danger" role="status">
        {t.recettesSeuil(data.montants.seuil)}
      </p>
    {/if}
  </section>

  <p class="text-xs text-encre-faine">
    {t.bareme}
  </p>
</main>
