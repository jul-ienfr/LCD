<script lang="ts">
  import { page } from "$app/state";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  const etat = $derived(page.url.searchParams.get("police"));
  const retour = $derived(
    `/voyageur?t=${encodeURIComponent(data.token)}&lang=${data.langue}`,
  );
</script>

<svelte:head>
  <title>Fiche de police — LCD Parc</title>
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<main class="mx-auto max-w-2xl space-y-8 px-6 py-12">
  {#if data.indisponible}
    <h1 class="text-3xl font-semibold tracking-tight">Fiche de police</h1>
    <p class="ui-alerte ui-alerte--alerte">
      Lien invalide ou expiré, ou séjour introuvable. Ouvrez votre espace
      voyageur depuis le message de votre hôte.
    </p>
    <a class="ui-lien text-sm" href="/voyageur">Retour à l’espace voyageur</a>
  {:else if data.reservation}
    <header class="space-y-2">
      <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">Espace voyageur</p>
      <h1 class="text-3xl font-semibold tracking-tight">Fiche de police</h1>
      <p class="text-encre-douce">
        Séjour {data.reservation.ref} · {data.reservation.debut} → {data.reservation.fin}.
        Une fiche par personne hébergée, avant l’arrivée.
      </p>
      <nav aria-label="Langue" class="flex flex-wrap gap-2 pt-1">
        {#each ["fr", "en", "it", "es", "de"] as code}
          <a aria-current={code === data.langue ? "true" : undefined} class={code === data.langue ? "ui-etiquette bg-encre text-fond" : "ui-etiquette-ui"} href={`/voyageur/police?t=${encodeURIComponent(data.token)}&lang=${code}`}>
            {code.toUpperCase()}
          </a>
        {/each}
      </nav>
    </header>

    {#if etat === "ok"}<p class="ui-alerte ui-alerte--succes">Fiche enregistrée. Merci.</p>{/if}
    {#if etat === "erreur"}<p class="ui-alerte ui-alerte--danger">Fiche non enregistrée : vérifiez les champs obligatoires.</p>{/if}
    {#if etat === "complet"}<p class="ui-alerte ui-alerte--alerte">Toutes les fiches prévues pour ce séjour sont déjà remplies.</p>{/if}

    <section class="ui-carte">
      <h2 class="text-lg font-semibold">{data.fiches.length}/{data.reservation.voyageurs} fiche(s) reçue(s)</h2>
      {#if data.fiches.length > 0}
        <ul class="mt-3 space-y-1 text-sm">
          {#each data.fiches as fiche (fiche.id)}
            <li>{fiche.prenoms} {fiche.nom} — reçue le {fiche.createdAt}</li>
          {/each}
        </ul>
      {/if}
      <p class="mt-3 text-xs text-encre-faine">
        Données conservées 6 mois puis supprimées automatiquement. Aucune copie
        de passeport ou de carte d’identité n’est demandée ni stockée.
      </p>
    </section>

    {#if data.restantes > 0}
      <form method="POST" class="ui-carte space-y-4">
        <input type="hidden" name="token" value={data.token} />
        <input type="hidden" name="langue" value={data.langue} />
        <input type="hidden" name="ref" value={data.ref} />
        <h2 class="text-lg font-semibold">Fiche {data.fiches.length + 1} sur {data.reservation.voyageurs}</h2>
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="ui-champ-groupe"><span class="ui-label">Nom *</span><input class="ui-champ" name="nom" autocomplete="family-name" maxlength="120" minlength="2" required /></label>
          <label class="ui-champ-groupe"><span class="ui-label">Prénoms *</span><input class="ui-champ" name="prenoms" autocomplete="given-name" maxlength="120" minlength="2" required /></label>
          <label class="ui-champ-groupe"><span class="ui-label">Date de naissance *</span><input class="ui-champ" name="dateNaissance" type="date" max={new Date().toISOString().slice(0, 10)} required /></label>
          <label class="ui-champ-groupe"><span class="ui-label">Lieu de naissance *</span><input class="ui-champ" name="lieuNaissance" maxlength="160" minlength="2" required /></label>
          <label class="ui-champ-groupe"><span class="ui-label">Nationalité *</span><input class="ui-champ" name="nationalite" autocomplete="country-name" maxlength="80" minlength="2" required /></label>
          <label class="ui-champ-groupe"><span class="ui-label">Téléphone mobile *</span><input class="ui-champ" name="telephone" type="tel" autocomplete="tel" maxlength="24" required /></label>
        </div>
        <label class="ui-champ-groupe"><span class="ui-label">Domicile habituel *</span><input class="ui-champ" name="domicile" autocomplete="street-address" maxlength="240" minlength="5" required /></label>
        <label class="ui-champ-groupe"><span class="ui-label">Email (facultatif)</span><input class="ui-champ" name="email" type="email" autocomplete="email" maxlength="254" /></label>
        <p class="text-xs text-encre-faine">Champs obligatoires marqués *. Données transmises de façon chiffrée à votre hôte, sans autre usage.</p>
        <button class="ui-bouton ui-bouton--primaire" type="submit">Enregistrer la fiche</button>
      </form>
    {/if}

    <a class="ui-lien text-sm" href={retour}>← Retour à mon séjour</a>
  {/if}
</main>
