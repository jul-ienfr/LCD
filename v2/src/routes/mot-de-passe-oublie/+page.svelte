<script lang="ts">
  import type { ActionData, PageData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head>
  <title>Mot de passe oublié — {data.apparence.identite.nom}</title>
</svelte:head>

<main class="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-8 px-6 py-12">
  <header class="space-y-2">
    <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">Compte</p>
    <h1 class="text-3xl font-semibold tracking-tight">Mot de passe oublié</h1>
    <p class="text-encre-douce">Saisissez l’adresse de votre compte : nous vous enverrons un lien de réinitialisation valable une heure.</p>
  </header>

  {#if form?.message}
    <p class:ui-alerte--danger={!form.ok} class:ui-alerte--succes={form.ok} class="ui-alerte" role="status">{form.message}</p>
  {/if}

  <form method="POST" class="ui-carte space-y-4">
    <label class="ui-champ-groupe"><span class="ui-label">E-mail</span><input class="ui-champ" type="email" name="email" autocomplete="username" required /></label>
    <button class="ui-bouton ui-bouton--primaire w-full" type="submit">Envoyer le lien</button>
    <a class="block text-center text-sm ui-lien" href="/login">← Retour à la connexion</a>
  </form>
</main>
