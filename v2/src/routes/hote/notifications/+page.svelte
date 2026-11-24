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

  <div class="flex flex-wrap gap-2 text-sm" role="group" aria-label="Filtrer les notifications">
    <a
      class="ui-etiquette-ui"
      class:ui-etiquette-ui--accent={!data.typeFiltre}
      href="/hote/notifications"
      aria-current={!data.typeFiltre ? "page" : undefined}
    >Tous : {data.totalGlobal}</a>
    {#each Object.entries(data.parType) as [type, nombre] (type)}
      <a
        class="ui-etiquette-ui"
        class:ui-etiquette-ui--accent={data.typeFiltre === type}
        href="/hote/notifications?type={type}"
        aria-current={data.typeFiltre === type ? "page" : undefined}
      >{libelles[type] ?? type} : {nombre}</a>
    {/each}
  </div>

  {#if data.notifications.length === 0}
    <p class="ui-carte border-dashed text-encre-douce">
      Rien à traiter pour le moment.
    </p>
  {:else}
    <ul class="space-y-3">
      {#each data.notifications as notification, index (notification.href + notification.libelle + index)}
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

  {#if data.pages > 1}
    <nav aria-label="Pagination du centre de notifications" class="flex flex-wrap items-center gap-3 text-sm">
      {#if data.lienPrecedent}
        <a class="ui-bouton ui-bouton--secondaire ui-bouton--petit" href={data.lienPrecedent} rel="prev">← Précédent</a>
      {/if}
      <span class="text-encre-faine">
        Page {data.pageCourante} sur {data.pages} · {data.total} élément(s)
      </span>
      {#if data.lienSuivant}
        <a class="ui-bouton ui-bouton--secondaire ui-bouton--petit" href={data.lienSuivant} rel="next">Suivant →</a>
      {/if}
    </nav>
  {/if}

  <p class="text-sm">
    <a class="ui-lien-action" href="/hote/messages/fils">← {t.titre}</a>
  </p>
</main>
