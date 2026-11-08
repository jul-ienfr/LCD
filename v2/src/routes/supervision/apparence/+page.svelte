<script lang="ts">
  import NavSuperAdmin from "@/lib/components/nav-super-admin.svelte";
  import type { ActionData, PageData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();

  // svelte-ignore state_referenced_locally
  let themeChoisi = $state(data.apparence.themeId);

  const themeActif = $derived(
    data.themes.find((theme) => theme.id === data.apparence.themeId) ??
      data.themes[0],
  );

  const themePublie = $derived(
    data.themes.find((theme) => theme.id === data.publiee.themeId) ??
      data.themes[0],
  );

  const date = new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
</script>

<svelte:head>
  <title>Apparence — Supervision</title>
</svelte:head>

<main class="mx-auto max-w-6xl space-y-8 px-6 py-10">
  <header class="space-y-4">
    <NavSuperAdmin actif="apparence" />
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div class="ui-entete space-y-2">
        <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">
          Supervision · Réservé au super-admin
        </p>
        <h1 class="text-3xl font-semibold tracking-tight">
          Apparence du site
        </h1>
        <p class="max-w-2xl text-encre-douce">
          Un seul thème pour tout le site. Préparez un brouillon, prévisualisez-le,
          puis publiez. Chaque publication est versionnée et réversible.
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <form method="POST" action="?/apercu">
          <button class="ui-bouton ui-bouton--secondaire" type="submit">
            Prévisualiser
          </button>
        </form>
        {#if data.apercu}
          <form method="POST" action="?/fermer">
            <button class="ui-bouton ui-bouton--fantome" type="submit">
              Quitter l’aperçu
            </button>
          </form>
        {/if}
      </div>
    </div>
  </header>

  {#if form?.message}
    <p
      class={form.ok ? "ui-alerte ui-alerte--ok" : "ui-alerte ui-alerte--danger"}
      role="status"
    >
      {form.message}
    </p>
  {/if}
  {#if data.apercu}
    <p class="ui-alerte ui-alerte--alerte" role="status">
      Aperçu du brouillon actif : le site affiche la version non publiée, pour
      vous uniquement.
    </p>
  {/if}

  <section class="grid gap-4 md:grid-cols-3">
    <article class="ui-carte ui-kpi">
      <p class="text-xs uppercase tracking-widest text-encre-faine">Publié</p>
      <p class="text-2xl font-extrabold">{themePublie?.nom ?? "—"}</p>
      <p class="text-xs text-encre-douce">
        {#if data.versionPubliee}
          Version {data.versionPubliee.version} · {data.versionPubliee.publiePar}
        {:else}
          Aucune version publiée : thème par défaut.
        {/if}
      </p>
    </article>
    <article class="ui-carte ui-kpi">
      <p class="text-xs uppercase tracking-widest text-encre-faine">Brouillon</p>
      <p class="text-2xl font-extrabold">
        {data.brouillon ? "En attente" : "Aucun"}
      </p>
      <p class="text-xs text-encre-douce">
        {#if data.brouillon}
          Modifié par {data.brouillon.creePar}
        {:else}
          Le formulaire crée un brouillon à l’enregistrement.
        {/if}
      </p>
    </article>
    <article class="ui-carte ui-kpi">
      <p class="text-xs uppercase tracking-widest text-encre-faine">Accent</p>
      <p class="flex items-center gap-2 text-sm font-semibold">
        <span
          class="inline-block size-5 rounded-full border border-bordure"
          style={`background:${data.publiee.accent ?? themePublie?.clair.accent ?? "#0e7c6b"}`}
        ></span>
        {data.publiee.accent ?? "Accent du thème"}
      </p>
      <p class="text-xs text-encre-douce">Contraste vérifié 4,5:1.</p>
    </article>
  </section>

  <form method="POST" action="?/enregistrer" class="space-y-6">
    <section class="ui-carte space-y-4">
      <div class="flex flex-wrap items-baseline justify-between gap-2">
        <h2 class="text-lg font-semibold">1. Choisir un thème</h2>
        <span class="ui-badge ui-badge--accent">
          {themeActif?.nom ?? "—"}
        </span>
      </div>

      <fieldset class="min-w-0">
        <legend class="sr-only">Thèmes disponibles</legend>
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {#each data.themes as theme (theme.id)}
            <label
              class="ui-carte flex cursor-pointer items-start gap-3 p-3 has-[:checked]:border-accent has-[:checked]:ring-2 has-[:checked]:ring-accent"
            >
              <input
                class="mt-1 size-4 accent-[var(--accent)]"
                type="radio"
                name="themeId"
                value={theme.id}
                bind:group={themeChoisi}
              />
              <span class="min-w-0 space-y-2">
                <span class="flex gap-1" aria-hidden="true">
                  {#each [theme.clair.fond, theme.clair.surface, theme.clair.accent, theme.sombre.fond, theme.sombre.accent] as couleur}
                    <span
                      class="h-6 w-4 rounded-sm border border-bordure"
                      style={`background:${couleur}`}
                    ></span>
                  {/each}
                </span>
                <span class="block text-sm font-semibold">{theme.nom}</span>
                <span class="block text-xs text-encre-faine">{theme.description}</span>
                <span class="block text-[11px] uppercase tracking-widest text-encre-faine">
                  Nav {theme.variantes.nav} · En-tête {theme.variantes.entete}
                </span>
              </span>
            </label>
          {/each}
        </div>
      </fieldset>
    </section>

    <section class="ui-carte space-y-4">
      <h2 class="text-lg font-semibold">2. Accent et identité</h2>
      <div class="grid gap-4 md:grid-cols-2">
        <div class="space-y-2 md:col-span-2">
          <label class="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              name="accentActif"
              defaultChecked={Boolean(data.apparence.accent)}
            />
            <span class="font-medium">Utiliser un accent personnalisé</span>
          </label>
          <div class="flex items-center gap-3">
            <input
              class="h-10 w-24 cursor-pointer rounded border border-bordure bg-fond"
              type="color"
              name="accent"
              defaultValue={data.apparence.accent ?? themeActif?.clair.accent ?? "#0e7c6b"}
            />
            <p class="text-xs text-encre-faine">
              Vérifié sur les surfaces claires et sombres du thème.
            </p>
          </div>
        </div>

        <label class="space-y-2">
          <span class="ui-label">Nom de marque</span>
          <input
            class="ui-champ"
            name="nom"
            maxlength="60"
            defaultValue={data.apparence.identite.nom}
          />
        </label>
        <label class="space-y-2">
          <span class="ui-label">Logo (URL ou /chemin)</span>
          <input
            class="ui-champ"
            name="logoUrl"
            defaultValue={data.apparence.identite.logoUrl ?? ""}
            placeholder="/logo.svg"
          />
        </label>
        <label class="space-y-2">
          <span class="ui-label">E-mail de contact</span>
          <input
            class="ui-champ"
            name="emailContact"
            type="email"
            defaultValue={data.apparence.identite.emailContact ?? ""}
          />
        </label>
        <label class="space-y-2">
          <span class="ui-label">Téléphone de contact</span>
          <input
            class="ui-champ"
            name="telephoneContact"
            type="tel"
            defaultValue={data.apparence.identite.telephoneContact ?? ""}
          />
        </label>
        <label class="space-y-2 md:col-span-2">
          <span class="ui-label">Adresse de contact</span>
          <input
            class="ui-champ"
            name="adresseContact"
            maxlength="200"
            defaultValue={data.apparence.identite.adresseContact ?? ""}
          />
        </label>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <button class="ui-bouton ui-bouton--primaire" type="submit">
          Enregistrer le brouillon
        </button>
        <p class="text-xs text-encre-faine">
          Aucun changement public tant que vous ne publiez pas.
        </p>
      </div>
    </section>
  </form>

  <section class="ui-carte space-y-4">
    <h2 class="text-lg font-semibold">3. Publier</h2>
    {#if data.brouillon}
      <form method="POST" action="?/publier" class="flex flex-wrap items-end gap-3">
        <label class="min-w-64 flex-1 space-y-2">
          <span class="ui-label">Motif (facultatif)</span>
          <input
            class="ui-champ"
            name="motif"
            maxlength="200"
            placeholder="Ex. passage au thème Sable pour l’été"
          />
        </label>
        <button class="ui-bouton ui-bouton--primaire" type="submit">
          Publier pour tout le site
        </button>
      </form>
      <p class="text-xs text-encre-faine">
        La version publiée actuelle sera archivée. Le retour est immédiat.
      </p>
    {:else}
      <p class="text-sm text-encre-douce">
        Enregistrez d’abord un brouillon pour pouvoir le publier.
      </p>
    {/if}
  </section>

  <section class="ui-carte space-y-4">
    <div class="flex flex-wrap items-baseline justify-between gap-2">
      <h2 class="text-lg font-semibold">Historique</h2>
      <p class="text-xs text-encre-faine">
        Publier une ancienne version la republie comme nouvelle version.
      </p>
    </div>
    {#if data.versions.length === 0}
      <p class="text-sm text-encre-douce">Aucune version publiée pour l’instant.</p>
    {:else}
      <div class="overflow-x-auto">
        <table class="ui-tableau">
          <thead>
            <tr>
              <th>Version</th>
              <th>Thème</th>
              <th>Statut</th>
              <th>Date</th>
              <th>Par</th>
              <th>Motif</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {#each data.versions as version (version.id)}
              <tr>
                <td>v{version.version}</td>
                <td>
                  {data.themes.find((theme) => theme.id === version.apparence.themeId)?.nom ??
                    version.apparence.themeId}
                </td>
                <td>
                  <span
                    class={version.statut === "publie"
                      ? "ui-badge ui-badge--ok"
                      : "ui-badge"}
                  >
                    {version.statut}
                  </span>
                </td>
                <td class="text-xs text-encre-faine">
                  {version.publieLe ? date.format(new Date(version.publieLe)) : "—"}
                </td>
                <td class="text-xs">{version.publiePar ?? "—"}</td>
                <td class="max-w-48 truncate text-xs text-encre-faine">
                  {version.motif ?? "—"}
                </td>
                <td>
                  {#if version.statut !== "publie"}
                    <form method="POST" action="?/revenir">
                      <input type="hidden" name="versionId" value={version.id} />
                      <button class="ui-bouton ui-bouton--fantome ui-bouton--petit" type="submit">
                        Republier
                      </button>
                    </form>
                  {:else}
                    <span class="text-xs text-encre-faine">Active</span>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </section>
</main>
