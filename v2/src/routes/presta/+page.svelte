<script lang="ts">
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>Espace prestataire — LCD</title>
</svelte:head>

<main id="contenu" class="mx-auto max-w-3xl space-y-8 px-6 py-12">
  <header class="flex flex-wrap items-end justify-between gap-4">
    <div class="space-y-2">
      <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">Espace prestataire</p>
      <h1 class="text-3xl font-semibold tracking-tight">Bonjour {data.nom}</h1>
      <p class="text-encre-douce">{data.missions.length} mission{data.missions.length > 1 ? "s" : ""} · {data.email}</p>
    </div>
    <div class="flex flex-wrap items-center gap-3">
      <a class="ui-lien-action text-sm" href="/hote/securite">Sécurité / 2FA</a>
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

            {#if mission.pointage === "non_commence"}
              <p class="mt-2 text-sm text-encre-douce">Durée prévue : {mission.dureePrevue}</p>
            {:else}
              <dl class="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                <div>
                  <dt class="text-xs uppercase tracking-wide text-encre-faine">Début pointé</dt>
                  <dd>
                    {mission.debutReel}
                    {#if mission.debutSource === "hors_ligne"}
                      <span class="text-xs text-encre-faine">hors ligne, reçu le {mission.debutRecuLe}</span>
                    {/if}
                  </dd>
                </div>
                {#if mission.finReelle}
                  <div>
                    <dt class="text-xs uppercase tracking-wide text-encre-faine">Fin pointée</dt>
                    <dd>
                      {mission.finReelle}
                      {#if mission.finSource === "hors_ligne"}
                        <span class="text-xs text-encre-faine">hors ligne, reçu le {mission.finRecuLe}</span>
                      {/if}
                    </dd>
                  </div>
                  <div>
                    <dt class="text-xs uppercase tracking-wide text-encre-faine">Durée réelle</dt>
                    <dd>{mission.dureeReelle} <span class="text-encre-faine">(prévu {mission.dureePrevue})</span></dd>
                  </div>
                  <div>
                    <dt class="text-xs uppercase tracking-wide text-encre-faine">Écart</dt>
                    <dd>{mission.ecart}</dd>
                  </div>
                {/if}
              </dl>
            {/if}

            <div class="mt-3 flex flex-wrap items-end gap-3">
              {#if mission.pointage === "non_commence" && (mission.statut === "planifiee" || mission.statut === "en_cours")}
                <form class="space-y-2" method="POST" action="?/pointage">
                  <input type="hidden" name="missionId" value={mission.id} />
                  <input type="hidden" name="sens" value="debut" />
                  <button class="ui-bouton ui-bouton--primaire ui-bouton--petit" type="submit">Pointer le début</button>
                  <details class="text-xs text-encre-douce">
                    <summary class="cursor-pointer">Pointage fait hors ligne ?</summary>
                    <label class="mt-2 block space-y-1">
                      <span>Heure réelle du pointage</span>
                      <input class="ui-champ" name="horodatageLocal" type="datetime-local" />
                    </label>
                  </details>
                </form>
              {:else if mission.pointage === "en_cours" && mission.statut === "en_cours"}
                <form class="space-y-2" method="POST" action="?/pointage">
                  <input type="hidden" name="missionId" value={mission.id} />
                  <input type="hidden" name="sens" value="fin" />
                  <button class="ui-bouton ui-bouton--primaire ui-bouton--petit" type="submit">Pointer la fin</button>
                  <details class="text-xs text-encre-douce">
                    <summary class="cursor-pointer">Pointage fait hors ligne ?</summary>
                    <label class="mt-2 block space-y-1">
                      <span>Heure réelle du pointage</span>
                      <input class="ui-champ" name="horodatageLocal" type="datetime-local" />
                    </label>
                  </details>
                </form>
              {/if}
              {#each mission.transitions.filter((statut) => statut === "annulee") as statut (statut)}
                <form method="POST" action="?/statut">
                  <input type="hidden" name="missionId" value={mission.id} />
                  <input type="hidden" name="statut" value={statut} />
                  <button class="ui-bouton ui-bouton--secondaire ui-bouton--petit" type="submit">Annuler la mission</button>
                </form>
              {/each}
            </div>
          </li>
        {/each}
      </ul>
    {/if}
  </section>

  <nav class="flex flex-wrap gap-4 text-sm">
    <a class="ui-lien-action" href="/support">Support</a>
    <a class="ui-lien-action" href="/">Accueil</a>
  </nav>
</main>
