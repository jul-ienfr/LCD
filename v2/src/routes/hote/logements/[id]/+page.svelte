<script lang="ts">
  import { traductionsDetails } from "@/lib/i18n-details";
  import type { ActionData, PageData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();
  const t = $derived(traductionsDetails((data as { langue?: string }).langue ?? "fr"));
</script>

<svelte:head>
  <title>{t.gTitrePage(data.logement.nom)}</title>
</svelte:head>

<main id="contenu" class="mx-auto max-w-2xl space-y-8 px-6 py-12">
  <header class="flex flex-wrap items-end justify-between gap-4">
    <div class="space-y-2">
      <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">
        {t.gSurtitre(data.logement.code)}
      </p>
      <h1 class="text-3xl font-semibold tracking-tight">{t.gTitre(data.logement.nom)}</h1>
      <p class="text-encre-douce">{t.gDescription}</p>
    </div>
    <a class="ui-lien-action text-sm" href="/hote/logements">{t.gRetour}</a>
  </header>

  <section class="ui-carte">
    <form method="POST" action="?/guide" class="space-y-4">
      <input type="hidden" name="logementId" value={data.logement.id} />

      <div class="grid gap-4 sm:grid-cols-2">
        <label class="ui-champ-groupe">
          <span class="ui-label">{t.gCheckin}</span>
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
          <span class="ui-label">{t.gUrgence}</span>
          <input
            class="ui-champ"
            name="urgenceTel"
            defaultValue={data.logement.urgenceTel}
            type="tel"
          />
        </label>
        <label class="ui-champ-groupe">
          <span class="ui-label">{t.gWifiReseau}</span>
          <input class="ui-champ" name="wifiSsid" defaultValue={data.logement.wifiSsid} />
        </label>
        <label class="ui-champ-groupe">
          <span class="ui-label">{t.gWifiMdp}</span>
          <input
            class="ui-champ"
            name="wifiPassword"
            defaultValue={data.logement.wifiPassword}
          />
        </label>
      </div>

      <label class="ui-champ-groupe">
        <span class="ui-label">{t.gConsignes}</span>
        <textarea
          class="ui-champ min-h-24"
          name="checkinInstructions"
          defaultValue={data.logement.checkinInstructions}
        ></textarea>
      </label>

      <label class="ui-champ-groupe">
        <span class="ui-label">{t.gRegles}</span>
        <textarea class="ui-champ min-h-24" name="regles" defaultValue={data.logement.regles}></textarea>
      </label>

      <label class="ui-champ-groupe">
        <span class="ui-label">{t.gGuide}</span>
        <textarea class="ui-champ min-h-32" name="guideTexte" defaultValue={data.logement.guideTexte}></textarea>
      </label>

      <fieldset class="space-y-3 rounded-xl border border-bordure p-4">
        <legend class="px-1 text-sm font-semibold">
          Guide partenaire (Duve, Touch Stay…)
        </legend>
        <p class="text-xs text-encre-faine">
          Lien vers le guide hébergé par votre partenaire. Il apparaît dans le
          guide voyageur signé et dans l’espace voyageur, en complément du guide
          natif.
        </p>
        <label class="ui-champ-groupe">
          <span class="ui-label">Nom affiché</span>
          <input
            class="ui-champ"
            name="guidePartenaireNom"
            maxlength="80"
            defaultValue={data.logement.guidePartenaireNom}
            placeholder="Guide Touch Stay"
          />
        </label>
        <label class="ui-champ-groupe">
          <span class="ui-label">URL HTTPS du guide</span>
          <input
            class="ui-champ"
            name="guidePartenaireUrl"
            type="url"
            maxlength="500"
            defaultValue={data.logement.guidePartenaireUrl}
            placeholder="https://guide.example.fr/…"
          />
        </label>
      </fieldset>

      {#if form?.message}
        <p
          class={form.ok ? "ui-alerte ui-alerte--ok" : "ui-alerte ui-alerte--danger"}
          role={form.ok ? "status" : "alert"}
        >
          {form.message}
        </p>
      {/if}

      <button class="ui-bouton ui-bouton--primaire" type="submit">
        {t.gEnregistrer}
      </button>
    </form>
  </section>

  <section class="ui-carte">
    <a
      class="ui-bouton ui-bouton--secondaire"
      href="/hote/logements/{data.logement.id}/guide"
    >
      Guide structuré multilingue →
    </a>
    <p class="mt-2 text-xs text-encre-faine">
      Sections Arrivée / WiFi / Séjour / Départ / Urgence, en 6 langues.
    </p>
  </section>

  <section class="ui-carte space-y-2">
    <a
      class="ui-bouton ui-bouton--secondaire"
      href="/hote/logements/{data.logement.id}/serrure"
    >
      Codes d'accès et serrure →
    </a>
    <p class="text-xs text-encre-faine">
      Un code par arrivée, préparé à J-7, avec repli manuel si la serrure
      connectée est indisponible.
    </p>
  </section>

  <section class="ui-carte space-y-4" id="calendrier">
    <div>
      <h2 class="text-lg font-semibold">{t.gCalTitre}</h2>
      <p class="mt-1 text-sm text-encre-douce">{t.gCalDescription}</p>
    </div>
    <input class="ui-champ font-mono text-xs" readonly value={data.urlCalendrier} />
    <div class="flex flex-wrap items-center gap-3">
      <a class="ui-bouton ui-bouton--secondaire" href={data.urlCalendrier}>
        {t.gTelecharger}
      </a>
      <a class="ui-lien-action text-sm" href="/hote/planning">{t.gVoirPlanning}</a>
    </div>
    <p class="text-xs text-encre-faine">{t.gCalAide}</p>
  </section>

  <a class="ui-lien-action text-sm" href="/hote">{t.gDash}</a>
</main>
