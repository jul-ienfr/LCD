<script lang="ts">
  import NavSuperAdmin from "@/lib/components/nav-super-admin.svelte";
  import type { ActionData, PageData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const date = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short" });
</script>

<svelte:head>
  <title>Espaces — Supervision</title>
</svelte:head>

<main id="contenu" class="mx-auto max-w-4xl space-y-8 px-6 py-10">
  <header class="space-y-4">
    <NavSuperAdmin actif="espaces" />
    <div class="ui-entete space-y-2">
      <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">
        Plateforme
      </p>
      <h1 class="text-3xl font-semibold tracking-tight">Créer un espace</h1>
      <p class="text-encre-douce">
        Un espace complet en une étape : le tenant, son compte administrateur
        et le premier logement — sans SSH. Si une étape échoue, l’espace est
        supprimé automatiquement : jamais d’espace à moitié créé. La création
        est tracée dans le journal d’audit du nouvel espace.
      </p>
    </div>
  </header>

  {#if form?.erreur}
    <p class="ui-alerte ui-alerte--danger" role="alert">{form.erreur}</p>
  {:else if form?.ok && form.espace}
    <section class="ui-alerte ui-alerte--succes space-y-1" role="status">
      <p class="font-medium">
        Espace « {form.espace.nom} » créé ({form.espace.slug}).
      </p>
      <p class="text-sm">
        Compte administrateur : {form.espace.adminEmail} · premier logement :
        {form.espace.logementCode}. Communiquez le mot de passe provisoire à
        l’administrateur ; il devra l’activer avec la double authentification à
        sa première connexion.
      </p>
    </section>
  {/if}

  <section class="ui-carte space-y-4" aria-labelledby="creer-titre">
    <h2 id="creer-titre" class="text-lg font-semibold">Nouvel espace</h2>
    <form method="POST" action="?/creer" class="grid gap-4 sm:grid-cols-2">
      <label class="ui-champ-groupe">
        <span class="ui-label">Identifiant (slug)</span>
        <input
          class="ui-champ"
          name="slug"
          required
          maxlength="40"
          pattern="[a-z0-9](?:[a-z0-9-]&#123;1,38&#125;[a-z0-9])?"
          defaultValue={form?.valeurs?.slug ?? ""}
          placeholder="parc-nord"
        />
        <span class="text-xs text-encre-faine">
          Minuscules, chiffres et tirets. Il sert dans les URLs et les exports.
        </span>
      </label>
      <label class="ui-champ-groupe">
        <span class="ui-label">Nom de l’espace</span>
        <input
          class="ui-champ"
          name="nom"
          required
          minlength="2"
          maxlength="120"
          defaultValue={form?.valeurs?.nom ?? ""}
          placeholder="Parc Nord"
        />
      </label>
      <label class="ui-champ-groupe">
        <span class="ui-label">Nom de l’administrateur</span>
        <input
          class="ui-champ"
          name="adminNom"
          required
          minlength="2"
          maxlength="120"
          autocomplete="name"
          defaultValue={form?.valeurs?.adminNom ?? ""}
        />
      </label>
      <label class="ui-champ-groupe">
        <span class="ui-label">Email de l’administrateur</span>
        <input
          class="ui-champ"
          type="email"
          name="adminEmail"
          required
          autocomplete="email"
          defaultValue={form?.valeurs?.adminEmail ?? ""}
        />
      </label>
      <label class="ui-champ-groupe">
        <span class="ui-label">Mot de passe provisoire</span>
        <input
          class="ui-champ"
          type="password"
          name="adminPassword"
          required
          minlength="12"
          maxlength="128"
          autocomplete="new-password"
        />
        <span class="text-xs text-encre-faine">
          12 caractères minimum. Il n’est jamais réaffiché : en cas d’erreur,
          ressaisissez-le.
        </span>
      </label>
      <div class="hidden sm:block"></div>
      <label class="ui-champ-groupe">
        <span class="ui-label">Code du premier logement</span>
        <input
          class="ui-champ"
          name="logementCode"
          required
          maxlength="32"
          pattern="[a-z0-9](?:[a-z0-9-]&#123;0,30&#125;[a-z0-9])?"
          defaultValue={form?.valeurs?.logementCode ?? ""}
          placeholder="log-1"
        />
        <span class="text-xs text-encre-faine">
          Minuscules, chiffres et tirets (2 à 32 caractères).
        </span>
      </label>
      <label class="ui-champ-groupe">
        <span class="ui-label">Nom du premier logement</span>
        <input
          class="ui-champ"
          name="logementNom"
          required
          minlength="2"
          maxlength="120"
          defaultValue={form?.valeurs?.logementNom ?? ""}
          placeholder="Santa Severa"
        />
      </label>
      <label class="ui-champ-groupe sm:col-span-2">
        <span class="ui-label">Adresse du logement (optionnelle)</span>
        <input
          class="ui-champ"
          name="logementAdresse"
          maxlength="200"
          defaultValue={form?.valeurs?.logementAdresse ?? ""}
        />
      </label>
      <div class="sm:col-span-2">
        <button class="ui-bouton ui-bouton--primaire" type="submit">
          Créer l’espace
        </button>
      </div>
    </form>
  </section>

  <section class="space-y-3" aria-labelledby="existants-titre">
    <h2 id="existants-titre" class="text-lg font-semibold">
      Espaces existants
      <span class="ui-badge ml-2">{data.espaces.length}</span>
    </h2>
    {#if data.espaces.length === 0}
      <p class="ui-carte text-sm text-encre-douce">
        Aucun espace pour le moment.
      </p>
    {:else}
      <ul class="space-y-2">
        {#each data.espaces as espace (espace.id)}
          <li class="ui-carte flex flex-wrap items-center justify-between gap-2">
            <div>
              <p class="font-medium">{espace.nom}</p>
              <p class="text-xs text-encre-faine">
                {espace.slug} · créé le {date.format(new Date(espace.createdAt))}
              </p>
            </div>
            <span
              class="ui-badge"
              class:ui-badge--danger={espace.statut === "suspendu"}
            >
              {espace.statut}
            </span>
          </li>
        {/each}
      </ul>
    {/if}
  </section>
</main>
