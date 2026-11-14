<script lang="ts">
  import type { BlocSite } from "@/domain/page-publique";
  import type { AvisPublieSite } from "./utils";
  import BlocAvis from "./BlocAvis.svelte";
  import BlocCarte from "./BlocCarte.svelte";
  import BlocCta from "./BlocCta.svelte";
  import BlocDescription from "./BlocDescription.svelte";
  import BlocEquipements from "./BlocEquipements.svelte";
  import BlocGalerie from "./BlocGalerie.svelte";
  import BlocHero from "./BlocHero.svelte";

  let {
    bloc,
    avisPublies = [],
  }: { bloc: BlocSite; avisPublies?: readonly AvisPublieSite[] } = $props();
</script>

{#if bloc.type === "hero"}
  <BlocHero contenu={bloc.contenu} />
{:else if bloc.type === "galerie"}
  <BlocGalerie contenu={bloc.contenu} />
{:else if bloc.type === "description"}
  <BlocDescription contenu={bloc.contenu} />
{:else if bloc.type === "equipements"}
  <BlocEquipements contenu={bloc.contenu} />
{:else if bloc.type === "carte"}
  <BlocCarte contenu={bloc.contenu} />
{:else if bloc.type === "avis"}
  <BlocAvis contenu={bloc.contenu} {avisPublies} />
{:else if bloc.type === "cta"}
  <BlocCta contenu={bloc.contenu} />
{/if}
