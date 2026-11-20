<script lang="ts">
  import NavSuperAdmin from "@/lib/components/nav-super-admin.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>Journaux applicatifs — Supervision</title>
</svelte:head>

<main id="contenu" class="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-12">
  <NavSuperAdmin actif="journaux" />

  <header class="space-y-2">
    <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">
      Plateforme
    </p>
    <h1 class="text-3xl font-semibold tracking-tight">Journaux applicatifs</h1>
    <p class="text-encre-douce">
      Les 200 dernières lignes du journal applicatif, lues depuis la base —
      sans SSH. Le contexte est masqué (clés sensibles remplacées) et la
      rétention est bornée à 30 jours.
    </p>
  </header>

  {#if data.indisponible}
    <p class="ui-alerte ui-alerte--alerte">
      Journaux indisponibles : la table est absente ou la base est
      injoignable. Vérifiez que les migrations sont appliquées (0109).
    </p>
  {:else}
    <form class="ui-carte flex flex-wrap items-end gap-3 p-4" method="get">
      <label class="space-y-2 text-sm">
        <span class="ui-label">Niveau</span>
        <select class="ui-champ" name="niveau">
          <option value="" selected={!data.filtres.niveau}>Tous</option>
          <option value="info" selected={data.filtres.niveau === "info"}>
            Info
          </option>
          <option value="error" selected={data.filtres.niveau === "error"}>
            Erreurs
          </option>
        </select>
      </label>
      <label class="min-w-56 flex-1 space-y-2 text-sm">
        <span class="ui-label">Message contient</span>
        <input
          class="ui-champ"
          maxlength="80"
          name="q"
          placeholder="sync, webhook, erreur.page…"
          defaultValue={data.filtres.q}
        />
      </label>
      <button class="ui-bouton ui-bouton--primaire" type="submit">
        Filtrer
      </button>
    </form>

    <p class="text-sm text-encre-douce">
      {data.entrees.length} ligne(s) affichée(s).
    </p>

    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <div
      role="region"
      tabindex="0"
      aria-label="Tableau défilant"
      class="overflow-x-auto rounded-2xl border border-bordure bg-surface"
    >
      <table class="ui-tableau min-w-[900px]">
        <thead>
          <tr>
            <th>Date (UTC)</th>
            <th>Niveau</th>
            <th>Message</th>
            <th>Contexte</th>
            <th>Requête</th>
          </tr>
        </thead>
        <tbody>
          {#each data.entrees as entree (entree.id)}
            <tr class="align-top">
              <td class="whitespace-nowrap tabular-nums">{entree.date}</td>
              <td>
                {#if entree.niveau === "error"}
                  <span class="ui-badge ui-badge--danger">erreur</span>
                {:else}
                  <span class="ui-badge">info</span>
                {/if}
              </td>
              <td class="font-mono text-xs">{entree.message}</td>
              <td class="text-xs">
                {#if entree.contexteVide}
                  —
                {:else}
                  <details>
                    <summary
                      class="flex min-h-11 min-w-11 cursor-pointer items-center text-encre-douce"
                    >
                      Voir
                    </summary>
                    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
                    <pre
                      role="region"
                      tabindex="0"
                      aria-label="Contexte"
                      class="mt-2 max-w-md overflow-x-auto whitespace-pre-wrap break-all rounded-lg bg-fond p-2">{entree.contexteTexte}</pre>
                  </details>
                {/if}
              </td>
              <td class="font-mono text-xs text-encre-faine">
                {entree.requestId ?? "—"}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</main>
