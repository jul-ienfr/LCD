<script lang="ts">
  import NavSuperAdmin from "@/lib/components/nav-super-admin.svelte";
  import type { ActionData, PageData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();

  function actif(
    flags: Record<string, boolean> | null,
    cle: string,
  ): boolean {
    return flags?.[cle] === true;
  }
</script>

<svelte:head>
  <title>Modules par espace — Supervision</title>
</svelte:head>

<main id="contenu" class="mx-auto max-w-5xl space-y-8 px-6 py-10">
  <header class="space-y-4">
    <NavSuperAdmin actif="modules" />
    <div class="ui-entete space-y-2">
      <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">
        Plateforme
      </p>
      <h1 class="text-3xl font-semibold tracking-tight">
        Modules par espace
      </h1>
      <p class="text-encre-douce">
        Chaque module s’active ou se désactive par espace, sans redéploiement.
        L’effet est immédiat et tracé dans le journal d’audit.
      </p>
    </div>
  </header>

  {#if form?.erreur}
    <p class="ui-alerte ui-alerte--danger" role="alert">{form.erreur}</p>
  {:else if form?.ok}
    <p class="ui-alerte ui-alerte--succes" role="status">
      Modules enregistrés.
    </p>
  {/if}

  {#if data.espaces.length === 0}
    <p class="ui-carte text-sm text-encre-douce">
      Aucun espace. Créez d’abord un espace depuis la supervision.
    </p>
  {:else}
    {#each data.espaces as espace (espace.id)}
      <form method="POST" action="?/enregistrer" class="ui-carte space-y-4">
        <input type="hidden" name="tenantId" value={espace.id} />
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 class="text-lg font-semibold">{espace.nom}</h2>
            <p class="text-xs text-encre-faine">{espace.slug}</p>
          </div>
          <button class="ui-bouton" type="submit">Enregistrer</button>
        </div>
        <div class="grid gap-3 sm:grid-cols-2">
          {#each data.flags as flag (flag.cle)}
            <label
              class="flex items-start gap-3 rounded-carte border border-bordure p-3"
            >
              <input
                type="checkbox"
                name={`flag.${flag.cle}`}
                checked={actif(espace.flags, flag.cle)}
                class="mt-1"
              />
              <span>
                <span class="block font-medium">{flag.nom}</span>
                <span class="block text-xs text-encre-douce">{flag.detail}</span>
              </span>
            </label>
          {/each}
        </div>
        {#if espace.flags === null}
          <p class="text-xs text-encre-faine">
            Aucun flag posé pour cet espace : les cases reflètent l’état
            « tout désactivé » tant que vous n’enregistrez pas.
          </p>
        {/if}
      </form>
    {/each}
  {/if}
</main>
