<script lang="ts">
  import type { ActionData, PageData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head>
  <title>Double authentification — {data.apparence.identite.nom}</title>
</svelte:head>

<main class="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-8 px-6 py-12">
  <header class="space-y-2">
    <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">Sécurité</p>
    <h1 class="text-3xl font-semibold tracking-tight">Double authentification</h1>
    <p class="text-encre-douce">Saisissez le code à 6 chiffres de votre application d’authentification.</p>
  </header>

  {#if form?.message}<p class="ui-alerte ui-alerte--danger" role="alert">{form.message}</p>{/if}

  <form method="POST" class="ui-carte space-y-4">
    <label class="ui-champ-groupe">
      <span class="ui-label">Code</span>
      <input class="ui-champ text-center font-mono text-2xl tracking-[0.4em]" name="code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]&#123;6&#125;" maxlength="6" required />
    </label>
    <button class="ui-bouton ui-bouton--primaire w-full" type="submit">Vérifier</button>
    <a class="block text-center text-sm ui-lien" href="/login">← Retour à la connexion</a>
  </form>
</main>
