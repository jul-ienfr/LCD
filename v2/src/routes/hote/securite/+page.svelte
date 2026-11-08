<script lang="ts">
  import type { ActionData, PageData } from "./$types";
  import { traductionsSecurite } from "@/lib/i18n-securite";

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const t = $derived(traductionsSecurite(data.langue));
</script>

<svelte:head>
  <title>{t.titrePage}</title>
</svelte:head>

<main class="mx-auto max-w-2xl space-y-8 px-6 py-12">
  <header class="space-y-2">
    <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">{t.compte}</p>
    <h1 class="text-3xl font-semibold tracking-tight">{t.securite}</h1>
    <p class="text-encre-douce">{t.compte} : <span class="font-medium">{data.email}</span></p>
  </header>

  {#if data.exigenceDeuxFacteurs}
    <p class="ui-alerte ui-alerte--danger" role="alert">{t.exigence}</p>
  {/if}
  {#if form?.message}<p class:ui-alerte--danger={!form.ok} class:ui-alerte--succes={form.ok} class="ui-alerte" role="status">{form.message}</p>{/if}
  {#if data.motdepasse === "ok"}<p class="ui-alerte ui-alerte--succes">{t.motDePasseChange}</p>{/if}

  <section class="ui-carte space-y-4">
    <div>
      <h2 class="text-lg font-semibold">{t.deuxFacteurs}</h2>
      <p class="mt-1 text-sm text-encre-douce">{t.totp}</p>
    </div>
    {#if data.deuxfacteurs === "actif"}
      <p class="ui-alerte ui-alerte--succes" role="status">{t.active2fa}</p>
    {/if}
    {#if form?.ok && form.message === "2FA désactivée."}
      <p class="ui-alerte ui-alerte--succes" role="status">{form.message}</p>
    {/if}

    {#if form?.etape === "verifier" && form.qr}
      <div class="space-y-4">
        <img src={form.qr} alt={t.qrAlt} width="240" height="240" class="rounded-controle border border-bordure bg-white p-2" />
        <code class="block break-all font-mono text-xs text-encre-douce">{form.totpURI}</code>
        {#if form.backupCodes}
          <div class="rounded-controle border border-alerte bg-alerte-douce p-3 text-xs text-alerte">
            <p class="font-semibold">{t.codesSecours}</p>
            <ul class="mt-1 grid grid-cols-2 gap-1 font-mono">
              {#each form.backupCodes as code (code)}<li>{code}</li>{/each}
            </ul>
          </div>
        {/if}
        <form method="POST" action="?/verifier2fa" class="flex flex-wrap items-end gap-3">
          <label class="ui-champ-groupe"><span class="ui-label">{t.code6}</span><input class="ui-champ font-mono" name="code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]&#123;6&#125;" maxlength="6" required /></label>
          <button class="ui-bouton ui-bouton--primaire" type="submit">{t.verifierActiver}</button>
        </form>
      </div>
    {:else if data.twoFactorEnabled}
      <p class="ui-alerte ui-alerte--succes">{t.deuxFaActive}</p>
      <form method="POST" action="?/desactiver2fa" class="flex flex-wrap items-end gap-3">
        <label class="ui-champ-groupe"><span class="ui-label">{t.mdpDesactiver}</span><input class="ui-champ" type="password" name="password" autocomplete="current-password" required /></label>
        <button class="ui-bouton ui-bouton--danger" type="submit">{t.desactiver}</button>
      </form>
    {:else}
      <form method="POST" action="?/activer2fa" class="space-y-3">
        <label class="ui-champ-groupe"><span class="ui-label">{t.mdpActiver}</span><input class="ui-champ" type="password" name="password" autocomplete="current-password" required /></label>
        <button class="ui-bouton ui-bouton--primaire" type="submit">{t.activer}</button>
      </form>
    {/if}
  </section>

  <section class="ui-carte space-y-4">
    <div>
      <h2 class="text-lg font-semibold">{t.sessionsActives}</h2>
      <p class="mt-1 text-sm text-encre-douce">{t.sessionsOuvertes(data.totalSessions)}</p>
    </div>
    {#if data.sessionsEtat === "ok"}<p class="ui-alerte ui-alerte--succes">{t.sessionsFermees}</p>{/if}
    {#if data.sessionsEtat === "erreur"}<p class="ui-alerte ui-alerte--danger">{t.sessionsEchec}</p>{/if}
    <ul class="divide-y divide-bordure rounded-controle border border-bordure">
      {#each data.sessions as element (element.id)}
        <li class="flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
          <div>
            <p class="font-medium">{element.navigateur}{#if element.actuelle}<span class="ml-2 ui-etiquette border-accent text-accent">{t.sessionCourante}</span>{/if}</p>
            <p class="text-xs text-encre-faine">{element.createdAt} · {element.ip}</p>
          </div>
          <p class="text-xs text-encre-douce">{t.expireLe(element.expiresAt)}</p>
        </li>
      {/each}
    </ul>
    <form method="POST" action="?/sessions">
      <button class="ui-bouton ui-bouton--danger" type="submit" disabled={data.autresSessions === 0}>{t.fermerAutres}</button>
    </form>
  </section>

  <section class="ui-carte space-y-4">
    <div>
      <h2 class="text-lg font-semibold">{t.motDePasse}</h2>
      <p class="mt-1 text-sm text-encre-douce">{t.motDePasseAide}</p>
    </div>
    <form method="POST" action="?/motdepasse" class="space-y-3">
      <label class="ui-champ-groupe"><span class="ui-label">{t.actuel}</span><input class="ui-champ" type="password" name="motDePasseActuel" autocomplete="current-password" required /></label>
      <label class="ui-champ-groupe"><span class="ui-label">{t.nouveau}</span><input class="ui-champ" type="password" name="nouveauMotDePasse" autocomplete="new-password" minlength="12" required /></label>
      <label class="ui-champ-groupe"><span class="ui-label">{t.confirmation}</span><input class="ui-champ" type="password" name="confirmation" autocomplete="new-password" minlength="12" required /></label>
      <button class="ui-bouton ui-bouton--primaire" type="submit">{t.modifier}</button>
    </form>
  </section>

  <a class="ui-lien text-sm" href={data.retour}>{t.retour}</a>
</main>
