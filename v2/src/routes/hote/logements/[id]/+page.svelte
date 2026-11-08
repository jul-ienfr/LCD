<script lang="ts">
  import type { ActionData, PageData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head>
  <title>{data.t.gTitrePage(data.logement.nom)}</title>
</svelte:head>

<main class="mx-auto max-w-2xl space-y-8 px-6 py-12">
  <header class="flex flex-wrap items-end justify-between gap-4">
    <div class="space-y-2">
      <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">
        {data.t.gSurtitre(data.logement.code)}
      </p>
      <h1 class="text-3xl font-semibold tracking-tight">{data.t.gTitre(data.logement.nom)}</h1>
      <p class="text-encre-douce">{data.t.gDescription}</p>
    </div>
    <a class="ui-lien text-sm" href="/hote/logements">{data.t.gRetour}</a>
  </header>

  <section class="ui-carte">
    <form method="POST" action="?/guide" class="space-y-4">
      <input type="hidden" name="logementId" value={data.logement.id} />

      <div class="grid gap-4 sm:grid-cols-2">
        <label class="ui-champ-groupe">
          <span class="ui-label">{data.t.gCheckin}</span>
          <input
            class="ui-champ"
            name="checkinHeure"
            defaultValue={data.logement.checkinHeure}
            placeholder="15:00"
            inputmode="numeric"
            pattern="([01][0-9]|2[0-3]):[0-5][0-9]"
          />
        </label>
        <label class="ui-champ-groupe">
          <span class="ui-label">{data.t.gUrgence}</span>
          <input
            class="ui-champ"
            name="urgenceTel"
            defaultValue={data.logement.urgenceTel}
            type="tel"
          />
        </label>
        <label class="ui-champ-groupe">
          <span class="ui-label">{data.t.gWifiReseau}</span>
          <input class="ui-champ" name="wifiSsid" defaultValue={data.logement.wifiSsid} />
        </label>
        <label class="ui-champ-groupe">
          <span class="ui-label">{data.t.gWifiMdp}</span>
          <input
            class="ui-champ"
            name="wifiPassword"
            defaultValue={data.logement.wifiPassword}
          />
        </label>
      </div>

      <label class="ui-champ-groupe">
        <span class="ui-label">{data.t.gConsignes}</span>
        <textarea
          class="ui-champ min-h-24"
          name="checkinInstructions"
          defaultValue={data.logement.checkinInstructions}
        ></textarea>
      </label>

      <label class="ui-champ-groupe">
        <span class="ui-label">{data.t.gRegles}</span>
        <textarea class="ui-champ min-h-24" name="regles" defaultValue={data.logement.regles}></textarea>
      </label>

      <label class="ui-champ-groupe">
        <span class="ui-label">{data.t.gGuide}</span>
        <textarea class="ui-champ min-h-32" name="guideTexte" defaultValue={data.logement.guideTexte}></textarea>
      </label>

      {#if form?.message}
        <p
          class={form.ok ? "ui-alerte ui-alerte--ok" : "ui-alerte ui-alerte--danger"}
          role="status"
        >
          {form.message}
        </p>
      {/if}

      <button class="ui-bouton ui-bouton--primaire" type="submit">
        {data.t.gEnregistrer}
      </button>
    </form>
  </section>

  <section class="ui-carte space-y-4" id="calendrier">
    <div>
      <h2 class="text-lg font-semibold">{data.t.gCalTitre}</h2>
      <p class="mt-1 text-sm text-encre-douce">{data.t.gCalDescription}</p>
    </div>
    <input class="ui-champ font-mono text-xs" readonly value={data.urlCalendrier} />
    <div class="flex flex-wrap items-center gap-3">
      <a class="ui-bouton ui-bouton--secondaire" href={data.urlCalendrier}>
        {data.t.gTelecharger}
      </a>
      <a class="ui-lien text-sm" href="/hote/planning">{data.t.gVoirPlanning}</a>
    </div>
    <p class="text-xs text-encre-faine">{data.t.gCalAide}</p>
  </section>

  <a class="ui-lien text-sm" href="/hote">{data.t.gDash}</a>
</main>
