<script lang="ts">
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>{data.t.eTitrePage(data.etat.typeLabel, data.etat.date)}</title>
</svelte:head>

<main class="mx-auto max-w-5xl space-y-8 px-6 py-12">
  <header class="flex flex-wrap items-end justify-between gap-4">
    <div class="space-y-2">
      <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">
        {data.logement.nom} · {data.etat.ref}
      </p>
      <h1 class="text-3xl font-semibold tracking-tight">
        {data.t.eTitre(data.etat.typeLabel)}
      </h1>
      <h2 class="text-lg font-semibold">{data.logement.nom}</h2>
      <p class="text-encre-douce">{data.t.eCree(data.etat.createdAt)}</p>
    </div>
    <div class="flex flex-wrap gap-3 text-sm">
      <a
        class="ui-lien"
        href={`/hote/etats-des-lieux?logement=${data.logement.id}`}
      >
        {data.t.eHistorique}
      </a>
      <a class="ui-lien" href="/hote">{data.t.eDash}</a>
    </div>
  </header>

  {#if data.ok === "complet"}
    <p class="ui-alerte ui-alerte--succes">
      {data.t.eOkComplet}
    </p>
  {:else if data.erreur}
    <p class="ui-alerte ui-alerte--danger">
      {data.erreur === "constat"
        ? data.t.eErrConstat
        : data.t.eErrEnregistrer}
    </p>
  {/if}

  {#if data.brouillon}
    <section class="ui-carte space-y-4 border-l-4 border-l-accent">
      <div class="space-y-1">
        <h2 class="text-lg font-semibold">{data.t.eBrouillon}</h2>
        <p class="text-sm text-encre-douce">{data.t.eBrouillonAide}</p>
      </div>
      <form class="space-y-4" method="POST" action="?/completer">
        <input name="nbLignes" type="hidden" value={data.lignes.length} />
        <label class="block space-y-2">
          <span class="ui-label">{data.t.eNotes}</span>
          <textarea class="ui-champ min-h-20" maxlength="2000" name="notes">{data.etat.notesValeur}</textarea>
        </label>
        <div class="overflow-x-auto">
          <table class="ui-tableau min-w-[760px]">
            <thead>
              <tr>
                <th>{data.t.eBien}</th>
                <th>{data.t.eEtatConstate}</th>
                <th>{data.t.eManquant}</th>
                <th>{data.t.eCommentaire}</th>
              </tr>
            </thead>
            <tbody>
              {#each data.lignes as ligne, index (ligne.qr)}
                <tr>
                  <td>
                    <p class="font-medium">{ligne.libelle}</p>
                    <input name={`qr-${index}`} type="hidden" value={ligne.qr} />
                    <p class="text-xs text-encre-faine">
                      {data.t.eReference(ligne.etatReference)}
                    </p>
                  </td>
                  <td>
                    <select class="ui-champ" name={`etat-${index}`}>
                      <option value="">{data.t.eChoisir}</option>
                      {#each data.etats as etat (etat.valeur)}
                        <option
                          selected={ligne.etatConstateValeur === etat.valeur}
                          value={etat.valeur}
                        >
                          {etat.libelle}
                        </option>
                      {/each}
                    </select>
                  </td>
                  <td>
                    <label class="flex items-center gap-2 text-sm">
                      <input
                        checked={ligne.manquant}
                        name={`manquant-${index}`}
                        type="checkbox"
                      />
                      {data.t.eManquant}
                    </label>
                  </td>
                  <td>
                    <input
                      class="ui-champ"
                      maxlength="500"
                      name={`commentaire-${index}`}
                      value={ligne.commentaireValeur}
                    />
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
        <button class="ui-bouton ui-bouton--primaire" type="submit">
          {data.t.eValider}
        </button>
      </form>
    </section>
  {/if}

  <section class="grid gap-4 sm:grid-cols-3">
    <article class="ui-carte ui-kpi">
      <p class="text-xs uppercase tracking-widest text-encre-faine">{data.t.eManquants}</p>
      <p class="text-3xl font-extrabold">{data.analyse.manquants}</p>
      {#if data.analyse.manquants > 0}
        <span class="ui-badge ui-badge--danger">{data.t.eARemplacer}</span>
      {/if}
    </article>
    <article class="ui-carte ui-kpi">
      <p class="text-xs uppercase tracking-widest text-encre-faine">{data.t.eDegrades}</p>
      <p class="text-3xl font-extrabold">{data.analyse.degrades}</p>
    </article>
    <article class="ui-carte ui-kpi">
      <p class="text-xs uppercase tracking-widest text-encre-faine">
        {data.t.eCout}
      </p>
      <p class="text-3xl font-extrabold">{data.analyse.coutRemplacement}</p>
    </article>
  </section>

  <section class="ui-carte space-y-3">
    <div class="grid gap-4 sm:grid-cols-3">
      <div>
        <p class="ui-label">{data.t.eSejour}</p>
        <p class="text-sm">
          {#if data.reservation}
            {data.reservation.ref}
            {data.reservation.clientNom ? ` — ${data.reservation.clientNom}` : ""}
            <span class="text-encre-faine">
              ({data.reservation.debut} → {data.reservation.fin})
            </span>
          {:else}
            {data.t.eAucunSejour}
          {/if}
        </p>
      </div>
      <div>
        <p class="ui-label">{data.t.eLogement}</p>
        <p class="text-sm">{data.logement.nom} — {data.logement.code}</p>
      </div>
      <div>
        <p class="ui-label">{data.t.eNotes}</p>
        <p class="text-sm text-encre-douce">{data.etat.notes}</p>
      </div>
    </div>
  </section>

  <section class="space-y-3">
    <h2 class="text-lg font-semibold">{data.t.eConstat}</h2>
    <div class="overflow-x-auto rounded-carte border border-bordure bg-surface">
      <table class="ui-tableau min-w-[820px]">
        <thead>
          <tr>
            <th>{data.t.eBien}</th>
            <th>{data.t.eReference("").replace(" :", "")}</th>
            <th>{data.t.eEtatReference}</th>
            <th>{data.t.eEtatConstate}</th>
            <th>{data.t.ePrix}</th>
            <th>{data.t.eCommentaire}</th>
          </tr>
        </thead>
        <tbody>
          {#each data.lignes as ligne (ligne.qr)}
            <tr>
              <td>
                <p class="font-medium">{ligne.libelle}</p>
                {#if ligne.manquant}
                  <span class="ui-badge ui-badge--danger">{data.t.eManquant}</span>
                {/if}
              </td>
              <td class="font-mono text-xs">{ligne.qr}</td>
              <td>{ligne.etatReference}</td>
              <td>{ligne.manquant ? "—" : ligne.etatConstate ?? "—"}</td>
              <td>{ligne.prixReference}</td>
              <td>{ligne.commentaire}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </section>

  <nav class="flex flex-wrap gap-4 text-sm">
    <a class="ui-lien" href={`/hote/etats-des-lieux?logement=${data.logement.id}`}>
      {data.t.eTous}
    </a>
    <a class="ui-lien" href={`/hote/entretien?logement=${data.logement.id}`}>
      {data.t.eEntretien}
    </a>
    <a class="ui-lien" href={`/hote/menage?logement=${data.logement.id}`}>
      {data.t.eMenage}
    </a>
  </nav>
</main>
