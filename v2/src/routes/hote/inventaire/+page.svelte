<script lang="ts">
  import PageEntete from "@/lib/components/ui/page-entete.svelte";
  import Kpi from "@/lib/components/ui/kpi.svelte";
  import { traductionsInventaire } from "@/lib/i18n-inventaire";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
  const t = $derived(traductionsInventaire(data.langue));
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

  {#if !data.logement}
    <p class="rounded-2xl border border-dashed border-bordure p-6 text-encre-douce">
      {t.videTexte}
    </p>
    <a class="ui-bouton ui-bouton--primaire" href="/hote/logements">{t.creerLogement}</a>
  {:else}
    {#if data.logements.length > 1}
      <nav class="flex flex-wrap gap-2" aria-label={t.choisirLogement}>
        {#each data.logements as logement (logement.id)}
          <a
            class="rounded-full border px-4 py-2 text-sm {logement.id === data.logement.id ? 'border-accent bg-accent-douce font-semibold text-accent' : 'border-bordure bg-surface'}"
            href={`/hote/inventaire?logement=${logement.id}`}
          >
            {logement.nom}
          </a>
        {/each}
      </nav>
    {/if}

    {#if data.ok}
      <p class="ui-alerte ui-alerte--ok">
        {data.ok === "utiliser" ? t.okUtiliser : data.ok === "etat" ? t.okEtat : t.okEnregistre}
      </p>
    {/if}
    {#if data.erreur}
      <p class="ui-alerte ui-alerte--danger">{data.erreur === "inattendu" ? t.erreurInattendue : data.erreur}</p>
    {/if}

    <section class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Kpi libelle={t.kpiBiens} valeur={data.stats.total} />
      <Kpi libelle={t.kpiRotations} valeur={data.stats.rotations} />
      <Kpi libelle={t.kpiAge} valeur={`${data.stats.ageMoyen}${data.stats.ageMoyen === "—" ? "" : ` ${t.joursSuffixe}`}`} />
      <Kpi libelle={t.kpiBudget} valeur={data.stats.budget} />
    </section>

    <section class="grid gap-4 md:grid-cols-3">
      <div class="ui-carte">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-encre-faine">{t.alerteDormants}</h2>
        {#if data.alertes.dormants.length === 0}
          <p class="mt-2 text-sm text-encre-douce">{t.aucunMasc}</p>
        {:else}
          <ul class="mt-2 space-y-1 text-sm">
            {#each data.alertes.dormants as bien (bien.id)}
              <li>{bien.label} <span class="text-encre-faine">({bien.jours} {t.joursSuffixe})</span></li>
            {/each}
          </ul>
        {/if}
      </div>
      <div class="ui-carte">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-encre-faine">{t.alerteRemplacements}</h2>
        {#if data.alertes.remplacements.length === 0}
          <p class="mt-2 text-sm text-encre-douce">{t.aucunMasc}</p>
        {:else}
          <ul class="mt-2 space-y-1 text-sm">
            {#each data.alertes.remplacements as bien (bien.id)}
              <li>{bien.label} <span class="text-encre-faine">({t.etatPrefixe} {bien.etat}{t.surCinq})</span></li>
            {/each}
          </ul>
        {/if}
      </div>
      <div class="ui-carte">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-encre-faine">{t.alerteGaranties}</h2>
        {#if data.alertes.garanties.length === 0}
          <p class="mt-2 text-sm text-encre-douce">{t.aucunFem}</p>
        {:else}
          <ul class="mt-2 space-y-1 text-sm">
            {#each data.alertes.garanties as bien (bien.id)}
              <li>{bien.label} <span class="text-encre-faine">({bien.jours} {t.joursSuffixe})</span></li>
            {/each}
          </ul>
        {/if}
      </div>
    </section>

    <section class="space-y-3">
      <h2 class="text-lg font-semibold">{t.biensDe(data.logement.nom)}</h2>
      {#if data.biens.length === 0}
        <p class="rounded-2xl border border-dashed border-bordure p-6 text-encre-douce">
          {t.aucunBien}
        </p>
      {:else}
        <div class="overflow-x-auto rounded-2xl border border-bordure bg-surface">
          <table class="ui-tableau min-w-[900px]">
            <thead>
              <tr>
                <th>{t.colBien}</th>
                <th>{t.colEtat}</th>
                <th>{t.colUsages}</th>
                <th>{t.colLavages}</th>
                <th>{t.colDernierUsage}</th>
                <th>{t.colActions}</th>
              </tr>
            </thead>
            <tbody>
              {#each data.biens as bien (bien.id)}
                <tr>
                  <td>
                    <p class="font-medium">{bien.label}</p>
                    <p class="text-xs text-encre-faine">{bien.categorie} · <span class="font-mono">{bien.qr}</span></p>
                  </td>
                  <td><span class={bien.classe}>{bien.etat}{t.surCinq} · {t.etats[String(bien.etat)] ?? bien.etat}</span></td>
                  <td>{bien.utilisationsNb}</td>
                  <td>{bien.lavagesNb}</td>
                  <td>{bien.derniereUtilisation ?? "—"}</td>
                  <td>
                    <div class="space-y-2">
                      <form class="flex flex-wrap gap-2" method="POST" action="?/utiliser">
                        <input name="logementId" type="hidden" value={data.logement.id} />
                        <input name="qr" type="hidden" value={bien.qr} />
                        <input name="ref" type="hidden" value={bien.refUtiliser} />
                        <button class="ui-bouton ui-bouton--secondaire ui-bouton--petit" name="laver" type="submit" value="0">{t.utilise}</button>
                        <button class="ui-bouton ui-bouton--secondaire ui-bouton--petit" name="laver" type="submit" value="1">{t.utiliseLave}</button>
                      </form>
                      <form class="flex flex-wrap items-center gap-2" method="POST" action="?/etat">
                        <input name="logementId" type="hidden" value={data.logement.id} />
                        <input name="qr" type="hidden" value={bien.qr} />
                        <input name="ref" type="hidden" value={bien.refEtat} />
                        <select aria-label={t.nouvelEtatDe(bien.label)} class="ui-champ text-xs" name="etat">
                          {#each data.etats as valeur (valeur)}
                            <option value={valeur} selected={valeur === bien.etat}>{valeur} · {t.etats[String(valeur)] ?? valeur}</option>
                          {/each}
                        </select>
                        <input aria-label={t.noteEtatDe(bien.label)} class="ui-champ min-w-0 flex-1 text-xs" name="note" placeholder={t.notePlaceholder} />
                        <button class="ui-bouton ui-bouton--secondaire ui-bouton--petit" type="submit">{t.etatBtn}</button>
                      </form>
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </section>

    <section class="ui-carte">
      <h2 class="text-lg font-semibold">{t.ajouterTitre}</h2>
      <p class="mt-1 text-sm text-encre-douce">{t.ajouterAide}</p>
      <form class="mt-4 space-y-3" method="POST" action="?/enregistrer">
        <input name="logementId" type="hidden" value={data.logement.id} />
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label class="space-y-2">
            <span class="ui-label">{t.qrLabel}</span>
            <input class="ui-champ font-mono text-sm" name="qr" placeholder="LCD-DRAPS-001" required />
          </label>
          <label class="space-y-2">
            <span class="ui-label">{t.categorie}</span>
            <input class="ui-champ" name="categorie" placeholder="Linge de lit" required />
          </label>
          <label class="space-y-2">
            <span class="ui-label">{t.libelle}</span>
            <input class="ui-champ" name="label" placeholder="Drap housse 160×200" required />
          </label>
          <label class="space-y-2">
            <span class="ui-label">{t.dateAchat}</span>
            <input class="ui-champ" name="dateAchat" type="date" />
          </label>
          <label class="space-y-2">
            <span class="ui-label">{t.prixAchat}</span>
            <input class="ui-champ" inputmode="decimal" name="prixAchat" placeholder="29,90" />
          </label>
          <label class="space-y-2">
            <span class="ui-label">{t.fournisseur}</span>
            <input class="ui-champ" name="fournisseur" />
          </label>
          <label class="space-y-2">
            <span class="ui-label">{t.garantieFin}</span>
            <input class="ui-champ" name="garantieFin" type="date" />
          </label>
          <label class="space-y-2">
            <span class="ui-label">{t.etatInitial}</span>
            <select class="ui-champ" name="etat">
              {#each data.etats as valeur (valeur)}
                <option value={valeur} selected={valeur === 5}>{valeur} · {t.etats[String(valeur)] ?? valeur}</option>
              {/each}
            </select>
          </label>
          <label class="space-y-2">
            <span class="ui-label">{t.photo}</span>
            <input class="ui-champ" name="photoUrl" type="url" />
          </label>
          <label class="space-y-2 lg:col-span-3">
            <span class="ui-label">{t.notes}</span>
            <textarea class="ui-champ min-h-16" name="notes"></textarea>
          </label>
        </div>
        <button class="ui-bouton ui-bouton--primaire" type="submit">{t.enregistrerBien}</button>
      </form>
    </section>
  {/if}
</main>
