<script lang="ts">
  import { objet, tableau, texte, texteDe } from "./utils";

  let { contenu }: { contenu: Record<string, unknown> } = $props();
  const images = $derived(
    tableau(contenu, "images")
      .map((image) => {
        if (typeof image === "string") return { url: image, alt: "" };
        const record = objet(image);
        return record
          ? { url: texteDe(record, "url"), alt: texteDe(record, "alt") }
          : null;
      })
      .filter(
        (image): image is { url: string; alt: string } =>
          image !== null && image.url.length > 0,
      ),
  );
</script>

{#if images.length > 0}
  <section class="mx-auto max-w-6xl px-6 py-12">
    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {#each images as image, index (image.url)}
        <img
          class="h-64 w-full rounded-2xl object-cover"
          src={image.url}
          alt={image.alt || `Photo ${index + 1}`}
          loading="lazy"
        />
      {/each}
    </div>
  </section>
{/if}
