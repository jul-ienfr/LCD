<script lang="ts">
  import type { ActionData, PageData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const libelles: Record<string, string> = {
    ouvert: "Réouvrir",
    en_cours: "Prendre en charge",
    resolu: "Marquer résolu",
    ferme: "Fermer",
  };
</script>

<svelte:head>
  <title>{data.ticket.sujet} — Support</title>
</svelte:head>

<main class="mx-auto max-w-3xl space-y-8 px-6 py-12">
  <header class="flex flex-wrap items-end justify-between gap-4">
    <div class="space-y-2">
      <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">Ticket {data.ticket.ref}</p>
      <h1 class="text-3xl font-semibold tracking-tight">{data.ticket.sujet}</h1>
      <p class="text-encre-douce">{data.ticket.statut} · priorité {data.ticket.priorite} · {data.ticket.date}</p>
    </div>
    <a class="ui-lien text-sm" href="/support">← Support</a>
  </header>

  {#if form?.message}
    <p class:ui-alerte--danger={!form.ok} class:ui-alerte--succes={form.ok} class="ui-alerte" role="status">{form.message}</p>
  {/if}

  {#if data.estStaff && data.transitions.length > 0}
    <div class="flex flex-wrap gap-2">
      {#each data.transitions as statut (statut)}
        <form method="POST" action="?/statut">
          <input type="hidden" name="ticketId" value={data.ticket.id} />
          <input type="hidden" name="statut" value={statut} />
          <button class="ui-bouton ui-bouton--secondaire ui-bouton--petit" type="submit">{libelles[statut] ?? statut}</button>
        </form>
      {/each}
    </div>
  {/if}

  <section class="space-y-3">
    {#each data.messages as message (message.id)}
      <article class="ui-carte">
        <header class="flex flex-wrap items-center justify-between gap-2 text-sm">
          <p class="font-medium">{message.auteur}</p>
          <p class="text-encre-faine">{message.date}</p>
        </header>
        <p class="mt-2 whitespace-pre-line text-encre-douce">{message.contenu}</p>
      </article>
    {/each}
  </section>

  <section class="ui-carte">
    <h2 class="text-lg font-semibold">Répondre</h2>
    <form method="POST" action="?/repondre" class="mt-4 space-y-3">
      <input type="hidden" name="ticketId" value={data.ticket.id} />
      <label class="ui-champ-groupe"><span class="ui-label">Message</span><textarea class="ui-champ" name="message" rows="5" maxlength="5000" required></textarea></label>
      <button class="ui-bouton ui-bouton--primaire" type="submit">Envoyer la réponse</button>
    </form>
  </section>
</main>
