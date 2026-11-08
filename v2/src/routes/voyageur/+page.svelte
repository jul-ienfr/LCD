<script lang="ts">
  import { page } from "$app/state";
  import EntetePublique from "@/lib/components/entete-publique.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  const incidentEtat = $derived(page.url.searchParams.get("incident"));
  const extrasEtat = $derived(page.url.searchParams.get("extras"));
  const avisEtat = $derived(page.url.searchParams.get("avis"));
  const preferencesEtat = $derived(page.url.searchParams.get("preferences"));
  const memoireEtat = $derived(page.url.searchParams.get("memoire"));
  const departEtat = $derived(page.url.searchParams.get("depart"));
  const base = $derived(
    data.token
      ? `/voyageur?t=${encodeURIComponent(data.token)}&lang=${data.langue}`
      : `/voyageur?lang=${data.langue}`,
  );
</script>

<svelte:head>
  <title>{data.d.votreSejour} — LCD Parc</title>
  <script src="/outbox.js" defer></script>
</svelte:head>

<EntetePublique
  logoUrl={data.identite.logoUrl}
  nom={data.identite.nom}
  retourLibelle={data.d.retourAccueil}
/>

<main class="mx-auto max-w-2xl space-y-8 px-6 py-12">
  {#if data.invalide}
    <header class="space-y-2">
      <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">{data.d.espaceVoyageur}</p>
      <h1 class="text-3xl font-semibold tracking-tight">{data.d.votreSejour}</h1>
      <p class="rounded-controle border border-danger bg-danger-douce p-4 text-danger">{data.d.lienInvalide}</p>
    </header>
    <a class="ui-lien text-sm" href="/">{data.d.retourAccueil}</a>
  {:else if !data.token}
    <header class="space-y-2">
      <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">{data.d.espaceVoyageur}</p>
      <h1 class="text-3xl font-semibold tracking-tight">{data.d.votreSejour}</h1>
      <p class="text-encre-douce">{data.d.ouvrirLien}</p>
      <nav aria-label={data.d.langue} class="flex flex-wrap gap-2 pt-2">
        {#each ["fr", "en", "it", "es", "de"] as code}
          <a
            aria-current={code === data.langue ? "true" : undefined}
            class={code === data.langue ? "ui-etiquette bg-encre text-fond" : "ui-etiquette-ui"}
            href={`/voyageur?lang=${code}`}
          >{code.toUpperCase()}</a>
        {/each}
      </nav>
    </header>
    <section class="ui-carte">
      <h2 class="text-lg font-semibold">{data.d.besoinAide}</h2>
      <p class="mt-2 text-encre-douce">{data.d.aideTexte}</p>
    </section>
    <a class="ui-lien text-sm" href="/">{data.d.retourAccueil}</a>
  {:else if data.reservation && data.logement}
    <header class="space-y-2">
      <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">{data.d.espaceVoyageur}</p>
      <h1 class="text-3xl font-semibold tracking-tight">{data.d.votreSejour}</h1>
      <p class="text-encre-douce">
        {data.logement.nom}{data.logement.adresse ? ` — ${data.logement.adresse}` : ""}
      </p>
      <nav aria-label={data.d.langue} class="flex flex-wrap gap-2 pt-2">
        {#each ["fr", "en", "it", "es", "de"] as code}
          <a
            aria-current={code === data.langue ? "true" : undefined}
            class={code === data.langue ? "ui-etiquette bg-encre text-fond" : "ui-etiquette-ui"}
            href={`/voyageur?t=${encodeURIComponent(data.token)}&lang=${code}`}
          >{code.toUpperCase()}</a>
        {/each}
      </nav>
    </header>

    {#if incidentEtat === "ok"}
      <p class="ui-alerte ui-alerte--succes" role="status">{data.d.incidentOk}</p>
    {:else if incidentEtat === "erreur"}
      <p class="ui-alerte ui-alerte--danger" role="alert">{data.d.incidentErreur}</p>
    {/if}

    <section class="ui-carte">
      <h2 class="text-lg font-semibold">{data.d.sejour} {data.reservation.ref}</h2>
      <dl class="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        <div><dt class="text-encre-faine">{data.d.arrivee}</dt><dd class="font-medium">{data.reservation.debut}</dd></div>
        <div><dt class="text-encre-faine">{data.d.depart}</dt><dd class="font-medium">{data.reservation.fin}</dd></div>
        <div><dt class="text-encre-faine">{data.d.nuits}</dt><dd class="font-medium">{data.reservation.nuits}</dd></div>
        <div><dt class="text-encre-faine">{data.d.voyageurs}</dt><dd class="font-medium">{data.reservation.voyageurs}</dd></div>
      </dl>
      {#if data.reservation.clientNom}
        <p class="mt-3 text-sm text-encre-douce">{data.d.auNomDe} {data.reservation.clientNom}.</p>
      {/if}
    </section>

    <section class="ui-carte">
      <h2 class="text-lg font-semibold">Fiche de police</h2>
      <p class="mt-2 text-sm text-encre-douce">
        Obligatoire avant l’arrivée : une fiche par personne hébergée.
        {data.fichesPolice}/{data.reservation.voyageurs} reçue(s). Données conservées
        6 mois, aucune pièce d’identité demandée.
      </p>
      <a class="ui-bouton ui-bouton--secondaire mt-3" href={`/voyageur/police?t=${encodeURIComponent(data.token)}&lang=${data.langue}`}>
        {data.fichesPolice >= data.reservation.voyageurs ? "Voir les fiches déposées" : "Remplir une fiche"}
      </a>
    </section>

    <section class="ui-carte">
      <h2 class="text-lg font-semibold">{data.d.guideLogement}</h2>
      <dl class="mt-3 grid gap-3 text-sm sm:grid-cols-2">
        {#if data.logement.checkinHeure}<div><dt class="text-encre-faine">{data.d.checkin}</dt><dd class="font-medium">{data.logement.checkinHeure}</dd></div>{/if}
        {#if data.logement.wifiSsid}<div><dt class="text-encre-faine">WiFi</dt><dd class="font-medium">{data.logement.wifiSsid}</dd></div>{/if}
        {#if data.logement.wifiPassword}<div><dt class="text-encre-faine">{data.d.motDePasseWifi}</dt><dd class="font-mono font-medium">{data.logement.wifiPassword}</dd></div>{/if}
        {#if data.logement.urgenceTel}<div><dt class="text-encre-faine">{data.d.urgence}</dt><dd class="font-medium">{data.logement.urgenceTel}</dd></div>{/if}
      </dl>
      {#if data.logement.checkinInstructions}
        <div class="mt-4"><h3 class="text-sm font-semibold">{data.d.arrivee}</h3><p class="mt-1 whitespace-pre-line text-sm text-encre-douce">{data.logement.checkinInstructions}</p></div>
      {/if}
      {#if data.logement.regles}
        <div class="mt-4"><h3 class="text-sm font-semibold">{data.d.regles}</h3><p class="mt-1 whitespace-pre-line text-sm text-encre-douce">{data.logement.regles}</p></div>
      {/if}
      {#if data.logement.guideTexte}
        <div class="mt-4"><h3 class="text-sm font-semibold">{data.d.bonnesAdresses}</h3><p class="mt-1 whitespace-pre-line text-sm text-encre-douce">{data.logement.guideTexte}</p></div>
      {/if}
      {#if !data.logement.checkinHeure && !data.logement.wifiSsid && !data.logement.checkinInstructions && !data.logement.regles && !data.logement.guideTexte}
        <p class="mt-3 text-sm text-encre-douce">{data.d.guideACompleter}</p>
      {/if}
    </section>

    {#if data.lieux.length > 0}
      <section class="ui-carte" id="tourisme">
        <h2 class="text-lg font-semibold">{data.d.tourisme}</h2>
        <nav aria-label={data.d.tourisme} class="mt-3 flex flex-wrap gap-2">
          <a aria-current={!data.categorieActive ? "page" : undefined} class={data.categorieActive ? "ui-etiquette-ui" : "ui-etiquette border-accent bg-accent-douce text-accent"} href={base}>
            {data.d.tousLesLieux}
          </a>
          {#each data.categories as categorie (categorie.id)}
            <a aria-current={data.categorieActive === categorie.id ? "page" : undefined} class={data.categorieActive === categorie.id ? "ui-etiquette border-accent bg-accent-douce text-accent" : "ui-etiquette-ui"} href={`${base}&cat=${categorie.id}`}>
              {categorie.label}
            </a>
          {/each}
        </nav>
        <ul class="mt-4 divide-y divide-bordure">
          {#each data.lieux as lieu (lieu.id)}
            <li class="py-3">
              <div class="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p class="font-medium">{lieu.nom}</p>
                  <p class="text-xs text-encre-faine">{lieu.categorieLabel}{lieu.commune ? ` · ${lieu.commune}` : ""}</p>
                  {#if lieu.acces}<p class="mt-1 text-sm text-encre-douce">{lieu.acces}</p>{/if}
                </div>
                {#if lieu.prixIndicatif}<p class="text-sm font-medium">{lieu.prixIndicatif}</p>{/if}
              </div>
              <div class="mt-2 flex flex-wrap gap-3 text-sm">
                {#if lieu.lien}<a class="ui-lien" href={lieu.lien} target="_blank" rel="noreferrer noopener">{lieu.nom}</a>{/if}
                {#if lieu.extraId}<a class="ui-lien" href="#extras">{data.d.reserverExtra}</a>{/if}
              </div>
            </li>
          {/each}
        </ul>
      </section>
    {/if}

    <section class="ui-carte" id="preferences">
      <h2 class="text-lg font-semibold">{data.d.preferencesSejour}</h2>
      <p class="mt-2 text-sm text-encre-douce">{data.d.preferencesTexte}</p>
      {#if preferencesEtat === "ok"}<p class="ui-alerte ui-alerte--succes mt-3">{data.d.preferencesOk}</p>{/if}
      {#if preferencesEtat === "erreur"}<p class="ui-alerte ui-alerte--danger mt-3">{data.d.preferencesErreur}</p>{/if}
      <form method="POST" action="?/preferences" class="mt-4 space-y-3">
        <input type="hidden" name="token" value={data.token} />
        <input type="hidden" name="langue" value={data.langue} />
        <label class="ui-champ-groupe">
          <span class="ui-label">{data.d.menageFrequence}</span>
          <input class="ui-champ" name="menageFrequenceJ" type="number" min="0" max="30" value={data.preferences?.menageFrequenceJ ?? 0} />
        </label>
        <label class="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" name="lingeInclus" defaultChecked={data.preferences?.lingeInclus ?? true} />
          <span>{data.d.lingeInclus}</span>
        </label>
        <label class="ui-champ-groupe">
          <span class="ui-label">{data.d.heureArrivee}</span>
          <input class="ui-champ" name="heureArrivee" type="time" value={data.preferences?.heureArrivee ?? ""} />
        </label>
        <label class="ui-champ-groupe">
          <span class="ui-label">{data.d.consignesSejour}</span>
          <textarea class="ui-champ" name="consignes" rows="3" maxlength="500">{data.preferences?.consignes ?? ""}</textarea>
        </label>
        <button class="ui-bouton ui-bouton--primaire" type="submit">{data.d.preferencesEnregistrer}</button>
      </form>
    </section>

    {#if data.reservation.clientEmail}
      <section class="ui-carte" id="memoire">
        <h2 class="text-lg font-semibold">{data.d.memoire}</h2>
        <p class="mt-2 text-sm text-encre-douce">{data.d.memoireTexte}</p>
        {#if memoireEtat === "ok"}<p class="ui-alerte ui-alerte--succes mt-3">{data.d.memoireOk}</p>{/if}
        {#if memoireEtat === "oublie"}<p class="ui-alerte ui-alerte--succes mt-3">{data.d.memoireOublie}</p>{/if}
        {#if memoireEtat === "erreur"}<p class="ui-alerte ui-alerte--danger mt-3">{data.d.memoireErreur}</p>{/if}
        {#if data.memoire}<p class="mt-3 text-xs text-encre-faine">{data.d.memoireOk} {data.memoire.expireAt}</p>{/if}
        <form method="POST" action="?/memoire" class="mt-4 space-y-3">
          <input type="hidden" name="token" value={data.token} />
          <input type="hidden" name="langue" value={data.langue} />
          <input type="hidden" name="intention" value="memoriser" />
          <label class="ui-champ-groupe">
            <span class="ui-label">{data.d.memoireNom}</span>
            <input class="ui-champ" name="nom" required value={data.memoire?.nom ?? data.reservation.clientNom ?? ""} />
          </label>
          <label class="ui-champ-groupe">
            <span class="ui-label">{data.d.memoireChamp}</span>
            <textarea class="ui-champ min-h-24" name="preferences">{data.memoire?.preferences ?? ""}</textarea>
          </label>
          {#if data.memoire}
            <input type="hidden" name="consentement" value="on" />
          {:else}
            <label class="flex items-start gap-2 text-sm text-encre-douce">
              <input class="mt-1" type="checkbox" name="consentement" required />
              <span>{data.d.memoireConsentement}</span>
            </label>
          {/if}
          <button class="ui-bouton ui-bouton--secondaire" type="submit">{data.memoire ? data.d.memoireMettreAJour : data.d.memoireEnregistrer}</button>
        </form>
        {#if data.memoire}
          <form method="POST" action="?/memoire" class="mt-3">
            <input type="hidden" name="token" value={data.token} />
            <input type="hidden" name="langue" value={data.langue} />
            <input type="hidden" name="intention" value="oublier" />
            <button class="text-sm text-danger underline" type="submit">{data.d.memoireOublier}</button>
          </form>
        {/if}
      </section>
    {/if}

    <section class="ui-carte" id="depart">
      <h2 class="text-lg font-semibold">{data.d.departTitre}</h2>
      <p class="mt-2 text-sm text-encre-douce">{data.d.departTexte}</p>
      {#if departEtat === "ok"}<p class="ui-alerte ui-alerte--succes mt-3">{data.d.departOk}</p>{/if}
      {#if departEtat === "erreur"}<p class="ui-alerte ui-alerte--danger mt-3">{data.d.departErreur}</p>{/if}
      {#if departEtat === "checklist"}<p class="ui-alerte ui-alerte--danger mt-3">{data.d.departChecklistErreur}</p>{/if}
      {#if data.reservation.departConfirmeLe}
        <div class="mt-4 rounded-controle border border-succes bg-succes-douce p-4 text-sm">
          <p class="font-medium">{data.d.departDeja}</p>
          <p class="mt-1 text-encre-douce">
            {new Date(data.reservation.departConfirmeLe).toLocaleString(data.langue)}
          </p>
          {#if data.reservation.departNote}<p class="mt-2 whitespace-pre-line">{data.reservation.departNote}</p>{/if}
        </div>
      {:else}
        <form method="POST" action="?/depart" class="mt-4 space-y-3">
          <input type="hidden" name="token" value={data.token} />
          <input type="hidden" name="langue" value={data.langue} />
          <fieldset class="space-y-2">
            {#each data.d.departChecklist as etape, index (etape)}
              <label class="flex items-start gap-2 text-sm text-encre-douce">
                <input
                  class="mt-1"
                  type="checkbox"
                  name="checklist"
                  value={data.etapesDepart[index] ?? ""}
                  required
                />
                <span>{etape}</span>
              </label>
            {/each}
          </fieldset>
          <label class="flex items-start gap-2 text-sm text-encre-douce">
            <input class="mt-1" type="checkbox" name="confirmation" required />
            <span>{data.d.departCle}</span>
          </label>
          <label class="ui-champ-groupe">
            <span class="ui-label">{data.d.departNote}</span>
            <textarea class="ui-champ" name="note" rows="2" maxlength="500"></textarea>
          </label>
          <button class="ui-bouton ui-bouton--primaire" type="submit">{data.d.departBouton}</button>
        </form>
      {/if}
    </section>

    <section class="ui-carte" id="avis">
      <h2 class="text-lg font-semibold">{data.d.avis}</h2>
      <p class="mt-2 text-sm text-encre-douce">{data.d.avisTexte}</p>
      <p class="mt-2 text-sm"><a class="ui-lien" href={`/questionnaire/${encodeURIComponent(data.token)}`}>{data.d.questionnaireLien}</a></p>
      {#if avisEtat === "ok"}<p class="ui-alerte ui-alerte--succes mt-3">{data.d.avisOk}</p>{/if}
      {#if avisEtat === "erreur"}<p class="ui-alerte ui-alerte--danger mt-3">{data.d.avisErreur}</p>{/if}
      {#if data.avis}
        <div class="mt-4 rounded-controle border border-bordure bg-surface2 p-4 text-sm">
          <p>{data.d.avisDeja}</p>
          <p class="mt-1 font-medium">{"★".repeat(data.avis.note)}<span class="text-encre-faine">{"★".repeat(5 - data.avis.note)}</span></p>
          {#if data.avis.commentaire}<p class="mt-1 whitespace-pre-line text-encre-douce">{data.avis.commentaire}</p>{/if}
        </div>
      {:else}
        <form method="POST" action="?/avis" class="mt-4 space-y-3">
          <input type="hidden" name="token" value={data.token} />
          <input type="hidden" name="langue" value={data.langue} />
          <input type="hidden" name="ref" value={data.refs.avis} />
          <label class="ui-champ-groupe">
            <span class="ui-label">{data.d.memoireNom}</span>
            <input class="ui-champ" name="nom" required value={data.reservation.clientNom ?? ""} />
          </label>
          <label class="ui-champ-groupe">
            <span class="ui-label">{data.d.avisNote}</span>
            <select class="ui-champ" name="note">
              <option value="5">5 — excellent</option>
              <option value="4">4 — très bien</option>
              <option value="3">3 — correct</option>
              <option value="2">2 — moyen</option>
              <option value="1">1 — à améliorer</option>
            </select>
          </label>
          <label class="ui-champ-groupe">
            <span class="ui-label">{data.d.avisCommentaire}</span>
            <textarea class="ui-champ min-h-24" name="commentaire"></textarea>
          </label>
          <button class="ui-bouton ui-bouton--secondaire" type="submit">{data.d.avisEnvoyer}</button>
        </form>
      {/if}
    </section>

    <section class="ui-carte" id="extras">
      <h2 class="text-lg font-semibold">{data.d.extras}</h2>
      {#if extrasEtat === "ok"}<p class="ui-alerte ui-alerte--succes mt-2">{data.d.commandeEnregistree}</p>{/if}
      {#if extrasEtat === "erreur"}<p class="ui-alerte ui-alerte--danger mt-2">{data.d.commandeErreur}</p>{/if}
      {#if data.extras.length === 0}
        <p class="mt-3 text-sm text-encre-douce">{data.d.aucunExtra}</p>
      {:else}
        <ul class="mt-4 divide-y divide-bordure">
          {#each data.extras as extra (extra.id)}
            <li class="py-3">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p class="font-medium">{extra.nom}</p>
                  {#if extra.description}<p class="text-sm text-encre-douce">{extra.description}</p>{/if}
                </div>
                <p class="font-medium">{extra.prix}</p>
              </div>
              <form method="POST" action="?/extra" class="mt-2 flex flex-wrap items-center gap-2">
                <input type="hidden" name="token" value={data.token} />
                <input type="hidden" name="langue" value={data.langue} />
                <input type="hidden" name="extraId" value={extra.id} />
                <input type="hidden" name="ref" value={data.refs.extras[extra.id]} />
                <label class="text-sm text-encre-douce">{data.d.quantite}
                  <input class="ml-2 w-16 rounded-controle border border-bordure p-1 text-center" type="number" name="quantite" min="1" max="20" value="1" />
                </label>
                <button class="ui-bouton ui-bouton--secondaire ui-bouton--petit" type="submit">{data.d.commander}</button>
              </form>
            </li>
          {/each}
        </ul>
      {/if}
      {#if data.commandes.length > 0}
        <div class="mt-5 border-t border-bordure pt-4">
          <h3 class="text-sm font-semibold">{data.d.vosCommandes}</h3>
          <ul class="mt-2 space-y-2 text-sm">
            {#each data.commandes as commande (commande.id)}
              <li class="flex flex-wrap items-center justify-between gap-2">
                <span>{commande.nom} × {commande.quantite}</span>
                <span class="text-encre-faine">{data.statuts.commande[commande.statut] ?? commande.statut} · {commande.total}</span>
              </li>
            {/each}
          </ul>
        </div>
      {/if}
    </section>

    <section class="ui-carte">
      <h2 class="text-lg font-semibold">{data.d.signalerIncident}</h2>
      <p class="mb-4 mt-1 text-sm text-encre-douce">{data.d.incidentTexte}</p>
      <form method="POST" action="?/incident" class="space-y-3">
        <input type="hidden" name="token" value={data.token} />
        <input type="hidden" name="langue" value={data.langue} />
        <input type="hidden" name="ref" value={data.refs.incident} />
        <label class="ui-champ-groupe">
          <span class="ui-label">{data.d.incidentTexte}</span>
          <textarea class="ui-champ min-h-24" name="message" required minlength="5"></textarea>
        </label>
        <button class="ui-bouton ui-bouton--primaire" type="submit">{data.d.envoyer}</button>
      </form>
    </section>

    <section class="space-y-3">
      <h2 class="text-lg font-semibold">{data.d.vosSignalements}</h2>
      {#if data.incidents.length === 0}
        <p class="text-sm text-encre-douce">{data.d.aucunSignalement}</p>
      {:else}
        <ul class="divide-y divide-bordure rounded-carte border border-bordure bg-surface">
          {#each data.incidents as incident (incident.id)}
            <li class="p-4">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <p class="font-medium">{incident.ref}</p>
                <span class="ui-etiquette">{data.statuts.incident[incident.statut] ?? incident.statut}</span>
              </div>
              <p class="mt-1 whitespace-pre-line text-sm text-encre-douce">{incident.message}</p>
            </li>
          {/each}
        </ul>
      {/if}
    </section>

    <a class="ui-lien text-sm" href="/">{data.d.retourAccueil}</a>
  {/if}
</main>
