<script lang="ts">
  import { objet, tableau, texte, texteDe } from "./utils";

  let { contenu }: { contenu: Record<string, unknown> } = $props();
  const titre = $derived(texte(contenu, "titre", "Ils ont séjourné ici"));
  const avis = $derived(
    tableau(contenu, "avis")
      .map((entree) => {
        const record = objet(entree);
        if (!record) return null;
        return {
          auteur: texteDe(record, "auteur", "Voyageur"),
          note: texteDe(record, "note"),
          texte: texteDe(record, "texte"),
        };
      })
      .filter(
        (entree): entree is { auteur: string; note: string; texte: string } =>
          entree !== null && entree.texte.length > 0,
      ),
  );
</script>

{#if avis.length > 0}
  <section class="mx-auto max-w-4xl px-6 py-12">
    <h2 class="text-2xl font-semibold tracking-tight">{titre}</h2>
    <div class="mt-4 grid gap-4 md:grid-cols-2">
      {#each avis as entree (entree.auteur + entree.texte)}
        <blockquote class="rounded-2xl border border-black/10 p-5">
          <p class="text-sm leading-relaxed">« {entree.texte} »</p>
          <footer class="mt-3 text-xs font-medium opacity-70">
            {entree.auteur}{entree.note ? ` · ${entree.note}/5` : ""}
          </footer>
        </blockquote>
      {/each}
    </div>
  </section>
{/if}
