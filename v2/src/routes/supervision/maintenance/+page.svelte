<script lang="ts">
  import NavSuperAdmin from "@/lib/components/nav-super-admin.svelte";
  import type { ActionData, PageData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const dateHeure = new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  });
</script>

<svelte:head>
  <title>Maintenance — Supervision</title>
</svelte:head>

<main id="contenu" class="mx-auto max-w-4xl space-y-8 px-6 py-10">
  <header class="space-y-4">
    <NavSuperAdmin actif="maintenance" />
    <div class="ui-entete space-y-2">
      <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">
        Plateforme
      </p>
      <h1 class="text-3xl font-semibold tracking-tight">Mode maintenance</h1>
      <p class="text-encre-douce">
        Suspend le site proprement : chaque visiteur reçoit une page dédiée
        (503), vos données restent intactes, et la réouverture se fait ici,
        sans redéploiement. Vous restez connecté à la supervision pendant la
        suspension, ainsi que les sauvegardes, les tâches planifiées et les
        webhooks.
      </p>
    </div>
  </header>

  {#if form?.erreur}
    <p class="ui-alerte ui-alerte--danger" role="alert">{form.erreur}</p>
  {:else if form?.ok}
    <p class="ui-alerte ui-alerte--succes" role="status">
      {form.actif
        ? "Maintenance activée : le site est suspendu pour les visiteurs."
        : "Maintenance désactivée : le site est rouvert."}
    </p>
  {/if}

  {#if data.etat.actif}
    <section class="ui-carte space-y-4" aria-labelledby="etat-titre">
      <h2 id="etat-titre" class="text-lg font-semibold">
        <span class="ui-badge ui-badge--danger">Maintenance active</span>
      </h2>
      <p class="text-sm text-encre-douce">
        Depuis le
        {data.etat.debutLe
          ? dateHeure.format(new Date(data.etat.debutLe))
          : "—"}
        {#if data.etat.par}
          · par {data.etat.par}
        {/if}
      </p>
      {#if data.etat.message}
        <p class="rounded-carte border border-bordure bg-surface px-4 py-3 text-sm">
          {data.etat.message}
        </p>
      {/if}
      <form method="POST" action="?/desactiver">
        <button class="ui-bouton ui-bouton--primaire" type="submit">
          Rouvrir le site
        </button>
      </form>
    </section>
  {:else}
    <section class="ui-carte space-y-4" aria-labelledby="activer-titre">
      <h2 id="activer-titre" class="text-lg font-semibold">
        Activer la maintenance
      </h2>
      <p class="text-sm text-encre-douce">
        Les visiteurs verront la page de maintenance à chaque adresse. Le
        message ci-dessous leur est affiché tel quel ; laissez vide pour le
        texte par défaut.
      </p>
      <form method="POST" action="?/activer" class="space-y-4">
        <label class="ui-champ-groupe">
          <span class="ui-label">Message affiché (optionnel)</span>
          <textarea
            class="ui-champ"
            name="message"
            rows="3"
            maxlength="500"
            placeholder="Ex. : migration de la base de données, réouverture prévue vers 15 h."
          ></textarea>
        </label>
        {#if data.confirmer}
          <p class="ui-alerte ui-alerte--attention" role="alert">
            Le site va être suspendu pour tous les visiteurs. Cochez la case
            pour confirmer.
          </p>
        {/if}
        <label class="flex items-start gap-3 rounded-carte border border-bordure p-3">
          <input type="checkbox" name="confirmation" value="oui" class="mt-1" />
          <span class="text-sm">
            Je confirme suspendre le site pour tous les visiteurs.
          </span>
        </label>
        <button class="ui-bouton ui-bouton--danger" type="submit">
          Activer la maintenance
        </button>
      </form>
    </section>
  {/if}

  <section class="space-y-3" aria-labelledby="regles-titre">
    <h2 id="regles-titre" class="text-lg font-semibold">
      Ce qui reste joignable pendant la suspension
    </h2>
    <ul class="ui-carte space-y-2 text-sm text-encre-douce">
      <li>La supervision (cette page) et la connexion des super-admins.</li>
      <li>
        Les sondes de santé (<code>/api/health</code>, <code>/api/ready</code>,
        <code>/api/metrics</code>) : la supervision externe voit un site
        vivant.
      </li>
      <li>
        Les tâches planifiées (sauvegardes, purges, synchronisations) et les
        webhooks entrants : aucune donnée n'est perdue.
      </li>
    </ul>
  </section>
</main>
