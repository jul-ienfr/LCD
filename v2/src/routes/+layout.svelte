<script lang="ts">
  import "@fontsource-variable/fraunces";
  import "@fontsource-variable/inter";
  import "../app.css";
  import type { Snippet } from "svelte";
  import { page } from "$app/state";
  import { styleTheme, themeResolu } from "@/lib/apparence";
  import type { LayoutData } from "./$types";

  let { data, children }: { data: LayoutData; children: Snippet } = $props();

  const theme = $derived(themeResolu(data.apparence));
  const css = $derived(styleTheme(theme));
  const retour = $derived(page.url.pathname + page.url.search);
</script>

<svelte:head>
  {@html `<style>${css}</style>`}
  <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
  <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
  <meta name="theme-color" content={theme.clair.accent} media="(prefers-color-scheme: light)" />
  <meta name="theme-color" content={theme.sombre.accent} media="(prefers-color-scheme: dark)" />
</svelte:head>

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

  {#if !data.utilisateur && !data.cookiesOk}
    <section class="cookies-bandeau" aria-label="Information sur les cookies">
      <p>
        Ce site n’utilise que des cookies essentiels (session, sécurité,
        préférences d’affichage). Aucun traceur publicitaire ni mesure d’audience.
      </p>
      <div class="flex flex-wrap items-center gap-4">
        <a class="ui-lien text-sm" href="/legales">En savoir plus</a>
        <a
          class="ui-bouton ui-bouton--secondaire ui-bouton--petit"
          href={`/api/cookies?retour=${encodeURIComponent(retour)}`}
        >
          J’ai compris
        </a>
      </div>
    </section>
  {/if}
</div>
