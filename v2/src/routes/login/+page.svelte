<script lang="ts">
  import type { ActionData, PageData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head>
  <title>Connexion — {data.apparence.identite.nom}</title>
</svelte:head>

<main lang={data.langue} class="relative mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-8 overflow-hidden px-6 py-12">
  <div class="ui-orb -right-24 top-10 size-64" aria-hidden="true"></div>
  <header class="relative space-y-3">
    <a class="inline-flex items-center gap-2.5 font-semibold tracking-tight" href="/">
      <span class="grid size-9 place-items-center rounded-xl bg-accent text-base font-black text-sur-accent">
        {data.apparence.identite.nom.slice(0, 1)}
      </span>
      <span>{data.apparence.identite.nom}</span>
    </a>
    <p class="ui-surtitre">{data.t.espacePro}</p>
    <h1 class="text-3xl font-semibold tracking-tight">{data.t.bonRetour}</h1>
    <p class="text-encre-douce">{data.t.intro}</p>
    <nav aria-label="Langue" class="flex flex-wrap gap-2 text-xs">
      {#each data.langues as langue (langue)}
        <a
          class:font-bold={langue === data.langue}
          class="ui-lien uppercase"
          href={`?lang=${langue}`}
          hreflang={langue}
        >{langue}</a>
      {/each}
    </nav>
  </header>

  {#if data.succes}<p class="ui-alerte ui-alerte--ok" role="status">{data.succes}</p>{/if}
  {#if data.erreur}<p class="ui-alerte ui-alerte--danger" role="alert">{data.erreur}</p>{/if}
  {#if form?.message}<p class="ui-alerte ui-alerte--danger" role="alert">{form.message}</p>{/if}

  <form class="ui-carte space-y-4" method="POST">
    <label class="ui-champ-groupe">
      <span class="ui-label">{data.t.email}</span>
      <input class="ui-champ" name="email" type="email" autocomplete="username" defaultValue={form?.email ?? ""} required />
    </label>
    <label class="ui-champ-groupe">
      <span class="ui-label">{data.t.motDePasse}</span>
      <input class="ui-champ" name="password" type="password" autocomplete="current-password" minlength="12" required />
    </label>
    {#if data.captcha}
      <div class="ui-champ-groupe rounded-xl border border-bordure bg-surface-2 p-3">
        <p class="ui-label">{data.t.captchaTitre}</p>
        <p class="text-sm text-encre-douce">{data.captcha.question}</p>
        <input type="hidden" name="captchaToken" value={data.captcha.token} />
        <label class="mt-2 block">
          <span class="ui-label">{data.t.captchaResultat}</span>
          <input
            class="ui-champ"
            name="captchaReponse"
            type="text"
            inputmode="numeric"
            pattern="[0-9]+"
            autocomplete="off"
            required
          />
        </label>
      </div>
    {/if}
    <button class="ui-bouton ui-bouton--primaire w-full" type="submit">{data.t.seConnecter}</button>
    <a class="block text-center text-sm ui-lien" href="/mot-de-passe-oublie">{data.t.oublie}</a>
  </form>

  <p class="text-center text-xs text-encre-faine">{data.t.footer}</p>
</main>
