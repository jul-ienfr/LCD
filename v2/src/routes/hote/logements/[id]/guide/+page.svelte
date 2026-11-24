<script lang="ts">
  import type { ActionData, PageData } from "./$types";
  import ConfirmationAction from "@/lib/components/ui/confirmation-action.svelte";

  let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head>
  <title>Guide structuré — {data.logement.nom} — LCD Parc</title>
</svelte:head>

<main id="contenu" class="mx-auto max-w-3xl space-y-8 px-6 py-12">
  <header class="flex flex-wrap items-end justify-between gap-4">
    <div class="space-y-2">
      <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">
        Logement {data.logement.code}
      </p>
      <h1 class="text-3xl font-semibold tracking-tight">
        Guide structuré — {data.logement.nom}
      </h1>
      <p class="text-encre-douce">
        Contenu multilingue affiché dans le guide voyageur signé.
      </p>
    </div>
    <a class="ui-lien-action text-sm" href="/hote/logements/{data.logement.id}">← Détail logement</a>
  </header>

  <!-- Sélecteur de langue -->
  <nav class="flex flex-wrap gap-2" aria-label="Langues du guide">
    {#each data.langues as langue (langue.code)}
      <a
        class="ui-bouton ui-bouton--petit {langue.code === data.langueActive ? 'ui-bouton--primaire' : 'ui-bouton--secondaire'}"
        href="/hote/logements/{data.logement.id}/guide?langue={langue.code}"
        aria-current={langue.code === data.langueActive ? "page" : undefined}
      >
        {langue.libelle}{langue.aContenu ? " ●" : ""}
      </a>
    {/each}
  </nav>

  <!-- Langue par défaut -->
  <section class="ui-carte">
    <form method="POST" action="?/langueDefaut" class="flex flex-wrap items-center gap-3">
      <input type="hidden" name="logementId" value={data.logement.id} />
      <label class="ui-label" for="langueDefaut">Langue par défaut du guide</label>
      <select class="ui-champ w-auto" name="langueDefaut" id="langueDefaut">
        {#each data.langues as langue (langue.code)}
          <option value={langue.code} selected={langue.code === data.langueDefaut}>
            {langue.libelle}
          </option>
        {/each}
      </select>
      <button class="ui-bouton ui-bouton--secondaire ui-bouton--petit" type="submit">
        Enregistrer
      </button>
    </form>
  </section>

  <!-- Message de résultat -->
  {#if form?.message}
    <p
      class={form.ok ? "ui-alerte ui-alerte--ok" : "ui-alerte ui-alerte--danger"}
      role={form.ok ? "status" : "alert"}
    >
      {form.message}
    </p>
  {/if}

  <!-- Sections du guide -->
  {#each data.sections as section (section.section)}
    <section class="ui-carte space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold">{section.libelle}</h2>
        {#if section.existe}
          <ConfirmationAction
            langue={data.langueActive}
            action="supprimer"
            cible={`${section.section}:${data.langueActive}`}
            libelle="Supprimer"
            champs={{
              logementId: data.logement.id,
              section: section.section,
              langue: data.langueActive,
            }}
            classe="ui-bouton ui-bouton--fantome ui-bouton--petit text-danger"
          />
        {/if}
      </div>

      <form method="POST" action="?/enregistrer" class="space-y-3">
        <input type="hidden" name="logementId" value={data.logement.id} />
        <input type="hidden" name="section" value={section.section} />
        <input type="hidden" name="langue" value={data.langueActive} />

        <label class="ui-champ-groupe">
          <span class="ui-label">Titre</span>
          <input
            class="ui-champ"
            name="titre"
            value={section.titre}
            maxlength="120"
            placeholder="Titre de la section"
          />
        </label>

        <label class="ui-champ-groupe">
          <span class="ui-label">Contenu</span>
          <textarea
            class="ui-champ min-h-28"
            name="corps"
            maxlength="5000"
            placeholder="Contenu affiché au voyageur…"
          >{section.corps}</textarea>
        </label>

        <button class="ui-bouton ui-bouton--primaire ui-bouton--petit" type="submit">
          Enregistrer {section.libelle}
        </button>
      </form>
    </section>
  {/each}

  <a class="ui-lien-action text-sm" href="/hote/logements">← Tous les logements</a>
</main>
