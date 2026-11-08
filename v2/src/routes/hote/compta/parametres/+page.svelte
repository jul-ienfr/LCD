<script lang="ts">
  import PageEntete from "@/lib/components/ui/page-entete.svelte";
  import Kpi from "@/lib/components/ui/kpi.svelte";
  import { traductionsCompta } from "@/lib/i18n-compta";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  const t = $derived(traductionsCompta(data.langue));
</script>

<svelte:head>
  <title>{t.paramsTitrePage}</title>
</svelte:head>

<main class="mx-auto max-w-3xl space-y-8 px-6 py-12">
  <PageEntete
    surtitre={t.paramsSurtitre}
    titre={t.paramsTitre}
    description={t.paramsDescription}
  />

  {#if data.ok}
    <p class="ui-alerte ui-alerte--ok">{t.paramsOk}</p>
  {/if}
  {#if data.erreur}
    <p class="ui-alerte ui-alerte--danger">{t.paramsErreurs[data.erreur] ?? data.erreur}</p>
  {/if}

  <section class="grid gap-4 sm:grid-cols-3">
    <Kpi libelle={t.kpiTvaDefaut} valeur={data.parametres.tauxTvaLibelle} />
    <Kpi libelle={t.kpiTaxe} valeur={data.parametres.taxeLibelle} note={t.parNuitPersonne} />
    <Kpi libelle={t.kpiNumerotation} valeur={`${data.parametres.prefixeFacture}-2026-0001`} note={data.parametres.plafondLibelle} />
  </section>

  <section class="ui-carte">
    <h2 class="text-lg font-semibold">{t.reglages}</h2>
    <p class="mt-1 text-sm text-encre-douce">{t.reglagesAide}</p>
    <form class="mt-5 space-y-5" method="POST" action="?/enregistrer">
      <div class="grid gap-4 sm:grid-cols-2">
        <label class="space-y-2">
          <span class="ui-label">{t.tauxTva}</span>
          <input class="ui-champ" inputmode="decimal" name="tauxTva" placeholder="10" required defaultValue={data.parametres.tauxTvaSaisie} />
          <span class="block text-xs text-encre-faine">{t.tauxAide}</span>
        </label>
        <label class="space-y-2">
          <span class="ui-label">{t.prefixe}</span>
          <input class="ui-champ font-mono uppercase" maxlength="8" name="prefixeFacture" placeholder="FAC" required defaultValue={data.parametres.prefixeFacture} />
          <span class="block text-xs text-encre-faine">{t.prefixeAide}</span>
        </label>
        <label class="space-y-2">
          <span class="ui-label">{t.taxeNuit}</span>
          <input class="ui-champ" inputmode="decimal" name="taxeNuitEuros" placeholder="0" defaultValue={data.parametres.taxeSaisie} />
          <span class="block text-xs text-encre-faine">{t.taxeAide}</span>
        </label>
        <label class="space-y-2">
          <span class="ui-label">{t.plafond}</span>
          <input class="ui-champ" inputmode="decimal" name="plafondEuros" placeholder="Ex. 4,20" defaultValue={data.parametres.plafondSaisie} />
          <span class="block text-xs text-encre-faine">{t.plafondAide}</span>
        </label>
      </div>
      <label class="block space-y-2">
        <span class="ui-label">{t.mentions}</span>
        <textarea class="ui-champ min-h-24" maxlength="2000" name="mentionsLegales" placeholder={t.mentionsPlaceholder} defaultValue={data.parametres.mentionsLegales ?? ""}></textarea>
      </label>
      <button class="ui-bouton ui-bouton--primaire" type="submit">{t.enregistrer}</button>
    </form>
  </section>

  <section class="ui-alerte ui-alerte--alerte">
    <h2 class="font-semibold">{t.facturXTitre}</h2>
    <p class="mt-2">{t.facturXAide}</p>
  </section>
</main>
