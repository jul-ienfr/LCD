<script lang="ts">
  import { texte } from "./utils";

  let { contenu }: { contenu: Record<string, unknown> } = $props();
  const titre = $derived(texte(contenu, "titre"));
  const corps = $derived(texte(contenu, "texte", texte(contenu, "description")));
  const paragraphes = $derived(
    corps
      .split(/\n{2,}/)
      .map((paragraphe) => paragraphe.trim())
      .filter(Boolean),
  );
</script>

<section class="mx-auto max-w-3xl space-y-4 px-6 py-12">
  {#if titre}<h2 class="text-2xl font-semibold tracking-tight">{titre}</h2>{/if}
  <div class="space-y-3 text-base leading-relaxed opacity-90">
    {#each paragraphes as paragraphe}<p>{paragraphe}</p>{/each}
  </div>
</section>
