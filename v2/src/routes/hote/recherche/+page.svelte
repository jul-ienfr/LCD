<script lang="ts">
  import PageEntete from "@/lib/components/ui/page-entete.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>{data.t.titrePage}</title>
</svelte:head>

<main class="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12">
  <PageEntete
    surtitre={data.t.surtitre}
    titre={data.t.titre}
    description={data.t.description}
  />

  <form class="flex flex-wrap items-end gap-3" method="get">
    <label class="block min-w-64 flex-1 space-y-2 text-sm">
      <span class="ui-label">{data.t.label}</span>
      <input
        class="ui-champ"
        maxlength={data.max}
        minlength={data.min}
        name="q"
        placeholder={data.t.placeholder}
        required
        type="search"
        defaultValue={data.q}
      />
    </label>
    <button class="ui-bouton ui-bouton--primaire" type="submit">{data.t.rechercher}</button>
  </form>

  {#if data.q && !data.valide}
    <p class="ui-alerte ui-alerte--alerte">{data.t.minimum(data.min)}</p>
  {/if}

  {#if data.q && data.valide}
    <p class="text-sm text-encre-douce">{data.t.resultats(data.nombre, data.q)}</p>
  {/if}

  {#if data.q && data.valide && data.nombre === 0}
    <p class="rounded-2xl border border-bordure bg-surface p-6 text-sm text-encre-douce">
      {data.t.aucun}
    </p>
  {/if}

  {#each data.groupes as groupe (groupe.categorie)}
    <section class="ui-carte">
      <h2 class="text-lg font-semibold">{groupe.libelle}</h2>
      <ul class="mt-3 divide-y divide-bordure" role="list">
        {#each groupe.items as item (item.id)}
          <li class="py-3">
            <a class="font-medium underline" href={item.href}>{item.ref}</a>
            <span class="text-sm text-encre-douce">
              {item.titre}{item.detail ? ` · ${item.detail}` : ""}{item.date ? ` · ${item.date}` : ""}
            </span>
          </li>
        {/each}
      </ul>
    </section>
  {/each}

  <div class="flex flex-wrap gap-4 text-sm">
    <a class="ui-lien" href="/hote">{data.t.retour}</a>
    <a class="ui-lien" href="/hote/audit">{data.t.audit}</a>
  </div>
</main>
