<script lang="ts">
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  const t = $derived(data.t);

  const libelles: Record<string, string> = {
    message: "Messages voyageurs",
    brouillon: "Brouillons à valider",
    reservation: "Réservations à confirmer",
    paiement: "Paiements en retard",
  };
</script>

<svelte:head>
  <title>Centre de notifications — LCD</title>
</svelte:head>

<main id="contenu" class="mx-auto max-w-4xl space-y-8 px-6 py-12">
  <header class="space-y-2">
    <h1 class="text-3xl font-semibold tracking-tight">Centre de notifications</h1>
    <p class="text-encre-douce">
      {data.total} élément(s) à traiter : messages non lus, brouillons à valider,
      réservations à confirmer et paiements en retard.
    </p>
    <a class="ui-lien-action text-sm" href="/hote/installation">
      Installer l'application et activer les notifications →
    </a>
  </header>

  <ul class="flex flex-wrap gap-2 text-sm">
    {#each Object.entries(data.parType) as [type, nombre] (type)}
      <li class="ui-etiquette-ui">{libelles[type] ?? type} : {nombre}</li>
    {/each}
  </ul>

  {#if data.notifications.length === 0}
    <p class="ui-carte border-dashed text-encre-douce">
      Rien à traiter pour le moment.
    </p>
  {:else}
    <ul class="space-y-3">
      {#each data.notifications as notification (notification.href + notification.libelle)}
        <li class="ui-carte flex flex-wrap items-start justify-between gap-3">
          <div class="space-y-1">
            <p class="font-semibold">{notification.libelle}</p>
            <p class="text-sm text-encre-douce">{notification.detail}</p>
          </div>
          <div class="flex flex-col items-end gap-1 text-sm">
            <span class="ui-etiquette-ui">{libelles[notification.type] ?? notification.type}</span>
            {#if notification.date}<span class="text-encre-faine">{notification.date.slice(0, 16).replace("T", " ")}</span>{/if}
            <a class="ui-lien-action" href={notification.href}>Traiter</a>
          </div>
        </li>
      {/each}
    </ul>
  {/if}

  <p class="text-sm">
    <a class="ui-lien-action" href="/hote/messages/fils">← {t.titre}</a>
  </p>
</main>
