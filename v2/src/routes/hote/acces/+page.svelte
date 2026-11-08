<script lang="ts">
  import PageEntete from "@/lib/components/ui/page-entete.svelte";
  import Kpi from "@/lib/components/ui/kpi.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>{data.t.titrePage}</title>
</svelte:head>

<main class="mx-auto max-w-6xl space-y-8 px-6 py-12">
  <PageEntete
    surtitre={data.t.surtitre}
    titre={data.t.titre}
    description={data.t.description}
  />

  {#if data.ok === "revoque"}
    <p class="ui-alerte ui-alerte--ok">{data.t.revoquee}</p>
  {/if}
  {#if data.erreur}
    <p class="ui-alerte ui-alerte--danger">
      {data.erreur === "inattendu" ? data.t.erreurInattendue : data.erreur}
    </p>
  {/if}

  <section class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <Kpi libelle={data.t.sessionsActives} valeur={data.kpis.actives} />
    <Kpi libelle={data.t.comptesActifs} valeur={data.kpis.comptesActifs} />
    <Kpi libelle={data.t.administrateurs} valeur={data.kpis.admins} />
    <Kpi libelle={data.t.sansSession} valeur={data.kpis.sansSession} />
  </section>

  <section class="overflow-x-auto rounded-2xl border border-bordure bg-surface shadow-sm">
    <table class="ui-tableau min-w-[900px]">
      <thead>
        <tr>
          <th>{data.t.utilisateur}</th>
          <th>{data.t.role}</th>
          <th>{data.t.appareil}</th>
          <th>{data.t.ip}</th>
          <th>{data.t.derniereActivite}</th>
          <th>{data.t.expire}</th>
          <th>{data.t.action}</th>
        </tr>
      </thead>
      <tbody>
        {#if data.sessions.length === 0}
          <tr>
            <td class="p-6 text-encre-douce" colspan="7">{data.t.aucuneSession}</td>
          </tr>
        {:else}
          {#each data.sessions as ligne (ligne.id)}
            <tr>
              <td>
                <p class="font-medium">{ligne.userName}</p>
                <p class="text-xs text-encre-faine">{ligne.userEmail}</p>
              </td>
              <td>{ligne.role}</td>
              <td class="max-w-64 truncate text-xs text-encre-douce">{ligne.userAgent ?? data.t.inconnu}</td>
              <td class="font-mono text-xs">{ligne.ip ?? "—"}</td>
              <td>{ligne.activite}</td>
              <td>
                <span class={ligne.active ? "ui-badge ui-badge--accent" : "ui-badge"}>
                  {ligne.active ? data.t.active : data.t.expiree}
                </span>
                <p class="mt-1 text-xs text-encre-faine">{ligne.expire}</p>
              </td>
              <td>
                {#if ligne.estSoi}
                  <span class="text-xs text-encre-faine">{data.t.sessionCourante}</span>
                {:else}
                  <form method="POST" action="?/revoquer">
                    <input name="id" type="hidden" value={ligne.id} />
                    <button class="ui-bouton ui-bouton--danger ui-bouton--petit" type="submit">{data.t.revoquer}</button>
                  </form>
                {/if}
              </td>
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </section>

  <section class="ui-carte">
    <h2 class="text-lg font-semibold">{data.t.comptesEtSessions}</h2>
    <ul class="mt-3 grid gap-2 sm:grid-cols-2">
      {#each data.comptes as compte (compte.id)}
        <li class="flex items-center justify-between gap-3 rounded-xl border border-bordure px-3 py-2 text-sm">
          <span>{compte.nom} <span class="text-xs text-encre-faine">· {compte.role}</span></span>
          <span class="text-xs font-medium">{data.t.sessions(compte.sessions)}</span>
        </li>
      {/each}
    </ul>
    <div class="mt-4 flex flex-wrap gap-4 text-sm">
      <a class="ui-lien" href="/hote/utilisateurs">{data.t.gererUtilisateurs}</a>
      <a class="ui-lien" href="/hote/audit">{data.t.audit}</a>
    </div>
  </section>
</main>
