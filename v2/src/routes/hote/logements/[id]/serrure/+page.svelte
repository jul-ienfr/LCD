<script lang="ts">
  import type { ActionData, PageData } from "./$types";
  import ConfirmationAction from "@/lib/components/ui/confirmation-action.svelte";
  import { traductionsStatuts } from "@/lib/i18n-statuts";

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const statuts = $derived(traductionsStatuts(data.langue));
</script>

<svelte:head>
  <title>Codes d'accès — {data.logement.nom} — LCD Parc</title>
</svelte:head>

<main id="contenu" class="mx-auto max-w-3xl space-y-8 px-6 py-12">
  <header class="flex flex-wrap items-end justify-between gap-4">
    <div class="space-y-2">
      <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">
        Logement {data.logement.code}
      </p>
      <h1 class="text-3xl font-semibold tracking-tight">
        Codes d'accès — {data.logement.nom}
      </h1>
      <p class="text-encre-douce">
        Un code par arrivée, préparé automatiquement à J-7 et rejouable sans
        doublon. La serrure connectée n'est jamais obligatoire : sans elle, un
        code manuel est généré.
      </p>
    </div>
    <a class="ui-lien-action text-sm" href="/hote/logements/{data.logement.id}">
      ← Détail logement
    </a>
  </header>

  {#if form?.message}
    <p
      class={form.ok ? "ui-alerte ui-alerte--ok" : "ui-alerte ui-alerte--danger"}
      role={form.ok ? "status" : "alert"}
    >
      {form.message}
    </p>
  {/if}

  <p class="text-sm text-encre-douce">
    Serrure connectée :
    {#if data.serrureDisponible}
      <strong>configurée</strong> — renseignez l'identifiant de la serrure pour
      programmer un code numérique.
    {:else}
      <strong>non configurée</strong> — les codes sont générés en mode manuel.
    {/if}
  </p>

  <!-- Créer un code pour une réservation -->
  <section class="ui-carte space-y-4">
    <div>
      <h2 class="text-lg font-semibold">Préparer un code pour une réservation</h2>
      <p class="mt-1 text-sm text-encre-douce">
        Les dates de la réservation sont reprises côté serveur.
      </p>
    </div>

    {#if data.reservations.length === 0}
      <p class="text-sm text-encre-faine">
        Aucune réservation à venir pour ce logement.
      </p>
    {:else}
      <ul class="space-y-3">
        {#each data.reservations as reservation (reservation.id)}
          <li class="rounded border border-bordure p-3">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div class="text-sm">
                <p class="font-medium">
                  {reservation.ref} — {reservation.clientNom}
                </p>
                <p class="text-encre-douce">
                  Du {reservation.debut} au {reservation.fin} ({statuts[reservation.statut] ?? reservation.statut})
                </p>
              </div>
              {#if reservation.aUnCode}
                <span class="ui-etiquette">Code actif</span>
              {:else}
                <form method="POST" action="?/creer" class="flex items-end gap-2">
                  <input type="hidden" name="logementId" value={data.logement.id} />
                  <input type="hidden" name="reservationId" value={reservation.id} />
                  <div>
                    <label
                      class="ui-label"
                      for="serrure-{reservation.id}"
                    >
                      Serrure (facultatif)
                    </label>
                    <input
                      class="ui-champ"
                      id="serrure-{reservation.id}"
                      name="serrureId"
                      placeholder="nuki-123"
                      autocomplete="off"
                    />
                  </div>
                  <button class="ui-bouton ui-bouton--secondaire" type="submit">
                    Créer le code
                  </button>
                </form>
              {/if}
            </div>
          </li>
        {/each}
      </ul>
    {/if}
  </section>

  <!-- Créer un code pour une plage libre -->
  <section class="ui-carte space-y-4">
    <div>
      <h2 class="text-lg font-semibold">Préparer un code pour une plage</h2>
      <p class="mt-1 text-sm text-encre-douce">
        Utile pour une intervention, un artisan ou une arrivée hors réservation.
      </p>
    </div>
    <form method="POST" action="?/creer" class="grid gap-3 sm:grid-cols-2">
      <input type="hidden" name="logementId" value={data.logement.id} />
      <div>
        <label class="ui-label" for="arrivee">Arrivée</label>
        <input class="ui-champ" id="arrivee" name="arrivee" type="date" required />
      </div>
      <div>
        <label class="ui-label" for="depart">Départ</label>
        <input class="ui-champ" id="depart" name="depart" type="date" required />
      </div>
      <div class="sm:col-span-2">
        <label class="ui-label" for="serrure-plage">Serrure (facultatif)</label>
        <input
          class="ui-champ"
          id="serrure-plage"
          name="serrureId"
          placeholder="nuki-123"
          autocomplete="off"
        />
      </div>
      <div class="sm:col-span-2">
        <button class="ui-bouton ui-bouton--primaire" type="submit">
          Créer le code
        </button>
      </div>
    </form>
  </section>

  <!-- Accès du logement -->
  <section class="ui-carte space-y-4">
    <h2 class="text-lg font-semibold">Codes du logement</h2>

    {#if data.acces.length === 0}
      <p class="text-sm text-encre-faine">Aucun code pour ce logement.</p>
    {:else}
      <ul class="space-y-3">
        {#each data.acces as acces (acces.id)}
          <li class="rounded border border-bordure p-3">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div class="space-y-1 text-sm">
                <p class="font-mono text-lg font-semibold">{acces.code}</p>
                <p class="text-encre-douce">
                  {acces.fournisseur} · {acces.libelleStatut} · {acces.ref}
                </p>
                <p class="text-encre-faine">
                  Valide du {acces.valideDe} au {acces.valideA}
                </p>
                {#if acces.revoquePar}
                  <p class="text-encre-faine">
                    Révoqué le {acces.revoqueLe} par {acces.revoquePar}
                  </p>
                {/if}
              </div>

              {#if acces.statut === "actif"}
                {#snippet motifRevocation()}
                  <label class="ui-label" for="motif-{acces.id}">
                    Motif de révocation
                  </label>
                  <textarea
                    class="ui-champ"
                    id="motif-{acces.id}"
                    name="motif"
                    rows="2"
                    minlength="10"
                    required
                    placeholder="Départ anticipé, code perdu..."
                  ></textarea>
                {/snippet}
                <ConfirmationAction
                  langue={data.langue}
                  action="revoquer"
                  cible={acces.id}
                  libelle="Révoquer"
                  champs={{ accesId: acces.id }}
                  contenu={motifRevocation}
                  classe="ui-bouton ui-bouton--danger"
                />
              {/if}
            </div>
          </li>
        {/each}
      </ul>
    {/if}
  </section>

  <a class="ui-lien-action text-sm" href="/hote/logements/{data.logement.id}">
    ← Détail du logement
  </a>
</main>
