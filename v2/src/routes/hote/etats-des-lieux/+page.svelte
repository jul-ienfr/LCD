<script lang="ts">
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>{data.t.titrePage}</title>
</svelte:head>

<main class="mx-auto max-w-6xl space-y-8 px-6 py-12">
  <header class="flex flex-wrap items-end justify-between gap-4">
    <div class="space-y-2">
      <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">
        {data.t.surtitre}
      </p>
      <h1 class="text-3xl font-semibold tracking-tight">{data.t.titre}</h1>
      <p class="text-encre-douce">{data.t.description}</p>
    </div>
    <a class="ui-lien text-sm" href="/hote">{data.t.retour}</a>
  </header>

  {#if data.vide}
    <section class="ui-carte space-y-3">
      <p class="text-encre-douce">
        {data.t.vide}
      </p>
      <a class="ui-bouton ui-bouton--primaire" href="/hote/logements">{data.t.gererLogements}</a>
    </section>
  {:else if data.logement}
    {#if data.logements.length > 1}
      <nav class="flex flex-wrap gap-2" aria-label={data.t.choisirLogement}>
        {#each data.logements as logement (logement.id)}
          <a
            class={logement.id === data.logement.id
              ? "ui-bouton ui-bouton--primaire ui-bouton--petit"
              : "ui-bouton ui-bouton--secondaire ui-bouton--petit"}
            href={`/hote/etats-des-lieux?logement=${logement.id}`}
          >
            {logement.nom}
          </a>
        {/each}
      </nav>
    {/if}

    {#if data.erreur}
      <p class="ui-alerte ui-alerte--danger" role="alert">
        {data.erreur === "inattendu"
          ? data.t.erreurInattendue
          : data.erreur}
      </p>
    {/if}

    <section class="ui-carte space-y-4">
      <div>
        <h2 class="text-lg font-semibold">
          {data.t.nouvelle(data.logement.nom)}
        </h2>
        <p class="mt-1 text-sm text-encre-douce">{data.t.nouvelleAide}</p>
      </div>

      {#if data.biens.length === 0}
        <div class="space-y-3">
          <p class="ui-alerte ui-alerte--alerte">
            {data.t.aucunBien}
          </p>
          <a class="ui-lien text-sm" href="/hote/logements">{data.t.gererLogements}</a>
        </div>
      {:else}
        <form method="POST" action="?/creer" class="space-y-5">
          <input type="hidden" name="logementId" value={data.logement.id} />
          <input type="hidden" name="ref" value={data.ref} />

          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label class="ui-champ-groupe">
              <span class="ui-label">{data.t.type}</span>
              <select class="ui-champ" name="type" required>
                {#each data.types as type (type.valeur)}
                  <option value={type.valeur}>{type.libelle}</option>
                {/each}
              </select>
            </label>
            <label class="ui-champ-groupe">
              <span class="ui-label">{data.t.date}</span>
              <input
                class="ui-champ"
                type="date"
                name="date"
                defaultValue={data.aujourdHui}
                required
              />
            </label>
            <label class="ui-champ-groupe">
              <span class="ui-label">{data.t.sejour}</span>
              <select class="ui-champ" name="reservationId">
                <option value="">{data.t.aucunSejour}</option>
                {#each data.reservations as reservation (reservation.id)}
                  <option value={reservation.id}>
                    {reservation.ref} · {reservation.debut} → {reservation.fin}
                  </option>
                {/each}
              </select>
            </label>
            <label class="ui-champ-groupe">
              <span class="ui-label">{data.t.reference}</span>
              <input class="ui-champ font-mono text-xs" readonly value={data.ref} />
            </label>
          </div>

          <div class="overflow-x-auto rounded-carte border border-bordure bg-surface">
            <table class="ui-tableau min-w-[760px]">
              <thead>
                <tr>
                  <th>{data.t.bien}</th>
                  <th>{data.t.reference}</th>
                  <th>{data.t.etatConstate}</th>
                  <th>{data.t.manquant}</th>
                  <th>{data.t.commentaire}</th>
                </tr>
              </thead>
              <tbody>
                {#each data.biens as bien (bien.id)}
                  <tr>
                    <td>
                      <p class="font-medium">{bien.label}</p>
                      <p class="text-xs text-encre-faine">{bien.categorie}</p>
                    </td>
                    <td>
                      <span class="ui-badge">{bien.etatLabel}</span>
                      <p class="mt-1 font-mono text-xs text-encre-faine">{bien.qr}</p>
                    </td>
                    <td>
                      <select class="ui-champ" name={`etat-${bien.qr}`}>
                        {#each data.etatsBien as etat (etat.valeur)}
                          <option value={etat.valeur} selected={etat.valeur === bien.etat}>
                            {etat.libelle}
                          </option>
                        {/each}
                      </select>
                    </td>
                    <td>
                      <label class="flex items-center gap-2 text-sm">
                        <input type="checkbox" name={`manquant-${bien.qr}`} />
                        {data.t.manquant}
                      </label>
                    </td>
                    <td>
                      <input
                        class="ui-champ"
                        name={`commentaire-${bien.qr}`}
                        placeholder={data.t.optionnel}
                        maxlength="500"
                      />
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>

          <label class="ui-champ-groupe">
            <span class="ui-label">{data.t.notes}</span>
            <textarea
              class="ui-champ min-h-24"
              name="notes"
              maxlength="2000"
            ></textarea>
          </label>

          <button class="ui-bouton ui-bouton--primaire" type="submit">
            {data.t.enregistrer}
          </button>
        </form>
      {/if}
    </section>

    <section class="space-y-3">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <h2 class="text-lg font-semibold">{data.t.historique}</h2>
        <div class="flex flex-wrap gap-4 text-sm">
          <a class="ui-lien" href={`/hote/entretien?logement=${data.logement.id}`}>
            {data.t.entretien}
          </a>
          <a class="ui-lien" href={`/hote/menage?logement=${data.logement.id}`}>
            {data.t.menage}
          </a>
        </div>
      </div>

      {#if data.etats.length === 0}
        <p class="ui-carte border-dashed text-encre-douce">
          {data.t.aucunEtat}
        </p>
      {:else}
        <div class="overflow-x-auto rounded-carte border border-bordure bg-surface">
          <table class="ui-tableau min-w-[760px]">
            <thead>
              <tr>
                <th>{data.t.colDate}</th>
                <th>{data.t.colLogement}</th>
                <th>{data.t.colType}</th>
                <th>{data.t.colSejour}</th>
                <th>{data.t.colManquants}</th>
                <th>{data.t.colDegrades}</th>
                <th>{data.t.colRemplacement}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {#each data.etats as etat (etat.id)}
                <tr>
                  <td>{etat.date}</td>
                  <td>{data.logement.nom}</td>
                  <td>
                    {etat.typeLabel}
                    {#if etat.brouillon}
                      <span class="ui-badge ui-badge--alerte">{data.t.aCompleter}</span>
                    {/if}
                  </td>
                  <td>{etat.reservation}</td>
                  <td>{etat.manquants}</td>
                  <td>{etat.degrades}</td>
                  <td>{etat.coutRemplacement}</td>
                  <td>
                    <a class="ui-lien text-sm" href={`/hote/etats-des-lieux/${etat.id}`}>
                      {data.t.voir}
                    </a>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </section>
  {/if}
</main>
