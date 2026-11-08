<script lang="ts">
  import EntetePublique from "@/lib/components/entete-publique.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>Réserver — {data.indisponible ? "indisponible" : data.tenant?.nom ?? "LCD Parc"}</title>
</svelte:head>

<EntetePublique nom={data.tenant?.nom ?? "Réservation"} retourLibelle="Accueil" />

<main class="mx-auto max-w-4xl space-y-10 px-6 py-12">
  {#if data.indisponible}
    <header class="space-y-3">
      <h1 class="text-3xl font-semibold tracking-tight">Réservation indisponible</h1>
      <p class="text-encre-douce">
        Cet espace de réservation n’existe pas ou n’est pas ouvert.
      </p>
      <a class="ui-lien" href="/">Retour à l’accueil</a>
    </header>
  {:else if data.tenant}
    <header class="space-y-3">
      <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">
        {data.tenant.nom} · Réservation directe
      </p>
      <h1 class="text-4xl font-semibold tracking-tight">Réservez votre séjour</h1>
      <p class="max-w-2xl text-encre-douce">
        Demande sans paiement en ligne. L’hôte confirme la disponibilité et vous
        envoie ensuite les instructions d’arrivée.
      </p>
    </header>

    {#if data.reservationOk}
      <section class="ui-carte border-accent bg-accent-douce text-accent" role="status">
        <h2 class="text-lg font-semibold">Demande enregistrée</h2>
        <p class="mt-2 text-sm">
          Référence <strong>{data.reservationOk.ref}</strong> · {data.reservationOk.debut}
          → {data.reservationOk.fin} · {data.reservationOk.montant}
        </p>
        <p class="mt-2 text-sm">
          Un e-mail de confirmation vous sera envoyé après validation par l’hôte.
        </p>
        {#if data.reservationOk.lienVoyageur}
          <a class="ui-bouton ui-bouton--primaire mt-4" href={data.reservationOk.lienVoyageur}>
            Ouvrir mon espace séjour
          </a>
        {/if}
      </section>
    {/if}

    {#if data.ventesSuspendues}
      <section class="ui-carte border-alerte bg-alerte-douce text-alerte" role="status">
        <h2 class="text-lg font-semibold">Réservations temporairement suspendues</h2>
        <p class="mt-2 text-sm">
          L’hôte a mis les ventes en pause. Aucune demande ne peut être
          enregistrée pour le moment ; les séjours déjà confirmés restent
          valables.
        </p>
      </section>
    {/if}

    {#if data.erreur}
      <p class="ui-alerte ui-alerte--danger" role="alert">{data.erreur}</p>
    {/if}

    {#if !data.logement}
      <section class="space-y-4">
        <h2 class="text-lg font-semibold">Nos logements</h2>
        {#if data.logements.length === 0}
          <p class="ui-carte border-dashed text-encre-douce">
            Aucun logement n’est ouvert à la réservation pour le moment.
          </p>
        {:else}
          <ul class="grid gap-5 sm:grid-cols-2">
            {#each data.logements as logement (logement.id)}
              <li class="ui-carte ui-carte--liee ui-carte--media overflow-hidden">
                <a
                  class="block"
                  href={`/reserver?tenant=${encodeURIComponent(data.slug)}&logement=${logement.id}`}
                >
                  <div class="ui-photo aspect-[4/3] overflow-hidden bg-surface-2">
                    <img
                      class="h-full w-full object-cover"
                      src={logement.photo}
                      alt={logement.nom}
                      width="1000"
                      height="750"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <div class="space-y-2 p-4">
                    <h3 class="text-lg font-semibold">{logement.nom}</h3>
                    {#if logement.adresse}
                      <p class="text-sm text-encre-douce">{logement.adresse}</p>
                    {/if}
                    {#if logement.moyenne !== null}
                      <p class="text-sm">
                        <span class="text-accent">★</span>
                        {logement.moyenne}/5 · {logement.avis} avis
                      </p>
                    {/if}
                    <span class="ui-bouton ui-bouton--secondaire ui-bouton--petit">
                      Voir les disponibilités
                    </span>
                  </div>
                </a>
              </li>
            {/each}
          </ul>
        {/if}
      </section>
    {:else}
      {#if data.logement.photo}
        <div class="ui-photo overflow-hidden rounded-3xl">
          <img
            class="aspect-[16/8] w-full object-cover"
            src={data.logement.photo}
            alt={data.logement.nom}
            width="1400"
            height="700"
            fetchpriority="high"
            decoding="async"
          />
        </div>
      {/if}
      <section class="ui-carte space-y-5">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 class="text-xl font-semibold">{data.logement.nom}</h2>
            {#if data.logement.adresse}
              <p class="text-sm text-encre-douce">{data.logement.adresse}</p>
            {/if}
          </div>
          <a class="ui-lien text-sm" href={`/reserver?tenant=${encodeURIComponent(data.slug)}`}>
            Changer de logement
          </a>
        </div>

        <form class="grid gap-3 sm:grid-cols-4" method="GET">
          <input type="hidden" name="tenant" value={data.slug} />
          <input type="hidden" name="logement" value={data.logement.id} />
          <input type="hidden" name="utm_source" value={data.attribution.utm_source} />
          <input type="hidden" name="utm_medium" value={data.attribution.utm_medium} />
          <input type="hidden" name="utm_campaign" value={data.attribution.utm_campaign} />
          <input type="hidden" name="widget" value={data.attribution.widget} />
          <input type="hidden" name="code" value={data.attribution.code} />
          <label class="space-y-2">
            <span class="ui-label">Arrivée</span>
            <input class="ui-champ" name="debut" type="date" defaultValue={data.debut} required />
          </label>
          <label class="space-y-2">
            <span class="ui-label">Départ</span>
            <input class="ui-champ" name="fin" type="date" defaultValue={data.fin} required />
          </label>
          <label class="space-y-2">
            <span class="ui-label">Voyageurs</span>
            <input class="ui-champ" name="voyageurs" type="number" min="1" max="20" defaultValue={data.voyageurs} />
          </label>
          <div class="flex items-end">
            <button class="ui-bouton ui-bouton--primaire w-full" type="submit">
              Calculer le prix
            </button>
          </div>
        </form>

        {#if data.erreurDevis}
          <p class="ui-alerte ui-alerte--alerte">{data.erreurDevis}</p>
        {/if}

        {#if data.devis}
          <div class="rounded-controle border border-bordure bg-surface2 p-5">
            <h3 class="text-sm font-semibold uppercase tracking-widest text-encre-faine">
              Votre estimation
            </h3>
            <p class="mt-2 text-sm">
              {data.devis.nuits} nuit{data.devis.nuits > 1 ? "s" : ""} · {data.devis.total}
              estimés
            </p>
            <ul class="mt-3 divide-y divide-bordure text-sm">
              {#each data.devis.lignes as ligne (ligne.date)}
                <li class="flex justify-between py-2">
                  <span>{ligne.date}</span>
                  <span>{ligne.prix}</span>
                </li>
              {/each}
            </ul>
            <p class="mt-3 flex justify-between border-t border-bordure pt-3 text-base font-semibold">
              <span>Total TTC</span>
              <span>{data.devis.total}</span>
            </p>
            <p class="mt-2 text-xs text-encre-faine">
              Taxe de séjour et extras éventuels seront précisés sur la facture.
            </p>

            <form method="POST" class="mt-5 space-y-3">
              <input type="hidden" name="tenant" value={data.slug} />
              <input type="hidden" name="logementId" value={data.logement.id} />
              <input type="hidden" name="debut" value={data.debut} />
              <input type="hidden" name="fin" value={data.fin} />
              <input type="hidden" name="voyageurs" value={data.voyageurs} />
              <input type="hidden" name="ref" value={data.refFormulaire} />
              <input type="hidden" name="source" value={data.source} />
              <input type="hidden" name="utm_source" value={data.attribution.utm_source} />
              <input type="hidden" name="utm_medium" value={data.attribution.utm_medium} />
              <input type="hidden" name="utm_campaign" value={data.attribution.utm_campaign} />
              <input type="hidden" name="widget" value={data.attribution.widget} />
              <input type="hidden" name="code" value={data.attribution.code} />
              <div class="grid gap-3 sm:grid-cols-2">
                <label class="space-y-2">
                  <span class="ui-label">Nom complet</span>
                  <input class="ui-champ" name="nom" autocomplete="name" required />
                </label>
                <label class="space-y-2">
                  <span class="ui-label">E-mail</span>
                  <input class="ui-champ" name="email" type="email" autocomplete="email" required />
                </label>
              </div>
              <label class="hidden" aria-hidden="true">
                <span>Site</span>
                <input name="site" tabindex="-1" autocomplete="off" />
              </label>
              <button class="ui-bouton ui-bouton--primaire" type="submit">
                Envoyer la demande
              </button>
              <p class="text-xs text-encre-faine">
                Aucun paiement n’est demandé maintenant. La demande devient une
                réservation après confirmation de l’hôte.
              </p>
            </form>
          </div>
        {/if}
      </section>

      {#if data.avis.length > 0}
        <section class="space-y-3" id="avis">
          <div class="flex flex-wrap items-baseline justify-between gap-2">
            <h2 class="text-lg font-semibold">Avis voyageurs</h2>
            <p class="text-sm text-encre-douce">
              {data.moyenneLogement}/5 · {data.avis.length} avis
            </p>
          </div>
          <ul class="space-y-3">
            {#each data.avis as avis (avis.id)}
              <li class="ui-carte space-y-2">
                <p class="font-medium">{avis.nom}</p>
                <p class="text-sm">
                  {"★".repeat(avis.note)}<span class="text-encre-faine">{"★".repeat(5 - avis.note)}</span>
                </p>
                <p class="text-xs text-encre-faine">{avis.date}</p>
                {#if avis.commentaire}
                  <p class="whitespace-pre-line text-sm text-encre-douce">{avis.commentaire}</p>
                {/if}
              </li>
            {/each}
          </ul>
        </section>
      {/if}
    {/if}

    <nav class="flex flex-wrap gap-4 text-sm">
      <a class="ui-lien" href="/">Accueil</a>
      <a class="ui-lien" href="/voyageur">Espace voyageur</a>
    </nav>
  {/if}
</main>
