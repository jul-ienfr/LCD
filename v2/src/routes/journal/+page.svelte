<script lang="ts">
  import NavSuperAdmin from "@/lib/components/nav-super-admin.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>Journal global — Supervision</title>
</svelte:head>

<main class="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-12">
  <NavSuperAdmin actif="/journal" />

  <header class="space-y-2">
    <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">
      Plateforme
    </p>
    <h1 class="text-3xl font-semibold tracking-tight">Journal global</h1>
    <p class="text-encre-douce">
      200 dernières actions, tous espaces confondus. Lecture seule sur la
      connexion owner ; les payloads restent repliés et jamais interprétés comme
      du HTML.
    </p>
  </header>

  {#if data.indisponible}
    <p class="ui-alerte ui-alerte--alerte">
      Connexion owner absente : journal cross-tenant indisponible.
    </p>
  {:else}
    <form class="ui-carte flex flex-wrap items-end gap-3 p-4" method="get">
      <label class="space-y-2 text-sm">
        <span class="ui-label">Espace</span>
        <select class="ui-champ" name="tenant">
          <option value="" selected={!data.filtres.tenant}>Tous</option>
          {#each data.tenants as tenant (tenant.id)}
            <option value={tenant.id} selected={tenant.id === data.filtres.tenant}>{tenant.nom} ({tenant.slug})</option>
          {/each}
        </select>
      </label>
      <label class="min-w-56 flex-1 space-y-2 text-sm">
        <span class="ui-label">Action contient</span>
        <input
          class="ui-champ"
          maxlength="80"
          name="action"
          placeholder="reservation, facture, auth…"
          defaultValue={data.filtres.action}
        />
      </label>
      <button class="ui-bouton ui-bouton--primaire" type="submit">Filtrer</button>
    </form>

    <p class="text-sm text-encre-douce">{data.entrees.length} entrée(s) affichée(s).</p>

    <div class="overflow-x-auto rounded-2xl border border-bordure bg-surface">
      <table class="ui-tableau min-w-[900px]">
        <thead>
          <tr>
            <th>Date (UTC)</th>
            <th>Espace</th>
            <th>Auteur</th>
            <th>Action</th>
            <th>Cible / réf.</th>
            <th>Payload</th>
          </tr>
        </thead>
        <tbody>
          {#each data.entrees as entree (entree.id)}
            <tr class="align-top">
              <td class="whitespace-nowrap tabular-nums">{entree.date}</td>
              <td>
                {entree.espace}<br />
                <span class="text-xs text-encre-faine">{entree.slug}</span>
              </td>
              <td>{entree.qui}</td>
              <td class="font-mono text-xs">{entree.action}</td>
              <td class="text-xs">
                {entree.cible ?? "—"}{entree.ref ? ` · ${entree.ref}` : ""}
              </td>
              <td class="text-xs">
                {#if entree.payloadVide}
                  —
                {:else}
                  <details>
                    <summary class="cursor-pointer text-encre-douce">Voir</summary>
                    <pre class="mt-2 max-w-md overflow-x-auto whitespace-pre-wrap break-all rounded-lg bg-fond p-2">{entree.payloadTexte}</pre>
                  </details>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</main>
