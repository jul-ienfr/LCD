<script lang="ts">
  import type { ActionData, PageData } from "./$types";
  import { formaterEuros } from "@/lib/format";

  let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head>
  <title>{data.facture.numero} — {data.t.facture}</title>
</svelte:head>

<main class="mx-auto max-w-3xl space-y-6 px-6 py-12 print:max-w-none print:px-0 print:py-0">
  <div class="flex flex-wrap items-center justify-between gap-3 print:hidden">
    <a class="ui-lien text-sm" href="/hote/factures">{data.t.retourAuxFactures}</a>
    <div class="flex flex-wrap items-center gap-3">
      <a class="ui-bouton ui-bouton--secondaire ui-bouton--petit" download href={`/api/factures/${data.facture.id}/pdf`}>PDF</a>
      <a class="ui-bouton ui-bouton--secondaire ui-bouton--petit" download href={`/api/factures/${data.facture.id}/factur-x`}>Factur-X</a>
      <a class="ui-bouton ui-bouton--secondaire ui-bouton--petit" href={`/hote/factures/${data.facture.id}/litige`}>{data.t.litige}</a>
      <span class="text-xs text-encre-faine">{data.t.imprimer}</span>
    </div>
  </div>

  {#if form?.message}
    <p class:ui-alerte--danger={!form.ok} class:ui-alerte--succes={form.ok} class="ui-alerte print:hidden" role="status">{form.message}</p>
  {/if}

  <div class="flex flex-wrap gap-2 print:hidden">
    {#each data.transitions as statut (statut)}
      <form method="POST" action="?/statut">
        <input type="hidden" name="factureId" value={data.facture.id} />
        <input type="hidden" name="statut" value={statut} />
        <button class="ui-bouton ui-bouton--secondaire ui-bouton--petit" type="submit">{data.t.statuts[statut] ?? statut}</button>
      </form>
    {/each}
  </div>

  <article class="space-y-8 rounded-carte border border-bordure bg-surface p-8 shadow-carte print:rounded-none print:border-0 print:p-0 print:shadow-none">
    <header class="flex flex-wrap items-start justify-between gap-6 border-b border-bordure pb-6">
      <div>
        <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">{data.t.facture}</p>
        <h1 class="mt-1 break-all font-mono text-2xl font-semibold">{data.facture.numero}</h1>
        <p class="mt-2 text-sm text-encre-douce">{data.t.emiseLe(data.facture.dateEmission)}{data.facture.echeance ? ` · ${data.t.echeanceLe(data.facture.echeance)}` : ""}</p>
      </div>
      <div class="text-right text-sm text-encre-douce">
        <p class="font-semibold text-encre">{data.tenant.nom}</p>
        <p>{data.t.conciergerie}</p>
        {#if data.tenant.siren}<p class="font-mono text-xs">SIREN {data.tenant.siren}</p>{/if}
        {#if data.tenant.adresse}<p class="mt-1">{data.tenant.adresse}</p>{/if}
      </div>
    </header>

    <section class="grid gap-6 sm:grid-cols-2">
      <div>
        <h2 class="text-sm font-semibold uppercase tracking-wide text-encre-faine">{data.t.client}</h2>
        <p class="mt-1 font-medium">{data.facture.clientNom}</p>
        {#if data.facture.clientEmail}<p class="break-all text-sm text-encre-douce">{data.facture.clientEmail}</p>{/if}
      </div>
      <div class="sm:text-right">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-encre-faine">{data.t.statut}</h2>
        <p class="mt-1 font-medium">{data.facture.statut}</p>
      </div>
    </section>

    <table class="ui-tableau w-full border-collapse text-sm">
      <thead><tr><th>{data.t.designationCol}</th><th class="text-right">{data.t.qte}</th><th class="text-right">{data.t.pu}</th><th class="text-right">{data.t.total}</th></tr></thead>
      <tbody>
        {#each data.facture.lignes as ligne (ligne.id)}
          <tr>
            <td>{ligne.designation}</td>
            <td class="text-right">{ligne.quantite}</td>
            <td class="text-right">{formaterEuros(ligne.prixUnitaireCentimes)}</td>
            <td class="text-right">{formaterEuros(ligne.totalCentimes)}</td>
          </tr>
        {/each}
      </tbody>
    </table>

    <section class="ml-auto max-w-xs space-y-1 text-sm">
      <div class="flex justify-between"><span class="text-encre-douce">{data.t.totalHt}</span><span>{formaterEuros(data.facture.montantHtCentimes)}</span></div>
      <div class="flex justify-between"><span class="text-encre-douce">{data.t.tvaLigne}</span><span>{formaterEuros(data.facture.tvaCentimes)}</span></div>
      <div class="flex justify-between"><span class="text-encre-douce">{data.t.taxeLigne}</span><span>{formaterEuros(data.facture.taxeSejourCentimes)}</span></div>
      <div class="flex justify-between border-t border-bordure pt-2 text-base font-semibold"><span>{data.t.totalTtc}</span><span>{formaterEuros(data.facture.montantTtcCentimes)}</span></div>
      {#if data.paiements.length > 0}
        <div class="flex justify-between pt-2"><span class="text-encre-douce">{data.t.dejaPaye}</span><span>{formaterEuros(data.totalPaye)}</span></div>
        <div class="flex justify-between font-medium"><span>{data.t.resteAPayer}</span><span>{formaterEuros(data.reste)}</span></div>
      {/if}
    </section>

    {#if data.facture.notes}
      <section class="border-t border-bordure pt-4 text-sm text-encre-douce">
        <h2 class="font-semibold text-encre">{data.t.notes}</h2>
        <p class="mt-1 whitespace-pre-line">{data.facture.notes}</p>
      </section>
    {/if}

    <footer class="border-t border-bordure pt-4 text-xs text-encre-faine">
      <p>{data.t.piedFacture}</p>
      {#if data.tenant.mentionsLegales}<p class="mt-2 whitespace-pre-line">{data.tenant.mentionsLegales}</p>{/if}
      {#if data.tenant.mediation}<p class="mt-2">{data.tenant.mediation}</p>{/if}
    </footer>
  </article>

  <section class="ui-carte space-y-4 print:hidden">
    <div>
      <h2 class="text-lg font-semibold">{data.t.paiements}</h2>
      <p class="text-sm text-encre-douce">{data.totalPaye > 0 ? data.t.encaisses(formaterEuros(data.totalPaye), formaterEuros(data.reste)) : data.t.aucunEncaissement}</p>
    </div>
    {#if data.paiements.length > 0}
      <ul class="divide-y divide-bordure">
        {#each data.paiements as p (p.id)}
          <li class="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
            <div>
              <p class="font-medium">{p.mode} · {formaterEuros(p.montantCentimes)}</p>
              <p class="text-encre-faine">{p.date}{p.reference ? ` · ${p.reference}` : ""}{p.notes ? ` · ${p.notes}` : ""}</p>
            </div>
            <span class="font-mono text-xs text-encre-faine">{p.ref}</span>
          </li>
        {/each}
      </ul>
    {/if}

    {#if data.facture.statut === "emise" && data.reste > 0}
      <form method="POST" action="?/paiement" class="space-y-3 border-t border-bordure pt-4">
        <input type="hidden" name="factureId" value={data.facture.id} />
        <input type="hidden" name="ref" value={data.refPaiement} />
        <h3 class="text-sm font-semibold">{data.t.encaisser}</h3>
        <p class="text-sm text-encre-douce">{data.t.encaisserAide}</p>
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="ui-champ-groupe"><span class="ui-label">{data.t.montant}</span><input class="ui-champ" name="montantEuros" inputmode="decimal" defaultValue={data.resteFormate.replace(" €", "")} required /></label>
          <label class="ui-champ-groupe"><span class="ui-label">{data.t.mode}</span>
            <select class="ui-champ" name="mode">
              <option value="virement">{data.t.virement}</option>
              <option value="cb">{data.t.cb}</option>
              <option value="especes">{data.t.especes}</option>
              <option value="cheque">{data.t.cheque}</option>
              <option value="stripe">{data.t.stripe}</option>
            </select>
          </label>
          <label class="ui-champ-groupe"><span class="ui-label">{data.t.datePaiement}</span><input class="ui-champ" type="date" name="datePaiement" defaultValue={data.aujourdHui} required /></label>
          <label class="ui-champ-groupe"><span class="ui-label">{data.t.reference}</span><input class="ui-champ" name="reference" /></label>
        </div>
        <label class="ui-champ-groupe"><span class="ui-label">{data.t.notes}</span><input class="ui-champ" name="notes" /></label>
        <button class="ui-bouton ui-bouton--primaire" type="submit">{data.t.enregistrerPaiement}</button>
      </form>
    {:else if data.facture.statut === "brouillon"}
      <p class="ui-alerte ui-alerte--alerte">{data.t.emettrePourPayer}</p>
    {:else if data.facture.statut === "payee"}
      <p class="ui-alerte ui-alerte--succes">{data.t.soldee}</p>
    {/if}
  </section>

  <section class="ui-carte space-y-4 print:hidden">
    <div>
      <h2 class="text-lg font-semibold">{data.t.partage}</h2>
      <p class="text-sm text-encre-douce">{data.t.partageAide}</p>
    </div>
    {#if data.lienClient}
      <label class="ui-champ-groupe">
        <span class="ui-label">{data.t.lienFacture}</span>
        <input class="ui-champ font-mono text-xs" readonly value={data.lienClient} />
      </label>
      <a class="ui-bouton ui-bouton--secondaire" href={data.lienClient} target="_blank" rel="noreferrer">{data.t.ouvrirClient}</a>
      <form method="POST" action="?/envoyer" class="space-y-3 border-t border-bordure pt-4">
        <input type="hidden" name="factureId" value={data.facture.id} />
        <h3 class="text-sm font-semibold">{data.t.envoyerEmail}</h3>
        {#if !data.emailConfigured}
          <p class="ui-alerte ui-alerte--alerte">{data.t.smtpOff}</p>
        {/if}
        <label class="ui-champ-groupe"><span class="ui-label">{data.t.destinataire}</span><input class="ui-champ" type="email" name="email" defaultValue={data.facture.clientEmail ?? ""} required /></label>
        <div class="flex flex-wrap gap-2">
          <button class="ui-bouton ui-bouton--primaire" type="submit">{data.t.envoyer}</button>
          {#if data.facture.statut === "emise" && data.reste > 0}
            <button class="ui-bouton ui-bouton--secondaire" type="submit" name="type" value="relance">{data.t.relancerEmail}</button>
          {/if}
        </div>
      </form>
    {:else}
      <p class="ui-alerte ui-alerte--alerte">{data.t.emettrePourLien}</p>
    {/if}
  </section>
</main>
