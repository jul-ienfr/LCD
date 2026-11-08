<script lang="ts">
  import type { ActionData, PageData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head>
  <title>Nouveau mot de passe — {data.apparence.identite.nom}</title>
</svelte:head>

<main class="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-8 px-6 py-12">
  <header class="space-y-2">
    <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">Compte</p>
    <h1 class="text-3xl font-semibold tracking-tight">Nouveau mot de passe</h1>
    <p class="text-encre-douce">Choisissez un mot de passe de 12 caractères minimum. Toutes les sessions seront fermées.</p>
  </header>

  {#if form?.message}<p class="ui-alerte ui-alerte--danger" role="alert">{form.message}</p>{/if}

  {#if !data.token}
    <p class="ui-alerte ui-alerte--alerte">Ce lien est incomplet. Demandez un nouvel e-mail de réinitialisation.</p>
    <a class="ui-bouton ui-bouton--primaire w-full" href="/mot-de-passe-oublie">Demander un lien</a>
  {:else}
    <form method="POST" class="ui-carte space-y-4">
      <input type="hidden" name="token" value={data.token} />
      <label class="ui-champ-groupe"><span class="ui-label">Nouveau mot de passe</span><input class="ui-champ" type="password" name="password" autocomplete="new-password" minlength="12" required /></label>
      <label class="ui-champ-groupe"><span class="ui-label">Confirmation</span><input class="ui-champ" type="password" name="confirmation" autocomplete="new-password" minlength="12" required /></label>
      <button class="ui-bouton ui-bouton--primaire w-full" type="submit">Changer le mot de passe</button>
    </form>
  {/if}
</main>
