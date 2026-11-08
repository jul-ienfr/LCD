<script lang="ts">
  import NavSuperAdmin from "@/lib/components/nav-super-admin.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>Voir comme — Supervision</title>
</svelte:head>

<main class="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12">
  <NavSuperAdmin actif="/supervision/voir-comme" />

  <header class="space-y-2">
    <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">
      Plateforme
    </p>
    <h1 class="text-3xl font-semibold tracking-tight">Voir comme</h1>
    <p class="text-encre-douce">
      Aperçu du pilotage staff avec un rôle réduit. Le cookie est signé, limité à
      2 h, lié à votre compte et n’ouvre aucune écriture : toutes les mutations
      sont refusées par le proxy et par les actions serveur.
    </p>
  </header>

  {#if data.erreur}
    <p class="ui-alerte ui-alerte--danger">
      {data.erreur === "role"
        ? "Rôle d’aperçu inconnu."
        : "Votre compte n’a pas d’e-mail exploitable."}
    </p>
  {/if}

  {#if data.apercu}
    <section class="ui-alerte ui-alerte--alerte">
      <p>
        Aperçu en cours : <strong>{data.apercu.libelle}</strong> ({data.apercu.email}),
        jusqu’à {data.apercu.expire}.
      </p>
      <form class="mt-4" method="POST" action="/preview/quitter">
        <button class="ui-bouton ui-bouton--secondaire" type="submit">
          Quitter l’aperçu
        </button>
      </form>
    </section>
  {:else}
    <form class="ui-carte space-y-4" method="POST" action="?/demarrer">
      <label class="block space-y-2">
        <span class="ui-label">Rôle à prévisualiser</span>
        <select class="ui-champ" name="role">
          {#each data.roles as role (role.id)}
            <option value={role.id} selected={role.id === "comptable"}>{role.libelle}</option>
          {/each}
        </select>
      </label>
      <p class="text-xs text-encre-faine">
        Les rôles externes (prestataire, propriétaire, commercial) ont leurs
        portails dédiés et ne sont pas prévisualisés ici.
      </p>
      <button class="ui-bouton ui-bouton--primaire" type="submit">
        Démarrer l’aperçu lecture seule
      </button>
    </form>
  {/if}

  <div class="flex flex-wrap gap-4 text-sm">
    <a class="ui-lien" href="/supervision">← Supervision</a>
    <a class="ui-lien" href="/journal?action=apercu">Journal des aperçus</a>
  </div>
</main>
