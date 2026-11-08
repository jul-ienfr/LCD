<script lang="ts">
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>Espace prestataire — LCD</title>
</svelte:head>

<main class="mx-auto max-w-3xl space-y-8 px-6 py-12">
  <header class="flex flex-wrap items-end justify-between gap-4">
    <div class="space-y-2">
      <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">Espace prestataire</p>
      <h1 class="text-3xl font-semibold tracking-tight">Bonjour {data.nom}</h1>
      <p class="text-encre-douce">{data.missions.length} mission{data.missions.length > 1 ? "s" : ""} · {data.email}</p>
    </div>
    <div class="flex flex-wrap items-center gap-3">
      <a class="ui-lien text-sm" href="/hote/securite">Sécurité / 2FA</a>
      <form method="POST" action="/logout"><button class="ui-bouton ui-bouton--fantome ui-bouton--petit" type="submit">Quitter</button></form>
    </div>
  </header>

  {#if data.offres.length > 0}
    <section class="space-y-3">
      <h2 class="text-lg font-semibold">Offres en attente ({data.offres.length})</h2>
      <ul class="space-y-3">
        {#each data.offres as offre (offre.id)}
          <li class="rounded-carte border border-accent bg-accent-douce p-4">
            <p class="font-mono text-xs text-accent">{offre.ref}</p>
            <p class="mt-1 text-sm">{offre.mission}</p>
            {#if offre.message}<p class="mt-1 text-sm text-encre-douce">{offre.message}</p>{/if}
            <div class="mt-3 flex flex-wrap gap-2">
              {#each ["accepter", "refuser"] as decision (decision)}
                <form method="POST" action="?/dispatch">
                  <input type="hidden" name="id" value={offre.id} />
                  <input type="hidden" name="decision" value={decision} />
                  <button class={decision === "accepter" ? "ui-bouton ui-bouton--primaire ui-bouton--petit" : "ui-bouton ui-bouton--secondaire ui-bouton--petit"} type="submit">{decision === "accepter" ? "Accepter" : "Refuser"}</button>
                </form>
              {/each}
            </div>
          </li>
        {/each}
      </ul>
    </section>
  {/if}

  <section class="space-y-3">
    <h2 class="text-lg font-semibold">Mes missions</h2>
    {#if data.missions.length === 0}
      <p class="ui-carte border-dashed text-encre-douce">Aucune mission attribuée pour le moment.</p>
    {:else}
      <ul class="space-y-3">
        {#each data.missions as mission (mission.id)}
          <li class="ui-carte">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p class="font-medium">{mission.type} · {mission.logement}</p>
                <p class="text-sm text-encre-douce">{mission.ref} · {mission.date}{mission.heure ? ` ${mission.heure}` : ""}</p>
              </div>
              <span class="ui-etiquette">{mission.statutLibelle}</span>
              <code class="text-xs text-encre-faine">{mission.statut}</code>
            </div>
            <div class="mt-3 flex flex-wrap gap-2">
              {#each mission.transitions as statut (statut)}
                <form method="POST" action="?/statut">
                  <input type="hidden" name="missionId" value={mission.id} />
                  <input type="hidden" name="statut" value={statut} />
                  <button class="ui-bouton ui-bouton--secondaire ui-bouton--petit" type="submit">
                    {statut === "en_cours" ? "Commencer" : statut === "terminee" ? "Terminer" : "Annuler"}
                  </button>
                </form>
              {/each}
            </div>
          </li>
        {/each}
      </ul>
    {/if}
  </section>

  <nav class="flex flex-wrap gap-4 text-sm">
    <a class="ui-lien" href="/support">Support</a>
    <a class="ui-lien" href="/">Accueil</a>
  </nav>
</main>
