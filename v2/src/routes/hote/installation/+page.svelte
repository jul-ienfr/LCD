<script lang="ts">
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>Installer l'application — LCD Parc</title>
  <script src="/pwa.js" defer></script>
</svelte:head>

<main id="contenu" class="mx-auto max-w-2xl space-y-8 px-6 py-12">
  <header class="space-y-2">
    <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">
      Application
    </p>
    <h1 class="text-3xl font-semibold tracking-tight">
      Installer LCD Parc
    </h1>
    <p class="text-encre-douce">
      LCD Parc fonctionne comme une application : accès direct depuis l'écran
      d'accueil, ouverture plein écran et pages déjà consultées disponibles hors
      ligne. L'installation dépend du navigateur ; aucune donnée sensible n'est
      mise en cache.
    </p>
  </header>

  <section class="ui-carte space-y-4">
    <h2 class="text-lg font-semibold">Installer sur cet appareil</h2>
    <p class="text-sm text-encre-douce">
      Sur ordinateur, utilisez l'icône d'installation dans la barre d'adresse.
      Sur iPhone/iPad, touchez « Partager » puis « Sur l'écran d'accueil ».
      Sur Android, ouvrez le menu du navigateur puis « Installer l'application ».
    </p>
    <button
      class="ui-bouton ui-bouton--primaire"
      type="button"
      data-pwa-installer
      hidden
    >
      Installer l'application
    </button>
  </section>

  <section class="ui-carte space-y-4">
    <h2 class="text-lg font-semibold">Notifications</h2>
    <p class="text-sm text-encre-douce">
      Les notifications signalent les nouveaux messages et les actions à
      valider. Elles ne sont proposées que si votre navigateur les prend en
      charge ; vous pouvez les refuser sans perdre aucune fonctionnalité.
    </p>
    <button
      class="ui-bouton ui-bouton--secondaire"
      type="button"
      data-pwa-notifications
    >
      Activer les notifications
    </button>
  </section>

  <p class="text-sm text-encre-douce" data-pwa-statut role="status">
    Statut : en attente de vérification du navigateur.
  </p>

  <p class="text-xs text-encre-faine">
    Connecté en tant que {data.email}. Les pages staff, l'API et les espaces
    sécurisés ne sont jamais mis en cache par le service worker.
  </p>

  <a class="ui-lien-action text-sm" href="/hote">← Retour au tableau de bord</a>
</main>
