<script lang="ts">
  import type { PageData } from "./$types";
  import { FORFAIT_OBJET_CENTIMES, JOURS_AVANT_DON } from "@/domain/objet-trouve";
  import { formaterEuros } from "@/lib/format";
  import { traductionsRelation } from "@/lib/i18n-relation";

  let { data }: { data: PageData } = $props();

  const t = $derived(traductionsRelation(data.langue));

  const classesStatut: Record<string, string> = {
    trouve: "ui-badge ui-badge--alerte",
    reclame: "ui-badge ui-badge--accent",
    envoye: "ui-badge ui-badge--ok",
    donne: "ui-badge",
  };

  function messageOk(ok: string): string {
    if (ok === "trouve") return t.okTrouve;
    if (ok === "reclame") return t.okReclame(formaterEuros(FORFAIT_OBJET_CENTIMES));
    if (ok === "envoye") return t.okEnvoye;
    if (ok === "donne") return t.okDonne;
    return t.okTrouve;
  }
</script>

<svelte:head>
  <title>{t.oTitrePage}</title>
</svelte:head>

<main class="mx-auto max-w-6xl space-y-8 px-6 py-12">
  <header class="flex flex-wrap items-end justify-between gap-4">
    <div class="space-y-2">
      <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">
        {t.oSurtitre}
      </p>
      <h1 class="text-3xl font-semibold tracking-tight">{t.oTitre}</h1>
      <p class="text-encre-douce">{t.oDescription(JOURS_AVANT_DON)}</p>
    </div>
    <a class="text-sm underline" href="/hote">{t.retourTableau}</a>
  </header>

  {#if data.vide}
    <section class="ui-carte space-y-3">
      <p class="text-encre-douce">
        {t.oVide}
      </p>
      <a class="ui-bouton ui-bouton--primaire" href="/hote/logements">
        {t.creerLogement}
      </a>
    </section>
  {:else if data.logement}
    {@const logement = data.logement}
    {#if data.logements.length > 1}
      <nav class="flex flex-wrap gap-2" aria-label={t.choisirLogement}>
        {#each data.logements as choix (choix.id)}
          <a
            class={choix.id === logement.id
              ? "ui-bouton ui-bouton--primaire ui-bouton--petit"
              : "ui-bouton ui-bouton--secondaire ui-bouton--petit"}
            href={`/hote/objets-trouves?logement=${choix.id}`}
          >
            {choix.nom}
          </a>
        {/each}
      </nav>
    {/if}

    {#if data.ok}
      <p class="ui-alerte ui-alerte--ok" role="status">
        {messageOk(data.ok)}
      </p>
    {/if}
    {#if data.erreur}
      <p class="ui-alerte ui-alerte--danger" role="alert">
        {data.erreur === "inattendu"
          ? t.erreurInattendue
          : data.erreur}
      </p>
    {/if}

    <section class="grid gap-4 sm:grid-cols-4">
      <article class="ui-carte ui-kpi">
        <p class="text-xs uppercase tracking-widest text-encre-faine">
          {t.enAttente}
        </p>
        <p class="text-3xl font-extrabold">{data.stats.enAttente}</p>
      </article>
      <article class="ui-carte ui-kpi">
        <p class="text-xs uppercase tracking-widest text-encre-faine">
          {t.reclames}
        </p>
        <p class="text-3xl font-extrabold">{data.stats.reclames}</p>
      </article>
      <article class="ui-carte ui-kpi">
        <p class="text-xs uppercase tracking-widest text-encre-faine">
          {t.envoyes}
        </p>
        <p class="text-3xl font-extrabold">{data.stats.envoyes}</p>
      </article>
      <article class="ui-carte ui-kpi">
        <p class="text-xs uppercase tracking-widest text-encre-faine">
          {t.pretsDon}
        </p>
        <p class="text-3xl font-extrabold">{data.stats.pretsAuDon}</p>
      </article>
    </section>

    <section class="ui-carte space-y-4">
      <h2 class="text-lg font-semibold">{t.declarer}</h2>
      <form method="POST" action="?/enregistrer" class="space-y-3">
        <input type="hidden" name="logementId" value={logement.id} />
        <input type="hidden" name="ref" value={data.ref} />
        <div class="grid gap-3 sm:grid-cols-3">
          <label class="ui-label space-y-1 sm:col-span-2">
            <span>{t.descriptionChamp}</span>
            <input
              class="ui-champ"
              name="description"
              placeholder={t.descPlaceholder}
              required
              maxlength="500"
            />
          </label>
          <label class="ui-label space-y-1">
            <span>{t.lieu}</span>
            <input
              class="ui-champ"
              name="lieu"
              placeholder={t.lieuPlaceholder}
              required
              maxlength="120"
            />
          </label>
        </div>
        <div class="grid gap-3 sm:grid-cols-3">
          <label class="ui-label space-y-1">
            <span>{t.trouveLe}</span>
            <input
              class="ui-champ"
              name="trouveLe"
              required
              type="date"
              defaultValue={data.aujourdHui}
            />
          </label>
          <label class="ui-label space-y-1">
            <span>{t.voyageurOptionnel}</span>
            <input class="ui-champ" name="voyageurNom" maxlength="120" />
          </label>
          <label class="ui-label space-y-1">
            <span>{t.contactOptionnel}</span>
            <input class="ui-champ" name="contact" maxlength="200" />
          </label>
        </div>
        <button class="ui-bouton ui-bouton--primaire" type="submit">
          {t.enregistrerObjet}
        </button>
      </form>
    </section>

    <section class="space-y-3">
      <h2 class="text-lg font-semibold">{t.registreDe(logement.nom)}</h2>
      {#if data.objets.length === 0}
        <p
          class="rounded-2xl border border-dashed border-bordure p-6 text-encre-douce"
        >
          {t.oAucunObjet}
        </p>
      {:else}
        <ul class="grid gap-4 sm:grid-cols-2">
          {#each data.objets as objet (objet.id)}
            <li class="ui-carte space-y-3">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <span class={classesStatut[objet.statut] ?? "ui-badge"}>
                  {t.statuts[objet.statut] ?? objet.libelleStatut}
                </span>
                <span class="text-xs text-encre-faine">
                  {t.trouveLeLabel(objet.trouveLe)}
                </span>
              </div>
              <div>
                <p class="font-medium">{objet.description}</p>
                <p class="mt-0.5 text-sm text-encre-douce">
                  {objet.lieu}
                  {objet.voyageurNom ? ` · ${objet.voyageurNom}` : ""}
                  {objet.contact ? ` · ${objet.contact}` : ""}
                </p>
              </div>
              {#if objet.fraisCentimes > 0}
                <p class="text-sm">
                  {t.fraisReclamation}
                  <span class="font-semibold">
                    {formaterEuros(objet.fraisCentimes)}
                  </span>
                </p>
              {/if}
              {#if objet.envoyeLe}
                <p class="text-sm text-encre-douce">
                  {t.envoyeLeLabel(objet.envoyeLe)}
                </p>
              {/if}

              {#if objet.statut === "trouve" || objet.statut === "reclame"}
                <details class="rounded-xl border border-bordure p-3">
                  <summary class="cursor-pointer text-sm font-medium">
                    {objet.statut === "reclame"
                      ? t.modifierReclamation
                      : t.reclamerObjet}
                  </summary>
                  <form method="POST" action="?/reclamer" class="mt-3 space-y-2">
                    <input type="hidden" name="logementId" value={logement.id} />
                    <input type="hidden" name="id" value={objet.id} />
                    <label class="ui-label space-y-1 text-sm">
                      <span>{t.nomVoyageur}</span>
                      <input
                        class="ui-champ"
                        name="voyageurNom"
                        defaultValue={objet.voyageurNom ?? ""}
                        required
                        maxlength="120"
                      />
                    </label>
                    <label class="ui-label space-y-1 text-sm">
                      <span>{t.contact}</span>
                      <input
                        class="ui-champ"
                        name="contact"
                        defaultValue={objet.contact ?? ""}
                        required
                        maxlength="200"
                      />
                    </label>
                    <button
                      class="ui-bouton ui-bouton--secondaire ui-bouton--petit"
                      type="submit"
                    >
                      {t.marquerReclame(formaterEuros(FORFAIT_OBJET_CENTIMES))}
                    </button>
                  </form>
                </details>
              {/if}

              <div class="flex flex-wrap gap-3 text-sm">
                {#if objet.statut === "reclame"}
                  <form method="POST" action="?/envoyer">
                    <input type="hidden" name="logementId" value={logement.id} />
                    <input type="hidden" name="id" value={objet.id} />
                    <button class="ui-bouton ui-bouton--fantome ui-bouton--petit" type="submit">
                      {t.marquerEnvoye}
                    </button>
                  </form>
                {/if}
                {#if objet.statut === "trouve" || objet.statut === "reclame"}
                  {#if objet.eligibleAuDon}
                    <form method="POST" action="?/donner">
                      <input type="hidden" name="logementId" value={logement.id} />
                      <input type="hidden" name="id" value={objet.id} />
                      <button
                        class="ui-bouton ui-bouton--fantome ui-bouton--petit"
                        type="submit"
                      >
                        {t.donner}
                      </button>
                    </form>
                  {:else}
                    <p class="text-encre-faine">
                      {t.donDans(objet.joursRestants)}
                    </p>
                  {/if}
                {/if}
              </div>
            </li>
          {/each}
        </ul>
      {/if}
    </section>

    <nav class="flex flex-wrap gap-4 text-sm">
      <a class="underline" href={`/hote/phrases?logement=${logement.id}`}>
        {t.phrases}
      </a>
      <a class="underline" href="/hote">{t.tableauBord}</a>
    </nav>
  {/if}
</main>
