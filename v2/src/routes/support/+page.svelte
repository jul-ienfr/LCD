<script lang="ts">
  import type { ActionData, PageData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head>
  <title>{data.estStaff ? "Tickets support" : "Mes demandes"} — LCD</title>
</svelte:head>

<main class="mx-auto max-w-4xl space-y-8 px-6 py-12">
  <header class="flex flex-wrap items-end justify-between gap-4">
    <div class="space-y-2">
      <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">Support</p>
      <h1 class="text-3xl font-semibold tracking-tight">{data.estStaff ? "Tickets support" : "Mes demandes"}</h1>
      <p class="text-encre-douce">{data.tickets.length} ticket{data.tickets.length > 1 ? "s" : ""} · {data.email}</p>
    </div>
    <div class="flex flex-wrap items-center gap-3">
      <a class="ui-lien text-sm" href="/hote/securite">Sécurité / 2FA</a>
      <form method="POST" action="/logout"><button class="ui-bouton ui-bouton--fantome ui-bouton--petit" type="submit">Quitter</button></form>
    </div>
  </header>

  {#if data.ok}
    <p class="ui-alerte ui-alerte--succes" role="status">Ticket créé.</p>
  {:else if form?.message}
    <p class:ui-alerte--danger={!form.ok} class:ui-alerte--succes={form.ok} class="ui-alerte" role="status">{form.message}</p>
  {/if}

  <section class="ui-carte">
    <h2 class="text-lg font-semibold">Ouvrir un ticket</h2>
    <form method="POST" action="?/creer" class="mt-4 space-y-4">
      <div class="grid gap-4 sm:grid-cols-[1fr_180px]">
        <label class="ui-champ-groupe"><span class="ui-label">Sujet</span><input class="ui-champ" name="sujet" maxlength="160" placeholder="Problème WiFi" required /></label>
        <label class="ui-champ-groupe"><span class="ui-label">Priorité</span>
          <select class="ui-champ" name="priorite">
            {#each data.priorites as priorite (priorite)}<option value={priorite} selected={priorite === "normale"}>{priorite}</option>{/each}
          </select>
        </label>
      </div>
      <label class="ui-champ-groupe"><span class="ui-label">Message</span><textarea class="ui-champ" name="message" rows="5" maxlength="5000" required></textarea></label>
      <button class="ui-bouton ui-bouton--primaire" type="submit">Ouvrir le ticket</button>
    </form>
  </section>

  <section class="space-y-3">
    <h2 class="text-lg font-semibold">{data.estStaff ? "Tous les tickets" : "Mes tickets"}</h2>
    {#if data.tickets.length === 0}
      <p class="ui-carte border-dashed text-encre-douce">Aucun ticket pour le moment.</p>
    {:else}
      <ul class="divide-y divide-bordure rounded-carte border border-bordure bg-surface">
        {#each data.tickets as ticket (ticket.id)}
          <li class="p-4">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <a class="font-medium underline" href={`/support/${ticket.id}`}>{ticket.sujet}</a>
              <span class="ui-etiquette">{ticket.statut} · {ticket.priorite}</span>
            </div>
            <p class="mt-1 text-sm text-encre-faine">{ticket.ref} · {ticket.date}</p>
          </li>
        {/each}
      </ul>
    {/if}
  </section>

  <a class="ui-lien text-sm" href="/">Retour à l’accueil</a>
</main>
