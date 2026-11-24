<script lang="ts">
  import type { ActionData, PageData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const extraErreur = $derived((form as { erreur?: string } | null)?.erreur ?? data.extraErreur);
</script>

<svelte:head>
  {#if data.indisponible}
    <title>Guide indisponible — LCD Parc</title>
  {:else}
    <title>Guide — {data.logementNom} — LCD Parc</title>
  {/if}
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

{#if data.indisponible}
  <main id="contenu" class="mx-auto max-w-md space-y-4 px-4 py-16 text-center">
    <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">LCD Parc</p>
    <h1 class="text-2xl font-semibold tracking-tight">Lien indisponible</h1>
    <p class="text-encre-douce">
      {#if data.indisponible === "invalide"}
        Ce lien est invalide ou expiré. Demandez un nouveau lien à votre hôte.
      {:else if data.indisponible === "reservation"}
        Cette réservation n'est plus disponible. Contactez votre hôte.
      {:else}
        Ce logement n'est plus disponible. Contactez votre hôte.
      {/if}
    </p>
    <a class="ui-lien-action text-sm" href="/">Retour à l'accueil</a>
  </main>
{:else}
  <main id="contenu" class="mx-auto max-w-2xl space-y-8 px-6 py-12">
    <header class="space-y-2 border-b border-bordure pb-6">
      <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">LCD Parc</p>
      <h1 class="text-3xl font-semibold tracking-tight">Guide — {data.logementNom}</h1>
      <p class="text-encre-douce">
        Séjour du {data.debut} au {data.fin}
      </p>
    </header>

    <!-- T612 — Code d'accès actif (disparaît dès la révocation) -->
    {#if data.codeAcces}
      <section
        class="ui-carte space-y-2 border-2 border-encre"
        data-code-acces
        data-acces-code={data.codeAcces.code}
      >
        <h2 class="text-lg font-semibold">Code d'accès</h2>
        <p class="font-mono text-4xl tracking-[0.3em]">{data.codeAcces.code}</p>
        <p class="text-sm text-encre-douce">
          Valable du {data.codeAcces.valideDe.slice(0, 16).replace("T", " ")} au
          {data.codeAcces.valideA.slice(0, 16).replace("T", " ")}.
        </p>
      </section>
    {/if}

    <!-- T712 — Guide partenaire hébergé (Duve, Touch Stay…) -->
    {#if data.guidePartenaireUrl}
      <section class="ui-carte space-y-3">
        <h2 class="text-lg font-semibold">
          {data.guidePartenaireNom ?? "Guide partenaire"}
        </h2>
        <p class="text-encre-douce">
          Votre hôte met aussi à disposition un guide détaillé, hébergé par son
          partenaire.
        </p>
        <a
          class="ui-bouton ui-bouton--secondaire"
          href={data.guidePartenaireUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Ouvrir le guide partenaire →
        </a>
      </section>
    {/if}

    <!-- Informations pratiques -->
    <section class="ui-carte space-y-3">
      <h2 class="text-lg font-semibold">Informations pratiques</h2>
      {#if data.checkinHeure}
        <p><strong>Check-in :</strong> à partir de {data.checkinHeure}</p>
      {/if}
      {#if data.checkinInstructions}
        <p><strong>Consignes d'arrivée :</strong> {data.checkinInstructions}</p>
      {/if}
      {#if data.wifiSsid}
        <p>
          <strong>WiFi :</strong> {data.wifiSsid}{data.wifiPassword
            ? ` / ${data.wifiPassword}`
            : ""}
        </p>
      {/if}
      {#if data.urgenceTel}
        <p>
          <strong>Urgence :</strong>
          <a class="ui-lien-action" href="tel:{data.urgenceTel}">{data.urgenceTel}</a>
        </p>
      {/if}
    </section>

    <!-- Sections du guide -->
    {#if data.sections.length > 0}
      {#each data.sections as section (section.section)}
        <section class="ui-carte space-y-2">
          {#if section.titre !== section.libelle}
            <p class="text-xs font-medium uppercase tracking-widest text-encre-faine">
              {section.libelle}
            </p>
          {/if}
          <h2 class="text-lg font-semibold">{section.titre}</h2>
          <p class="whitespace-pre-wrap text-encre-douce">{section.corps}</p>
        </section>
      {/each}
    {/if}

    <!-- T608 — Demandes d'extras : formulaire natif, sans JavaScript -->
    <section class="ui-carte space-y-4" id="extras">
      <div>
        <h2 class="text-lg font-semibold">Demander un extra</h2>
        <p class="mt-1 text-sm text-encre-douce">
          Votre demande est transmise à votre hôte, qui la valide et vous
          confirme le prix. Aucun paiement n'est demandé ici.
        </p>
      </div>

      {#if data.extraOk}
        <p class="ui-alerte ui-alerte--ok" role="status">
          Demande transmise à votre hôte.
        </p>
      {/if}
      {#if extraErreur}
        <p class="ui-alerte ui-alerte--danger" role="alert">
          {extraErreur === "extra" || extraErreur === "reservation"
            ? "La demande n'a pas pu être transmise. Réessayez ou contactez votre hôte."
            : extraErreur}
        </p>
      {/if}

      <form method="POST" action="?/extra" class="space-y-4">
        <div>
          <label class="ui-label" for="type">Type d'extra</label>
          <select class="ui-champ" id="type" name="type" required>
            {#each data.types as type (type.valeur)}
              <option value={type.valeur}>{type.libelle}</option>
            {/each}
          </select>
        </div>
        <div>
          <label class="ui-label" for="message">
            Précisions (facultatif)
          </label>
          <textarea
            class="ui-champ"
            id="message"
            name="message"
            rows="3"
            maxlength="1000"
            placeholder="Heure souhaitée, nombre de lits bébé, vol..."
          ></textarea>
        </div>
        <button class="ui-bouton ui-bouton--primaire" type="submit">
          Envoyer la demande
        </button>
      </form>

      {#if data.demandes.length > 0}
        <div class="space-y-2">
          <h3 class="text-sm font-semibold uppercase tracking-widest text-encre-faine">
            Vos demandes
          </h3>
          <ul class="space-y-2">
            {#each data.demandes as demande (demande.id)}
              <li class="rounded border border-bordure p-3 text-sm">
                <p class="font-medium">
                  {demande.libelle} — {demande.prixFormatte}
                </p>
                <p class="text-encre-douce">{demande.libelleStatut}</p>
                {#if demande.motifRefus}
                  <p class="text-xs text-encre-faine">{demande.motifRefus}</p>
                {/if}
              </li>
            {/each}
          </ul>
        </div>
      {/if}
    </section>

    <footer class="text-center text-sm text-encre-faine">
      <p>Bon séjour ! Votre hôte reste disponible pour toute question.</p>
    </footer>
  </main>
{/if}
