<script lang="ts">
  import { traductionsDetails } from "@/lib/i18n-details";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
  const t = $derived(traductionsDetails((data as { langue?: string }).langue ?? "fr"));
</script>

<svelte:head>
  <title>{t.eTitrePage(data.etat.typeLabel, data.etat.date)}</title>
</svelte:head>

<main id="contenu" class="mx-auto max-w-5xl space-y-8 px-6 py-12">
  <header class="flex flex-wrap items-end justify-between gap-4">
    <div class="space-y-2">
      <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">
        {data.logement.nom} · {data.etat.ref}
      </p>
      <h1 class="text-3xl font-semibold tracking-tight">
        {t.eTitre(data.etat.typeLabel)}
      </h1>
      <h2 class="text-lg font-semibold">{data.logement.nom}</h2>
      <p class="text-encre-douce">{t.eCree(data.etat.createdAt)}</p>
    </div>
    <div class="flex flex-wrap gap-3 text-sm">
      <a
        class="ui-lien-action"
        href={`/hote/etats-des-lieux?logement=${data.logement.id}`}
      >
        {t.eHistorique}
      </a>
      <a class="ui-lien-action" href="/hote">{t.eDash}</a>
    </div>
  </header>

  {#if data.ok === "complet"}
    <p class="ui-alerte ui-alerte--succes">
      {t.eOkComplet}
    </p>
  {:else if data.erreur}
    <p class="ui-alerte ui-alerte--danger">
      {data.erreur === "constat"
        ? t.eErrConstat
        : t.eErrEnregistrer}
    </p>
  {/if}

  {#if data.brouillon}
    <section class="ui-carte space-y-4 border-l-4 border-l-accent">
      <div class="space-y-1">
        <h2 class="text-lg font-semibold">{t.eBrouillon}</h2>
        <p class="text-sm text-encre-douce">{t.eBrouillonAide}</p>
      </div>
      <form class="space-y-4" method="POST" action="?/completer">
        <input name="nbLignes" type="hidden" value={data.lignes.length} />
        <label class="block space-y-2">
          <span class="ui-label">{t.eNotes}</span>
          <textarea class="ui-champ min-h-20" maxlength="2000" name="notes">{data.etat.notesValeur}</textarea>
        </label>
        <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
        <div role="region" tabindex="0" aria-label="Tableau défilant"  class="overflow-x-auto">
          <table class="ui-tableau min-w-[760px]">
            <thead>
              <tr>
                <th>{t.eBien}</th>
                <th>{t.eEtatConstate}</th>
                <th>{t.eManquant}</th>
                <th>{t.eCommentaire}</th>
              </tr>
            </thead>
            <tbody>
              {#each data.lignes as ligne, index (ligne.qr)}
                <tr>
                  <td>
                    <p class="font-medium">{ligne.libelle}</p>
                    <input name={`qr-${index}`} type="hidden" value={ligne.qr} />
                    <p class="text-xs text-encre-faine">
                      {t.eReference(ligne.etatReference)}
                    </p>
                  </td>
                  <td>
                    <select
                      class="ui-champ"
                      name={`etat-${index}`}
                      aria-label={`${t.eEtatConstate} — ${ligne.libelle}`}
                    >
                      <option value="">{t.eChoisir}</option>
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
                    <label class="flex min-h-11 min-w-11 items-center gap-2 text-sm">
                      <input
                        checked={ligne.manquant}
                        name={`manquant-${index}`}
                        type="checkbox"
                      />
                      {t.eManquant}
                    </label>
                  </td>
                  <td>
                    <input
                      class="ui-champ"
                      maxlength="500"
                      name={`commentaire-${index}`}
                      value={ligne.commentaireValeur}
                      aria-label={`${t.eCommentaire} — ${ligne.libelle}`}
                    />
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
        <button class="ui-bouton ui-bouton--primaire" type="submit">
          {t.eValider}
        </button>
      </form>
    </section>
  {/if}

  <section class="grid gap-4 sm:grid-cols-3">
    <article class="ui-carte ui-kpi">
      <p class="text-xs uppercase tracking-widest text-encre-faine">{t.eManquants}</p>
      <p class="text-3xl font-extrabold">{data.analyse.manquants}</p>
      {#if data.analyse.manquants > 0}
        <span class="ui-badge ui-badge--danger">{t.eARemplacer}</span>
      {/if}
    </article>
    <article class="ui-carte ui-kpi">
      <p class="text-xs uppercase tracking-widest text-encre-faine">{t.eDegrades}</p>
      <p class="text-3xl font-extrabold">{data.analyse.degrades}</p>
    </article>
    <article class="ui-carte ui-kpi">
      <p class="text-xs uppercase tracking-widest text-encre-faine">
        {t.eCout}
      </p>
      <p class="text-3xl font-extrabold">{data.analyse.coutRemplacement}</p>
    </article>
  </section>

  <section class="ui-carte space-y-3">
    <div class="grid gap-4 sm:grid-cols-3">
      <div>
        <p class="ui-label">{t.eSejour}</p>
        <p class="text-sm">
          {#if data.reservation}
            {data.reservation.ref}
            {data.reservation.clientNom ? ` — ${data.reservation.clientNom}` : ""}
            <span class="text-encre-faine">
              ({data.reservation.debut} → {data.reservation.fin})
            </span>
          {:else}
            {t.eAucunSejour}
          {/if}
        </p>
      </div>
      <div>
        <p class="ui-label">{t.eLogement}</p>
        <p class="text-sm">{data.logement.nom} — {data.logement.code}</p>
      </div>
      <div>
        <p class="ui-label">{t.eNotes}</p>
        <p class="text-sm text-encre-douce">{data.etat.notes}</p>
      </div>
    </div>
  </section>

  <section class="space-y-3">
    <h2 class="text-lg font-semibold">{t.eConstat}</h2>
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <div role="region" tabindex="0" aria-label="Tableau défilant"  class="overflow-x-auto rounded-carte border border-bordure bg-surface">
      <table class="ui-tableau min-w-[820px]">
        <thead>
          <tr>
            <th>{t.eBien}</th>
            <th>{t.eReference("").replace(" :", "")}</th>
            <th>{t.eEtatReference}</th>
            <th>{t.eEtatConstate}</th>
            <th>{t.ePrix}</th>
            <th>{t.eCommentaire}</th>
          </tr>
        </thead>
        <tbody>
          {#each data.lignes as ligne (ligne.qr)}
            <tr>
              <td>
                <p class="font-medium">{ligne.libelle}</p>
                {#if ligne.manquant}
                  <span class="ui-badge ui-badge--danger">{t.eManquant}</span>
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
    <a class="ui-lien-action" href={`/hote/etats-des-lieux?logement=${data.logement.id}`}>
      {t.eTous}
    </a>
    <a class="ui-lien-action" href={`/hote/entretien?logement=${data.logement.id}`}>
      {t.eEntretien}
    </a>
    <a class="ui-lien-action" href={`/hote/menage?logement=${data.logement.id}`}>
      {t.eMenage}
    </a>
  </nav>
</main>
