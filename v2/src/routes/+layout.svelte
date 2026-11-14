<script lang="ts">
  import "@fontsource-variable/fraunces";
  import "@fontsource-variable/inter";
  import "../app.css";
  import type { Snippet } from "svelte";
  import { page } from "$app/state";
  import { styleTheme, themeResolu } from "@/lib/apparence";
  import { traductionsPubliques } from "@/lib/i18n-public";
  import type { LayoutData } from "./$types";

  let { data, children }: { data: LayoutData; children: Snippet } = $props();

  const theme = $derived(themeResolu(data.apparence));
  const css = $derived(styleTheme(theme));
  const retour = $derived(page.url.pathname + page.url.search);
  const pageAuth = $derived(
    ["/login", "/logout", "/mot-de-passe-oublie", "/reinitialiser-mot-de-passe", "/two-factor"].some(
      (prefixe) => page.url.pathname.startsWith(prefixe),
    ),
  );
  const t = $derived(traductionsPubliques(data.langue));
</script>

<svelte:head>
  {@html `<style>${css}</style>`}
  <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
  <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
  <meta name="theme-color" content={theme.clair.accent} media="(prefers-color-scheme: light)" />
  <meta name="theme-color" content={theme.sombre.accent} media="(prefers-color-scheme: dark)" />
  {#if data.suivi}
    {#each data.suivi.scriptsMesure as script}
      {@html script}
    {/each}
    {#each data.suivi.scriptsPublicite as script}
      {@html script}
    {/each}
    {#each data.suivi.scriptsClient as script}
      {@html script}
    {/each}
  {/if}
</svelte:head>

<a class="lien-evitement" href="#contenu">{t.allerAuContenu}</a>

{#if data.apercu}
  <div class="apercu-bandeau" role="status">
    <span>Aperçu du brouillon — visible uniquement par vous.</span>
    <form method="POST" action="/apercu/fin">
      <button class="ui-bouton ui-bouton--fantome ui-bouton--petit" type="submit">
        Quitter l’aperçu
      </button>
    </form>
  </div>
{/if}

{#if data.lite}
  <div class="mode-lite-bandeau" role="status">
    <span>Version légère active.</span>
    <a class="ui-lien text-sm" href={`/api/lite?on=0&retour=${encodeURIComponent(retour)}`}>
      Revenir à la version complète
    </a>
  </div>
{/if}

<div
  class="apparence"
  class:mode-lite={data.lite}
  data-nav={theme.variantes.nav}
  data-entete={theme.variantes.entete}
>
  {@render children()}

  {#if data.suivi?.actif && !data.utilisateur && !data.cookiesOk && !pageAuth}
    <section class="cookies-bandeau" aria-label="Choix de suivi">
      <p>
        Nous utilisons des cookies essentiels et, avec votre accord, des outils
        de mesure d’audience et de publicité pour comprendre les visites et
        améliorer nos offres. Vous pouvez refuser sans perdre l’accès au site.
      </p>
      <div class="flex flex-wrap items-center gap-4">
        <a
          class="ui-lien inline-flex min-h-11 min-w-11 items-center justify-center text-sm"
          href="/consentement">Personnaliser</a
        >
        <form method="POST" action="/consentement?/refus">
          <input type="hidden" name="retour" value={retour} />
          <button class="ui-bouton ui-bouton--secondaire ui-bouton--petit" type="submit">
            Refuser
          </button>
        </form>
        <form method="POST" action="/consentement?/tout">
          <input type="hidden" name="retour" value={retour} />
          <button class="ui-bouton ui-bouton--petit" type="submit">
            Tout accepter
          </button>
        </form>
      </div>
    </section>
  {/if}
</div>
