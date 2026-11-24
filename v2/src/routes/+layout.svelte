<script lang="ts">
  import "@fontsource-variable/fraunces";
  import "@fontsource-variable/inter";
  import "../app.css";
  import type { Snippet } from "svelte";
  import { onMount, tick } from "svelte";
  import { page } from "$app/state";
  import {
    appliquerValeursSaisie,
    installerVerrouSoumissions,
  } from "@/lib/client/soumissions";
  import {
    creerFileNotifications,
    ordonnerNotifications,
    resultatDepuisUrl,
    signatureResultat,
    type NotificationAction,
    type ResultatAction,
  } from "@/lib/client/notifications";
  import { styleTheme, themeResolu } from "@/lib/apparence";
  import { traductionsPubliques } from "@/lib/i18n-public";
  import type { LayoutData } from "./$types";

  let { data, children }: { data: LayoutData; children: Snippet } = $props();

  const theme = $derived(themeResolu(data.apparence));
  // FR-043 : le mode et la densité choisis par la personne sont appliqués au
  // rendu serveur ; « système » conserve la préférence de l'appareil.
  const css = $derived(
    styleTheme(theme, {
      mode: data.preferences.mode,
      densite: data.preferences.densite,
    }),
  );
  const notificationsActives = $derived(data.preferences.notifications);
  const retour = $derived(page.url.pathname + page.url.search);
  const pageAuth = $derived(
    ["/login", "/logout", "/mot-de-passe-oublie", "/reinitialiser-mot-de-passe", "/two-factor"].some(
      (prefixe) => page.url.pathname.startsWith(prefixe),
    ),
  );
  const t = $derived(traductionsPubliques(data.langue));
  const doublon = $derived(page.url.searchParams.get("doublon") === "1");

  // FR-042 : chaque résultat d'action (échec en priorité) double son message
  // contextuel d'une notification in-app, visible sans remonter la page.
  const file = creerFileNotifications({ limite: 3, dureeSuccesMs: 5_000 });
  let notifications = $state<NotificationAction[]>([]);
  const notificationsAffichees = $derived(ordonnerNotifications(notifications));

  function libelleResultat(resultat: ResultatAction): string {
    if (resultat === "succes") return t.notifSucces;
    if (resultat === "doublon") return t.doublon;
    return t.notifEchec;
  }

  function rafraichirNotifications(): void {
    file.expirer();
    notifications = [...file.liste()];
  }

  function fermerNotification(id: number): void {
    file.retirer(id);
    notifications = [...file.liste()];
  }

  $effect(() => {
    if (!notificationsActives) return;
    const chemin = page.url.pathname + page.url.search;
    const resultatForm = page.form as { erreur?: string; message?: string } | null;
    const detail = resultatForm?.erreur ?? resultatForm?.message ?? "";
    const resultat = detail
      ? ("echec" as const)
      : resultatDepuisUrl(page.url.searchParams);
    if (!resultat) return;
    const ajoutee = file.ajouter({
      ton: resultat === "succes" ? "succes" : "echec",
      texte: libelleResultat(resultat),
      signature: signatureResultat(chemin, resultat, detail),
    });
    if (!ajoutee) return;
    rafraichirNotifications();
    setTimeout(rafraichirNotifications, 5_000);
  });

  // FR-040 : verrou côté navigateur des formulaires POST (état d'attente,
  // second clic refusé). Le serveur écarte le doublon même sans JavaScript.
  onMount(() => installerVerrouSoumissions());

  // FR-041 : après un refus de validation (`fail`), les valeurs saisies sont
  // replacées dans les champs de même nom, sans lier chaque page.
  $effect(() => {
    const resultat = page.form as { valeurs?: Record<string, unknown> } | null;
    const valeurs = resultat?.valeurs;
    if (!valeurs) return;
    void tick().then(() => appliquerValeursSaisie(valeurs));
  });
</script>

<svelte:head>
  {@html `<style>${css}</style>`}
  <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
  <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
  {#if data.preferences.mode === "systeme"}
    <meta name="theme-color" content={theme.clair.accent} media="(prefers-color-scheme: light)" />
    <meta name="theme-color" content={theme.sombre.accent} media="(prefers-color-scheme: dark)" />
  {:else}
    <meta
      name="theme-color"
      content={data.preferences.mode === "sombre" ? theme.sombre.accent : theme.clair.accent}
    />
  {/if}
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

{#if doublon}
  <div class="doublon-bandeau" role="status" data-doublon>
    {t.doublon}
  </div>
{/if}

<section
  class="notifications"
  aria-label={t.notifRegion}
  aria-live="polite"
  data-notifications
>
  {#if notificationsActives}
    {#each notificationsAffichees as notification (notification.id)}
    <div
      class="ui-alerte notification"
      class:ui-alerte--danger={notification.ton === "echec"}
      class:ui-alerte--ok={notification.ton === "succes"}
      role={notification.ton === "echec" ? "alert" : "status"}
      data-ton={notification.ton}
    >
      <p>{notification.texte}</p>
      <button
        type="button"
        class="notification-fermer"
        aria-label={t.notifFermer}
        onclick={() => fermerNotification(notification.id)}
      >
        <span aria-hidden="true">×</span>
      </button>
    </div>
    {/each}
  {/if}
</section>

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
  data-mode={data.preferences.mode}
  data-densite={data.preferences.densite}
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
