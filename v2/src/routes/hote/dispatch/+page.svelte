<script lang="ts">
  import PageEntete from "@/lib/components/ui/page-entete.svelte";
  import Alerte from "@/lib/components/ui/alerte.svelte";
  import { traductionsDispatch } from "@/lib/i18n-dispatch";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  const t = $derived(traductionsDispatch(data.langue));

  const classes: Record<string, string> = {
    proposee: "ui-badge ui-badge--alerte",
    acceptee: "ui-badge ui-badge--accent",
    refusee: "ui-badge ui-badge--danger",
    retiree: "ui-badge",
  };
</script>

<svelte:head>
  <title>{t.titrePage}</title>
</svelte:head>

<main class="mx-auto max-w-6xl space-y-8 px-6 py-12">
  <PageEntete
    surtitre={t.surtitre}
    titre={t.titre}
    description={t.description}
  />

  {#if data.ok}
    <Alerte ton="ok">{data.ok === "retire" ? t.okRetire : t.okPropose}</Alerte>
  {/if}
  {#if data.erreur}
    <Alerte ton="danger">
      {data.erreur === "inattendu" ? t.erreurInattendue : data.erreur}
    </Alerte>
  {/if}

  {#if data.prestataires.length === 0}
    <Alerte ton="alerte">{t.aucunPrestataire}</Alerte>
  {/if}

  <section class="space-y-3">
    <h2 class="text-lg font-semibold">{t.missionsAVenir(data.missions.length)}</h2>
    {#if data.missions.length === 0}
      <p class="rounded-2xl border border-dashed border-bordure p-6 text-encre-douce">
        {t.aucuneMission}
      </p>
    {:else}
      <div class="overflow-x-auto rounded-2xl border border-bordure bg-surface">
        <table class="ui-tableau min-w-[960px]">
          <thead>
            <tr>
              <th>{t.mission}</th>
              <th>{t.logement}</th>
              <th>{t.date}</th>
              <th>{t.assigne}</th>
              <th>{t.offreEnCours}</th>
              <th>{t.dispatcher}</th>
            </tr>
          </thead>
          <tbody>
            {#each data.missions as mission (mission.id)}
              <tr>
                <td>
                  <p class="font-mono text-xs">{mission.ref}</p>
                  <p class="mt-1 text-xs text-encre-douce">
                    {t.types[mission.type] ?? mission.type}
                    · {t.statutsMission[mission.statut] ?? mission.statut}
                  </p>
                </td>
                <td>{mission.logement}</td>
                <td>{mission.date}{mission.heure ? ` ${mission.heure}` : ""}</td>
                <td>{mission.assigne}</td>
                <td>
                  {#if mission.active}
                    <div class="space-y-1">
                      <span class={classes[mission.active.statut]}>
                        {t.statutsDispatch[mission.active.statut] ?? mission.active.statut}
                      </span>
                      <p class="text-xs text-encre-douce">{mission.active.prestataire}</p>
                      {#if mission.active.statut === "proposee"}
                        <form method="POST" action="?/retirer">
                          <input name="id" type="hidden" value={mission.active.id} />
                          <button class="text-xs text-danger underline" type="submit">{t.retirerOffre}</button>
                        </form>
                      {/if}
                    </div>
                  {:else}
                    <span class="text-xs text-encre-faine">{t.aucuneOffre}</span>
                  {/if}
                </td>
                <td>
                  {#if mission.dispatchable && !mission.active}
                    <form class="space-y-2" method="POST" action="?/proposer">
                      <input name="missionId" type="hidden" value={mission.id} />
                      <input name="ref" type="hidden" value={mission.refOffre} />
                      <select class="ui-champ text-xs" name="prestataireId" required>
                        <option value="">{t.choisir}</option>
                        {#each data.prestataires as prestataire (prestataire.id)}
                          <option value={prestataire.id}>{prestataire.name}</option>
                        {/each}
                      </select>
                      <input class="ui-champ text-xs" name="message" placeholder={t.messagePlaceholder} />
                      <button class="ui-bouton ui-bouton--secondaire ui-bouton--petit" type="submit">{t.proposer}</button>
                    </form>
                  {:else}
                    <span class="text-xs text-encre-faine">
                      {mission.dispatchable ? t.enCours : t.nonDispatchable}
                    </span>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </section>

  <section class="space-y-3">
    <h2 class="text-lg font-semibold">{t.historique}</h2>
    {#if data.historique.length === 0}
      <p class="rounded-2xl border border-dashed border-bordure p-6 text-encre-douce">
        {t.aucuneOffreHistorique}
      </p>
    {:else}
      <ul class="space-y-2">
        {#each data.historique as dispatch (dispatch.id)}
          <li class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-bordure bg-surface p-4 text-sm">
            <div>
              <p class="font-mono text-xs text-encre-faine">{dispatch.ref} · {dispatch.mission}</p>
              <p class="mt-1">
                {dispatch.prestataire}{dispatch.message ? ` — ${dispatch.message}` : ""}
              </p>
            </div>
            <span class={classes[dispatch.statut]}>
              {t.statutsDispatch[dispatch.statut] ?? dispatch.statut}
            </span>
          </li>
        {/each}
      </ul>
    {/if}
  </section>
</main>
